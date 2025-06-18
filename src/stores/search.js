import { defineStore } from 'pinia'
import { courseApi } from '@/api/index.js'

export const useSearchStore = defineStore('search', {
  state: () => ({
    // 搜索历史记录
    searchHistory: [],
    // 热门搜索
    hotSearches: [],
    // 搜索结果
    searchResults: [],
    // 搜索参数
    searchParams: {
      keyword: '',
      category: '',
      minPoints: null,
      maxPoints: null,
      sortBy: 'default', // default, price_asc, price_desc, popularity_asc, popularity_desc
      page: 1,
      pageSize: 10
    },
    // 加载状态
    loading: false,
    // 是否还有更多数据
    hasMore: true,
    // 总数
    total: 0
  }),

  getters: {
    // 获取最近的搜索历史（最多10条）
    recentSearchHistory: (state) => {
      return state.searchHistory.slice(0, 10)
    },
    
    // 获取热门搜索（最多8条）
    topHotSearches: (state) => {
      return state.hotSearches.slice(0, 8)
    }
  },

  actions: {
    // 添加搜索历史
    addSearchHistory(keyword) {
      if (!keyword || keyword.trim() === '') return
      
      const trimmedKeyword = keyword.trim()
      
      // 移除已存在的相同关键词
      this.searchHistory = this.searchHistory.filter(item => item !== trimmedKeyword)
      
      // 添加到开头
      this.searchHistory.unshift(trimmedKeyword)
      
      // 限制历史记录数量（最多20条）
      if (this.searchHistory.length > 20) {
        this.searchHistory = this.searchHistory.slice(0, 20)
      }
    },

    // 删除单个搜索历史
    removeSearchHistory(keyword) {
      this.searchHistory = this.searchHistory.filter(item => item !== keyword)
    },

    // 清空搜索历史
    clearSearchHistory() {
      this.searchHistory = []
    },

    // 获取热门搜索
    async fetchHotSearches() {
      try {
        const response = await courseApi.getHotSearches()
        if (response && (response.code === 200 || response.code === 0)) {
          this.hotSearches = response.data || []
        } else {
          // 如果接口失败，使用默认热门搜索
          this.hotSearches = [
            'Java基础',
            'Spring Boot',
            'Vue.js',
            'Python',
            '数据结构',
            '算法',
            '前端开发',
            '后端开发'
          ]
        }
      } catch (error) {
        console.error('获取热门搜索失败:', error)
        // 使用默认热门搜索
        this.hotSearches = [
          'Java基础',
          'Spring Boot',
          'Vue.js',
          'Python',
          '数据结构',
          '算法',
          '前端开发',
          '后端开发'
        ]
      }
    },

    // 搜索课程
    async searchCourses(params = {}, isLoadMore = false) {
      try {
        this.loading = true
        
        // 合并搜索参数
        const searchParams = {
          ...this.searchParams,
          ...params
        }
        
        // 如果是加载更多，页码+1
        if (isLoadMore) {
          searchParams.page = this.searchParams.page + 1
        } else {
          searchParams.page = 1
          this.searchResults = []
        }
        
        // 更新搜索参数
        this.searchParams = { ...searchParams }
        
        // 调用搜索接口
        const response = await courseApi.searchCourses(searchParams)
        
        if (response && (response.code === 200 || response.code === 0)) {
          const data = response.data || {}
          const courses = data.records || data.list || []
          
          if (isLoadMore) {
            // 加载更多：追加到现有结果
            this.searchResults = [...this.searchResults, ...courses]
          } else {
            // 新搜索：替换结果
            this.searchResults = courses
          }
          
          this.total = data.total || courses.length
          this.hasMore = courses.length === searchParams.pageSize && this.searchResults.length < this.total
          
          // 如果有搜索关键词，添加到搜索历史
          if (searchParams.keyword && !isLoadMore) {
            this.addSearchHistory(searchParams.keyword)
          }
        } else {
          throw new Error(response?.message || '搜索失败')
        }
      } catch (error) {
        console.error('搜索课程失败:', error)
        uni.showToast({ title: error.message || '搜索失败，请稍后重试', icon: 'none' })
        
        if (!isLoadMore) {
          this.searchResults = []
          this.total = 0
          this.hasMore = false
        }
      } finally {
        this.loading = false
      }
    },

    // 重置搜索参数
    resetSearchParams() {
      this.searchParams = {
        keyword: '',
        category: '',
        minPoints: null,
        maxPoints: null,
        sortBy: 'default',
        page: 1,
        pageSize: 10
      }
      this.searchResults = []
      this.total = 0
      this.hasMore = true
    },

    // 设置搜索关键词
    setSearchKeyword(keyword) {
      this.searchParams.keyword = keyword
    },

    // 设置分类筛选
    setCategory(category) {
      this.searchParams.category = category
    },

    // 设置积分范围
    setPointsRange(minPoints, maxPoints) {
      this.searchParams.minPoints = minPoints
      this.searchParams.maxPoints = maxPoints
    },

    // 设置排序方式
    setSortBy(sortBy) {
      this.searchParams.sortBy = sortBy
    }
  },

  // 持久化配置
  persist: {
    enabled: true,
    strategies: [
      {
        key: 'search-store',
        storage: {
          getItem: (key) => uni.getStorageSync(key),
          setItem: (key, value) => uni.setStorageSync(key, value)
        },
        // 只持久化搜索历史和热门搜索
        paths: ['searchHistory', 'hotSearches']
      }
    ]
  }
})