<template>
  <view class="cart-container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="nav-bar">
        <view class="nav-left" @click="goBack">
          <uni-icons type="left" size="20" color="#333"></uni-icons>
        </view>
        <view class="nav-title">购物车</view>
        <view class="nav-right" @click="clearCart" v-if="cartList.length > 0">
          <text class="clear-text">清空</text>
        </view>
      </view>
    </view>

    <!-- 用户积分信息 -->
    <view class="user-points-section">
      <view class="points-card">
        <view class="points-info">
          <uni-icons type="wallet" size="24" color="#1890ff"></uni-icons>
          <text class="points-label">我的积分</text>
        </view>
        <text class="points-value">{{ userPoints }}</text>
      </view>
    </view>

    <!-- 购物车列表 -->
    <view class="cart-content">
      <!-- 空购物车状态 -->
      <view v-if="cartList.length === 0" class="empty-cart">
        <image src="/static/icons/empty-cart.svg" class="empty-icon" mode="aspectFit"></image>
        <text class="empty-text">购物车空空如也</text>
        <text class="empty-desc">快去挑选心仪的课程吧</text>
        <button class="go-browse-btn" @click="goBrowse">去逛逛</button>
      </view>

      <!-- 购物车商品列表 -->
      <view v-else class="cart-list">
        <view class="select-all-section">
          <view class="select-all" @click="toggleSelectAll">
            <view class="checkbox" :class="{ checked: isAllSelected }">
              <uni-icons v-if="isAllSelected" type="checkmarkempty" size="16" color="#fff"></uni-icons>
            </view>
            <text class="select-text">全选</text>
          </view>
          <text class="total-count">共{{ cartList.length }}件商品</text>
        </view>

        <view class="cart-item" v-for="item in cartList" :key="item.cartId">
          <view class="item-checkbox" @click="toggleItemSelect(item)">
            <view class="checkbox" :class="{ checked: item.selected }">
              <uni-icons v-if="item.selected" type="checkmarkempty" size="16" color="#fff"></uni-icons>
            </view>
          </view>
          
          <view class="item-content" @click="goToCourseDetail(item.couId)">
            <image :src="getImageUrl(item.couPic)" class="course-image" mode="aspectFill"></image>
            <view class="course-info">
              <text class="course-name">{{ item.couName }}</text>
              <text class="course-teacher">讲师：{{ item.teaName }}</text>
              <view class="course-meta">
                <text class="course-type">{{ item.typeName || '在线课程' }}</text>
                <text class="add-time">{{ formatTime(item.addTime) }}</text>
              </view>
              <view class="price-section">
                <text class="price-label">积分：</text>
                <text class="price-value">{{ convertPriceToPoints(item.couPrice) }}</text>
              </view>
            </view>
          </view>
          
          <view class="item-actions">
            <view class="remove-btn" @click="removeFromCart(item)">
              <uni-icons type="trash" size="20" color="#ff4d4f"></uni-icons>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部结算栏 -->
    <view class="bottom-bar" v-if="cartList.length > 0">
      <view class="selected-info">
        <text class="selected-count">已选{{ selectedCount }}件</text>
        <view class="total-price">
          <text class="total-label">合计：</text>
          <text class="total-value">{{ totalPrice }}积分</text>
        </view>
      </view>
      <button class="checkout-btn" 
              :disabled="selectedCount === 0 || totalPrice > userPoints" 
              @click="checkout">
        {{ selectedCount === 0 ? '请选择商品' : totalPrice > userPoints ? '积分不足' : '去结算' }}
      </button>
    </view>

    <!-- 确认删除弹窗 -->
    <uni-popup ref="confirmPopup" type="dialog">
      <uni-popup-dialog 
        type="warn" 
        title="确认删除" 
        content="确定要从购物车中移除这个课程吗？" 
        :before-close="true" 
        @close="confirmPopup.close()" 
        @confirm="confirmRemove">
      </uni-popup-dialog>
    </uni-popup>

    <!-- 清空购物车确认弹窗 -->
    <uni-popup ref="clearPopup" type="dialog">
      <uni-popup-dialog 
        type="warn" 
        title="确认清空" 
        content="确定要清空购物车吗？此操作不可恢复。" 
        :before-close="true" 
        @close="clearPopup.close()" 
        @confirm="confirmClear">
      </uni-popup-dialog>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { userApi, BASE_URL } from '@/api/index.js';

// 响应式数据
const cartList = ref([]);
const userPoints = ref(0);
const userInfo = ref(null);
const confirmPopup = ref(null);
const clearPopup = ref(null);
const itemToRemove = ref(null);

// 计算属性
const selectedCount = computed(() => {
  return cartList.value.filter(item => item.selected).length;
});

const isAllSelected = computed(() => {
  return cartList.value.length > 0 && cartList.value.every(item => item.selected);
});

const totalPrice = computed(() => {
  return cartList.value
    .filter(item => item.selected)
    .reduce((total, item) => total + ((item.couPrice || 0) * 10), 0);
});

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
  return (price || 0) * 10;
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 86400000) { // 1天内
    return '今天加入';
  } else if (diff < 604800000) { // 1周内
    return Math.floor(diff / 86400000) + '天前加入';
  } else {
    return timeStr.split(' ')[0];
  }
};

const toggleSelectAll = () => {
  const newSelectState = !isAllSelected.value;
  cartList.value.forEach(item => {
    item.selected = newSelectState;
  });
};

const toggleItemSelect = (item) => {
  item.selected = !item.selected;
};

const removeFromCart = (item) => {
  itemToRemove.value = item;
  confirmPopup.value.open();
};

const confirmRemove = async () => {
  if (!itemToRemove.value) return;
  
  try {
    uni.showLoading({ title: '删除中...' });
    
    const response = await userApi.removeFromCart(
      userInfo.value.id,
      itemToRemove.value.couId
    );
    
    if (response.success) {
      // 从列表中移除
      const index = cartList.value.findIndex(item => item.cartId === itemToRemove.value.cartId);
      if (index > -1) {
        cartList.value.splice(index, 1);
      }
      uni.showToast({ title: '删除成功', icon: 'success' });
    } else {
      uni.showToast({ title: response.message || '删除失败', icon: 'none' });
    }
  } catch (error) {
    console.error('删除失败:', error);
    uni.showToast({ title: '删除失败', icon: 'none' });
  } finally {
    uni.hideLoading();
    confirmPopup.value.close();
    itemToRemove.value = null;
  }
};

const clearCart = () => {
  clearPopup.value.open();
};

const confirmClear = async () => {
  try {
    uni.showLoading({ title: '清空中...' });
    
    const response = await userApi.clearCart(userInfo.value.id);
    
    if (response.success) {
      cartList.value = [];
      uni.showToast({ title: '清空成功', icon: 'success' });
    } else {
      uni.showToast({ title: response.message || '清空失败', icon: 'none' });
    }
  } catch (error) {
    console.error('清空失败:', error);
    uni.showToast({ title: '清空失败', icon: 'none' });
  } finally {
    uni.hideLoading();
    clearPopup.value.close();
  }
};

const goToCourseDetail = (couId) => {
  uni.navigateTo({
    url: `/pages/course/detail?id=${couId}`
  });
};

const checkout = async () => {
  if (selectedCount.value === 0) {
    uni.showToast({ title: '请选择要购买的课程', icon: 'none' });
    return;
  }
  
  if (totalPrice.value > userPoints.value) {
    uni.showToast({ title: '积分不足，无法购买', icon: 'none' });
    return;
  }
  
  try {
    uni.showLoading({ title: '结算中...' });
    
    const selectedItems = cartList.value.filter(item => item.selected);
    const couIds = selectedItems.map(item => item.couId);
    
    console.log('=== 购物车结算前端调试 ===');
    console.log('选中的商品:', selectedItems);
    console.log('课程ID列表:', couIds);
    console.log('用户ID:', userInfo.value.id);
    console.log('发送给后端的数据:', {
      stuId: userInfo.value.id,
      couIds: couIds
    });
    
    const response = await userApi.checkoutCart({
      stuId: userInfo.value.id,
      couIds: couIds
    });
    
    console.log('后端响应:', response);
    
    if (response.success) {
      uni.showToast({ title: '购买成功！', icon: 'success' });
      
      // 移除已购买的商品
      cartList.value = cartList.value.filter(item => !item.selected);
      
      // 更新用户积分
      userPoints.value = response.remainingPoints || userPoints.value;
      
      // 跳转到订单页面
      setTimeout(() => {
        uni.navigateTo({
          url: '/pages/my/orders'
        });
      }, 1500);
    } else {
      uni.showToast({ title: response.message || '购买失败', icon: 'none' });
    }
  } catch (error) {
    console.error('结算失败:', error);
    uni.showToast({ title: '结算失败，请稍后重试', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const loadCartList = async () => {
  console.log('=== 开始加载购物车列表 ===');
  console.log('当前用户信息:', JSON.stringify(userInfo.value, null, 2));
  console.log('用户ID:', userInfo.value?.id);
  
  if (!userInfo.value || !userInfo.value.id) {
    console.error('用户信息不存在或用户ID为空，无法加载购物车');
    cartList.value = [];
    return;
  }
  
  try {
    console.log('正在调用API获取购物车列表，用户ID:', userInfo.value.id);
    console.log('API调用URL: /api/cart/list?stuId=' + userInfo.value.id);
    
    const response = await userApi.getCartList(userInfo.value.id);
    
    console.log('=== API响应详情 ===');
    console.log('响应类型:', typeof response);
    console.log('响应是否为null/undefined:', response === null || response === undefined);
    console.log('购物车列表完整响应:', JSON.stringify(response, null, 2));
    
    // 检查响应是否成功
    if (response && (response.success === true || response.code === 200 || response.code === 0)) {
      console.log('API响应成功，开始处理数据');
      
      // 处理不同的响应格式
      const data = response.data || response.result || [];
      
      console.log('=== 数据处理详情 ===');
      console.log('提取的数据:', JSON.stringify(data, null, 2));
      console.log('数据类型:', typeof data);
      console.log('是否为数组:', Array.isArray(data));
      console.log('数据长度:', data.length);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('开始处理购物车项目，共', data.length, '项');
        cartList.value = data.map((item, index) => {
          console.log(`处理第${index + 1}个购物车项目:`, JSON.stringify(item, null, 2));
          
          // 详细检查couId字段
          const couId = item.couId || item.cou_id;
          console.log(`第${index + 1}项 couId 检查:`, {
            原始couId: item.couId,
            备用cou_id: item.cou_id,
            最终couId: couId,
            couId类型: typeof couId
          });
          
          const processedItem = {
            ...item,
            selected: false, // 默认不选中
            // 确保必要字段存在
            cartId: item.cartId || item.id,
            couId: couId,
            couName: item.couName || item.cou_name || '课程名称',
            couPic: item.couPic || item.cou_pic || '',
            couPrice: item.couPrice || item.cou_price || 0,
            teaName: item.teaName || item.tea_name || '未知讲师',
            typeName: item.typeName || item.type_name || '在线课程',
            addTime: item.addTime || item.add_time || item.createTime || item.create_time
          };
          console.log(`处理后的第${index + 1}个项目:`, JSON.stringify(processedItem, null, 2));
          return processedItem;
        });
        console.log('=== 最终购物车列表 ===');
        console.log('处理后的购物车列表长度:', cartList.value.length);
        console.log('处理后的购物车列表:', JSON.stringify(cartList.value, null, 2));
      } else {
        console.log('购物车数据为空或不是数组，设置为空数组');
        cartList.value = [];
      }
    } else {
      console.error('=== API响应失败 ===');
      console.error('响应状态检查失败:', {
        responseExists: !!response,
        success: response?.success,
        code: response?.code,
        message: response?.message || response?.msg,
        fullResponse: response
      });
      cartList.value = [];
    }
  } catch (error) {
    console.error('=== 获取购物车异常 ===');
    console.error('异常类型:', error.constructor.name);
    console.error('异常消息:', error.message);
    console.error('异常堆栈:', error.stack);
    console.error('完整异常对象:', error);
    cartList.value = [];
  }
  
  console.log('=== 购物车加载完成 ===');
  console.log('最终购物车状态 - 长度:', cartList.value.length);
  console.log('最终购物车状态 - 内容:', JSON.stringify(cartList.value, null, 2));
};

const loadUserInfo = async () => {
  try {
    const token = uni.getStorageSync('token');
    if (!token) {
      uni.redirectTo({ url: '/pages/login/login' });
      return;
    }
    
    console.log('=== 开始获取用户信息 ===');
    const response = await userApi.getUserProfile();
    console.log('用户信息API响应:', response);
    
    // 兼容不同的响应格式
    // 检查是否有嵌套的data结构
    let actualData = null;
    if (response.success) {
      // 格式1: {success: true, data: userData}
      actualData = response.data;
    } else if (response.data && response.data.code === 200) {
      // 格式2: {data: {code: 200, message: '获取成功', data: userData}}
      actualData = response.data.data;
    } else if (response.code === 200) {
      // 格式3: {code: 200, message: '获取成功', data: userData}
      actualData = response.data;
    }
    
    if (actualData) {
      userInfo.value = actualData;
      userPoints.value = actualData.stuScore || 0;
      console.log('用户信息设置成功:', userInfo.value);
      console.log('用户积分设置为:', userPoints.value);
    } else {
      console.error('用户信息API响应格式异常:', response);
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
  }
};

onMounted(async () => {
  await loadUserInfo();
  if (userInfo.value) {
    await loadCartList();
  }
});
</script>

<style lang="scss" scoped>
.cart-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding-bottom: 120rpx;
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

.clear-text {
  font-size: 28rpx;
  color: #fff;
}

.user-points-section {
  padding: 32rpx;
}

.points-card {
  background: linear-gradient(135deg, #1890ff 0%, #36cfc9 100%);
  border-radius: 16rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8rpx 24rpx rgba(24, 144, 255, 0.2);
}

.points-info {
  display: flex;
  align-items: center;
}

.points-label {
  font-size: 28rpx;
  color: #fff;
  margin-left: 12rpx;
}

.points-value {
  font-size: 36rpx;
  font-weight: 600;
  color: #fff;
}

.cart-content {
  padding: 0 32rpx;
}

.empty-cart {
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

.select-all-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 0;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx 32rpx;
  margin-bottom: 16rpx;
}

.select-all {
  display: flex;
  align-items: center;
}

.checkbox {
  width: 36rpx;
  height: 36rpx;
  border: 2rpx solid #d9d9d9;
  border-radius: 6rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;
  
  &.checked {
    background-color: #1890ff;
    border-color: #1890ff;
  }
}

.select-text {
  font-size: 28rpx;
  color: #333;
  margin-left: 16rpx;
}

.total-count {
  font-size: 24rpx;
  color: #999;
}

.cart-item {
  display: flex;
  align-items: flex-start;
  background-color: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.item-checkbox {
  margin-right: 24rpx;
  margin-top: 8rpx;
}

.item-content {
  flex: 1;
  display: flex;
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

.course-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.course-type {
  font-size: 22rpx;
  color: #1890ff;
  background-color: rgba(24, 144, 255, 0.1);
  padding: 4rpx 12rpx;
  border-radius: 12rpx;
}

.add-time {
  font-size: 22rpx;
  color: #999;
}

.price-section {
  display: flex;
  align-items: center;
}

.price-label {
  font-size: 24rpx;
  color: #666;
}

.price-value {
  font-size: 28rpx;
  font-weight: 600;
  color: #ff6b35;
}

.item-actions {
  margin-left: 16rpx;
  margin-top: 8rpx;
}

.remove-btn {
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

.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -4rpx 12rpx rgba(0, 0, 0, 0.1);
}

.selected-info {
  flex: 1;
}

.selected-count {
  font-size: 24rpx;
  color: #666;
  display: block;
  margin-bottom: 8rpx;
}

.total-price {
  display: flex;
  align-items: center;
}

.total-label {
  font-size: 28rpx;
  color: #333;
}

.total-value {
  font-size: 32rpx;
  font-weight: 600;
  color: #ff6b35;
  margin-left: 8rpx;
}

.checkout-btn {
  background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
  color: #fff;
  border: none;
  border-radius: 48rpx;
  padding: 24rpx 48rpx;
  font-size: 28rpx;
  margin-left: 32rpx;
  
  &:disabled {
    background: #d9d9d9;
    color: #999;
  }
}
</style>