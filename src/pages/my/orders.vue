<template>
  <view class="orders-container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="nav-bar">
        <view class="nav-left" @click="goBack">
          <uni-icons type="left" size="20" color="#333"></uni-icons>
        </view>
        <view class="nav-title">我的订单</view>
        <view class="nav-right"></view>
      </view>
    </view>

    <!-- 订单列表 -->
    <view class="orders-content">
      <!-- 空订单状态 -->
      <view v-if="orderList.length === 0" class="empty-orders">
        <image src="/static/icons/empty-orders.svg" class="empty-icon" mode="aspectFit"></image>
        <text class="empty-text">暂无订单记录</text>
        <text class="empty-desc">快去购买心仪的课程吧</text>
        <button class="go-browse-btn" @click="goBrowse">去逛逛</button>
      </view>

      <!-- 订单列表 -->
      <view v-else class="order-list">
        <view class="order-item" v-for="order in orderList" :key="order.id" @click="viewOrderDetail(order)">
          <view class="order-header">
            <view class="order-info">
              <text class="order-number">订单号：{{ order.code }}</text>
              <text class="order-time">{{ formatTime(order.createTime) }}</text>
            </view>
            <view class="order-status">
              <text class="status-text">已完成</text>
            </view>
          </view>
          
          <view class="order-courses">
            <view class="course-item" v-for="course in order.courses" :key="course.id">
              <image :src="getImageUrl(course.couPic)" class="course-image" mode="aspectFill"></image>
              <view class="course-info">
                <text class="course-name">{{ course.couName }}</text>
                <text class="course-teacher">讲师：{{ course.teaName }}</text>
                <view class="course-price">
                  <text class="price-value">{{ convertPriceToPoints(course.couPrice) }}积分</text>
                </view>
              </view>
              <view class="course-actions">
                <button class="study-btn" @click.stop="goToStudy(course.couId)">去学习</button>
              </view>
            </view>
          </view>
          
          <view class="order-footer">
            <view class="order-total">
              <text class="total-label">实付积分：</text>
              <text class="total-amount">{{ convertPriceToPoints(order.amount) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 订单详情弹窗 -->
    <uni-popup ref="orderDetailPopup" type="bottom" :mask-click="true">
      <view class="order-detail-popup">
        <view class="popup-header">
          <text class="popup-title">订单详情</text>
          <view class="popup-close" @click="closeOrderDetail">
            <uni-icons type="close" size="20" color="#999"></uni-icons>
          </view>
        </view>
        
        <view class="popup-content" v-if="selectedOrder">
          <view class="detail-section">
            <view class="section-title">订单信息</view>
            <view class="detail-row">
              <text class="detail-label">订单号：</text>
              <text class="detail-value">{{ selectedOrder.code }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">下单时间：</text>
              <text class="detail-value">{{ formatFullTime(selectedOrder.createTime) }}</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">订单状态：</text>
              <text class="detail-value status-success">已完成</text>
            </view>
            <view class="detail-row">
              <text class="detail-label">支付方式：</text>
              <text class="detail-value">积分支付</text>
            </view>
          </view>
          
          <view class="detail-section">
            <view class="section-title">课程信息</view>
            <view class="course-detail" v-for="course in selectedOrder.courses" :key="course.id">
              <image :src="getImageUrl(course.couPic)" class="course-detail-image" mode="aspectFill"></image>
              <view class="course-detail-info">
                <text class="course-detail-name">{{ course.couName }}</text>
                <text class="course-detail-teacher">讲师：{{ course.teaName }}</text>
                <text class="course-detail-price">{{ convertPriceToPoints(course.couPrice) }}积分</text>
              </view>
            </view>
          </view>
          
          <view class="detail-section">
            <view class="section-title">费用明细</view>
            <view class="detail-row">
              <text class="detail-label">课程费用：</text>
              <text class="detail-value">{{ convertPriceToPoints(selectedOrder.amount) }}积分</text>
            </view>
            <view class="detail-row total-row">
              <text class="detail-label">实付积分：</text>
              <text class="detail-value total-amount">{{ convertPriceToPoints(selectedOrder.amount) }}积分</text>
            </view>
          </view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { userApi, BASE_URL } from '@/api/index.js';

// 响应式数据
const orderList = ref([]);
const selectedOrder = ref(null);
const orderDetailPopup = ref(null);
const userInfo = ref(null);

// 方法
const goBack = () => {
  uni.navigateBack();
};

const goBrowse = () => {
  uni.switchTab({
    url: '/pages/index/index'
  });
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
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 86400000) { // 1天内
    return '今天';
  } else if (diff < 604800000) { // 1周内
    return Math.floor(diff / 86400000) + '天前';
  } else if (diff < 2592000000) { // 1个月内
    return Math.floor(diff / 604800000) + '周前';
  } else {
    return timeStr.split(' ')[0];
  }
};

const formatFullTime = (timeStr) => {
  if (!timeStr) return '';
  return timeStr.replace('T', ' ').split('.')[0];
};

const viewOrderDetail = (order) => {
  uni.navigateTo({
    url: `/pages/my/order-detail?orderId=${order.id}`
  });
};

const closeOrderDetail = () => {
  orderDetailPopup.value.close();
  selectedOrder.value = null;
};

const goToStudy = (couId) => {
  uni.navigateTo({
    url: `/pages/course/detail?id=${couId}`
  });
};

const loadOrderList = async () => {
  try {
    uni.showLoading({ title: '加载中...' });
    
    console.log('开始加载订单列表，用户ID:', userInfo.value.id);
    
    // 使用订单列表概要API，包含订单和课程信息
    const response = await userApi.getOrderListWithSummary(userInfo.value.id);
    
    console.log('订单列表API响应:', response);
    
    if (response.success && response.data) {
      // 处理订单数据，按订单分组
      const ordersMap = new Map();
      
      response.data.forEach(item => {
        const orderId = item.orderId;
        
        if (!ordersMap.has(orderId)) {
          ordersMap.set(orderId, {
            id: orderId,
            code: item.orderCode,
            createTime: item.orderCreateTime,
            amount: item.orderAmount,
            courses: []
          });
        }
        
        const order = ordersMap.get(orderId);
        if (item.couId) { // 确保有课程信息
          order.courses.push({
            id: item.id,
            couId: item.couId,
            couName: item.couName,
            couPic: item.couPic,
            teaName: item.teaName,
            couPrice: item.couPrice
          });
        }
      });
      
      orderList.value = Array.from(ordersMap.values()).sort((a, b) => 
        new Date(b.createTime) - new Date(a.createTime)
      );
      
      console.log('处理后的订单列表:', orderList.value);
    } else {
      console.error('获取订单列表失败:', response.message || '未知错误');
      orderList.value = [];
    }
  } catch (error) {
    console.error('获取订单列表失败:', error);
    uni.showToast({ title: '加载失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const loadUserInfo = async () => {
  try {
    const token = uni.getStorageSync('token');
    if (!token) {
      console.log('未找到token，跳转到登录页');
      uni.redirectTo({ url: '/pages/login/login' });
      return;
    }
    
    console.log('开始获取用户信息');
    const response = await userApi.getUserProfile();
    console.log('用户信息API响应:', response);
    
    if (response && response.data) {
      userInfo.value = response.data;
      console.log('用户信息设置成功:', userInfo.value);
    } else {
      console.error('获取用户信息失败:', response);
      console.error('响应详情 - success:', response?.success, 'data:', response?.data, 'message:', response?.message);
      userInfo.value = null;
    }
  } catch (error) {
    console.error('获取用户信息异常:', error);
    userInfo.value = null;
  }
};

onMounted(async () => {
  try {
    await loadUserInfo();
    console.log('用户信息加载完成:', userInfo.value);
    
    if (userInfo.value && userInfo.value.id) {
      console.log('开始加载订单列表，用户ID:', userInfo.value.id);
      await loadOrderList();
    } else {
      console.error('用户信息不完整，无法加载订单列表');
      uni.showToast({ title: '用户信息获取失败', icon: 'none' });
    }
  } catch (error) {
    console.error('页面初始化失败:', error);
  }
});
</script>

<style lang="scss" scoped>
.orders-container {
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

.orders-content {
  padding: 32rpx;
}

.empty-orders {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-icon {
  width: 200rpx;
  height: 200rpx;
  opacity: 0.6;
}

.empty-text {
  font-size: 32rpx;
  color: #666;
  margin: 32rpx 0 16rpx;
}

.empty-desc {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 48rpx;
}

.go-browse-btn {
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  color: #fff;
  border: none;
  border-radius: 48rpx;
  padding: 24rpx 48rpx;
  font-size: 28rpx;
}

.order-item {
  background-color: #fff;
  border-radius: 16rpx;
  margin-bottom: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.order-info {
  flex: 1;
}

.order-number {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
  display: block;
  margin-bottom: 8rpx;
}

.order-time {
  font-size: 24rpx;
  color: #999;
}

.order-status {
  .status-text {
    font-size: 24rpx;
    color: #52c41a;
    background-color: rgba(82, 196, 26, 0.1);
    padding: 8rpx 16rpx;
    border-radius: 12rpx;
  }
}

.order-courses {
  padding: 0 32rpx;
}

.course-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.course-image {
  width: 120rpx;
  height: 90rpx;
  border-radius: 8rpx;
  margin-right: 24rpx;
}

.course-info {
  flex: 1;
}

.course-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
  line-height: 1.4;
}

.course-teacher {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 12rpx;
  display: block;
}

.course-price {
  .price-value {
    font-size: 28rpx;
    font-weight: 600;
    color: #ff6b35;
  }
}

.course-actions {
  margin-left: 16rpx;
}

.study-btn {
  background: linear-gradient(135deg, #52c41a 0%, #73d13d 100%);
  color: #fff;
  border: none;
  border-radius: 32rpx;
  padding: 16rpx 32rpx;
  font-size: 24rpx;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.order-total {
  display: flex;
  align-items: center;
}

.total-label {
  font-size: 28rpx;
  color: #333;
}

.total-amount {
  font-size: 32rpx;
  font-weight: 600;
  color: #ff6b35;
  margin-left: 8rpx;
}

.order-detail-popup {
  background-color: #fff;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 80vh;
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.popup-close {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  
  &:active {
    background-color: #f5f5f5;
  }
}

.popup-content {
  padding: 32rpx;
  max-height: 60vh;
  overflow-y: auto;
}

.detail-section {
  margin-bottom: 32rpx;
  
  &:last-child {
    margin-bottom: 0;
  }
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 24rpx;
  padding-bottom: 12rpx;
  border-bottom: 2rpx solid #1890ff;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
  
  &.total-row {
    border-top: 1rpx solid #f0f0f0;
    margin-top: 16rpx;
    padding-top: 24rpx;
  }
}

.detail-label {
  font-size: 28rpx;
  color: #666;
}

.detail-value {
  font-size: 28rpx;
  color: #333;
  
  &.status-success {
    color: #52c41a;
  }
  
  &.total-amount {
    font-size: 32rpx;
    font-weight: 600;
    color: #ff6b35;
  }
}

.course-detail {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.course-detail-image {
  width: 80rpx;
  height: 60rpx;
  border-radius: 6rpx;
  margin-right: 16rpx;
}

.course-detail-info {
  flex: 1;
}

.course-detail-name {
  font-size: 28rpx;
  color: #333;
  font-weight: 600;
  display: block;
  margin-bottom: 8rpx;
}

.course-detail-teacher {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}

.course-detail-price {
  font-size: 26rpx;
  color: #ff6b35;
  font-weight: 600;
}
</style>