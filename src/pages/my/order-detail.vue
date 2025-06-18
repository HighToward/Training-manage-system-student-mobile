<template>
  <view class="order-detail-container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="nav-bar">
        <view class="nav-left" @click="goBack">
          <uni-icons type="left" size="20" color="#333"></uni-icons>
        </view>
        <view class="nav-title">订单详情</view>
        <view class="nav-right"></view>
      </view>
    </view>

    <!-- 订单详情内容 -->
    <view class="order-detail-content" v-if="orderDetail">
      <!-- 订单状态 -->
      <view class="status-section">
        <view class="status-icon">
          <uni-icons type="checkmarkempty" size="40" color="#52c41a"></uni-icons>
        </view>
        <view class="status-info">
          <text class="status-text">订单已完成</text>
          <text class="status-desc">课程已添加到学习中心</text>
        </view>
      </view>

      <!-- 订单信息 -->
      <view class="info-section">
        <view class="section-title">订单信息</view>
        <view class="info-item">
          <text class="info-label">订单号</text>
          <text class="info-value">{{ orderDetail.order.code }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">下单时间</text>
          <text class="info-value">{{ formatTime(orderDetail.order.createTime) }}</text>
        </view>
        <view class="info-item">
          <text class="info-label">支付方式</text>
          <text class="info-value">积分支付</text>
        </view>
        <view class="info-item">
          <text class="info-label">订单状态</text>
          <text class="info-value status-success">已完成</text>
        </view>
      </view>

      <!-- 课程信息 -->
      <view class="courses-section">
        <view class="section-title">课程信息</view>
        <view class="course-item" v-for="course in orderDetail.details" :key="course.id">
          <image :src="getImageUrl(course.couPic)" class="course-image" mode="aspectFill"></image>
          <view class="course-info">
            <text class="course-name">{{ course.couName }}</text>
            <text class="course-teacher">讲师：{{ course.teaName }}</text>
            <view class="course-actions">
              <button class="study-btn" @click="goToStudy(course.couId)">去学习</button>
            </view>
          </view>
          <view class="course-price">
            <text class="price-value">{{ convertPriceToPoints(course.couPrice) }}积分</text>
          </view>
        </view>
      </view>

      <!-- 费用明细 -->
      <view class="payment-section">
        <view class="section-title">费用明细</view>
        <view class="payment-item" v-for="course in orderDetail.details" :key="'payment-' + course.id">
          <text class="payment-label">{{ course.couName }}</text>
          <text class="payment-value">{{ convertPriceToPoints(course.couPrice) }}积分</text>
        </view>
        <view class="payment-total">
          <text class="total-label">实付积分</text>
          <text class="total-value">{{ convertPriceToPoints(orderDetail.order.amount) }}积分</text>
        </view>
      </view>
    </view>

    <!-- 加载状态 -->
    <view v-else class="loading-container">
      <uni-load-more status="loading" :content-text="loadingText"></uni-load-more>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { userApi, BASE_URL } from '@/api/index.js';

// 响应式数据
const orderDetail = ref(null);
const loadingText = ref({ contentdown: '', contentrefresh: '加载中...', contentnomore: '加载完成' });

// 获取页面参数
const getCurrentPages = () => {
  const pages = getCurrentPages();
  const currentPage = pages[pages.length - 1];
  return currentPage.options;
};

// 方法
const goBack = () => {
  uni.navigateBack();
};

const getImageUrl = (pic) => {
  if (!pic) return '/static/images/default-course.jpg';
  if (pic.startsWith('http')) return pic;
  return `${BASE_URL}${pic}`;
};

const convertPriceToPoints = (price) => {
  return price || 0;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.replace('T', ' ').split('.')[0];
};

const goToStudy = (couId) => {
  uni.navigateTo({
    url: `/pages/course/detail?id=${couId}`
  });
};

const loadOrderDetail = async (orderId) => {
  try {
    uni.showLoading({ title: '加载中...' });
    
    console.log('加载订单详情，订单ID:', orderId);
    
    const response = await userApi.getOrderDetail(orderId);
    
    console.log('订单详情API响应:', response);
    
    if (response.success) {
      orderDetail.value = response.data;
      console.log('订单详情数据:', orderDetail.value);
    } else {
      console.error('获取订单详情失败:', response.message);
      uni.showToast({ title: response.message || '获取订单详情失败', icon: 'none' });
    }
  } catch (error) {
    console.error('获取订单详情失败:', error);
    uni.showToast({ title: '网络错误', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

onMounted(() => {
  const options = getCurrentPages();
  const orderId = options.orderId;
  
  if (orderId) {
    loadOrderDetail(orderId);
  } else {
    uni.showToast({ title: '订单ID不存在', icon: 'none' });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  }
});
</script>

<style lang="scss" scoped>
.order-detail-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding-top: var(--status-bar-height);
}

.nav-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 88rpx;
  padding: 0 32rpx;
}

.nav-left, .nav-right {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
}

.order-detail-content {
  padding: 32rpx;
}

.status-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 48rpx 32rpx;
  margin-bottom: 24rpx;
  display: flex;
  align-items: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.status-icon {
  width: 80rpx;
  height: 80rpx;
  background: #f6ffed;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
}

.status-info {
  flex: 1;
}

.status-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.status-desc {
  font-size: 28rpx;
  color: #666;
}

.info-section, .courses-section, .payment-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 32rpx;
  padding-bottom: 16rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.status-success {
  color: #52c41a !important;
}

.course-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.course-item:last-child {
  border-bottom: none;
}

.course-image {
  width: 120rpx;
  height: 90rpx;
  border-radius: 12rpx;
  margin-right: 24rpx;
}

.course-info {
  flex: 1;
  margin-right: 24rpx;
}

.course-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  display: block;
  margin-bottom: 8rpx;
  line-height: 1.4;
}

.course-teacher {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 16rpx;
}

.course-actions {
  display: flex;
}

.study-btn {
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  color: #fff;
  border: none;
  border-radius: 32rpx;
  padding: 12rpx 24rpx;
  font-size: 24rpx;
  line-height: 1;
}

.course-price {
  text-align: right;
}

.price-value {
  font-size: 28rpx;
  color: #ff4757;
  font-weight: 600;
}

.payment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.payment-item:last-of-type {
  border-bottom: none;
  margin-bottom: 24rpx;
}

.payment-label {
  font-size: 28rpx;
  color: #666;
}

.payment-value {
  font-size: 28rpx;
  color: #333;
}

.payment-total {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24rpx 0;
  border-top: 1rpx solid #f0f0f0;
}

.total-label {
  font-size: 32rpx;
  color: #333;
  font-weight: 600;
}

.total-value {
  font-size: 36rpx;
  color: #ff4757;
  font-weight: 700;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 400rpx;
}
</style>