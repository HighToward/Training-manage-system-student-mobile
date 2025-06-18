<template>
  <view class="questions-container">
    <!-- 头部统计 -->
    <view class="header">
      <view class="stats">
        <view class="stat-item">
          <text class="stat-number">{{ totalQuestions }}</text>
          <text class="stat-label">总问题</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ answeredQuestions }}</text>
          <text class="stat-label">已解答</text>
        </view>
        <view class="stat-item">
          <text class="stat-number">{{ pendingQuestions }}</text>
          <text class="stat-label">待解答</text>
        </view>
      </view>
    </view>

    <!-- 问题列表 -->
    <view class="questions-list">
      <view class="list-header">
        <text class="list-title">我的问题</text>
      </view>
      
      <view class="question-items">
        <view 
          v-for="(question, index) in questionsList" 
          :key="index" 
          class="question-item"
          @click="viewQuestion(question)"
        >
          <view class="question-content">
            <view class="question-header">
              <text class="question-title">{{ question.title }}</text>
              <view class="question-status" :class="question.status">
                <text class="status-text">{{ getStatusText(question.status) }}</text>
              </view>
            </view>
            <text class="question-preview">{{ question.content }}</text>
            <view class="question-meta">
              <text class="question-time">{{ question.createTime }}</text>
              <text class="question-replies" v-if="question.replyCount > 0">
                {{ question.replyCount }}条回复
              </text>
            </view>
          </view>
          <view class="question-arrow">
            <uni-icons type="right" size="16" color="#ccc"></uni-icons>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="questionsList.length === 0" class="empty-state">
        <image src="/static/images/empty-questions.png" class="empty-image"></image>
        <text class="empty-text">还没有提问过问题</text>
        <text class="empty-tip">快去学习中提出你的疑问吧</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// 模拟数据
const questionsList = ref([
  {
    id: 1,
    title: 'Vue3的响应式原理是什么？',
    content: '我想了解Vue3中响应式系统的工作原理，特别是Proxy相比Vue2的Object.defineProperty有什么优势...',
    status: 'answered',
    createTime: '2024-12-24 10:30',
    replyCount: 3
  },
  {
    id: 2,
    title: 'JavaScript闭包的应用场景',
    content: '老师您好，我对闭包的概念理解了，但是不知道在实际开发中有哪些应用场景...',
    status: 'pending',
    createTime: '2024-12-23 16:45',
    replyCount: 0
  },
  {
    id: 3,
    title: 'CSS Grid布局的使用方法',
    content: '请问CSS Grid和Flexbox的区别是什么？什么时候应该使用Grid布局？',
    status: 'answered',
    createTime: '2024-12-22 14:20',
    replyCount: 2
  }
])

// 计算属性
const totalQuestions = computed(() => questionsList.value.length)
const answeredQuestions = computed(() => 
  questionsList.value.filter(q => q.status === 'answered').length
)
const pendingQuestions = computed(() => 
  questionsList.value.filter(q => q.status === 'pending').length
)

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'answered': '已解答',
    'pending': '待解答'
  }
  return statusMap[status] || '未知'
}

// 查看问题详情
const viewQuestion = (question) => {
  uni.navigateTo({
    url: `/pages/question/detail?id=${question.id}`
  })
}

// 页面加载
onMounted(() => {
  // 这里可以调用API获取问题列表
  console.log('我的问题页面加载完成')
})
</script>

<style lang="scss" scoped>
.questions-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  background: #fff;
  padding: 30rpx;
  margin-bottom: 20rpx;
  
  .stats {
    display: flex;
    justify-content: space-around;
    
    .stat-item {
      text-align: center;
      
      .stat-number {
        font-size: 36rpx;
        font-weight: bold;
        color: #333;
        display: block;
        margin-bottom: 8rpx;
      }
      
      .stat-label {
        font-size: 22rpx;
        color: #666;
      }
    }
  }
}

.questions-list {
  padding: 0 30rpx;
  
  .list-header {
    margin-bottom: 20rpx;
    
    .list-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
    }
  }
  
  .question-items {
    background: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  }
  
  .question-item {
    display: flex;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1rpx solid #f5f5f5;
    
    &:last-child {
      border-bottom: none;
    }
    
    &:active {
      background-color: #f8f8f8;
    }
    
    .question-content {
      flex: 1;
      
      .question-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12rpx;
        
        .question-title {
          font-size: 28rpx;
          font-weight: bold;
          color: #333;
          flex: 1;
          margin-right: 20rpx;
        }
        
        .question-status {
          padding: 4rpx 12rpx;
          border-radius: 12rpx;
          
          &.answered {
            background-color: #f6ffed;
            
            .status-text {
              color: #52c41a;
              font-size: 20rpx;
            }
          }
          
          &.pending {
            background-color: #fff7e6;
            
            .status-text {
              color: #fa8c16;
              font-size: 20rpx;
            }
          }
        }
      }
      
      .question-preview {
        font-size: 24rpx;
        color: #666;
        line-height: 1.5;
        margin-bottom: 12rpx;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
      
      .question-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        .question-time {
          font-size: 20rpx;
          color: #999;
        }
        
        .question-replies {
          font-size: 20rpx;
          color: #1890ff;
        }
      }
    }
    
    .question-arrow {
      margin-left: 20rpx;
    }
  }
  
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
}
</style>