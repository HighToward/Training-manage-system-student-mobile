<template>
  <view class="favorites-container">
    <!-- 分类标签 -->
    <view class="category-tabs">
      <view 
        v-for="(tab, index) in tabs" 
        :key="index" 
        class="tab-item" 
        :class="{ active: activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        <text class="tab-text">{{ tab.name }}</text>
      </view>
    </view>

    <!-- 收藏列表 -->
    <view class="favorites-list">
      <!-- 课程收藏 -->
      <view v-if="activeTab === 'course'" class="course-list">
        <view 
          v-for="(course, index) in courseList" 
          :key="index" 
          class="course-item"
          @click="viewCourse(course)"
        >
          <image :src="course.cover" class="course-cover"></image>
          <view class="course-info">
            <text class="course-title">{{ course.title }}</text>
            <text class="course-desc">{{ course.description }}</text>
            <view class="course-meta">
              <text class="course-progress">学习进度: {{ course.progress }}%</text>
              <text class="collect-time">{{ course.collectTime }}</text>
            </view>
          </view>
          <view class="action-btn" @click.stop="removeFavorite('course', course.id)">
            <uni-icons type="heart-filled" size="20" color="#ff4757"></uni-icons>
          </view>
        </view>
      </view>

      <!-- 文章收藏 -->
      <view v-if="activeTab === 'article'" class="article-list">
        <view 
          v-for="(article, index) in articleList" 
          :key="index" 
          class="article-item"
          @click="viewArticle(article)"
        >
          <view class="article-content">
            <text class="article-title">{{ article.title }}</text>
            <text class="article-summary">{{ article.summary }}</text>
            <view class="article-meta">
              <text class="article-author">{{ article.author }}</text>
              <text class="collect-time">{{ article.collectTime }}</text>
            </view>
          </view>
          <image v-if="article.cover" :src="article.cover" class="article-cover"></image>
          <view class="action-btn" @click.stop="removeFavorite('article', article.id)">
            <uni-icons type="heart-filled" size="20" color="#ff4757"></uni-icons>
          </view>
        </view>
      </view>

      <!-- 视频收藏 -->
      <view v-if="activeTab === 'video'" class="video-list">
        <view 
          v-for="(video, index) in videoList" 
          :key="index" 
          class="video-item"
          @click="playVideo(video)"
        >
          <view class="video-cover-wrapper">
            <image :src="video.cover" class="video-cover"></image>
            <view class="play-icon">
              <uni-icons type="play-filled" size="24" color="#fff"></uni-icons>
            </view>
            <text class="video-duration">{{ video.duration }}</text>
          </view>
          <view class="video-info">
            <text class="video-title">{{ video.title }}</text>
            <view class="video-meta">
              <text class="video-views">{{ video.views }}次观看</text>
              <text class="collect-time">{{ video.collectTime }}</text>
            </view>
          </view>
          <view class="action-btn" @click.stop="removeFavorite('video', video.id)">
            <uni-icons type="heart-filled" size="20" color="#ff4757"></uni-icons>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-if="getCurrentList().length === 0" class="empty-state">
        <image src="/static/images/empty-favorites.png" class="empty-image"></image>
        <text class="empty-text">还没有收藏任何内容</text>
        <text class="empty-tip">快去发现感兴趣的内容吧</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

// 标签页数据
const tabs = ref([
  { key: 'course', name: '课程' },
  { key: 'article', name: '文章' },
  { key: 'video', name: '视频' }
])

const activeTab = ref('course')

// 模拟收藏数据
const courseList = ref([
  {
    id: 1,
    title: '现代Web开发基础',
    description: '学习HTML5、CSS3、JavaScript等前端技术',
    cover: '/static/images/course1.jpg',
    progress: 65,
    collectTime: '2024-12-20'
  },
  {
    id: 2,
    title: 'Vue.js实战开发',
    description: '从零开始学习Vue.js框架开发',
    cover: '/static/images/course2.jpg',
    progress: 30,
    collectTime: '2024-12-18'
  }
])

const articleList = ref([
  {
    id: 1,
    title: 'JavaScript异步编程详解',
    summary: '深入理解Promise、async/await等异步编程概念...',
    author: '张老师',
    cover: '/static/images/article1.jpg',
    collectTime: '2024-12-22'
  },
  {
    id: 2,
    title: 'CSS Grid布局完全指南',
    summary: 'CSS Grid是一个强大的布局系统，本文将详细介绍其使用方法...',
    author: '李老师',
    cover: '',
    collectTime: '2024-12-21'
  }
])

const videoList = ref([
  {
    id: 1,
    title: 'React Hooks深度解析',
    cover: '/static/images/video1.jpg',
    duration: '15:30',
    views: 1250,
    collectTime: '2024-12-23'
  }
])

// 切换标签
const switchTab = (key) => {
  activeTab.value = key
}

// 获取当前列表
const getCurrentList = () => {
  switch (activeTab.value) {
    case 'course':
      return courseList.value
    case 'article':
      return articleList.value
    case 'video':
      return videoList.value
    default:
      return []
  }
}

// 查看课程
const viewCourse = (course) => {
  uni.navigateTo({
    url: `/pages/course/detail?id=${course.id}`
  })
}

// 查看文章
const viewArticle = (article) => {
  uni.navigateTo({
    url: `/pages/article/detail?id=${article.id}`
  })
}

// 播放视频
const playVideo = (video) => {
  uni.navigateTo({
    url: `/pages/video/player?id=${video.id}`
  })
}

// 取消收藏
const removeFavorite = (type, id) => {
  uni.showModal({
    title: '提示',
    content: '确定要取消收藏吗？',
    success: (res) => {
      if (res.confirm) {
        // 从对应列表中移除
        switch (type) {
          case 'course':
            courseList.value = courseList.value.filter(item => item.id !== id)
            break
          case 'article':
            articleList.value = articleList.value.filter(item => item.id !== id)
            break
          case 'video':
            videoList.value = videoList.value.filter(item => item.id !== id)
            break
        }
        uni.showToast({
          title: '已取消收藏',
          icon: 'success'
        })
      }
    }
  })
}

// 页面加载
onMounted(() => {
  // 这里可以调用API获取收藏列表
  console.log('我的收藏页面加载完成')
})
</script>

<style lang="scss" scoped>
.favorites-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.category-tabs {
  background: #fff;
  display: flex;
  padding: 0 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 30rpx 0;
    position: relative;
    
    .tab-text {
      font-size: 28rpx;
      color: #666;
      transition: color 0.3s;
    }
    
    &.active {
      .tab-text {
        color: #1890ff;
        font-weight: bold;
      }
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60rpx;
        height: 4rpx;
        background-color: #1890ff;
        border-radius: 2rpx;
      }
    }
  }
}

.favorites-list {
  padding: 30rpx;
}

// 课程列表样式
.course-list {
  .course-item {
    background: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
    
    &:active {
      background-color: #f8f8f8;
    }
    
    .course-cover {
      width: 120rpx;
      height: 90rpx;
      border-radius: 8rpx;
      margin-right: 20rpx;
      background-color: #f0f0f0;
    }
    
    .course-info {
      flex: 1;
      
      .course-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 8rpx;
        display: block;
      }
      
      .course-desc {
        font-size: 22rpx;
        color: #666;
        margin-bottom: 12rpx;
        display: block;
        line-height: 1.4;
      }
      
      .course-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .course-progress {
          font-size: 20rpx;
          color: #1890ff;
        }
        
        .collect-time {
          font-size: 20rpx;
          color: #999;
        }
      }
    }
    
    .action-btn {
      padding: 10rpx;
    }
  }
}

// 文章列表样式
.article-list {
  .article-item {
    background: #fff;
    border-radius: 16rpx;
    padding: 30rpx;
    margin-bottom: 20rpx;
    display: flex;
    align-items: flex-start;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
    
    &:active {
      background-color: #f8f8f8;
    }
    
    .article-content {
      flex: 1;
      margin-right: 20rpx;
      
      .article-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 12rpx;
        display: block;
        line-height: 1.4;
      }
      
      .article-summary {
        font-size: 22rpx;
        color: #666;
        line-height: 1.5;
        margin-bottom: 16rpx;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
      
      .article-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .article-author {
          font-size: 20rpx;
          color: #1890ff;
        }
        
        .collect-time {
          font-size: 20rpx;
          color: #999;
        }
      }
    }
    
    .article-cover {
      width: 120rpx;
      height: 90rpx;
      border-radius: 8rpx;
      background-color: #f0f0f0;
      margin-right: 20rpx;
    }
    
    .action-btn {
      padding: 10rpx;
    }
  }
}

// 视频列表样式
.video-list {
  .video-item {
    background: #fff;
    border-radius: 16rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;
    display: flex;
    align-items: center;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
    
    &:active {
      background-color: #f8f8f8;
    }
    
    .video-cover-wrapper {
      position: relative;
      margin-right: 20rpx;
      
      .video-cover {
        width: 160rpx;
        height: 90rpx;
        border-radius: 8rpx;
        background-color: #f0f0f0;
      }
      
      .play-icon {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 40rpx;
        height: 40rpx;
        background-color: rgba(0, 0, 0, 0.6);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .video-duration {
        position: absolute;
        bottom: 8rpx;
        right: 8rpx;
        background-color: rgba(0, 0, 0, 0.7);
        color: #fff;
        font-size: 18rpx;
        padding: 2rpx 6rpx;
        border-radius: 4rpx;
      }
    }
    
    .video-info {
      flex: 1;
      
      .video-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 12rpx;
        display: block;
        line-height: 1.4;
      }
      
      .video-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .video-views {
          font-size: 20rpx;
          color: #666;
        }
        
        .collect-time {
          font-size: 20rpx;
          color: #999;
        }
      }
    }
    
    .action-btn {
      padding: 10rpx;
    }
  }
}

// 空状态样式
.empty-state {
  background: #fff;
  border-radius: 16rpx;
  padding: 80rpx 40rpx;
  text-align: center;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  
  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 30rpx;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 12rpx;
    display: block;
  }
  
  .empty-tip {
    font-size: 22rpx;
    color: #999;
  }
}
</style>