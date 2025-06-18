<template>
  <view class="news-detail-container">
    <!-- 资讯封面 -->
    <view class="news-header">
      <image :src="getImageUrl(newsDetail.infoImage)" class="news-cover" mode="aspectFill"></image>
    </view>

    <!-- 资讯信息 -->
    <view class="news-info">
      <text class="news-title">{{ newsDetail.infoTitle }}</text>
      <view class="news-meta">
        <text class="news-author">{{ newsDetail.teaName }}</text>
        <text class="news-date">{{ formatDate(newsDetail.createTime) }}</text>
      </view>
    </view>

    <!-- 资讯内容 -->
    <view class="news-content">
      <rich-text :nodes="processRichTextImages(newsDetail.infoMain)"></rich-text>
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
    </view>

    <!-- 评论区 -->
    <view class="comment-section">
      <view class="comment-header">
        <text class="comment-title">评论 ({{ comments.length }})</text>
      </view>

      <!-- 评论输入框 -->
      <view class="comment-input-container">
        <input v-model="commentText" placeholder="发表你的看法..." class="comment-input" />
        <button class="comment-submit" @click="submitComment" :disabled="!commentText.trim()">发布</button>
      </view>

      <!-- 评论列表 -->
      <view class="comment-list" v-if="comments.length > 0">
        <view class="comment-item" v-for="(comment, index) in comments" :key="index">
          <image :src="comment.avatar || '/static/images/default-avatar.png'" class="comment-avatar" mode="aspectFill"></image>
          <view class="comment-content">
            <view class="comment-user-info">
              <text class="comment-username">{{ comment.username }}</text>
              <text class="comment-time">{{ formatDate(comment.createTime) }}</text>
            </view>
            <text class="comment-text">{{ comment.content }}</text>
            <view class="comment-actions">
              <view class="comment-like" @click="toggleCommentLike(index)">
                <uni-icons :type="comment.isLiked ? 'heart-filled' : 'heart'" :color="comment.isLiked ? '#ff4757' : '#999'" size="16"></uni-icons>
                <text :class="{ liked: comment.isLiked }">{{ comment.likeCount || 0 }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

      <!-- 评论空状态 -->
      <view v-else class="comment-empty">
        <text>暂无评论，快来发表第一条评论吧~</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { informationApi, teacherApi, BASE_URL } from '@/api/index.js';

const newsId = ref('');
const newsDetail = ref({});
const isLiked = ref(false);
const isCollected = ref(false);
const likeCount = ref(0);
const collectCount = ref(0);
const commentText = ref('');
const comments = ref([]);
const loading = ref(false);

// 模拟资讯详情数据
const mockNewsDetail = {
  id: 1,
  infoTitle: 'For the health of the people—commemorating the 135th anniversary of the founding of the Chinese Medical Journal',
  infoImage: '/static/images/news1.jpg',
  teaName: 'A老师',
  createTime: '2022-12-16 22:16:40',
  infoMain: `
    <p>The year (2022) marks the 135th anniversary of the founding of the Chinese Medical Journal. Over the past 135 years, the Journal has witnessed tremendous changes in the health conditions of the Chinese people, the important role of modern medical technology in improving health, reducing diseases, and extending the life span, and the continuous improvement in medical and healthcare services and social security systems.</p>
    
    <p>The 135 years of the history of the Chinese Medical Journal can be divided into five stages. The first stage spans from 1887 (when the China Medical Missionary Journal [CMJ] was first published) to March 1907 (when it was renamed the China Medical Journal). The second stage spans from 1907 to 1932 (when the China Medical Journal merged with the National Medical Journal of China).</p>
    
    <p>Throughout its long history, the Chinese Medical Journal has been committed to promoting medical science and improving public health in China. It has served as a bridge between Chinese and international medical communities, facilitating the exchange of knowledge and best practices.</p>
    
    <p>Today, as we commemorate this significant milestone, we reflect on the journal's contributions to medical education, research, and clinical practice. The journal continues to play a vital role in advancing medical knowledge and improving healthcare outcomes for the Chinese people and beyond.</p>
  `
};

// 模拟评论数据
const mockComments = [
  {
    id: 1,
    username: '医学生小王',
    avatar: '/static/images/avatar1.png',
    content: '这篇文章很有意义，让我了解了中华医学杂志的历史发展。',
    createTime: '2022-12-17 10:30:00',
    likeCount: 5,
    isLiked: false
  },
  {
    id: 2,
    username: '护理专业李同学',
    avatar: '/static/images/avatar2.png',
    content: '135年的历史见证了中国医学的发展，作为医学生深感责任重大。',
    createTime: '2022-12-17 14:20:00',
    likeCount: 3,
    isLiked: true
  },
  {
    id: 3,
    username: '临床医学张三',
    avatar: '/static/images/avatar3.png',
    content: '希望中华医学杂志能继续为医学发展做出贡献！',
    createTime: '2022-12-17 16:45:00',
    likeCount: 8,
    isLiked: false
  }
];

// 页面加载时获取参数
onLoad((options) => {
  if (options.id) {
    newsId.value = options.id;
    fetchNewsDetail();
    fetchComments();
  }
});

// 获取资讯详情
const fetchNewsDetail = async () => {
  loading.value = true;
  try {
    const response = await informationApi.getInformationById(newsId.value);
    
    console.log('资讯详情API响应:', response); // 添加调试日志
    
    if (response && response.code === 200 && response.data) {
      newsDetail.value = response.data;
      
      // 补充教师信息
      await enrichNewsDetailWithTeacherInfo();
      
      // 获取点赞收藏状态
      await fetchLikeAndCollectStatus();
      
      // 设置默认的点赞收藏数量（如果后端没有返回）
      if (!likeCount.value) {
        likeCount.value = Math.floor(Math.random() * 100) + 10;
      }
      if (!collectCount.value) {
        collectCount.value = Math.floor(Math.random() * 50) + 5;
      }
    } else {
      console.log('资讯详情获取失败:', response);
      uni.showToast({
        title: '资讯不存在',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取资讯详情失败:', error);
    uni.showToast({
      title: '获取资讯详情失败',
      icon: 'none'
    });
    // 如果API调用失败，使用模拟数据作为备选
    newsDetail.value = mockNewsDetail;
    likeCount.value = Math.floor(Math.random() * 100) + 10;
    collectCount.value = Math.floor(Math.random() * 50) + 5;
    isLiked.value = false;
    isCollected.value = false;
  } finally {
    loading.value = false;
  }
};

// 补充资讯详情的教师信息
const enrichNewsDetailWithTeacherInfo = async () => {
  try {
    if (newsDetail.value.teaId && !newsDetail.value.teaName) {
      const response = await teacherApi.getTeacherList();
      console.log('教师列表API响应:', response); // 添加调试日志
      
      let teachers = [];
      if (response && response.code === 200 && response.data && Array.isArray(response.data)) {
        teachers = response.data;
      } else if (response && Array.isArray(response)) {
        teachers = response;
      }
      
      if (teachers.length > 0) {
        const teacher = teachers.find(t => t.id === newsDetail.value.teaId);
        if (teacher) {
          newsDetail.value.teaName = teacher.teaName;
          newsDetail.value.teaPic = teacher.pic;
        }
      }
    }
  } catch (error) {
    console.error('补充教师信息失败:', error);
  }
};

// 获取评论列表
const fetchComments = async () => {
  try {
    const response = await informationApi.getCommentsByInfoId(newsId.value);
    
    console.log('评论API响应:', response); // 添加调试日志
    
    if (response && response.code === 200 && response.data && Array.isArray(response.data)) {
      // 处理评论数据，添加头像URL
      comments.value = response.data.map(comment => ({
        ...comment,
        username: comment.userName || '匿名用户',
        avatar: getUserAvatarUrl(comment.userAvatar),
        content: comment.content || '',
        createTime: comment.createTime,
        likeCount: comment.infoLikeNum || 0,
        isLiked: false // 默认未点赞，实际应该从API获取
      }));
    } else if (response && Array.isArray(response)) {
      comments.value = response.map(comment => ({
        ...comment,
        username: comment.userName || '匿名用户',
        avatar: getUserAvatarUrl(comment.userAvatar)
      }));
    } else {
      comments.value = [];
    }
  } catch (error) {
    console.error('获取评论失败:', error);
    comments.value = [];
  }
};

// 获取用户头像URL
const getUserAvatarUrl = (avatarPath) => {
  if (!avatarPath) return '/static/images/default-avatar.png'; // 默认头像
  
  // 如果已经是完整URL，直接返回
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  
  // 如果是相对路径，拼接后端服务器地址
  if (avatarPath.startsWith('/')) {
    return `${BASE_URL}${avatarPath}`;
  }
  
  // 如果只是文件名，拼接uploads/avatar路径
  return `${BASE_URL}/uploads/avatar/${avatarPath}`;
};

// 获取用户点赞收藏状态
const fetchLikeAndCollectStatus = async () => {
  try {
    const userInfo = uni.getStorageSync('userInfo');
    const stuId = userInfo ? userInfo.id : null;
    
    if (!stuId) {
      isLiked.value = false;
      isCollected.value = false;
      return;
    }
    
    // 这里可以调用API获取用户对该资讯的点赞和收藏状态
    // 由于后端可能没有提供相应的API，暂时设置为false
    // 实际项目中可以添加类似以下的API调用：
    // const likeStatus = await informationApi.getUserLikeStatus(newsId.value, stuId);
    // const collectStatus = await informationApi.getUserCollectStatus(newsId.value, stuId);
    // isLiked.value = likeStatus.data.isLiked;
    // isCollected.value = collectStatus.data.isCollected;
    
    isLiked.value = false;
    isCollected.value = false;
  } catch (error) {
    console.error('获取点赞收藏状态失败:', error);
    isLiked.value = false;
    isCollected.value = false;
  }
};

// 切换点赞状态
const toggleLike = async () => {
  try {
    // 获取当前学生ID（实际项目中从用户信息获取）
    const userInfo = uni.getStorageSync('userInfo');
    const stuId = userInfo ? userInfo.id : null;
    
    if (!stuId) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    if (isLiked.value) {
      await informationApi.unlikeInformation(newsId.value, stuId);
      isLiked.value = false;
      likeCount.value = Math.max(0, likeCount.value - 1);
      uni.showToast({
        title: '取消点赞',
        icon: 'none',
        duration: 1000
      });
    } else {
      await informationApi.likeInformation(newsId.value, stuId);
      isLiked.value = true;
      likeCount.value += 1;
      uni.showToast({
        title: '点赞成功',
        icon: 'none',
        duration: 1000
      });
    }
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
    // 获取当前学生ID（实际项目中从用户信息获取）
    const userInfo = uni.getStorageSync('userInfo');
    const stuId = userInfo ? userInfo.id : null;
    
    if (!stuId) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    if (isCollected.value) {
      await informationApi.uncollectInformation(newsId.value, stuId);
      isCollected.value = false;
      collectCount.value = Math.max(0, collectCount.value - 1);
      uni.showToast({
        title: '取消收藏',
        icon: 'none',
        duration: 1000
      });
    } else {
      await informationApi.collectInformation(newsId.value, stuId);
      isCollected.value = true;
      collectCount.value += 1;
      uni.showToast({
        title: '收藏成功',
        icon: 'none',
        duration: 1000
      });
    }
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
      title: '请输入评论内容',
      icon: 'none'
    });
    return;
  }
  
  try {
    // 获取当前用户信息
    const userInfo = uni.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) {
      uni.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    const commentData = {
      content: commentText.value.trim(),
      userId: userInfo.id
    };
    
    await informationApi.createComment(newsId.value, commentData);
    
    // 重新获取评论列表
    await fetchComments();
    
    commentText.value = '';
    
    uni.showToast({
      title: '评论发布成功',
      icon: 'success'
    });
  } catch (error) {
    console.error('发布评论失败:', error);
    uni.showToast({
      title: '发布评论失败',
      icon: 'none'
    });
  }
};

// 切换评论点赞
const toggleCommentLike = (index) => {
  const comment = comments.value[index];
  comment.isLiked = !comment.isLiked;
  comment.likeCount += comment.isLiked ? 1 : -1;
};

// 格式化日期
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 处理图片路径
const getImageUrl = (imagePath) => {
  if (!imagePath) return '/static/images/default-news.jpg'; // 默认图片
  
  // 如果已经是完整URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // 如果是相对路径，拼接后端服务器地址
  if (imagePath.startsWith('/')) {
    return `${BASE_URL}${imagePath}`;
  }
  
  // 如果只是文件名，拼接uploads/img路径
  return `${BASE_URL}/uploads/img/${imagePath}`;
};

// 处理富文本内容中的图片
const processRichTextImages = (htmlContent) => {
  if (!htmlContent) return '';
  
  // 替换img标签的src属性，添加样式进行适配
  return htmlContent.replace(/<img([^>]*?)src=["']([^"']*?)["']([^>]*?)>/gi, (match, before, src, after) => {
    // 处理图片路径
    let processedSrc = src;
    if (!src.startsWith('http://') && !src.startsWith('https://')) {
      if (src.startsWith('/')) {
        processedSrc = `${BASE_URL}${src}`;
      } else {
        processedSrc = `${BASE_URL}/uploads/img/${src}`;
      }
    }
    
    // 添加样式进行适配
    const style = 'style="max-width: 100%; height: auto; display: block; margin: 10px 0;"';
    
    // 检查是否已经有style属性
    if (before.includes('style=') || after.includes('style=')) {
      return `<img${before}src="${processedSrc}"${after}>`;
    } else {
      return `<img${before}src="${processedSrc}" ${style}${after}>`;
    }
  });
};

// 格式化评论时间
const formatCommentTime = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const commentTime = new Date(dateStr);
  const diff = now - commentTime;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  
  return dateStr;
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

.news-detail-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f8ff 0%, #fafafa 100%);
  position: relative;
  
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 193, 7, 0.1) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
}

.news-header {
  position: relative;
  z-index: 1;
  
  .news-cover {
    width: 100%;
    height: 400rpx;
    object-fit: cover;
    border-radius: 0 0 $radius-large $radius-large;
    box-shadow: $shadow-medium;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.02);
      box-shadow: $shadow-heavy;
    }
  }
}

.news-info {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  padding: 32rpx;
  margin: 24rpx;
  border-radius: $radius-large;
  box-shadow: $shadow-medium;
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
  
  .news-title {
    font-size: 38rpx;
    font-weight: 700;
    color: $text-primary;
    line-height: 1.5;
    margin-bottom: 24rpx;
    display: block;
    background: linear-gradient(135deg, $text-primary, #595959);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  
  .news-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16rpx 0;
    border-top: 1rpx solid $border-color;
    
    .news-author {
      font-size: 28rpx;
      color: $text-secondary;
      font-weight: 600;
      
      &::before {
        content: '✍️';
        margin-right: 8rpx;
      }
    }
    
    .news-date {
      font-size: 24rpx;
      color: $text-disabled;
      
      &::before {
        content: '📅';
        margin-right: 8rpx;
      }
    }
  }
}

.news-content {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  margin: 24rpx;
  padding: 32rpx;
  border-radius: $radius-large;
  box-shadow: $shadow-medium;
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
  
  :deep(p) {
    font-size: 30rpx;
    line-height: 1.8;
    color: $text-primary;
    margin-bottom: 24rpx;
    text-align: justify;
    text-indent: 2em;
  }
  
  :deep(img) {
    max-width: 100% !important;
    height: auto !important;
    display: block;
    margin: 24rpx 0;
    border-radius: $radius-medium;
    box-shadow: $shadow-light;
    transition: all 0.3s ease;
    
    &:hover {
      transform: scale(1.02);
      box-shadow: $shadow-medium;
    }
  }
}

.action-buttons {
  display: flex;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  margin: 24rpx;
  padding: 32rpx;
  gap: 60rpx;
  border-radius: $radius-large;
  box-shadow: $shadow-medium;
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
  
  .action-item {
    display: flex;
    align-items: center;
    gap: 12rpx;
    padding: 16rpx 24rpx;
    border-radius: $radius-medium;
    transition: all 0.3s ease;
    cursor: pointer;
    
    &:active {
      transform: scale(0.95);
      background: rgba(0, 0, 0, 0.05);
    }
    
    text {
      font-size: 28rpx;
      color: $text-secondary;
      transition: all 0.3s ease;
      font-weight: 600;
      
      &.liked {
        color: $accent-color;
        animation: heartbeat 0.6s ease;
      }
      
      &.collected {
        color: $warning-color;
        animation: bounce 0.6s ease;
      }
    }
  }
}

@keyframes heartbeat {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8rpx);
  }
}

.comment-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  margin: 24rpx;
  padding: 32rpx;
  border-radius: $radius-large;
  box-shadow: $shadow-medium;
  border: 1rpx solid rgba(255, 255, 255, 0.8);
  position: relative;
  z-index: 1;
  
  .comment-header {
    margin-bottom: 32rpx;
    
    .comment-title {
      font-size: 32rpx;
      font-weight: 700;
      color: $text-primary;
      
      &::before {
        content: '💬';
        margin-right: 12rpx;
      }
    }
  }
  
  .comment-input-container {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 32rpx;
    
    .comment-input {
      flex: 1;
      background: rgba(245, 245, 245, 0.8);
      backdrop-filter: blur(10rpx);
      border-radius: 28rpx;
      padding: 20rpx 32rpx;
      font-size: 28rpx;
      border: 1rpx solid rgba(255, 255, 255, 0.5);
      color: $text-primary;
      transition: all 0.3s ease;
      
      &:focus {
        background: rgba(255, 255, 255, 0.9);
        border-color: $primary-color;
        box-shadow: $shadow-light;
      }
      
      &::placeholder {
        color: $text-disabled;
      }
    }
    
    .comment-submit {
      background: linear-gradient(135deg, $warning-color, #ffec3d);
      color: #fff;
      border: none;
      border-radius: 28rpx;
      padding: 20rpx 32rpx;
      font-size: 28rpx;
      font-weight: 600;
      box-shadow: $shadow-light;
      transition: all 0.3s ease;
      
      &:active {
        transform: scale(0.95);
        box-shadow: none;
      }
      
      &:disabled {
        background: linear-gradient(135deg, #ccc, #ddd);
        transform: none;
      }
    }
  }
  
  .comment-list {
    .comment-item {
      display: flex;
      margin-bottom: 32rpx;
      padding: 24rpx;
      background: rgba(248, 248, 248, 0.5);
      border-radius: $radius-medium;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(248, 248, 248, 0.8);
        transform: translateY(-2rpx);
        box-shadow: $shadow-light;
      }
      
      .comment-avatar {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        margin-right: 20rpx;
        flex-shrink: 0;
        border: 2rpx solid rgba(255, 255, 255, 0.8);
        box-shadow: $shadow-light;
        transition: all 0.3s ease;
        
        &:hover {
          transform: scale(1.05);
          box-shadow: $shadow-medium;
        }
      }
      
      .comment-content {
        flex: 1;
        
        .comment-user-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12rpx;
          
          .comment-username {
            font-size: 26rpx;
            color: $text-secondary;
            font-weight: 600;
          }
          
          .comment-time {
            font-size: 22rpx;
            color: $text-disabled;
          }
        }
        
        .comment-text {
          font-size: 28rpx;
          color: $text-primary;
          line-height: 1.6;
          margin-bottom: 16rpx;
          display: block;
        }
        
        .comment-actions {
          .comment-like {
            display: flex;
            align-items: center;
            gap: 8rpx;
            padding: 8rpx 16rpx;
            border-radius: $radius-small;
            transition: all 0.3s ease;
            cursor: pointer;
            
            &:active {
              transform: scale(0.95);
              background: rgba(0, 0, 0, 0.05);
            }
            
            text {
              font-size: 22rpx;
              color: $text-disabled;
              font-weight: 500;
              
              &.liked {
                color: $accent-color;
                animation: heartbeat 0.6s ease;
              }
            }
          }
        }
      }
    }
  }
  
  .comment-empty {
    text-align: center;
    padding: 80rpx 0;
    color: $text-disabled;
    font-size: 28rpx;
    
    &::before {
      content: '💭';
      font-size: 60rpx;
      display: block;
      margin-bottom: 16rpx;
    }
  }
}

// 响应式适配
@media screen and (max-width: 750rpx) {
  .news-info,
  .news-content,
  .action-buttons,
  .comment-section {
    margin: 16rpx;
    padding: 24rpx;
  }
  
  .news-info .news-title {
    font-size: 34rpx;
  }
  
  .news-content :deep(p) {
    font-size: 28rpx;
  }
  
  .action-buttons {
    gap: 40rpx;
    
    .action-item text {
      font-size: 26rpx;
    }
  }
}
</style>