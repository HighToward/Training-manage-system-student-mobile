<template>
  <view class="my-container">
    <!-- 用户信息区域 -->
    <view class="user-info-header">
      <image :src="userInfo.pic || '/static/images/default-avatar.png'" class="avatar"></image>
      <view class="user-details">
        <text class="username">{{ userInfo.stuName || 'Admin' }}</text>
        <text class="user-id">用户 ID {{ userInfo.id || '2' }}</text>
      </view>
    </view>

    <!-- 积分记录卡片 -->
    <view class="points-section">
      <view class="section-title">积分记录</view>
      <view class="points-card" @click="navigateTo('/pages/my/points-detail')">
        <view class="points-item">
          <text class="points-label">今日积分</text>
          <text class="points-value">{{ checkinStore.todayPoints }}<text class="points-unit">积分</text></text>
        </view>
        <view class="points-item">
          <text class="points-label">累计积分</text>
          <text class="points-value">{{ checkinStore.totalPoints }}<text class="points-unit">积分</text></text>
        </view>
      </view>
    </view>

    <!-- 学习记录卡片 -->
    <view class="learning-section">
      <view class="section-title">学习记录</view>
      <view class="learning-grid">
        <view class="learning-item" @click="navigateTo('/pages/my/questions')">
          <view class="learning-icon">
            <image src="/static/icons/my-questions.svg" class="icon"></image>
          </view>
          <text class="learning-text">问题集</text>
        </view>
        <view class="learning-item" @click="navigateTo('/pages/my/favorites')">
          <view class="learning-icon">
            <image src="/static/icons/my-favorites.svg" class="icon"></image>
          </view>
          <text class="learning-text">收藏</text>
        </view>
        <view class="learning-item" @click="navigateTo('/pages/my/message-center')">
          <view class="learning-icon">
            <image src="/static/icons/my-messages.svg" class="icon"></image>
          </view>
          <text class="learning-text">消息</text>
        </view>
        <view class="learning-item" @click="navigateTo('/pages/my/practice')">
          <view class="learning-icon">
            <image src="/static/icons/my-practice.svg" class="icon"></image>
          </view>
          <text class="learning-text">我的实践</text>
        </view>
      </view>
    </view>

    <!-- 积分工具卡片 -->
    <view class="tools-section">
      <view class="section-title">积分工具</view>
      <view class="tools-grid">
        <view class="tool-item" @click="navigateTo('/pages/my/cart')">
          <view class="tool-icon">
            <image src="/static/icons/my-cart.svg" class="icon"></image>
          </view>
          <text class="tool-text">购物车</text>
        </view>
        <view class="tool-item" @click="navigateTo('/pages/my/orders')">
          <view class="tool-icon">
            <image src="/static/icons/my-orders.svg" class="icon"></image>
          </view>
          <text class="tool-text">订单</text>
        </view>
      </view>
    </view>

    <!-- 更多选项 -->
    <view class="more-section">
      <view class="section-title">更多</view>
      <view class="more-item" @click="handleLogout">
        <view class="more-icon">
          <image src="/static/icons/my-logout.svg" class="icon"></image>
        </view>
        <text class="more-text">退出</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { userApi } from '@/api/index.js';
import { useCheckinStore } from '@/stores/checkin.js';

// 使用签到store
const checkinStore = useCheckinStore();

const userInfo = ref({});
const loading = ref(false);

// 积分数据现在从store中获取，移除本地模拟数据

// 计算打卡天数
const clockDays = computed(() => {
  if (!userInfo.value.clock) return 0;
  return (userInfo.value.clock.match(/1/g) || []).length;
});

// 格式化学习时长
const formatStudyTime = (minutes) => {
  if (!minutes) return '0分钟';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}小时${mins}分钟`;
  }
  return `${mins}分钟`;
};

// 获取学生个人信息
const fetchUserProfile = async () => {
  try {
    loading.value = true;
    const token = uni.getStorageSync('token');
    if (!token) {
      uni.reLaunch({ url: '/pages/login/login' });
      return;
    }
    
    const response = await userApi.getStudentProfile();
    
    // 检查响应格式并提取数据
    if (response && response.code === 200) {
      userInfo.value = response.data;
      // 同步更新store中的积分数据
      if (response.data.stuScore !== undefined) {
        checkinStore.totalPoints = response.data.stuScore;
      }
    } else if (response && response.code === 0) {
      userInfo.value = response.data;
      // 同步更新store中的积分数据
      if (response.data.stuScore !== undefined) {
        checkinStore.totalPoints = response.data.stuScore;
      }
    } else {
      // 直接使用响应数据（如果后端直接返回学生对象）
      userInfo.value = response;
      // 同步更新store中的积分数据
      if (response.stuScore !== undefined) {
        checkinStore.totalPoints = response.stuScore;
      }
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    if (error.message && error.message.includes('401')) {
      // token过期，跳转到登录页
      uni.removeStorageSync('token');
      uni.removeStorageSync('userInfo');
      uni.reLaunch({ url: '/pages/login/login' });
    } else if (error.message && error.message.includes('500')) {
      // 服务器错误
      uni.showToast({ 
        title: '服务器错误，请稍后重试', 
        icon: 'none' 
      });
    } else {
      uni.showToast({ 
        title: '获取用户信息失败', 
        icon: 'none' 
      });
    }
  } finally {
    loading.value = false;
  }
};

// 页面加载时获取用户信息
onMounted(async () => {
  await fetchUserProfile();
  // 初始化签到数据
  checkinStore.resetDailyPoints();
});

const navigateTo = (url) => {
  uni.navigateTo({ url });
};

// 打卡功能
const handleClockIn = async () => {
  try {
    uni.showLoading({ title: '打卡中...' });
    await userApi.clockIn();
    uni.hideLoading();
    uni.showToast({
      title: '打卡成功！',
      icon: 'success'
    });
    // 重新获取用户信息以更新打卡记录
    await fetchUserProfile();
  } catch (error) {
    uni.hideLoading();
    uni.showToast({
      title: error.message || '打卡失败',
      icon: 'none'
    });
  }
};

const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: function (res) {
      if (res.confirm) {
        // 清除本地存储的登录信息
        uni.removeStorageSync('token');
        uni.removeStorageSync('userInfo');
        // 跳转到登录页
        uni.reLaunch({ url: '/pages/login/login' });
      }
    }
  });
};
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

.my-container {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f0f8ff 0%, #fafafa 100%);
  min-height: 100vh;
  position: relative;
}

.user-info-header {
  background: linear-gradient(135deg, $primary-color 0%, #40a9ff 100%);
  padding: 60rpx 40rpx 40rpx;
  display: flex;
  align-items: center;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
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

  .avatar {
    width: 120rpx;
    height: 120rpx;
    border-radius: 50%;
    border: 4rpx solid rgba(255, 255, 255, 0.3);
    margin-right: 32rpx;
    background-color: #eee;
    box-shadow: $shadow-medium;
    transition: all 0.3s ease;
    position: relative;
    z-index: 2;
    
    &:active {
      transform: scale(0.95);
    }
  }

  .user-details {
    display: flex;
    flex-direction: column;
    color: #fff;
    position: relative;
    z-index: 2;
    
    .username {
      font-size: 36rpx;
      font-weight: 700;
      margin-bottom: 12rpx;
      text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
    }
    
    .user-id {
      font-size: 26rpx;
      opacity: 0.9;
      font-weight: 400;
    }
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

// 积分记录部分
.points-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10rpx);
  margin: 32rpx 24rpx;
  border-radius: $radius-large;
  padding: 40rpx;
  box-shadow: $shadow-medium;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4rpx;
    background: linear-gradient(90deg, $primary-color 0%, $secondary-color 100%);
  }

  .section-title {
    font-size: 36rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 32rpx;
    display: flex;
    align-items: center;
    position: relative;

    &::before {
      content: '';
      width: 8rpx;
      height: 36rpx;
      background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
      border-radius: 4rpx;
      margin-right: 20rpx;
      box-shadow: $shadow-light;
    }
    
    &::after {
      content: '✨';
      margin-left: auto;
      font-size: 28rpx;
      animation: sparkle 2s ease-in-out infinite;
    }
  }
  
  .points-card {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24rpx;
    
    .points-item {
      text-align: center;
      padding: 32rpx 24rpx;
      background: linear-gradient(135deg, rgba(24, 144, 255, 0.05) 0%, rgba(82, 196, 26, 0.05) 100%);
      border-radius: $radius-medium;
      border: 1rpx solid rgba(24, 144, 255, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        transition: left 0.6s ease;
      }

      &:active {
        transform: scale(0.95);
        box-shadow: $shadow-light;
        
        &::before {
          left: 100%;
        }
      }
      
      &:hover {
        transform: translateY(-4rpx);
        box-shadow: $shadow-medium;
        border-color: $primary-color;
      }
      
      .points-label {
        font-size: 26rpx;
        color: $text-secondary;
        font-weight: 500;
        margin-bottom: 12rpx;
        display: block;
      }
      
      .points-value {
        font-size: 40rpx;
        font-weight: 700;
        background: linear-gradient(135deg, $primary-color 0%, $secondary-color 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
        
        .points-unit {
          font-size: 20rpx;
          color: #999;
          margin-left: 4rpx;
        }
      }
    }
  }
}

@keyframes sparkle {
  0%, 100% {
    transform: scale(1) rotate(0deg);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.2) rotate(180deg);
    opacity: 1;
  }
}

// 学习记录部分
.learning-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10rpx);
  margin: 32rpx 24rpx;
  border-radius: $radius-large;
  padding: 40rpx;
  box-shadow: $shadow-medium;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4rpx;
    background: linear-gradient(90deg, $secondary-color 0%, $warning-color 100%);
  }

  .section-title {
    font-size: 36rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 32rpx;
    display: flex;
    align-items: center;
    position: relative;

    &::before {
      content: '';
      width: 8rpx;
      height: 36rpx;
      background: linear-gradient(135deg, $secondary-color 0%, $warning-color 100%);
      border-radius: 4rpx;
      margin-right: 20rpx;
      box-shadow: $shadow-light;
    }
    
    &::after {
      content: '📚';
      margin-left: auto;
      font-size: 28rpx;
      animation: bounce 2s ease-in-out infinite;
    }
  }
  
  .learning-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 20rpx;
    
    .learning-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 28rpx 16rpx;
      background: linear-gradient(135deg, rgba(82, 196, 26, 0.05) 0%, rgba(250, 173, 20, 0.05) 100%);
      border-radius: $radius-medium;
      border: 1rpx solid rgba(82, 196, 26, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
        transition: left 0.5s ease;
      }

      &:active {
        transform: scale(0.95);
        box-shadow: $shadow-light;
        
        &::before {
          left: 100%;
        }
      }
      
      &:hover {
        transform: translateY(-2rpx);
        box-shadow: $shadow-medium;
        border-color: $secondary-color;
      }
      
      .learning-icon {
        width: 60rpx;
        height: 60rpx;
        border-radius: 12rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 12rpx;
        background: linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(250, 173, 20, 0.1) 100%);
        
        .icon {
          width: 40rpx;
          height: 40rpx;
        }
      }
      
      .learning-text {
        font-size: 24rpx;
        color: $text-secondary;
        font-weight: 500;
        text-align: center;
      }
    }
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-8rpx);
  }
  60% {
    transform: translateY(-4rpx);
  }
}

// 积分工具部分
.tools-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10rpx);
  margin: 32rpx 24rpx;
  border-radius: $radius-large;
  padding: 40rpx;
  box-shadow: $shadow-medium;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4rpx;
    background: linear-gradient(90deg, $warning-color 0%, $accent-color 100%);
  }

  .section-title {
    font-size: 36rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 32rpx;
    display: flex;
    align-items: center;
    position: relative;

    &::before {
      content: '';
      width: 8rpx;
      height: 36rpx;
      background: linear-gradient(135deg, $warning-color 0%, $accent-color 100%);
      border-radius: 4rpx;
      margin-right: 20rpx;
      box-shadow: $shadow-light;
    }
    
    &::after {
      content: '🛠️';
      margin-left: auto;
      font-size: 28rpx;
      animation: rotate 3s linear infinite;
    }
  }

  .tools-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24rpx;

    .tool-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 28rpx 16rpx;
      background: linear-gradient(135deg, rgba(250, 173, 20, 0.05) 0%, rgba(255, 77, 79, 0.05) 100%);
      border-radius: $radius-medium;
      border: 1rpx solid rgba(250, 173, 20, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
        transition: left 0.5s ease;
      }

      &:active {
        transform: scale(0.95);
        box-shadow: $shadow-light;
        
        &::before {
          left: 100%;
        }
      }
      
      &:hover {
        transform: translateY(-4rpx);
        box-shadow: $shadow-medium;
        border-color: $warning-color;
        
        .tool-icon {
          transform: scale(1.1);
        }
      }

      .tool-icon {
        width: 56rpx;
        height: 56rpx;
        margin-bottom: 16rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, rgba(250, 173, 20, 0.1) 0%, rgba(255, 77, 79, 0.1) 100%);
        border-radius: 50%;
        transition: all 0.3s ease;
        position: relative;
        
        &::after {
          content: '';
          position: absolute;
          top: -2rpx;
          right: -2rpx;
          width: 12rpx;
          height: 12rpx;
          background: linear-gradient(135deg, $warning-color 0%, $accent-color 100%);
          border-radius: 50%;
          opacity: 0;
          transform: scale(0);
          transition: all 0.3s ease;
        }
        
        &:hover::after {
          opacity: 1;
          transform: scale(1);
        }

        .icon {
          width: 32rpx;
          height: 32rpx;
          filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
        }
      }

      .tool-text {
        font-size: 24rpx;
        color: $text-secondary;
        text-align: center;
        font-weight: 500;
        line-height: 1.4;
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 更多部分
.more-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10rpx);
  margin: 32rpx 24rpx 40rpx;
  border-radius: $radius-large;
  padding: 40rpx;
  box-shadow: $shadow-medium;
  border: 1rpx solid rgba(255, 255, 255, 0.2);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4rpx;
    background: linear-gradient(90deg, $accent-color 0%, #722ed1 100%);
  }

  .section-title {
    font-size: 36rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 32rpx;
    display: flex;
    align-items: center;
    position: relative;

    &::before {
      content: '';
      width: 8rpx;
      height: 36rpx;
      background: linear-gradient(135deg, $accent-color 0%, #722ed1 100%);
      border-radius: 4rpx;
      margin-right: 20rpx;
      box-shadow: $shadow-light;
    }
    
    &::after {
      content: '⚙️';
      margin-left: auto;
      font-size: 28rpx;
      animation: pulse 2s ease-in-out infinite;
    }
  }

  .more-item {
    display: flex;
    align-items: center;
    padding: 24rpx;
    background: linear-gradient(135deg, rgba(255, 77, 79, 0.05) 0%, rgba(114, 46, 209, 0.05) 100%);
    border-radius: $radius-medium;
    border: 1rpx solid rgba(255, 77, 79, 0.1);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    margin-bottom: 16rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
      transition: left 0.6s ease;
    }

    &:active {
      transform: scale(0.98);
      box-shadow: $shadow-light;
      
      &::before {
        left: 100%;
      }
    }
    
    &:hover {
      transform: translateX(8rpx);
      box-shadow: $shadow-medium;
      border-color: $accent-color;
      
      .more-icon {
        transform: scale(1.1) rotate(5deg);
      }
      
      .more-text {
        color: $accent-color;
      }
    }

    .more-icon {
      width: 56rpx;
      height: 56rpx;
      margin-right: 24rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(255, 77, 79, 0.1) 0%, rgba(114, 46, 209, 0.1) 100%);
      border-radius: 50%;
      transition: all 0.3s ease;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        top: -2rpx;
        right: -2rpx;
        width: 12rpx;
        height: 12rpx;
        background: linear-gradient(135deg, $accent-color 0%, #722ed1 100%);
        border-radius: 50%;
        opacity: 0;
        transform: scale(0);
        transition: all 0.3s ease;
      }
      
      &:hover::after {
        opacity: 1;
        transform: scale(1);
      }

      .icon {
        width: 32rpx;
        height: 32rpx;
        filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
      }
    }

    .more-text {
      font-size: 30rpx;
      color: $text-primary;
      font-weight: 600;
      transition: all 0.3s ease;
      position: relative;
      
      &::after {
        content: '→';
        position: absolute;
        right: -40rpx;
        opacity: 0;
        transform: translateX(-10rpx);
        transition: all 0.3s ease;
        color: $accent-color;
      }
    }
    
    &:hover .more-text::after {
      opacity: 1;
      transform: translateX(0);
    }
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}
</style>