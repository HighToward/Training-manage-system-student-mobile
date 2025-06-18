<template>
  <view class="home-container" @touchstart="onTouchStart" @touchmove="onTouchMove" @touchend="onTouchEnd">
    <!-- 顶部状态栏 -->
    <view class="status-bar"></view>
    
    <!-- 头部区域 -->
    <view class="header">
      <!-- 问候语和用户信息 -->
      <view class="greeting-section">
        <view class="greeting-text">
          <text class="greeting-main">你好，学习者</text>
          <text class="greeting-sub">今天也要努力学习哦～</text>
        </view>
        <view class="user-avatar">
          <uni-icons type="person-filled" size="24" color="#fff"></uni-icons>
        </view>
      </view>
      
      <!-- 搜索框 -->
      <view class="search-container">
        <view class="search-box" @click="focusSearch">
          <uni-icons type="search" size="18" color="#999"></uni-icons>
          <input 
            class="search-input" 
            type="text" 
            placeholder="搜索你想学的课程" 
            @confirm="onSearch" 
            @input="onSearchInput"
          />
        </view>
      </view>
    </view>

    <!-- 主要内容区域 -->
    <scroll-view class="main-content" scroll-y="true">
      <!-- 轮播图 -->
      <view class="banner-section">
        <swiper class="banner-swiper" :indicator-dots="true" :autoplay="true" :interval="3000" :duration="500">
          <swiper-item v-for="(item, index) in bannerItems" :key="index" @click="onBannerClick(item)">
            <view class="banner-item">
              <image :src="item.imageUrl" class="banner-image" mode="aspectFill"></image>
              <view class="banner-overlay">
                <view class="banner-content">
                  <text class="banner-title">{{ item.title }}</text>
                  <text class="banner-subtitle">{{ item.subtitle }}</text>
                  <view class="banner-action">
                    <text class="action-text">立即学习</text>
                    <uni-icons type="right" size="14" color="#fff"></uni-icons>
                  </view>
                </view>
              </view>
            </view>
          </swiper-item>
        </swiper>
      </view>

      <!-- 功能分类导航 -->
      <view class="category-section">
        <view class="category-header">
          <text class="category-title">学习分类</text>
          <view class="category-more" @click="navigateToCategory('/pages/category/all')">
            <text class="more-text">更多</text>
            <uni-icons type="right" size="12" color="#999"></uni-icons>
          </view>
        </view>
        <view class="category-grid">
          <view class="category-item" v-for="(item, index) in categories" :key="index" @click="navigateToCategory(item.path)">
            <view class="category-icon-wrapper">
              <image :src="item.iconUrl" class="category-icon"></image>
            </view>
            <text class="category-name">{{ item.name }}</text>
          </view>
        </view>
      </view>

      <!-- 推荐课程 -->
      <view class="courses-section">
        <view class="section-header">
          <view class="section-title-wrapper">
            <view class="title-indicator"></view>
            <text class="section-title">精品推荐</text>
          </view>
          <view class="section-subtitle">
            <text class="subtitle-text">为你精选优质课程</text>
          </view>
        </view>
        
        <view v-if="loading" class="loading-container">
          <view class="loading-spinner">
            <uni-icons type="spinner-cycle" size="24" color="#1890ff"></uni-icons>
          </view>
          <text class="loading-text">加载中...</text>
        </view>
        
        <view v-else-if="recommendedCourses.length > 0" class="course-grid">
          <view class="course-card" v-for="(course, index) in recommendedCourses" :key="course.id" @click="navigateToCourseDetail(course.id)">
            <view class="course-image-wrapper">
              <image :src="getImageUrl(course.couPic)" class="course-image" mode="aspectFill"></image>
              <view class="course-badge">
                <text class="badge-text">热门</text>
              </view>
            </view>
            <view class="course-content">
              <text class="course-title">{{ course.couName }}</text>
              <view class="course-teacher-info">
                <uni-icons type="person" size="12" color="#999"></uni-icons>
                <text class="teacher-name">{{ course.teaName }}</text>
              </view>
              <view class="course-footer">
                <view class="course-price">
                  <text class="price-label">积分</text>
                  <text class="price-value">{{ convertPriceToPoints(course.couPrice) }}</text>
                </view>
                <view class="course-stats">
                  <uni-icons type="eye" size="12" color="#999"></uni-icons>
                  <text class="stats-text">{{ course.purchase || 0 }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
        
        <view v-else class="empty-state">
          <view class="empty-icon">
            <uni-icons type="info" size="48" color="#d9d9d9"></uni-icons>
          </view>
          <text class="empty-text">暂无推荐课程</text>
          <text class="empty-desc">稍后再来看看吧</text>
        </view>
      </view>
      
      <!-- 底部间距 -->
      <view class="bottom-spacing"></view>
    </scroll-view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { courseApi, BASE_URL } from '@/api/index.js';
import { useBannerStore } from '@/stores/banner.js';
import { useSearchStore } from '@/stores/search.js';

// 使用 Pinia store 管理轮播图数据
const bannerStore = useBannerStore();
const searchStore = useSearchStore();
const bannerItems = ref([]);

// 分类导航数据
const categories = ref([
  { name: '推荐美食', iconUrl: '/static/icons/food.svg', path: '/pages/category/food' },
  { name: '医药卫生', iconUrl: '/static/icons/medical.svg', path: '/pages/category/medical' },
  { name: '内科护理', iconUrl: '/static/icons/internal_medicine.svg', path: '/pages/category/internal_medicine' },
  { name: '更多课程', iconUrl: '/static/icons/more.svg', path: '/pages/category/all' },
]);

// 推荐课程数据
const recommendedCourses = ref([]);
const loading = ref(false);

// 将价格转换为积分（1元 = 10积分）
const convertPriceToPoints = (price) => {
  if (!price) return 0;
  return Math.ceil(price * 10);
};

// 搜索功能
const onSearch = async (e) => {
  const keyword = e.value;
  if (!keyword.trim()) {
    uni.showToast({ title: '请输入搜索关键词', icon: 'none' });
    return;
  }
  
  try {
    const response = await courseApi.getCourseList({
      pageNum: 1,
      pageSize: 20,
      couName: keyword
    });
    
    // 统一处理响应
    if (response && (response.code === 200 || response.code === 0)) {
      uni.navigateTo({ 
        url: `/pages/course/list?keyword=${encodeURIComponent(keyword)}` 
      });
    } else {
      uni.showToast({ title: response?.message || '搜索失败', icon: 'none' });
    }
  } catch (error) {
    console.error('搜索失败:', error);
    uni.showToast({ title: '搜索失败，请稍后重试', icon: 'none' });
  }
};

const onCancelSearch = () => {
  console.log('取消搜索');
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return '/static/images/course-default.png';
  
  // 如果已经是完整URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // 使用统一的后端服务器地址
  return `${BASE_URL}/uploads/${imagePath.replace(/^\/?uploads\//, '')}`;
};

const onClearSearch = () => {
  console.log('清除搜索');
};

// 新增的搜索相关方法
const focusSearch = () => {
  // 跳转到搜索页面
  uni.navigateTo({
    url: '/pages/search/search'
  });
};

const onSearchInput = (e) => {
  // 搜索输入处理
  console.log('搜索输入:', e.detail.value);
};

const navigateToCategory = (path) => {
  console.log('跳转到分类:', path);
  uni.showToast({ title: '功能暂未开放', icon: 'none' });
};

const navigateToCourseDetail = (courseId) => {
  console.log('跳转到课程详情:', courseId);
  uni.navigateTo({ url: `/pages/course/detail?id=${courseId}` });
};

// 轮播图点击事件
const onBannerClick = (bannerItem) => {
  if (bannerItem.courseId) {
    navigateToCourseDetail(bannerItem.courseId);
  } else {
    uni.showToast({ title: '课程暂未开放', icon: 'none' });
  }
};

// 下拉刷新相关
const refreshing = ref(false);
const startY = ref(0);
const currentY = ref(0);
const pullDistance = ref(0);
const isPulling = ref(false);

// 触摸事件处理
const onTouchStart = (e) => {
  if (uni.getSystemInfoSync().scrollTop <= 0) {
    startY.value = e.touches[0].clientY;
    isPulling.value = true;
  }
};

const onTouchMove = (e) => {
  if (isPulling.value && !refreshing.value) {
    currentY.value = e.touches[0].clientY;
    pullDistance.value = Math.max(0, currentY.value - startY.value);
  }
};

const onTouchEnd = async () => {
  if (isPulling.value && pullDistance.value > 50 && !refreshing.value) {
    await refreshData();
  }
  isPulling.value = false;
  pullDistance.value = 0;
};

// 刷新数据
const refreshData = async () => {
  try {
    refreshing.value = true;
    uni.showToast({ title: '刷新中...', icon: 'loading' });
    
    // 刷新轮播图数据
    await bannerStore.refreshBannerData();
    bannerItems.value = bannerStore.bannerItems;
    
    // 刷新推荐课程
    await fetchRecommendedCourses();
    
    uni.showToast({ title: '刷新成功', icon: 'success' });
  } catch (error) {
    console.error('刷新失败:', error);
    uni.showToast({ title: '刷新失败', icon: 'none' });
  } finally {
    refreshing.value = false;
  }
};

// 获取推荐课程
const fetchRecommendedCourses = async () => {
  try {
    loading.value = true;
    
    const response = await courseApi.getCourseList({
      pageNum: 1,
      pageSize: 8
    });
    
    // 统一处理响应格式
    if (response && (response.code === 200 || response.code === 0)) {
      const courseList = response.data?.list || response.data || [];
      recommendedCourses.value = courseList;
    } else {
      console.error('API返回错误:', response);
      uni.showToast({ title: response?.message || '获取课程失败', icon: 'none' });
      // 使用模拟数据作为后备
      recommendedCourses.value = [
        { id: 1, couPic: '/static/images/course1.png', couName: '口腔正畸学', couPrice: 1, teaName: '张教授', purchase: 0 },
        { id: 2, couPic: '/static/images/course2.png', couName: '内科护理学', couPrice: 1, teaName: '李教授', purchase: 0 },
        { id: 3, couPic: '/static/images/course3.png', couName: '传染病学', couPrice: 1, teaName: '王教授', purchase: 0 },
        { id: 4, couPic: '/static/images/course4.png', couName: '传染病人的护理', couPrice: 2, teaName: '赵教授', purchase: 0 },
      ];
    }
  } catch (error) {
    console.error('获取推荐课程失败:', error);
    uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
    // 使用模拟数据作为后备
    recommendedCourses.value = [
      { id: 1, couPic: '/static/images/course1.png', couName: '口腔正畸学', couPrice: 1, teaName: '张教授', purchase: 0 },
      { id: 2, couPic: '/static/images/course2.png', couName: '内科护理学', couPrice: 1, teaName: '李教授', purchase: 0 },
      { id: 3, couPic: '/static/images/course3.png', couName: '传染病学', couPrice: 1, teaName: '王教授', purchase: 0 },
      { id: 4, couPic: '/static/images/course4.png', couName: '传染病人的护理', couPrice: 2, teaName: '赵教授', purchase: 0 },
    ];
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  // 初始化轮播图数据
  await bannerStore.initBannerData();
  bannerItems.value = bannerStore.bannerItems;
  
  // 获取推荐课程
  fetchRecommendedCourses();
});
</script>

<style lang="scss" scoped>
// 全局变量
$primary-color: #1890ff;
$secondary-color: #52c41a;
$accent-color: #ff4d4f;
$warning-color: #faad14;
$text-primary: #262626;
$text-secondary: #595959;
$text-disabled: #bfbfbf;
$bg-primary: #f0f2f5;
$bg-secondary: #fafafa;
$border-color: #f0f0f0;
$shadow-light: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
$shadow-medium: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
$shadow-heavy: 0 8rpx 24rpx rgba(0, 0, 0, 0.12);
$radius-small: 8rpx;
$radius-medium: 12rpx;
$radius-large: 16rpx;

.home-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f8ff 0%, #fafafa 100%);
  position: relative;
}

// 状态栏
.status-bar {
  height: var(--status-bar-height, 44rpx);
  background: transparent;
}

// 头部区域
.header {
  background: linear-gradient(135deg, $primary-color 0%, #40a9ff 100%);
  padding: 32rpx 32rpx 40rpx;
  border-radius: 0 0 40rpx 40rpx;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -20%;
    width: 200rpx;
    height: 200rpx;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    animation: float 6s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -10%;
    width: 150rpx;
    height: 150rpx;
    background: rgba(255, 255, 255, 0.08);
    border-radius: 50%;
    animation: float 8s ease-in-out infinite reverse;
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20rpx) rotate(180deg);
  }
}

// 问候语区域
.greeting-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
  position: relative;
  z-index: 2;
  
  .greeting-text {
    .greeting-main {
      display: block;
      font-size: 36rpx;
      font-weight: 600;
      color: #fff;
      margin-bottom: 8rpx;
    }
    
    .greeting-sub {
      display: block;
      font-size: 26rpx;
      color: rgba(255, 255, 255, 0.8);
      font-weight: 400;
    }
  }
  
  .user-avatar {
    width: 72rpx;
    height: 72rpx;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(10rpx);
    border: 2rpx solid rgba(255, 255, 255, 0.3);
  }
}

// 搜索容器
.search-container {
  position: relative;
  z-index: 2;
  
  .search-box {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20rpx);
    border-radius: 28rpx;
    padding: 24rpx 32rpx;
    box-shadow: $shadow-light;
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.98);
      box-shadow: $shadow-medium;
    }
    
    .search-input {
      flex: 1;
      margin-left: 16rpx;
      font-size: 28rpx;
      color: $text-primary;
      background: transparent;
      border: none;
      
      &::placeholder {
        color: $text-disabled;
      }
    }
  }
}

// 主要内容区域
.main-content {
  flex: 1;
  padding: 0 32rpx 32rpx 32rpx;
  margin-top: -20rpx;
  position: relative;
  z-index: 1;
  box-sizing: border-box;
}

// 轮播图区域
.banner-section {
  margin: 0 0 40rpx 0;
  box-sizing: border-box;
  
  .banner-swiper {
    height: 360rpx;
    border-radius: $radius-large;
    overflow: hidden;
    box-shadow: $shadow-medium;
    
    .banner-item {
      position: relative;
      height: 100%;
      border-radius: $radius-large;
      overflow: hidden;
      
      .banner-image {
        width: 100%;
        height: 100%;
      }
      
      .banner-overlay {
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
        padding: 60rpx 32rpx 32rpx;
        
        .banner-content {
          .banner-title {
            display: block;
            font-size: 36rpx;
            font-weight: 700;
            color: #fff;
            margin-bottom: 8rpx;
            text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
          }
          
          .banner-subtitle {
            display: block;
            font-size: 26rpx;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 20rpx;
          }
          
          .banner-action {
            display: flex;
            align-items: center;
            
            .action-text {
              font-size: 24rpx;
              color: #fff;
              margin-right: 8rpx;
            }
          }
        }
      }
    }
  }
}

// 分类区域
.category-section {
  background: #fff;
  border-radius: $radius-large;
  padding: 32rpx;
  margin: 0 0 32rpx 0;
  box-shadow: $shadow-light;
  box-sizing: border-box;
  
  .category-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;
    
    .category-title {
      font-size: 32rpx;
      font-weight: 600;
      color: $text-primary;
    }
    
    .category-more {
      display: flex;
      align-items: center;
      
      .more-text {
        font-size: 26rpx;
        color: $text-secondary;
        margin-right: 8rpx;
      }
    }
  }
  
  .category-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24rpx;
    
    .category-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20rpx;
      border-radius: $radius-medium;
      transition: all 0.3s ease;
      
      &:active {
        transform: scale(0.95);
        background: $bg-secondary;
      }
      
      .category-icon-wrapper {
        width: 88rpx;
        height: 88rpx;
        background: linear-gradient(135deg, #e6f7ff, #bae7ff);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 16rpx;
        box-shadow: $shadow-light;
        
        .category-icon {
          width: 48rpx;
          height: 48rpx;
        }
      }
      
      .category-name {
        font-size: 24rpx;
        color: $text-primary;
        text-align: center;
        font-weight: 500;
      }
    }
  }
}

// 课程区域
.courses-section {
  background: #fff;
  border-radius: $radius-large;
  padding: 32rpx;
  margin: 0;
  box-shadow: $shadow-light;
  box-sizing: border-box;
  
  .section-header {
    margin-bottom: 32rpx;
    
    .section-title-wrapper {
      display: flex;
      align-items: center;
      margin-bottom: 8rpx;
      
      .title-indicator {
        width: 6rpx;
        height: 32rpx;
        background: linear-gradient(135deg, $primary-color, $secondary-color);
        border-radius: 3rpx;
        margin-right: 16rpx;
      }
      
      .section-title {
        font-size: 32rpx;
        font-weight: 600;
        color: $text-primary;
      }
    }
    
    .section-subtitle {
      .subtitle-text {
        font-size: 26rpx;
        color: $text-secondary;
        margin-left: 22rpx;
      }
    }
  }
  
  .course-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24rpx;
    
    .course-card {
      background: #fff;
      border-radius: $radius-medium;
      overflow: hidden;
      box-shadow: $shadow-light;
      transition: all 0.3s ease;
      border: 1rpx solid $border-color;
      
      &:active {
        transform: translateY(-4rpx);
        box-shadow: $shadow-medium;
      }
      
      .course-image-wrapper {
        position: relative;
        height: 240rpx;
        
        .course-image {
          width: 100%;
          height: 100%;
        }
        
        .course-badge {
          position: absolute;
          top: 16rpx;
          right: 16rpx;
          background: linear-gradient(135deg, $accent-color, #ff7875);
          padding: 8rpx 16rpx;
          border-radius: 20rpx;
          
          .badge-text {
            font-size: 20rpx;
            color: #fff;
            font-weight: 500;
          }
        }
      }
      
      .course-content {
        padding: 24rpx;
        
        .course-title {
          font-size: 28rpx;
          font-weight: 600;
          color: $text-primary;
          margin-bottom: 16rpx;
          line-height: 1.4;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
        }
        
        .course-teacher-info {
          display: flex;
          align-items: center;
          margin-bottom: 20rpx;
          
          .teacher-name {
            font-size: 24rpx;
            color: $text-secondary;
            margin-left: 8rpx;
          }
        }
        
        .course-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .course-price {
            display: flex;
            align-items: baseline;
            
            .price-label {
              font-size: 22rpx;
              color: $text-secondary;
              margin-right: 4rpx;
            }
            
            .price-value {
              font-size: 32rpx;
              font-weight: 700;
              color: $warning-color;
            }
          }
          
          .course-stats {
            display: flex;
            align-items: center;
            
            .stats-text {
              font-size: 22rpx;
              color: $text-secondary;
              margin-left: 4rpx;
            }
          }
        }
      }
    }
  }
}

// 加载状态
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  
  .loading-spinner {
    margin-bottom: 16rpx;
    animation: spin 1s linear infinite;
  }
  
  .loading-text {
    font-size: 26rpx;
    color: $text-secondary;
  }
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 空状态
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80rpx 0;
  
  .empty-icon {
    margin-bottom: 24rpx;
    opacity: 0.6;
  }
  
  .empty-text {
    font-size: 28rpx;
    color: $text-secondary;
    margin-bottom: 8rpx;
    font-weight: 500;
  }
  
  .empty-desc {
    font-size: 24rpx;
    color: $text-disabled;
  }
}

// 底部间距
.bottom-spacing {
  height: 120rpx;
}

// 响应式适配
@media screen and (max-width: 750rpx) {
  .category-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 16rpx;
  }
  
  .course-grid {
    grid-template-columns: 1fr;
    
    .course-card {
      .course-image-wrapper {
        height: 200rpx;
      }
    }
  }
}
</style>
