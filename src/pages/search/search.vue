<template>
  <view class="search-container">
    <!-- 搜索头部 -->
    <view class="search-header">
      <view class="search-input-wrapper">
        <uni-icons type="search" size="18" color="#999"></uni-icons>
        <input 
          class="search-input" 
          type="text" 
          v-model="searchKeyword" 
          placeholder="请输入搜索内容" 
          confirm-type="search"
          @confirm="handleSearch"
          @input="onSearchInput"
          focus
        />
        <view v-if="searchKeyword" class="clear-btn" @click="clearSearch">
          <uni-icons type="clear" size="16" color="#999"></uni-icons>
        </view>
      </view>
      <text class="cancel-btn" @click="goBack">取消</text>
    </view>

    <!-- 搜索内容区域 -->
    <view class="search-content">
      <!-- 搜索历史 -->
      <view v-if="searchStore.recentSearchHistory.length > 0" class="search-section">
        <view class="section-header">
          <text class="section-title">搜索历史</text>
          <view class="clear-history" @click="clearHistory">
            <uni-icons type="trash" size="16" color="#999"></uni-icons>
          </view>
        </view>
        <view class="tag-list">
          <view 
            v-for="(item, index) in searchStore.recentSearchHistory" 
            :key="index" 
            class="tag-item history-tag"
            @click="selectHistoryItem(item)"
          >
            <text class="tag-text">{{ item }}</text>
            <view class="remove-tag" @click.stop="removeHistoryItem(item)">
              <uni-icons type="clear" size="12" color="#999"></uni-icons>
            </view>
          </view>
        </view>
      </view>

      <!-- 热门搜索 -->
      <view class="search-section">
        <view class="section-header">
          <text class="section-title">热门搜索</text>
          <view class="refresh-hot" @click="refreshHotSearches">
            <uni-icons type="refresh" size="16" color="#999"></uni-icons>
          </view>
        </view>
        <view class="tag-list">
          <view 
            v-for="(item, index) in searchStore.topHotSearches" 
            :key="index" 
            class="tag-item hot-tag"
            @click="selectHotItem(item)"
          >
            <text class="tag-text">{{ item }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSearchStore } from '@/stores/search.js'

const searchStore = useSearchStore()
const searchKeyword = ref('')

// 处理搜索输入
const onSearchInput = (e) => {
  searchKeyword.value = e.detail.value
}

// 执行搜索
const handleSearch = () => {
  if (!searchKeyword.value.trim()) {
    uni.showToast({ title: '请输入搜索内容', icon: 'none' })
    return
  }
  
  // 跳转到搜索结果页
  uni.navigateTo({
    url: `/pages/search/result?keyword=${encodeURIComponent(searchKeyword.value.trim())}`
  })
}

// 清空搜索框
const clearSearch = () => {
  searchKeyword.value = ''
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 选择历史搜索项
const selectHistoryItem = (item) => {
  searchKeyword.value = item
  handleSearch()
}

// 选择热门搜索项
const selectHotItem = (item) => {
  searchKeyword.value = item
  handleSearch()
}

// 删除单个历史记录
const removeHistoryItem = (item) => {
  searchStore.removeSearchHistory(item)
}

// 清空搜索历史
const clearHistory = () => {
  uni.showModal({
    title: '确认清空',
    content: '确定要清空所有搜索历史吗？',
    success: (res) => {
      if (res.confirm) {
        searchStore.clearSearchHistory()
        uni.showToast({ title: '已清空搜索历史', icon: 'success' })
      }
    }
  })
}

// 刷新热门搜索
const refreshHotSearches = async () => {
  uni.showLoading({ title: '刷新中...' })
  await searchStore.fetchHotSearches()
  uni.hideLoading()
  uni.showToast({ title: '刷新成功', icon: 'success' })
}

// 页面加载时获取热门搜索
onMounted(async () => {
  await searchStore.fetchHotSearches()
})
</script>

<style lang="scss" scoped>
.search-container {
  min-height: 100vh;
  background-color: #f8f9fa;
}

.search-header {
  display: flex;
  align-items: center;
  padding: 20rpx 30rpx;
  background-color: #fff;
  border-bottom: 1px solid #eee;
  
  .search-input-wrapper {
    flex: 1;
    display: flex;
    align-items: center;
    background-color: #f5f5f5;
    border-radius: 50rpx;
    padding: 20rpx 30rpx;
    margin-right: 20rpx;
    
    .search-input {
      flex: 1;
      margin-left: 20rpx;
      font-size: 28rpx;
      color: #333;
      
      &::placeholder {
        color: #999;
      }
    }
    
    .clear-btn {
      margin-left: 20rpx;
      padding: 10rpx;
    }
  }
  
  .cancel-btn {
    font-size: 28rpx;
    color: #007AFF;
  }
}

.search-content {
  padding: 30rpx;
}

.search-section {
  margin-bottom: 60rpx;
  
  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30rpx;
    
    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }
    
    .clear-history,
    .refresh-hot {
      padding: 10rpx;
      opacity: 0.6;
      
      &:active {
        opacity: 1;
      }
    }
  }
  
  .tag-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20rpx;
  }
  
  .tag-item {
    display: flex;
    align-items: center;
    padding: 16rpx 24rpx;
    border-radius: 40rpx;
    font-size: 26rpx;
    
    &.history-tag {
      background-color: #f0f0f0;
      color: #666;
      
      .tag-text {
        margin-right: 12rpx;
      }
      
      .remove-tag {
        padding: 4rpx;
        opacity: 0.6;
      }
      
      &:active {
        background-color: #e0e0e0;
      }
    }
    
    &.hot-tag {
      background-color: #fff;
      color: #007AFF;
      border: 1px solid #007AFF;
      
      &:active {
        background-color: #007AFF;
        color: #fff;
      }
    }
  }
}
</style>