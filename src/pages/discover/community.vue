<template>
  <view class="community-container">
    <!-- 搜索栏 -->
    <view class="search-container">
      <view class="search-box">
        <uni-icons type="search" size="18" color="#999"></uni-icons>
        <input v-model="searchKeyword" placeholder="搜索问题" class="search-input" @input="handleSearch" />
      </view>
      <view class="add-question-btn" @click="navigateToAddQuestion">
        <uni-icons type="plus" size="20" color="#fff"></uni-icons>
      </view>
    </view>

    <!-- 筛选栏 -->
    <view class="filter-container">
      <view class="filter-item" :class="{ active: filterType === 'all' }" @click="setFilterType('all')">
        <text>全部</text>
      </view>
      <view class="filter-item" :class="{ active: filterType === 'unsolved' }" @click="setFilterType('unsolved')">
        <text>未解决</text>
      </view>
      <view class="filter-item" :class="{ active: filterType === 'solved' }" @click="setFilterType('solved')">
        <text>已解决</text>
      </view>
      <view class="filter-item" :class="{ active: filterType === 'hot' }" @click="setFilterType('hot')">
        <text>热门</text>
      </view>
    </view>

    <!-- 排序栏 -->
    <view class="sort-container">
      <view class="sort-item" :class="{ active: sortOrder === 'desc' }" @click="setSortOrder('desc')">
        <text>最新</text>
      </view>
      <view class="sort-item" :class="{ active: sortOrder === 'asc' }" @click="setSortOrder('asc')">
        <text>最旧</text>
      </view>
    </view>

    <!-- 问题列表 -->
    <view class="question-list" v-if="filteredQuestionList.length > 0">
      <view class="question-item" v-for="(question, index) in filteredQuestionList" :key="index" @click="goToQuestionDetail(question.id)">
        <!-- 问题头部信息 -->
        <view class="question-header">
          <image :src="getAvatarUrl(question.studentAvatar)" class="user-avatar" mode="aspectFill"></image>
          <view class="user-info">
            <text class="username">{{ question.studentName || '匿名用户' }}</text>
            <text class="post-time">{{ formatDate(question.createTime) }}</text>
          </view>
          <view class="question-status" :class="getStatusClass(question.status)">
            <text>{{ getStatusText(question.status) }}</text>
          </view>
        </view>

        <!-- 问题内容 -->
        <view class="question-content">
          <text class="question-title">{{ question.title }}</text>
          <text class="question-description">{{ question.description }}</text>
        </view>

        <!-- 问题图片 -->
        <view class="question-images" v-if="question.images && question.images.length > 0">
          <image 
            v-for="(image, imgIndex) in question.images.slice(0, 3)" 
            :key="imgIndex" 
            :src="getImageUrl(image)" 
            class="question-image" 
            mode="aspectFill"
          ></image>
          <view v-if="question.images.length > 3" class="more-images">
            <text>+{{ question.images.length - 3 }}</text>
          </view>
        </view>

        <!-- 问题标签 -->
        <view class="question-tags" v-if="question.tags && question.tags.length > 0">
          <view class="tag" v-for="(tag, tagIndex) in question.tags" :key="tagIndex">
            <text>{{ tag }}</text>
          </view>
        </view>

        <!-- 问题统计信息 -->
        <view class="question-stats">
          <view class="stat-item">
            <uni-icons type="heart" size="16" color="#999"></uni-icons>
            <text>{{ question.likeCount || 0 }}</text>
          </view>
          <view class="stat-item">
            <uni-icons type="chat" size="16" color="#999"></uni-icons>
            <text>{{ question.commentCount || 0 }}</text>
          </view>
          <view class="stat-item">
            <uni-icons type="eye" size="16" color="#999"></uni-icons>
            <text>{{ question.viewCount || 0 }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-else class="empty-state">
      <image src="/static/images/empty-questions.png" class="empty-image" mode="aspectFit"></image>
      <text class="empty-text">暂无问题</text>
      <text class="empty-desc">快来发布第一个问题吧~</text>
    </view>

    <!-- 加载更多 -->
    <view v-if="hasMore && filteredQuestionList.length > 0" class="load-more" @click="loadMore">
      <text>加载更多</text>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { questionApi, BASE_URL } from '@/api/index.js';

const searchKeyword = ref('');
const filterType = ref('all'); // all, unsolved, solved, hot
const sortOrder = ref('desc'); // desc: 最新到最旧, asc: 最旧到最新
const questionList = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const pageSize = ref(10);

// 模拟问题数据
const mockQuestionList = [
  {
    id: 1,
    title: '关于护理专业实习的问题',
    description: '请问护理专业的实习一般安排在什么时候？需要准备哪些材料？',
    studentName: '护理小王',
    studentAvatar: '/static/images/avatar1.png',
    createTime: '2022-12-16 14:30:00',
    status: 'unsolved', // unsolved, solved, adopted
    likeCount: 5,
    commentCount: 3,
    viewCount: 25,
    tags: ['护理', '实习'],
    images: []
  },
  {
    id: 2,
    title: '医学基础课程学习方法',
    description: '医学基础课程内容很多，有什么好的学习方法推荐吗？特别是解剖学和生理学。',
    studentName: '医学生李同学',
    studentAvatar: '/static/images/avatar2.png',
    createTime: '2022-12-15 16:20:00',
    status: 'solved',
    likeCount: 12,
    commentCount: 8,
    viewCount: 45,
    tags: ['学习方法', '医学基础'],
    images: ['/static/images/study1.jpg']
  },
  {
    id: 3,
    title: '临床技能考试准备',
    description: '下个月要进行临床技能考试，请问有什么需要特别注意的地方？',
    studentName: '临床张三',
    studentAvatar: '/static/images/avatar3.png',
    createTime: '2022-12-14 10:15:00',
    status: 'adopted',
    likeCount: 8,
    commentCount: 6,
    viewCount: 32,
    tags: ['临床技能', '考试'],
    images: []
  },
  {
    id: 4,
    title: '关于药理学的疑问',
    description: '药理学中的药物代谢动力学部分比较难理解，有没有好的学习资料推荐？',
    studentName: '药学专业小刘',
    studentAvatar: '/static/images/avatar4.png',
    createTime: '2022-12-13 09:45:00',
    status: 'unsolved',
    likeCount: 3,
    commentCount: 2,
    viewCount: 18,
    tags: ['药理学', '学习资料'],
    images: ['/static/images/pharmacy1.jpg', '/static/images/pharmacy2.jpg']
  },
  {
    id: 5,
    title: '医学英语学习心得',
    description: '分享一些医学英语的学习心得，希望对大家有帮助。',
    studentName: '英语达人小陈',
    studentAvatar: '/static/images/avatar5.png',
    createTime: '2022-12-12 15:30:00',
    status: 'solved',
    likeCount: 15,
    commentCount: 10,
    viewCount: 68,
    tags: ['医学英语', '学习心得'],
    images: []
  }
];

// 设置筛选类型
const setFilterType = (type) => {
  filterType.value = type;
};

// 设置排序方式
const setSortOrder = (order) => {
  sortOrder.value = order;
};

// 搜索处理
const handleSearch = () => {
  console.log('搜索关键词:', searchKeyword.value);
};

// 过滤和排序后的问题列表
const filteredQuestionList = computed(() => {
  let filtered = questionList.value;
  
  // 搜索过滤
  if (searchKeyword.value.trim()) {
    filtered = filtered.filter(question => 
      question.title.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      question.description.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      (question.studentName && question.studentName.toLowerCase().includes(searchKeyword.value.toLowerCase()))
    );
  }
  
  // 状态过滤
  if (filterType.value !== 'all') {
    if (filterType.value === 'unsolved') {
      filtered = filtered.filter(question => question.status === 'unsolved');
    } else if (filterType.value === 'solved') {
      filtered = filtered.filter(question => question.status === 'solved' || question.status === 'adopted');
    } else if (filterType.value === 'hot') {
      // 热门问题：按点赞数和评论数排序
      filtered = filtered.filter(question => (question.likeCount || 0) + (question.commentCount || 0) > 5);
    }
  }
  
  // 时间排序
  filtered.sort((a, b) => {
    const dateA = new Date(a.createTime);
    const dateB = new Date(b.createTime);
    return sortOrder.value === 'desc' ? dateB - dateA : dateA - dateB;
  });
  
  return filtered;
});

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

// 跳转到问题详情页
const goToQuestionDetail = (questionId) => {
  uni.navigateTo({
    url: `/pages/discover/question-detail?id=${questionId}`
  });
};

// 跳转到发布问题页面
const navigateToAddQuestion = () => {
  uni.navigateTo({
    url: '/pages/discover/add-question'
  });
};

// 获取问题列表
const fetchQuestionList = async (isLoadMore = false) => {
  if (loading.value) return;
  
  loading.value = true;
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    };
    
    if (searchKeyword.value.trim()) {
      params.title = searchKeyword.value.trim();
    }
    
    const response = await questionApi.getQuestionList(params);
    
    console.log('问题列表API响应:', response);
    
    if (response && response.code === 200) {
      let newData = [];
      let totalCount = 0;
      
      if (response.data && Array.isArray(response.data)) {
        newData = response.data;
        hasMore.value = newData.length >= pageSize.value;
      } else if (response.data && response.data.records && Array.isArray(response.data.records)) {
        newData = response.data.records;
        totalCount = response.data.total || 0;
        hasMore.value = currentPage.value * pageSize.value < totalCount;
      } else {
        hasMore.value = false;
      }
      
      if (isLoadMore) {
        questionList.value = [...questionList.value, ...newData];
      } else {
        questionList.value = newData;
      }
      
    } else {
      console.log('问题列表API响应失败:', response);
      uni.showToast({
        title: 'API响应失败',
        icon: 'none'
      });
      
      hasMore.value = false;
      
      if (!isLoadMore) {
        questionList.value = [];
      }
    }
  } catch (error) {
    console.error('获取问题列表失败:', error);
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
    
    hasMore.value = false;
    
    // 如果是首次加载失败，使用模拟数据作为备选
    if (!isLoadMore && questionList.value.length === 0) {
      questionList.value = mockQuestionList;
      hasMore.value = false;
    }
  } finally {
    loading.value = false;
  }
};

// 加载更多
const loadMore = () => {
  if (hasMore.value && !loading.value) {
    currentPage.value++;
    fetchQuestionList(true);
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchQuestionList();
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

.community-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f8ff 0%, #fafafa 100%);
  padding: 20rpx;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-bottom: 20rpx;
  
  .search-box {
    flex: 1;
    display: flex;
    align-items: center;
    background: #fff;
    border-radius: $radius-medium;
    padding: 20rpx 24rpx;
    box-shadow: $shadow-light;
    
    .search-input {
      flex: 1;
      margin-left: 16rpx;
      font-size: 28rpx;
      color: $text-primary;
      
      &::placeholder {
        color: $text-disabled;
      }
    }
  }
  
  .add-question-btn {
    width: 80rpx;
    height: 80rpx;
    background: linear-gradient(135deg, $primary-color 0%, #40a9ff 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: $shadow-medium;
    
    &:active {
      transform: scale(0.95);
    }
  }
}

.filter-container {
  display: flex;
  gap: 20rpx;
  margin-bottom: 20rpx;
  
  .filter-item {
    padding: 16rpx 32rpx;
    background: #fff;
    border-radius: $radius-medium;
    font-size: 26rpx;
    color: $text-secondary;
    box-shadow: $shadow-light;
    transition: all 0.3s ease;
    
    &.active {
      background: linear-gradient(135deg, $primary-color 0%, #40a9ff 100%);
      color: #fff;
      box-shadow: $shadow-medium;
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
}

.sort-container {
  display: flex;
  gap: 20rpx;
  margin-bottom: 30rpx;
  
  .sort-item {
    padding: 12rpx 24rpx;
    background: #fff;
    border-radius: $radius-small;
    font-size: 24rpx;
    color: $text-secondary;
    box-shadow: $shadow-light;
    transition: all 0.3s ease;
    
    &.active {
      background: $warning-color;
      color: #fff;
    }
    
    &:active {
      transform: scale(0.95);
    }
  }
}

.question-list {
  .question-item {
    background: #fff;
    border-radius: $radius-large;
    padding: 30rpx;
    margin-bottom: 20rpx;
    box-shadow: $shadow-light;
    transition: all 0.3s ease;
    
    &:active {
      transform: translateY(-2rpx);
      box-shadow: $shadow-medium;
    }
    
    .question-header {
      display: flex;
      align-items: center;
      margin-bottom: 20rpx;
      
      .user-avatar {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        margin-right: 20rpx;
      }
      
      .user-info {
        flex: 1;
        
        .username {
          display: block;
          font-size: 26rpx;
          color: $text-primary;
          font-weight: 600;
          margin-bottom: 8rpx;
        }
        
        .post-time {
          font-size: 22rpx;
          color: $text-disabled;
        }
      }
      
      .question-status {
        padding: 8rpx 16rpx;
        border-radius: $radius-small;
        font-size: 20rpx;
        
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
      margin-bottom: 20rpx;
      
      .question-title {
        display: block;
        font-size: 30rpx;
        color: $text-primary;
        font-weight: 600;
        line-height: 1.4;
        margin-bottom: 12rpx;
      }
      
      .question-description {
        font-size: 26rpx;
        color: $text-secondary;
        line-height: 1.5;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
    }
    
    .question-images {
      display: flex;
      gap: 12rpx;
      margin-bottom: 20rpx;
      
      .question-image {
        width: 120rpx;
        height: 120rpx;
        border-radius: $radius-small;
      }
      
      .more-images {
        width: 120rpx;
        height: 120rpx;
        background: rgba(0, 0, 0, 0.1);
        border-radius: $radius-small;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24rpx;
        color: $text-secondary;
      }
    }
    
    .question-tags {
      display: flex;
      gap: 12rpx;
      margin-bottom: 20rpx;
      flex-wrap: wrap;
      
      .tag {
        padding: 8rpx 16rpx;
        background: $bg-primary;
        border-radius: $radius-small;
        font-size: 22rpx;
        color: $text-secondary;
      }
    }
    
    .question-stats {
      display: flex;
      gap: 40rpx;
      
      .stat-item {
        display: flex;
        align-items: center;
        gap: 8rpx;
        font-size: 22rpx;
        color: $text-disabled;
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100rpx 40rpx;
  
  .empty-image {
    width: 200rpx;
    height: 200rpx;
    margin-bottom: 30rpx;
    opacity: 0.6;
  }
  
  .empty-text {
    font-size: 32rpx;
    color: $text-secondary;
    margin-bottom: 12rpx;
  }
  
  .empty-desc {
    font-size: 26rpx;
    color: $text-disabled;
  }
}

.load-more {
  text-align: center;
  padding: 40rpx;
  font-size: 26rpx;
  color: $text-secondary;
  
  &:active {
    opacity: 0.7;
  }
}
</style>