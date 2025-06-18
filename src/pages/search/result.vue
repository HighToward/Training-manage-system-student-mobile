<template>
  <view class="search-result-container">
    <!-- 搜索头部 -->
    <view class="search-header">
      <view class="search-input-wrapper" @click="goToSearch">
        <uni-icons type="search" size="18" color="#999"></uni-icons>
        <text class="search-text">{{ searchKeyword || '请输入搜索内容' }}</text>
      </view>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-bar">
      <view class="filter-item" @click="showCategoryFilter">
        <text class="filter-text">{{ selectedCategory || '全部分类' }}</text>
        <uni-icons type="arrowdown" size="14" color="#666"></uni-icons>
      </view>
      
      <view class="filter-item" @click="showPointsFilter">
        <text class="filter-text">{{ pointsFilterText }}</text>
        <uni-icons type="arrowdown" size="14" color="#666"></uni-icons>
      </view>
      
      <view class="filter-item" @click="showSortFilter">
        <text class="filter-text">{{ sortFilterText }}</text>
        <uni-icons type="arrowdown" size="14" color="#666"></uni-icons>
      </view>
    </view>

    <!-- 搜索结果 -->
    <view class="search-results">
      <!-- 结果统计 -->
      <view v-if="!searchStore.loading && searchStore.searchResults.length > 0" class="result-stats">
        <text class="stats-text">共找到 {{ searchStore.total }} 门课程</text>
      </view>

      <!-- 课程列表 -->
      <view class="course-list">
        <view 
          v-for="course in searchStore.searchResults" 
          :key="course.id" 
          class="course-item"
          @click="goToCourseDetail(course.id)"
        >
          <image :src="getImageUrl(course.couPic)" class="course-cover" mode="aspectFill"></image>
          <view class="course-info">
            <text class="course-title">{{ course.couName }}</text>
            <text class="course-teacher">{{ course.teaName }}</text>
            <view class="course-meta">
              <text class="course-category">{{ course.typeName }}</text>
              <text class="course-buyers">{{ course.purchase || 0 }}人购买</text>
            </view>
            <view class="course-bottom">
              <text class="course-price">{{ convertPriceToPoints(course.couPrice) }} 积分</text>
              <view class="course-rating" v-if="course.averageScore">
                <uni-rate :value="course.averageScore" readonly size="12"></uni-rate>
                <text class="rating-text">{{ course.averageScore.toFixed(1) }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 加载状态 -->
      <view v-if="searchStore.loading" class="loading-container">
        <uni-load-more status="loading" :content-text="loadingText"></uni-load-more>
      </view>

      <!-- 空状态 -->
      <view v-if="!searchStore.loading && searchStore.searchResults.length === 0" class="empty-container">
        <image src="/static/images/empty-search.png" class="empty-image" mode="aspectFit"></image>
        <text class="empty-text">没有找到相关课程</text>
        <text class="empty-tip">试试其他关键词或调整筛选条件</text>
      </view>

      <!-- 加载更多 -->
      <view v-if="!searchStore.loading && searchStore.hasMore && searchStore.searchResults.length > 0" class="load-more">
        <uni-load-more status="more" @click="loadMore"></uni-load-more>
      </view>

      <!-- 没有更多 -->
      <view v-if="!searchStore.loading && !searchStore.hasMore && searchStore.searchResults.length > 0" class="no-more">
        <text class="no-more-text">没有更多课程了</text>
      </view>
    </view>

    <!-- 分类筛选弹窗 -->
    <uni-popup ref="categoryPopup" type="bottom">
      <view class="filter-popup">
        <view class="popup-header">
          <text class="popup-title">选择分类</text>
          <view class="popup-close" @click="closeCategoryFilter">
            <uni-icons type="clear" size="20" color="#666"></uni-icons>
          </view>
        </view>
        <view class="filter-options">
          <view 
            v-for="category in categories" 
            :key="category.id" 
            class="filter-option"
            :class="{ active: selectedCategory === category.typeName }"
            @click="selectCategory(category)"
          >
            <text class="option-text">{{ category.typeName }}</text>
            <uni-icons v-if="selectedCategory === category.typeName" type="checkmarkempty" size="18" color="#007AFF"></uni-icons>
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 积分筛选弹窗 -->
    <uni-popup ref="pointsPopup" type="bottom">
      <view class="filter-popup">
        <view class="popup-header">
          <text class="popup-title">积分范围</text>
          <view class="popup-close" @click="closePointsFilter">
            <uni-icons type="clear" size="20" color="#666"></uni-icons>
          </view>
        </view>
        <view class="filter-options">
          <view 
            v-for="range in pointsRanges" 
            :key="range.key" 
            class="filter-option"
            :class="{ active: selectedPointsRange === range.key }"
            @click="selectPointsRange(range)"
          >
            <text class="option-text">{{ range.label }}</text>
            <uni-icons v-if="selectedPointsRange === range.key" type="checkmarkempty" size="18" color="#007AFF"></uni-icons>
          </view>
        </view>
      </view>
    </uni-popup>

    <!-- 排序筛选弹窗 -->
    <uni-popup ref="sortPopup" type="bottom">
      <view class="filter-popup">
        <view class="popup-header">
          <text class="popup-title">排序方式</text>
          <view class="popup-close" @click="closeSortFilter">
            <uni-icons type="clear" size="20" color="#666"></uni-icons>
          </view>
        </view>
        <view class="filter-options">
          <view 
            v-for="sort in sortOptions" 
            :key="sort.key" 
            class="filter-option"
            :class="{ active: selectedSort === sort.key }"
            @click="selectSort(sort)"
          >
            <text class="option-text">{{ sort.label }}</text>
            <uni-icons v-if="selectedSort === sort.key" type="checkmarkempty" size="18" color="#007AFF"></uni-icons>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad, onReachBottom } from '@dcloudio/uni-app'
import { useSearchStore } from '@/stores/search.js'
import { courseApi, BASE_URL } from '@/api/index.js'

const searchStore = useSearchStore()
const searchKeyword = ref('')
const categories = ref([])
const selectedCategory = ref('')
const selectedPointsRange = ref('')
const selectedSort = ref('default')

// 弹窗引用
const categoryPopup = ref()
const pointsPopup = ref()
const sortPopup = ref()

// 积分范围选项
const pointsRanges = [
  { key: 'all', label: '不限', min: null, max: null },
  { key: '0-50', label: '0-50积分', min: 0, max: 50 },
  { key: '50-100', label: '50-100积分', min: 50, max: 100 },
  { key: '100-200', label: '100-200积分', min: 100, max: 200 },
  { key: '200-500', label: '200-500积分', min: 200, max: 500 },
  { key: '500+', label: '500积分以上', min: 500, max: null }
]

// 排序选项
const sortOptions = [
  { key: 'default', label: '默认排序' },
  { key: 'price_asc', label: '积分从低到高' },
  { key: 'price_desc', label: '积分从高到低' },
  { key: 'popularity_asc', label: '热度从低到高' },
  { key: 'popularity_desc', label: '热度从高到低' }
]

// 计算属性
const pointsFilterText = computed(() => {
  const range = pointsRanges.find(r => r.key === selectedPointsRange.value)
  return range ? range.label : '积分范围'
})

const sortFilterText = computed(() => {
  const sort = sortOptions.find(s => s.key === selectedSort.value)
  return sort ? sort.label : '排序'
})

const loadingText = computed(() => {
  return {
    contentText: {
      contentdown: '上拉加载更多',
      contentrefresh: '加载中...',
      contentnomore: '没有更多了'
    }
  }
})

// 页面加载
onLoad(async (options) => {
  searchKeyword.value = options.keyword || ''
  
  // 获取分类列表
  await fetchCategories()
  
  // 执行搜索
  if (searchKeyword.value) {
    await performSearch()
  }
})

// 触底加载更多
onReachBottom(() => {
  if (searchStore.hasMore && !searchStore.loading) {
    loadMore()
  }
})

// 获取分类列表
const fetchCategories = async () => {
  try {
    const response = await courseApi.getCourseTypes()
    if (response && (response.code === 200 || response.code === 0)) {
      categories.value = [
        { id: 0, typeName: '全部分类' },
        ...(response.data || [])
      ]
    }
  } catch (error) {
    console.error('获取分类失败:', error)
    categories.value = [{ id: 0, typeName: '全部分类' }]
  }
}

// 执行搜索
const performSearch = async () => {
  const pointsRange = pointsRanges.find(r => r.key === selectedPointsRange.value)
  
  await searchStore.searchCourses({
    keyword: searchKeyword.value,
    category: selectedCategory.value === '全部分类' ? '' : selectedCategory.value,
    minPoints: pointsRange?.min,
    maxPoints: pointsRange?.max,
    sortBy: selectedSort.value
  })
}

// 加载更多
const loadMore = async () => {
  const pointsRange = pointsRanges.find(r => r.key === selectedPointsRange.value)
  
  await searchStore.searchCourses({
    keyword: searchKeyword.value,
    category: selectedCategory.value === '全部分类' ? '' : selectedCategory.value,
    minPoints: pointsRange?.min,
    maxPoints: pointsRange?.max,
    sortBy: selectedSort.value
  }, true)
}

// 跳转到搜索页
const goToSearch = () => {
  uni.navigateTo({
    url: '/pages/search/search'
  })
}

// 跳转到课程详情
const goToCourseDetail = (courseId) => {
  uni.navigateTo({
    url: `/pages/course/detail?id=${courseId}`
  })
}

// 显示分类筛选
const showCategoryFilter = () => {
  categoryPopup.value.open()
}

// 关闭分类筛选
const closeCategoryFilter = () => {
  categoryPopup.value.close()
}

// 选择分类
const selectCategory = async (category) => {
  selectedCategory.value = category.typeName
  closeCategoryFilter()
  await performSearch()
}

// 显示积分筛选
const showPointsFilter = () => {
  pointsPopup.value.open()
}

// 关闭积分筛选
const closePointsFilter = () => {
  pointsPopup.value.close()
}

// 选择积分范围
const selectPointsRange = async (range) => {
  selectedPointsRange.value = range.key
  closePointsFilter()
  await performSearch()
}

// 显示排序筛选
const showSortFilter = () => {
  sortPopup.value.open()
}

// 关闭排序筛选
const closeSortFilter = () => {
  sortPopup.value.close()
}

// 选择排序
const selectSort = async (sort) => {
  selectedSort.value = sort.key
  closeSortFilter()
  await performSearch()
}

// 工具函数
const getImageUrl = (imagePath) => {
  if (!imagePath) return '/static/images/course-default.png'
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  
  return `${BASE_URL}/uploads/${imagePath.replace(/^\/?uploads\//, '')}`
}

const convertPriceToPoints = (price) => {
  if (!price) return 0
  return Math.ceil(price * 10)
}
</script>

<style lang="scss" scoped>
.search-result-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.search-header {
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  
  .search-input-wrapper {
    display: flex;
    align-items: center;
    background-color: #f5f5f5;
    border-radius: 50rpx;
    padding: 20rpx 30rpx;
    
    .search-text {
      flex: 1;
      margin-left: 20rpx;
      font-size: 28rpx;
      color: #666;
    }
  }
}

.filter-bar {
  display: flex;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  
  .filter-item {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24rpx 20rpx;
    border-right: 1px solid #eee;
    
    &:last-child {
      border-right: none;
    }
    
    .filter-text {
      font-size: 26rpx;
      color: #333;
      margin-right: 8rpx;
    }
    
    &:active {
      background-color: #f5f5f5;
    }
  }
}

.search-results {
  padding: 20rpx;
}

.result-stats {
  padding: 20rpx 0;
  
  .stats-text {
    font-size: 24rpx;
    color: #666;
  }
}

.course-list {
  .course-item {
    display: flex;
    background-color: #fff;
    border-radius: 16rpx;
    padding: 24rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
    
    .course-cover {
      width: 160rpx;
      height: 120rpx;
      border-radius: 12rpx;
      margin-right: 24rpx;
    }
    
    .course-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      
      .course-title {
        font-size: 30rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 12rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .course-teacher {
        font-size: 24rpx;
        color: #666;
        margin-bottom: 12rpx;
      }
      
      .course-meta {
        display: flex;
        align-items: center;
        margin-bottom: 12rpx;
        
        .course-category {
          font-size: 22rpx;
          color: #007AFF;
          background-color: #E3F2FD;
          padding: 4rpx 12rpx;
          border-radius: 20rpx;
          margin-right: 16rpx;
        }
        
        .course-buyers {
          font-size: 22rpx;
          color: #999;
        }
      }
      
      .course-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        .course-price {
          font-size: 28rpx;
          font-weight: 600;
          color: #FF6B35;
        }
        
        .course-rating {
          display: flex;
          align-items: center;
          
          .rating-text {
            font-size: 22rpx;
            color: #666;
            margin-left: 8rpx;
          }
        }
      }
    }
    
    &:active {
      transform: scale(0.98);
    }
  }
}

.loading-container,
.load-more {
  padding: 40rpx 0;
  text-align: center;
}

.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 40rpx;
  
  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 40rpx;
    opacity: 0.6;
  }
  
  .empty-text {
    font-size: 32rpx;
    color: #666;
    margin-bottom: 16rpx;
  }
  
  .empty-tip {
    font-size: 26rpx;
    color: #999;
  }
}

.no-more {
  padding: 40rpx 0;
  text-align: center;
  
  .no-more-text {
    font-size: 24rpx;
    color: #999;
  }
}

.filter-popup {
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 80vh;
  
  .popup-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 40rpx 40rpx 20rpx;
    border-bottom: 1px solid #eee;
    
    .popup-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }
    
    .popup-close {
      padding: 10rpx;
    }
  }
  
  .filter-options {
    max-height: 60vh;
    overflow-y: auto;
    
    .filter-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 32rpx 40rpx;
      border-bottom: 1px solid #f5f5f5;
      
      &:last-child {
        border-bottom: none;
      }
      
      .option-text {
        font-size: 28rpx;
        color: #333;
      }
      
      &.active {
        .option-text {
          color: #007AFF;
          font-weight: 600;
        }
      }
      
      &:active {
        background-color: #f5f5f5;
      }
    }
  }
}
</style>