<template>
  <view class="login-container">
    <!-- 背景装饰 -->
    <view class="bg-decoration">
      <view class="circle circle-1"></view>
      <view class="circle circle-2"></view>
      <view class="circle circle-3"></view>
    </view>
    
    <!-- 主要内容 -->
    <view class="content">
      <!-- Logo和标题区域 -->
      <view class="header">
        <view class="logo">
          <view class="logo-icon">
            <uni-icons type="book" size="40" color="#fff"></uni-icons>
          </view>
        </view>
        <text class="title">学生学习系统</text>
        <text class="subtitle">让学习更简单，让成长更快乐</text>
      </view>
      
      <!-- 登录表单 -->
      <view class="form-container">
        <view class="form-header">
          <text class="form-title">欢迎回来</text>
          <text class="form-desc">请登录您的账户</text>
        </view>
        
        <view class="form-content">
          <view class="input-group">
            <view class="input-item">
              <view class="input-icon">
                <uni-icons type="person" size="20" color="#1890ff"></uni-icons>
              </view>
              <input 
                class="input" 
                type="text" 
                v-model="username" 
                placeholder="请输入您的用户名" 
                placeholder-class="input-placeholder"
              />
            </view>
            
            <view class="input-item">
              <view class="input-icon">
                <uni-icons type="locked" size="20" color="#1890ff"></uni-icons>
              </view>
              <input 
                class="input" 
                type="password" 
                v-model="password" 
                placeholder="请输入您的密码" 
                placeholder-class="input-placeholder"
              />
            </view>
          </view>
          
          <button 
            class="login-button" 
            :class="{ 'loading': loading }"
            @click="handleLogin" 
            :disabled="loading"
          >
            <view v-if="loading" class="loading-icon">
              <uni-icons type="spinner-cycle" size="18" color="#fff"></uni-icons>
            </view>
            <text class="button-text">{{ loading ? '登录中...' : '登录' }}</text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue';
import { authApi } from '@/api/index.js';

const username = ref('');
const password = ref('');
const loading = ref(false);

const handleLogin = async () => {
  if (!username.value || !password.value) {
    uni.showToast({
      title: '请输入用户名和密码',
      icon: 'none'
    });
    return;
  }
  
  loading.value = true;
  
  try {
    uni.showLoading({
      title: '登录中...'
    });
    
    const res = await authApi.studentLogin({ 
      username: username.value, 
      password: password.value 
    });
    
    uni.hideLoading();
    
    // 统一处理响应格式
    if (res && (res.success || res.code === 200 || res.code === 0)) {
      // 保存登录信息
      const token = res.token || res.data?.token;
      const userInfo = res.user || res.data?.user || res.data;
      
      if (token) {
        uni.setStorageSync('token', token);
      }
      if (userInfo) {
        uni.setStorageSync('userInfo', userInfo);
      }
      
      uni.showToast({
        title: '登录成功',
        icon: 'success'
      });
      
      // 跳转到首页
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index/index'
        });
      }, 1500);
    } else {
      uni.showToast({
        title: res?.message || '登录失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('Login failed:', error);
    uni.showToast({
      title: error.message || '登录失败，请检查网络连接',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-container {
  position: relative;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

// 背景装饰
.bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 0;
  
  .circle {
    position: absolute;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.1);
    animation: float 6s ease-in-out infinite;
    
    &.circle-1 {
      width: 200rpx;
      height: 200rpx;
      top: 10%;
      right: -50rpx;
      animation-delay: 0s;
    }
    
    &.circle-2 {
      width: 150rpx;
      height: 150rpx;
      top: 60%;
      left: -30rpx;
      animation-delay: 2s;
    }
    
    &.circle-3 {
      width: 100rpx;
      height: 100rpx;
      top: 30%;
      left: 20%;
      animation-delay: 4s;
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(180deg);
  }
}

.content {
  position: relative;
  z-index: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 0 40rpx;
}

// Logo和标题区域
.header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0 80rpx;
  
  .logo {
    margin-bottom: 40rpx;
    
    .logo-icon {
      width: 120rpx;
      height: 120rpx;
      background: linear-gradient(135deg, #1890ff, #36cfc9);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8rpx 32rpx rgba(24, 144, 255, 0.3);
      animation: pulse 2s ease-in-out infinite;
    }
  }
  
  .title {
    font-size: 52rpx;
    color: #fff;
    font-weight: 700;
    margin-bottom: 16rpx;
    text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
  }
  
  .subtitle {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
    font-weight: 400;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

// 登录表单
.form-container {
  flex: 1;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-radius: 40rpx 40rpx 0 0;
  padding: 60rpx 40rpx;
  box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.1);
  
  .form-header {
    text-align: center;
    margin-bottom: 60rpx;
    
    .form-title {
      display: block;
      font-size: 44rpx;
      color: #1a1a1a;
      font-weight: 700;
      margin-bottom: 16rpx;
    }
    
    .form-desc {
      display: block;
      font-size: 28rpx;
      color: #666;
      font-weight: 400;
    }
  }
  
  .form-content {
    .input-group {
      margin-bottom: 60rpx;
    }
    
    .input-item {
      display: flex;
      align-items: center;
      background: #f8f9fa;
      border: 2rpx solid transparent;
      border-radius: 24rpx;
      padding: 24rpx 32rpx;
      margin-bottom: 32rpx;
      transition: all 0.3s ease;
      
      &:focus-within {
        background: #fff;
        border-color: #1890ff;
        box-shadow: 0 0 0 6rpx rgba(24, 144, 255, 0.1);
      }
      
      .input-icon {
        margin-right: 24rpx;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .input {
        flex: 1;
        font-size: 32rpx;
        color: #1a1a1a;
        background: transparent;
        border: none;
        outline: none;
        
        &.input-placeholder {
          color: #999;
        }
      }
    }
    
    .login-button {
      width: 100%;
      background: linear-gradient(135deg, #1890ff, #36cfc9);
      color: #fff;
      font-size: 36rpx;
      font-weight: 600;
      border-radius: 24rpx;
      padding: 32rpx 0;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8rpx 24rpx rgba(24, 144, 255, 0.3);
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
        transition: left 0.5s ease;
      }
      
      &:active {
        transform: translateY(2rpx);
        box-shadow: 0 4rpx 12rpx rgba(24, 144, 255, 0.3);
        
        &::before {
          left: 100%;
        }
      }
      
      &.loading {
        background: linear-gradient(135deg, #91d5ff, #87e8de);
        
        .loading-icon {
          margin-right: 16rpx;
          animation: spin 1s linear infinite;
        }
      }
      
      &:disabled {
        background: #d9d9d9;
        color: #999;
        box-shadow: none;
        transform: none;
      }
      
      .button-text {
        font-size: 36rpx;
        font-weight: 600;
      }
    }
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

// 响应式适配
@media screen and (max-height: 800rpx) {
  .header {
    padding: 80rpx 0 60rpx;
    
    .logo .logo-icon {
      width: 100rpx;
      height: 100rpx;
    }
    
    .title {
      font-size: 48rpx;
    }
    
    .subtitle {
      font-size: 26rpx;
    }
  }
  
  .form-container {
    padding: 50rpx 40rpx;
    
    .form-header {
      margin-bottom: 50rpx;
      
      .form-title {
        font-size: 40rpx;
      }
    }
    
    .form-content .input-group {
      margin-bottom: 50rpx;
    }
  }
}
</style>