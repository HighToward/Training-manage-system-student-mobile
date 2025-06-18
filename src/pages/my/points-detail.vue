<template>
  <view class="points-detail-container">
    <!-- 头部信息 -->
    <view class="header">
      <view class="points-summary">
        <text class="total-points">{{ totalPoints }}</text>
        <text class="points-unit">积分</text>
      </view>
      <text class="summary-text">累计积分</text>
    </view>

    <!-- 积分明细 -->
    <view class="points-history">
      <view class="history-title">积分明细</view>
      <view class="history-list">
        <view 
          v-for="(item, index) in pointsHistory" 
          :key="index" 
          class="history-item"
        >
          <view class="item-info">
            <text class="item-title">{{ item.title }}</text>
            <text class="item-time">{{ item.time }}</text>
          </view>
          <text class="item-points" :class="{ 'positive': item.points > 0, 'negative': item.points < 0 }">
            {{ item.points > 0 ? '+' : '' }}{{ item.points }}
          </text>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="pointsHistory.length === 0" class="empty-state">
        <text class="empty-text">暂无积分记录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCheckinStore } from '@/stores/checkin.js'
import { userApi } from '@/api/index.js'

// 使用签到store
const checkinStore = useCheckinStore()

// 积分数据从store获取
const totalPoints = computed(() => checkinStore.totalPoints)

// 积分明细列表
const pointsHistory = ref([])
const loading = ref(false)

// 获取用户积分信息
const fetchUserPoints = async () => {
  try {
    await checkinStore.fetchUserPoints()
  } catch (error) {
    console.error('获取用户积分失败:', error)
    uni.showToast({ title: '获取积分信息失败', icon: 'none' })
  }
}

// 获取积分明细
const fetchPointsHistory = async () => {
  try {
    loading.value = true
    
    // 创建积分明细列表
    const history = []
    
    // 如果今日已签到，添加签到记录
    if (checkinStore.isCheckedIn && checkinStore.lastCheckinTime) {
      const checkinDate = new Date(checkinStore.lastCheckinTime)
      const today = new Date().toDateString()
      const checkinDateStr = checkinDate.toDateString()
      
      if (today === checkinDateStr) {
        history.push({
          title: '每日签到',
          time: formatDateTime(checkinDate),
          points: 10
        })
      }
    }
    
    // 获取购买记录（积分扣除记录）
    try {
      // 获取用户信息
      const userInfo = uni.getStorageSync('userInfo')
      if (!userInfo || !userInfo.id) {
        console.warn('用户信息不存在，跳过购买记录获取')
        // 继续执行后续逻辑，不直接return
      } else {
        const purchaseResponse = await userApi.getPurchasedCourses(userInfo.id)
        if (purchaseResponse && purchaseResponse.data) {
        const purchasedCourses = purchaseResponse.data
        
        // 将购买记录转换为积分明细
        purchasedCourses.forEach(course => {
          if (course.createTime) {
            // 将价格转换为积分（1元 = 10积分）
            const pointsUsed = Math.round((course.couPrice || 0) * 10)
            
            history.push({
              title: `购买课程：${course.couName || '未知课程'}`,
              time: formatDateTime(new Date(course.createTime)),
              points: -pointsUsed
            })
          }
        })
        }
      }
    } catch (error) {
      console.error('获取购买记录失败:', error)
    }
    
    // 按时间倒序排列（最新的在前面）
    history.sort((a, b) => new Date(b.time) - new Date(a.time))
    
    pointsHistory.value = history
    
  } catch (error) {
    console.error('获取积分明细失败:', error)
    uni.showToast({ title: '获取积分明细失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}

// 格式化日期时间
const formatDateTime = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 页面加载
onMounted(async () => {
  try {
    // 获取用户积分信息
    await fetchUserPoints()
    
    // 重置今日积分状态
    checkinStore.resetDailyPoints()
    
    // 获取积分明细
    await fetchPointsHistory()
    
  } catch (error) {
    console.error('页面初始化失败:', error)
  }
})
</script>

<style lang="scss" scoped>
.points-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #ffcc00 0%, #ff9900 100%);
  padding: 60rpx 40rpx 40rpx;
  text-align: center;
  color: #fff;
  
  .points-summary {
    margin-bottom: 10rpx;
    
    .total-points {
      font-size: 72rpx;
      font-weight: bold;
    }
    
    .points-unit {
      font-size: 28rpx;
      margin-left: 8rpx;
      opacity: 0.9;
    }
  }
  
  .summary-text {
    font-size: 24rpx;
    opacity: 0.8;
  }
}

.points-history {
  padding: 30rpx;
  
  .history-title {
    font-size: 28rpx;
    font-weight: bold;
    color: #333;
    margin-bottom: 20rpx;
  }
  
  .history-list {
    background: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  }
  
  .history-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .item-info {
      flex: 1;
      
      .item-title {
        font-size: 28rpx;
        color: #333;
        margin-bottom: 8rpx;
        display: block;
      }
      
      .item-time {
        font-size: 22rpx;
        color: #999;
      }
    }
    
    .item-points {
      font-size: 28rpx;
      font-weight: bold;
      
      &.positive {
        color: #52c41a;
      }
      
      &.negative {
        color: #ff4d4f;
      }
    }
  }
  
  .empty-state {
    background: #fff;
    border-radius: 16rpx;
    padding: 80rpx 40rpx;
    text-align: center;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
    
    .empty-text {
      font-size: 24rpx;
      color: #999;
    }
  }
}
</style>