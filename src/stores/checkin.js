import { defineStore } from 'pinia'
import { userApi } from '@/api/index.js'

export const useCheckinStore = defineStore('checkin', {
  state: () => ({
    lastCheckinTime: null,
    todayPoints: 0,
    totalPoints: 0,
    isCheckedIn: false,
    loading: false
  }),

  getters: {
    // 检查是否可以签到（距离上次签到超过24小时）
    canCheckin: (state) => {
      if (!state.lastCheckinTime) return true
      
      const now = new Date().getTime()
      const lastCheckin = new Date(state.lastCheckinTime).getTime()
      const timeDiff = now - lastCheckin
      
      // 24小时 = 24 * 60 * 60 * 1000 毫秒
      return timeDiff >= 24 * 60 * 60 * 1000
    },
    
    // 获取下次可签到的时间
    nextCheckinTime: (state) => {
      if (!state.lastCheckinTime) return null
      
      const lastCheckin = new Date(state.lastCheckinTime).getTime()
      const nextTime = lastCheckin + 24 * 60 * 60 * 1000
      
      return new Date(nextTime)
    },
    
    // 获取距离下次签到的剩余时间（格式化）
    remainingTime: (state) => {
      if (!state.lastCheckinTime) return null
      
      const now = new Date().getTime()
      const lastCheckin = new Date(state.lastCheckinTime).getTime()
      const nextTime = lastCheckin + 24 * 60 * 60 * 1000
      const remaining = nextTime - now
      
      if (remaining <= 0) return null
      
      const hours = Math.floor(remaining / (60 * 60 * 1000))
      const minutes = Math.floor((remaining % (60 * 60 * 1000)) / (60 * 1000))
      
      return `${hours}小时${minutes}分钟`
    }
  },

  actions: {
    // 执行签到
    async performCheckin() {
      if (!this.canCheckin || this.loading) {
        return { success: false, message: '今日已签到或正在处理中' }
      }
      
      try {
        this.loading = true
        
        // 调用签到API
        const response = await this.callCheckinAPI()
        
        if (response.success) {
          // 更新签到状态
          this.lastCheckinTime = new Date().toISOString()
          this.isCheckedIn = true
          this.todayPoints += 10 // 签到获得10积分
          this.totalPoints += 10
          
          return { success: true, message: '签到成功！获得10积分' }
        } else {
          return { success: false, message: response.message || '签到失败' }
        }
      } catch (error) {
        console.error('签到失败:', error)
        return { success: false, message: '签到失败，请稍后重试' }
      } finally {
        this.loading = false
      }
    },
    
    // 调用后端签到API
    async callCheckinAPI() {
      try {
        const response = await userApi.checkin()
        
        if (response && (response.code === 200 || response.code === 0)) {
          return { success: true, message: response.message || '签到成功' }
        } else {
          return { success: false, message: response.message || '签到失败' }
        }
      } catch (error) {
        console.error('签到API调用失败:', error)
        return { success: false, message: error.message || '签到失败，请稍后重试' }
      }
    },
    
    // 获取用户积分信息
    async fetchUserPoints() {
      try {
        const response = await userApi.getStudentProfile()
        
        if (response && (response.code === 200 || response.code === 0)) {
          const userData = response.data
          this.totalPoints = userData.stuScore || 0
          
          // 检查今日是否已签到
          this.checkTodayCheckinStatus()
        }
      } catch (error) {
        console.error('获取用户积分失败:', error)
      }
    },
    
    // 检查今日签到状态
    checkTodayCheckinStatus() {
      if (!this.lastCheckinTime) {
        this.isCheckedIn = false
        this.todayPoints = 0
        return
      }
      
      const today = new Date().toDateString()
      const lastCheckinDate = new Date(this.lastCheckinTime).toDateString()
      
      if (today === lastCheckinDate) {
        this.isCheckedIn = true
        // 如果今日已签到，今日积分至少为10
        if (this.todayPoints < 10) {
          this.todayPoints = 10
        }
      } else {
        this.isCheckedIn = false
        this.todayPoints = 0
      }
    },
    
    // 重置今日积分（新的一天开始时调用）
    resetDailyPoints() {
      const today = new Date().toDateString()
      const lastCheckinDate = this.lastCheckinTime ? new Date(this.lastCheckinTime).toDateString() : null
      
      if (today !== lastCheckinDate) {
        this.todayPoints = 0
        this.isCheckedIn = false
      }
    },
    
    // 添加积分（其他途径获得积分时调用）
    addPoints(points) {
      this.todayPoints += points
      this.totalPoints += points
    }
  },
  
  // 持久化配置
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'checkin-store',
        storage: {
          getItem: (key) => uni.getStorageSync(key),
          setItem: (key, value) => uni.setStorageSync(key, value)
        }
      }
    ]
  }
})