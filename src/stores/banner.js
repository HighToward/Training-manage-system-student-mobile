import { defineStore } from 'pinia'
import { courseApi, BASE_URL } from '@/api/index.js'

export const useBannerStore = defineStore('banner', {
  state: () => ({
    bannerItems: [],
    lastUpdateDate: null,
    loading: false
  }),

  getters: {
    // 检查是否需要更新数据（每日0点更新）
    needsUpdate: (state) => {
      if (!state.lastUpdateDate) return true
      
      const today = new Date().toDateString()
      const lastUpdate = new Date(state.lastUpdateDate).toDateString()
      
      return today !== lastUpdate
    }
  },

  actions: {
    // 获取推荐课程作为轮播图数据
    async fetchBannerData() {
      if (this.loading) return
      
      try {
        this.loading = true
        
        const response = await courseApi.getCourseList({
          pageNum: 1,
          pageSize: 3 // 获取3个推荐课程
        })
        
        if (response && (response.code === 200 || response.code === 0)) {
          const courseList = response.data?.list || response.data || []
          
          // 转换课程数据为轮播图格式
          this.bannerItems = courseList.slice(0, 3).map(course => ({
            id: course.id,
            imageUrl: this.getImageUrl(course.couPic),
            title: this.truncateText(course.couName, 16), // 限制标题16字
            subtitle: this.truncateText(course.couIntroduction || course.couDescription || `${course.teaName || ''}老师主讲`, 16), // 课程介绍
            courseId: course.id,
            originalCourse: course
          }))
          
          this.lastUpdateDate = new Date().toISOString()
        } else {
          console.error('获取课程数据失败:', response)
          // 使用默认数据
          this.setDefaultBannerData()
        }
      } catch (error) {
        console.error('获取轮播图数据失败:', error)
        // 使用默认数据
        this.setDefaultBannerData()
      } finally {
        this.loading = false
      }
    },

    // 设置默认轮播图数据
    setDefaultBannerData() {
      this.bannerItems = [
        {
          id: 1,
          imageUrl: '/static/images/banner1.png',
          title: '内科护理学',
          subtitle: '呼吸系统疾病病人的护理与临床思维',
          courseId: null
        },
        {
          id: 2,
          imageUrl: '/static/images/banner2.png',
          title: '传染病学',
          subtitle: '常见传染病的预防与控制',
          courseId: null
        },
        {
          id: 3,
          imageUrl: '/static/images/course1.png',
          title: '口腔正畸学',
          subtitle: '口腔正畸基础理论与实践',
          courseId: null
        }
      ]
      this.lastUpdateDate = new Date().toISOString()
    },

    // 处理图片URL
    getImageUrl(imagePath) {
      if (!imagePath) return '/static/images/course-default.png'
      
      // 如果已经是完整URL，直接返回
      if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath
      }
      
      // 使用统一的后端服务器地址
      return `${BASE_URL}/uploads/${imagePath.replace(/^\/?uploads\//, '')}`
    },

    // 截取文本到指定长度
    truncateText(text, maxLength) {
      if (!text) return ''
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    },

    // 初始化轮播图数据
    async initBannerData() {
      // 如果需要更新或者没有数据，则获取新数据
      if (this.needsUpdate || this.bannerItems.length === 0) {
        await this.fetchBannerData()
      }
    },

    // 强制刷新轮播图数据
    async refreshBannerData() {
      await this.fetchBannerData()
    }
  },

  // 移除持久化配置，避免缓存导致的API端口问题
})