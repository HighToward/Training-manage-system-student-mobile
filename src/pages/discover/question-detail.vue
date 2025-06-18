<template>
  <view class="question-detail-container">
    <!-- 问题头部信息 -->
    <view class="question-header">
      <view class="user-info">
        <image :src="getAvatarUrl(questionDetail.studentAvatar)" class="user-avatar" mode="aspectFill"></image>
        <view class="user-details">
          <text class="username">{{ questionDetail.studentName || '匿名用户' }}</text>
          <text class="post-time">{{ formatDate(questionDetail.createTime) }}</text>
        </view>
      </view>
      <view class="question-status" :class="getStatusClass(questionDetail.status)">
        <text>{{ getStatusText(questionDetail.status) }}</text>
      </view>
    </view>

    <!-- 问题内容 -->
    <view class="question-content">
      <text class="question-title">{{ questionDetail.title }}</text>
      <rich-text :nodes="processRichTextImages(questionDetail.description)"></rich-text>
    </view>

    <!-- 问题图片 -->
    <view class="question-images" v-if="questionDetail.images && questionDetail.images.length > 0">
      <image 
        v-for="(image, index) in questionDetail.images" 
        :key="index" 
        :src="getImageUrl(image)" 
        class="question-image" 
        mode="aspectFill"
        @click="previewImage(image, questionDetail.images)"
      ></image>
    </view>

    <!-- 问题标签 -->
    <view class="question-tags" v-if="questionDetail.tags && questionDetail.tags.length > 0">
      <view class="tag" v-for="(tag, index) in questionDetail.tags" :key="index">
        <text>{{ tag }}</text>
      </view>
    </view>

    <!-- 操作按钮 -->
    <view class="action-buttons">
      <view class="action-item" @click="toggleLike">
        <uni-icons :type="isLiked ? 'heart-filled' : 'heart'" :color="isLiked ? '#ff4757' : '#666'" size="24"></uni-icons>
        <text :class="{ liked: isLiked }">{{ likeCount }}</text>
      </view>
      <view class="action-item" @click="toggleCollect">
        <uni-icons :type="isCollected ? 'star-filled' : 'star'" :color="isCollected ? '#FFC107' : '#666'" size="24"></uni-icons>
        <text :class="{ collected: isCollected }">{{ collectCount }}</text>
      </view>
      <view class="action-item">
        <uni-icons type="eye" color="#666" size="24"></uni-icons>
        <text>{{ questionDetail.viewCount || 0 }}</text>
      </view>
    </view>

    <!-- 评论区 -->
    <view class="comment-section">
      <view class="comment-header">
        <text class="comment-title">回答 ({{ comments.length }})</text>
      </view>

      <!-- 评论输入框 -->
      <view class="comment-input-container">
        <input v-model="commentText" placeholder="写下你的回答..." class="comment-input" />
        <button class="comment-submit" @click="submitComment" :disabled="!commentText.trim()">发布</button>
      </view>

      <!-- 评论列表 -->
      <view class="comment-list" v-if="comments.length > 0">
        <view class="comment-item" v-for="(comment, index) in comments" :key="index">
          <image :src="getAvatarUrl(comment.avatar)" class="comment-avatar" mode="aspectFill"></image>
          <view class="comment-content">
            <view class="comment-user-info">
              <text class="comment-username">{{ comment.username }}</text>
              <text class="comment-time">{{ formatDate(comment.createTime) }}</text>
            </view>
            <rich-text :nodes="processRichTextImages(comment.content)" class="comment-text"></rich-text>
            <view class="comment-actions">
              <view class="comment-like" @click="toggleCommentLike(index)">
                <uni-icons :type="comment.isLiked ? 'heart-filled' : 'heart'" :color="comment.isLiked ? '#ff4757' : '#999'" size="16"></uni-icons>
                <text :class="{ liked: comment.isLiked }">{{ comment.likeCount || 0 }}</text>
              </view>
              <view class="comment-reply" @click="replyToComment(index)">
                <uni-icons type="chat" color="#999" size="16"></uni-icons>
                <text>回复</text>
              </view>
            </view>
            
            <!-- 回复列表 -->
            <view class="reply-list" v-if="comment.replies && comment.replies.length > 0">
              <view class="reply-item" v-for="(reply, replyIndex) in comment.replies" :key="replyIndex">
                <image :src="getAvatarUrl(reply.avatar)" class="reply-avatar" mode="aspectFill"></image>
                <view class="reply-content">
                  <view class="reply-user-info">
                    <text class="reply-username">{{ reply.username }}</text>
                    <text class="reply-time">{{ formatDate(reply.createTime) }}</text>
                  </view>
                  <text class="reply-text">{{ reply.content }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 评论空状态 -->
      <view v-else class="comment-empty">
        <text>暂无回答，快来发表第一个回答吧~</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { questionApi, BASE_URL } from '@/api/index.js';

const questionId = ref('');
const questionDetail = ref({});
const isLiked = ref(false);
const isCollected = ref(false);
const likeCount = ref(0);
const collectCount = ref(0);
const commentText = ref('');
const comments = ref([]);
const loading = ref(false);

// 模拟问题详情数据
const mockQuestionDetail = {
  id: 1,
  title: '关于护理专业实习的问题',
  description: `
    <p>请问护理专业的实习一般安排在什么时候？需要准备哪些材料？</p>
    <p>我是护理专业大三的学生，马上要开始实习了，但是对实习的具体安排和要求不太清楚。希望有经验的学长学姐能够分享一下经验。</p>
    <p>主要想了解以下几个问题：</p>
    <ul>
      <li>实习的时间安排是怎样的？</li>
      <li>需要准备哪些证件和材料？</li>
      <li>实习期间的注意事项有哪些？</li>
      <li>如何选择合适的实习医院？</li>
    </ul>
  `,
  studentName: '护理小王',
  studentAvatar: '/static/images/avatar1.png',
  createTime: '2022-12-16 14:30:00',
  status: 'unsolved',
  viewCount: 25,
  tags: ['护理', '实习'],
  images: ['/static/images/nursing1.jpg', '/static/images/nursing2.jpg']
};

// 模拟评论数据
const mockComments = [
  {
    id: 1,
    username: '护理学姐',
    avatar: '/static/images/avatar2.png',
    content: '护理实习一般安排在大三下学期或大四上学期，需要准备学生证、身份证、健康证明等材料。实习期间要严格遵守医院规章制度，认真学习临床技能。',
    createTime: '2022-12-16 15:20:00',
    likeCount: 8,
    isLiked: false,
    replies: [
      {
        id: 11,
        username: '护理小王',
        avatar: '/static/images/avatar1.png',
        content: '谢谢学姐的回答！请问健康证明需要在哪里办理呢？',
        createTime: '2022-12-16 16:10:00'
      },
      {
        id: 12,
        username: '护理学姐',
        avatar: '/static/images/avatar2.png',
        content: '健康证明一般在当地疾控中心或指定医院办理，包括体检和疫苗接种记录。',
        createTime: '2022-12-16 16:30:00'
      }
    ]
  },
  {
    id: 2,
    username: '临床老师',
    avatar: '/static/images/avatar3.png',
    content: '选择实习医院时要考虑医院的教学水平、科室设置、实习指导老师的经验等因素。建议选择三甲医院或教学医院，这样能学到更多的临床知识和技能。',
    createTime: '2022-12-16 17:45:00',
    likeCount: 12,
    isLiked: true,
    replies: []
  },
  {
    id: 3,
    username: '护理专业毕业生',
    avatar: '/static/images/avatar4.png',
    content: '实习期间一定要主动学习，多向带教老师请教，认真完成实习报告。这段经历对以后的工作很重要。',
    createTime: '2022-12-16 19:20:00',
    likeCount: 5,
    isLiked: false,
    replies: []
  }
];

// 页面加载时获取参数
onLoad((options) => {
  if (options.id) {
    questionId.value = options.id;
    fetchQuestionDetail();
    fetchComments();
  }
});

// 获取问题详情
const fetchQuestionDetail = async () => {
  loading.value = true;
  try {
    const response = await questionApi.getQuestionById(questionId.value);
    
    console.log('问题详情API响应:', response);
    
    if (response && response.code === 200 && response.data) {
      questionDetail.value = response.data;
      
      // 获取点赞收藏状态
      await fetchLikeAndCollectStatus();
      
      // 设置默认的点赞收藏数量
      if (!likeCount.value) {
        likeCount.value = Math.floor(Math.random() * 50) + 5;
      }
      if (!collectCount.value) {
        collectCount.value = Math.floor(Math.random() * 20) + 2;
      }
    } else {
      console.log('问题详情获取失败:', response);
      uni.showToast({
        title: '问题不存在',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取问题详情失败:', error);
    uni.showToast({
      title: '获取问题详情失败',
      icon: 'none'
    });
    // 如果API调用失败，使用模拟数据作为备选
    questionDetail.value = mockQuestionDetail;
    likeCount.value = Math.floor(Math.random() * 50) + 5;
    collectCount.value = Math.floor(Math.random() * 20) + 2;
    isLiked.value = false;
    isCollected.value = false;
  } finally {
    loading.value = false;
  }
};

// 获取评论列表
const fetchComments = async () => {
  try {
    const response = await questionApi.getQuestionComments(questionId.value);
    
    console.log('问题评论API响应:', response);
    
    if (response && response.code === 200 && response.data) {
      comments.value = Array.isArray(response.data) ? response.data : [];
    } else {
      console.log('评论获取失败:', response);
    }
  } catch (error) {
    console.error('获取评论失败:', error);
    // 如果API调用失败，使用模拟数据作为备选
    comments.value = mockComments;
  }
};

// 获取点赞收藏状态
const fetchLikeAndCollectStatus = async () => {
  try {
    // 这里可以调用API获取用户的点赞和收藏状态
    // 暂时使用随机值模拟
    isLiked.value = Math.random() > 0.7;
    isCollected.value = Math.random() > 0.8;
  } catch (error) {
    console.error('获取点赞收藏状态失败:', error);
  }
};

// 切换点赞状态
const toggleLike = async () => {
  try {
    if (isLiked.value) {
      // 取消点赞的API调用
      likeCount.value = Math.max(0, likeCount.value - 1);
    } else {
      // 点赞的API调用
      await questionApi.likeQuestion(questionId.value);
      likeCount.value += 1;
    }
    isLiked.value = !isLiked.value;
    
    uni.showToast({
      title: isLiked.value ? '点赞成功' : '取消点赞',
      icon: 'none',
      duration: 1000
    });
  } catch (error) {
    console.error('点赞操作失败:', error);
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    });
  }
};

// 切换收藏状态
const toggleCollect = async () => {
  try {
    if (isCollected.value) {
      // 取消收藏的API调用
      await questionApi.uncollectQuestion(questionId.value);
      collectCount.value = Math.max(0, collectCount.value - 1);
    } else {
      // 收藏的API调用
      await questionApi.collectQuestion(questionId.value);
      collectCount.value += 1;
    }
    isCollected.value = !isCollected.value;
    
    uni.showToast({
      title: isCollected.value ? '收藏成功' : '取消收藏',
      icon: 'none',
      duration: 1000
    });
  } catch (error) {
    console.error('收藏操作失败:', error);
    uni.showToast({
      title: '操作失败',
      icon: 'none'
    });
  }
};

// 提交评论
const submitComment = async () => {
  if (!commentText.value.trim()) {
    uni.showToast({
      title: '请输入回答内容',
      icon: 'none'
    });
    return;
  }
  
  try {
    const commentData = {
      content: commentText.value.trim(),
      questionId: questionId.value
    };
    
    const response = await questionApi.createQuestionComment(questionId.value, commentData);
    
    if (response && response.code === 200) {
      uni.showToast({
        title: '回答发布成功',
        icon: 'success'
      });
      
      commentText.value = '';
      // 重新获取评论列表
      await fetchComments();
    } else {
      uni.showToast({
        title: '发布失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('提交评论失败:', error);
    uni.showToast({
      title: '发布失败',
      icon: 'none'
    });
  }
};

// 切换评论点赞状态
const toggleCommentLike = (index) => {
  const comment = comments.value[index];
  if (comment.isLiked) {
    comment.likeCount = Math.max(0, (comment.likeCount || 0) - 1);
  } else {
    comment.likeCount = (comment.likeCount || 0) + 1;
  }
  comment.isLiked = !comment.isLiked;
  
  uni.showToast({
    title: comment.isLiked ? '点赞成功' : '取消点赞',
    icon: 'none',
    duration: 1000
  });
};

// 回复评论
const replyToComment = (index) => {
  const comment = comments.value[index];
  uni.showToast({
    title: `回复 ${comment.username}`,
    icon: 'none'
  });
  // 这里可以实现回复功能
};

// 预览图片
const previewImage = (current, urls) => {
  const imageUrls = urls.map(url => getImageUrl(url));
  const currentUrl = getImageUrl(current);
  
  uni.previewImage({
    current: currentUrl,
    urls: imageUrls
  });
};

// 处理富文本图片
const processRichTextImages = (html) => {
  if (!html) return '';
  
  // 处理图片路径
  return html.replace(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi, (match, src) => {
    const fullSrc = getImageUrl(src);
    return match.replace(src, fullSrc);
  });
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) {
    return '刚刚';
  } else if (minutes < 60) {
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else if (days < 7) {
    return `${days}天前`;
  } else {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
};

// 获取头像URL
const getAvatarUrl = (avatarPath) => {
  if (!avatarPath) {
    return '/static/images/default-avatar.png';
  }
  
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  if (avatarPath.startsWith('/')) {
    return `${BASE_URL}${avatarPath}`;
  }
  
  return `${BASE_URL}/uploads/avatar/${avatarPath}`;
};

// 获取图片URL
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return '/static/default-image.png';
  }
  
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  if (imagePath.startsWith('/')) {
    return `${BASE_URL}${imagePath}`;
  }
  
  return `${BASE_URL}/uploads/img/${imagePath}`;
};

// 获取状态样式类
const getStatusClass = (status) => {
  switch (status) {
    case 'solved':
      return 'status-solved';
    case 'adopted':
      return 'status-adopted';
    case 'unsolved':
    default:
      return 'status-unsolved';
  }
};

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 'solved':
      return '已解决';
    case 'adopted':
      return '已采纳';
    case 'unsolved':
    default:
      return '未解决';
  }
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

.question-detail-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f8ff 0%, #fafafa 100%);
  padding: 20rpx;
}

.question-header {
  background: #fff;
  border-radius: $radius-large;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-light;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  .user-info {
    display: flex;
    align-items: center;
    flex: 1;
    
    .user-avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      margin-right: 24rpx;
    }
    
    .user-details {
      .username {
        display: block;
        font-size: 30rpx;
        color: $text-primary;
        font-weight: 600;
        margin-bottom: 8rpx;
      }
      
      .post-time {
        font-size: 24rpx;
        color: $text-disabled;
      }
    }
  }
  
  .question-status {
    padding: 12rpx 20rpx;
    border-radius: $radius-small;
    font-size: 22rpx;
    
    &.status-unsolved {
      background: #fff2e8;
      color: $warning-color;
    }
    
    &.status-solved {
      background: #f6ffed;
      color: $secondary-color;
    }
    
    &.status-adopted {
      background: #e6f7ff;
      color: $primary-color;
    }
  }
}

.question-content {
  background: #fff;
  border-radius: $radius-large;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-light;
  
  .question-title {
    display: block;
    font-size: 36rpx;
    color: $text-primary;
    font-weight: 600;
    line-height: 1.4;
    margin-bottom: 20rpx;
  }
}

.question-images {
  background: #fff;
  border-radius: $radius-large;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-light;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200rpx, 1fr));
  gap: 20rpx;
  
  .question-image {
    width: 100%;
    height: 200rpx;
    border-radius: $radius-medium;
    
    &:active {
      opacity: 0.8;
    }
  }
}

.question-tags {
  background: #fff;
  border-radius: $radius-large;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-light;
  display: flex;
  gap: 16rpx;
  flex-wrap: wrap;
  
  .tag {
    padding: 12rpx 20rpx;
    background: $bg-primary;
    border-radius: $radius-small;
    font-size: 24rpx;
    color: $text-secondary;
  }
}

.action-buttons {
  background: #fff;
  border-radius: $radius-large;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: $shadow-light;
  display: flex;
  justify-content: space-around;
  
  .action-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    padding: 20rpx;
    border-radius: $radius-medium;
    transition: all 0.3s ease;
    
    &:active {
      background: $bg-primary;
      transform: scale(0.95);
    }
    
    text {
      font-size: 24rpx;
      color: $text-secondary;
      
      &.liked {
        color: #ff4757;
      }
      
      &.collected {
        color: #FFC107;
      }
    }
  }
}

.comment-section {
  background: #fff;
  border-radius: $radius-large;
  padding: 30rpx;
  box-shadow: $shadow-light;
  
  .comment-header {
    margin-bottom: 30rpx;
    
    .comment-title {
      font-size: 32rpx;
      color: $text-primary;
      font-weight: 600;
    }
  }
  
  .comment-input-container {
    display: flex;
    gap: 20rpx;
    margin-bottom: 30rpx;
    
    .comment-input {
      flex: 1;
      background: $bg-primary;
      border-radius: $radius-medium;
      padding: 20rpx 24rpx;
      font-size: 28rpx;
      color: $text-primary;
      
      &::placeholder {
        color: $text-disabled;
      }
    }
    
    .comment-submit {
      background: linear-gradient(135deg, $primary-color 0%, #40a9ff 100%);
      color: #fff;
      border: none;
      border-radius: $radius-medium;
      padding: 20rpx 32rpx;
      font-size: 28rpx;
      
      &:disabled {
        background: $text-disabled;
        opacity: 0.6;
      }
      
      &:active:not(:disabled) {
        transform: scale(0.95);
      }
    }
  }
  
  .comment-list {
    .comment-item {
      display: flex;
      margin-bottom: 30rpx;
      padding-bottom: 30rpx;
      border-bottom: 1rpx solid $border-color;
      
      &:last-child {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }
      
      .comment-avatar {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        margin-right: 20rpx;
        flex-shrink: 0;
      }
      
      .comment-content {
        flex: 1;
        
        .comment-user-info {
          display: flex;
          align-items: center;
          gap: 20rpx;
          margin-bottom: 12rpx;
          
          .comment-username {
            font-size: 26rpx;
            color: $text-primary;
            font-weight: 600;
          }
          
          .comment-time {
            font-size: 22rpx;
            color: $text-disabled;
          }
        }
        
        .comment-text {
          font-size: 28rpx;
          color: $text-secondary;
          line-height: 1.5;
          margin-bottom: 16rpx;
        }
        
        .comment-actions {
          display: flex;
          gap: 40rpx;
          
          .comment-like,
          .comment-reply {
            display: flex;
            align-items: center;
            gap: 8rpx;
            font-size: 22rpx;
            color: $text-disabled;
            
            &:active {
              opacity: 0.7;
            }
            
            text.liked {
              color: #ff4757;
            }
          }
        }
        
        .reply-list {
          margin-top: 20rpx;
          padding-left: 20rpx;
          border-left: 2rpx solid $border-color;
          
          .reply-item {
            display: flex;
            margin-bottom: 20rpx;
            
            &:last-child {
              margin-bottom: 0;
            }
            
            .reply-avatar {
              width: 40rpx;
              height: 40rpx;
              border-radius: 50%;
              margin-right: 16rpx;
              flex-shrink: 0;
            }
            
            .reply-content {
              flex: 1;
              
              .reply-user-info {
                display: flex;
                align-items: center;
                gap: 16rpx;
                margin-bottom: 8rpx;
                
                .reply-username {
                  font-size: 24rpx;
                  color: $text-primary;
                  font-weight: 600;
                }
                
                .reply-time {
                  font-size: 20rpx;
                  color: $text-disabled;
                }
              }
              
              .reply-text {
                font-size: 26rpx;
                color: $text-secondary;
                line-height: 1.4;
              }
            }
          }
        }
      }
    }
  }
  
  .comment-empty {
    text-align: center;
    padding: 60rpx 40rpx;
    font-size: 28rpx;
    color: $text-disabled;
  }
}
</style>