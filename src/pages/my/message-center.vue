<template>
  <view class="message-center-container">
    <!-- 顶部导航 -->
    <view class="header">
      <view class="nav-bar">
        <view class="nav-left" @click="goBack">
          <uni-icons type="left" size="20" color="#333"></uni-icons>
        </view>
        <view class="nav-title">消息中心</view>
        <view class="nav-right"></view>
      </view>
    </view>

    <!-- 消息类型标签 -->
    <view class="message-tabs">
      <view class="tab-item" 
            :class="{ active: activeTab === 'system' }" 
            @click="switchTab('system')">
        <uni-icons type="notification" size="16" :color="activeTab === 'system' ? '#1890ff' : '#666'"></uni-icons>
        <text class="tab-text">系统消息</text>
        <view v-if="systemUnreadCount > 0" class="unread-badge">{{ systemUnreadCount }}</view>
      </view>
      <view class="tab-item" 
            :class="{ active: activeTab === 'course' }" 
            @click="switchTab('course')">
        <uni-icons type="star" size="16" :color="activeTab === 'course' ? '#1890ff' : '#666'"></uni-icons>
        <text class="tab-text">课程通知</text>
        <view v-if="courseUnreadCount > 0" class="unread-badge">{{ courseUnreadCount }}</view>
      </view>
    </view>

    <!-- 消息列表 -->
    <view class="message-list">
      <!-- 系统消息 -->
      <view v-if="activeTab === 'system'">
        <view v-if="systemMessages.length === 0" class="empty-state">
          <uni-icons type="email" size="60" color="#ccc"></uni-icons>
          <text class="empty-text">暂无系统消息</text>
        </view>
        <view v-else>
          <view class="message-item" 
                v-for="message in systemMessages" 
                :key="message.id"
                :class="{ unread: !message.isRead }"
                @click="readMessage(message)">
            <view class="message-icon">
              <uni-icons type="notification-filled" size="20" color="#1890ff"></uni-icons>
            </view>
            <view class="message-content">
              <view class="message-title">{{ message.title }}</view>
              <view class="message-preview">{{ message.content }}</view>
              <view class="message-time">{{ formatTime(message.createTime) }}</view>
            </view>
            <view v-if="!message.isRead" class="unread-dot"></view>
          </view>
        </view>
      </view>

      <!-- 课程通知 -->
      <view v-if="activeTab === 'course'">
        <view v-if="courseMessages.length === 0" class="empty-state">
          <uni-icons type="star" size="60" color="#ccc"></uni-icons>
          <text class="empty-text">暂无课程通知</text>
        </view>
        <view v-else>
          <view class="message-item" 
                v-for="message in courseMessages" 
                :key="message.id"
                :class="{ unread: !message.isRead }"
                @click="readMessage(message)">
            <view class="message-icon">
              <uni-icons type="star-filled" size="20" color="#52c41a"></uni-icons>
            </view>
            <view class="message-content">
              <view class="message-title">{{ message.title }}</view>
              <view class="message-preview">{{ message.content }}</view>
              <view class="message-time">{{ formatTime(message.createTime) }}</view>
            </view>
            <view v-if="!message.isRead" class="unread-dot"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 消息详情弹窗 -->
    <uni-popup ref="messagePopup" type="center" :mask-click="true">
      <view class="message-detail-popup">
        <view class="popup-header">
          <text class="popup-title">{{ selectedMessage?.title }}</text>
          <view class="popup-close" @click="closeMessageDetail">
            <uni-icons type="close" size="20" color="#999"></uni-icons>
          </view>
        </view>
        <view class="popup-content">
          <text class="popup-text">{{ selectedMessage?.content }}</text>
          <view class="popup-time">{{ formatTime(selectedMessage?.createTime) }}</view>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 响应式数据
const activeTab = ref('system');
const selectedMessage = ref(null);
const messagePopup = ref(null);

// 模拟消息数据
const systemMessages = ref([
  {
    id: 1,
    title: '系统维护通知',
    content: '系统将于今晚22:00-24:00进行维护升级，期间可能影响正常使用，请提前做好准备。维护完成后系统功能将得到优化。',
    createTime: '2024-01-15 14:30:00',
    isRead: false
  },
  {
    id: 2,
    title: '积分规则更新',
    content: '为了提供更好的学习体验，我们更新了积分获取规则。完成课程学习、参与讨论等都可以获得更多积分奖励。',
    createTime: '2024-01-14 10:15:00',
    isRead: true
  },
  {
    id: 3,
    title: '新功能上线',
    content: '购物车功能已正式上线！现在您可以将感兴趣的课程加入购物车，统一结算购买，享受更便捷的学习体验。',
    createTime: '2024-01-13 16:45:00',
    isRead: true
  }
]);

const courseMessages = ref([
  {
    id: 4,
    title: 'Python编程基础课程更新',
    content: '您购买的《Python编程基础》课程新增了3个章节，包含实战项目案例，快去学习吧！',
    createTime: '2024-01-15 09:20:00',
    isRead: false
  },
  {
    id: 5,
    title: '学习进度提醒',
    content: '您的《机器学习入门》课程已经7天没有学习了，坚持学习才能取得更好的效果哦！',
    createTime: '2024-01-12 18:30:00',
    isRead: true
  }
]);

// 计算属性
const systemUnreadCount = computed(() => {
  return systemMessages.value.filter(msg => !msg.isRead).length;
});

const courseUnreadCount = computed(() => {
  return courseMessages.value.filter(msg => !msg.isRead).length;
});

// 方法
const goBack = () => {
  uni.navigateBack();
};

const switchTab = (tab) => {
  activeTab.value = tab;
};

const readMessage = (message) => {
  selectedMessage.value = message;
  // 标记为已读
  if (!message.isRead) {
    message.isRead = true;
  }
  messagePopup.value.open();
};

const closeMessageDetail = () => {
  messagePopup.value.close();
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  const now = new Date();
  const diff = now - date;
  
  if (diff < 60000) { // 1分钟内
    return '刚刚';
  } else if (diff < 3600000) { // 1小时内
    return Math.floor(diff / 60000) + '分钟前';
  } else if (diff < 86400000) { // 1天内
    return Math.floor(diff / 3600000) + '小时前';
  } else if (diff < 604800000) { // 1周内
    return Math.floor(diff / 86400000) + '天前';
  } else {
    return timeStr.split(' ')[0]; // 显示日期
  }
};

onMounted(() => {
  console.log('消息中心页面加载完成');
});
</script>

<style lang="scss" scoped>
.message-center-container {
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

.message-tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1rpx solid #f0f0f0;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx 0;
  position: relative;
  
  &.active {
    .tab-text {
      color: #1890ff;
      font-weight: 600;
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

.tab-text {
  font-size: 28rpx;
  color: #666;
  margin-left: 8rpx;
  transition: all 0.3s ease;
}

.unread-badge {
  position: absolute;
  top: 16rpx;
  right: 20rpx;
  min-width: 32rpx;
  height: 32rpx;
  background-color: #ff4d4f;
  color: #fff;
  font-size: 20rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.message-list {
  padding: 0 32rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 24rpx;
}

.message-item {
  display: flex;
  align-items: flex-start;
  padding: 32rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  background-color: #fff;
  margin: 16rpx 0;
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
  position: relative;
  
  &.unread {
    background-color: #f6ffed;
    border-left: 4rpx solid #52c41a;
  }
  
  &:active {
    background-color: #f5f5f5;
  }
}

.message-icon {
  margin-right: 24rpx;
  margin-top: 8rpx;
}

.message-content {
  flex: 1;
}

.message-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 12rpx;
}

.message-preview {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 16rpx;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.message-time {
  font-size: 24rpx;
  color: #999;
}

.unread-dot {
  width: 16rpx;
  height: 16rpx;
  background-color: #ff4d4f;
  border-radius: 50%;
  margin-left: 16rpx;
  margin-top: 8rpx;
}

.message-detail-popup {
  width: 640rpx;
  max-height: 80vh;
  background-color: #fff;
  border-radius: 24rpx;
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
  flex: 1;
  margin-right: 16rpx;
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

.popup-text {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  display: block;
  margin-bottom: 24rpx;
}

.popup-time {
  font-size: 24rpx;
  color: #999;
  text-align: right;
}
</style>