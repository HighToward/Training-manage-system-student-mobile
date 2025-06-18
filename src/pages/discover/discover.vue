<template>
  <view class="discover-container">
    <!-- Tab切换 -->
    <view class="tab-container">
      <view class="tab-item" :class="{ active: activeTab === 'news' }" @click="switchTab('news')">
        <text>资讯</text>
      </view>
      <view class="tab-item" :class="{ active: activeTab === 'community' }" @click="switchTab('community')">
        <text>村民广场</text>
      </view>
    </view>

    <!-- 资讯页面 -->
    <view v-if="activeTab === 'news'" class="news-content">
      <!-- 搜索栏 -->
      <view class="search-container">
        <view class="search-box">
          <uni-icons type="search" size="18" color="#999"></uni-icons>
          <input v-model="searchKeyword" placeholder="搜索资讯" class="search-input" @input="handleSearch" />
        </view>
      </view>

      <!-- 时间排序 -->
      <view class="sort-container">
        <view class="sort-item" :class="{ active: sortOrder === 'desc' }" @click="setSortOrder('desc')">
          <text>最新</text>
        </view>
        <view class="sort-item" :class="{ active: sortOrder === 'asc' }" @click="setSortOrder('asc')">
          <text>最旧</text>
        </view>
      </view>

      <!-- 资讯列表 -->
      <view class="news-list" v-if="filteredNewsList.length > 0">
        <view class="news-item" v-for="(news, index) in filteredNewsList" :key="index" @click="navigateToDetail(news)">
          <image :src="getImageUrl(news.infoImage)" class="news-cover" mode="aspectFill"></image>
          <view class="news-content-wrapper">
            <text class="news-title">{{ news.infoTitle }}</text>
            <view class="news-meta">
              <text class="news-author">{{ news.teaName }}</text>
              <text class="news-date">{{ formatDate(news.createTime) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 空状态 -->
      <view v-else class="empty-state">
        <text>暂无资讯</text>
      </view>

      <!-- 加载更多 -->
      <view v-if="hasMore && filteredNewsList.length > 0" class="load-more" @click="loadMore">
        <text>加载更多</text>
      </view>
    </view>

    <!-- 村民广场页面 -->
    <community v-else></community>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { informationApi, teacherApi, BASE_URL } from '@/api/index.js';
import Community from './community.vue';

const activeTab = ref('news');
const searchKeyword = ref('');
const sortOrder = ref('desc'); // desc: 最新到最旧, asc: 最旧到最新
const newsList = ref([]);
const loading = ref(false);
const hasMore = ref(true);
const currentPage = ref(1);
const pageSize = ref(10);

// 模拟资讯数据
const mockNewsList = [
  {
    id: 1,
    infoTitle: 'For the health of the people—commemorating the 135th anniversary of the founding of the Chinese Medical Journal',
    infoImage: '/static/images/news1.jpg',
    teaName: 'A老师',
    createTime: '2022-12-16 22:16:40',
    infoMain: 'The year (2022) marks the 135th anniversary of the founding of the Chinese Medical Journal...'
  },
  {
    id: 2,
    infoTitle: '医学教育改革的新思路与实践',
    infoImage: '/static/images/news2.jpg',
    teaName: 'B老师',
    createTime: '2022-12-15 18:30:25',
    infoMain: '随着医学科技的快速发展，医学教育也需要与时俱进...'
  },
  {
    id: 3,
    infoTitle: '护理专业发展前景分析',
    infoImage: '/static/images/news3.jpg',
    teaName: 'C老师',
    createTime: '2022-12-14 14:22:10',
    infoMain: '护理专业作为医疗卫生事业的重要组成部分...'
  },
  {
    id: 4,
    infoTitle: '临床实习中的安全防护要点',
    infoImage: '/static/images/news4.jpg',
    teaName: 'D老师',
    createTime: '2022-12-13 09:45:33',
    infoMain: '在临床实习过程中，学生的安全防护至关重要...'
  },
  {
    id: 5,
    infoTitle: '医学伦理学在现代医疗中的重要性',
    infoImage: '/static/images/news5.jpg',
    teaName: 'E老师',
    createTime: '2022-12-12 16:18:55',
    infoMain: '医学伦理学是医学教育和医疗实践中不可或缺的重要内容...'
  }
];

// 切换Tab
const switchTab = (tab) => {
  activeTab.value = tab;
};

// 设置排序方式
const setSortOrder = (order) => {
  sortOrder.value = order;
};

// 搜索处理
const handleSearch = () => {
  // 实际项目中可以添加防抖处理
  console.log('搜索关键词:', searchKeyword.value);
};

// 过滤和排序后的资讯列表
const filteredNewsList = computed(() => {
  let filtered = newsList.value;
  
  // 搜索过滤
  if (searchKeyword.value.trim()) {
    filtered = filtered.filter(news => 
      news.infoTitle.toLowerCase().includes(searchKeyword.value.toLowerCase()) ||
      news.teaName.toLowerCase().includes(searchKeyword.value.toLowerCase())
    );
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
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

// 处理图片URL
const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return '/static/default-news.png'; // 默认图片
  }
  
  // 如果已经是完整的URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // 如果是相对路径，拼接基础URL
  if (imagePath.startsWith('/')) {
    return `${BASE_URL}${imagePath}`;
  }
  
  // 如果只是文件名，拼接uploads/img路径
  return `${BASE_URL}/uploads/img/${imagePath}`;
};

// 跳转到资讯详情页面
const navigateToDetail = (newsItem) => {
  uni.navigateTo({
    url: `/pages/discover/news-detail?id=${newsItem.id}`
  });
};

// 兼容旧方法名
const navigateToNewsDetail = (newsId) => {
  uni.navigateTo({
    url: `/pages/discover/news-detail?id=${newsId}`
  });
};

// 获取资讯列表
const fetchNewsList = async (isLoadMore = false) => {
  if (loading.value) return;
  
  loading.value = true;
  try {
    const params = {
      pageNum: currentPage.value,
      pageSize: pageSize.value
    };
    
    // 如果有搜索关键词，添加到参数中
    if (searchKeyword.value.trim()) {
      params.infoTitle = searchKeyword.value.trim();
    }
    
    const response = await informationApi.getInformationList(params);
    
    console.log('API响应数据:', response); // 添加调试日志
    
    if (response && response.code === 200) {
      let newData = [];
      let totalCount = 0;
      
      // 处理后端返回的Result结构
      if (response.data && Array.isArray(response.data)) {
        newData = response.data;
        // 如果返回的数据少于pageSize，说明没有更多数据了
        hasMore.value = newData.length >= pageSize.value;
      } else if (response.data && response.data.records && Array.isArray(response.data.records)) {
        // 如果是分页结构
        newData = response.data.records;
        totalCount = response.data.total || 0;
        // 根据总数和当前页数判断是否还有更多数据
        hasMore.value = currentPage.value * pageSize.value < totalCount;
      } else {
        // 如果数据结构不符合预期，设置为没有更多数据
        hasMore.value = false;
      }
      
      console.log('处理后的数据:', newData); // 添加调试日志
      
      if (isLoadMore) {
        // 加载更多时，将新数据追加到现有列表
        newsList.value = [...newsList.value, ...newData];
      } else {
        // 首次加载或刷新时，替换整个列表
        newsList.value = newData;
      }
      
      // 补充教师信息
      await enrichNewsListWithTeacherInfo();
      
    } else {
      console.log('API响应失败或数据为空:', response);
      uni.showToast({
        title: 'API响应失败',
        icon: 'none'
      });
      
      // API失败时不添加任何数据，只重置hasMore状态
      hasMore.value = false;
      
      if (!isLoadMore) {
        newsList.value = [];
      }
    }
  } catch (error) {
    console.error('获取资讯列表失败:', error);
    uni.showToast({
      title: '网络错误，请稍后重试',
      icon: 'none'
    });
    
    // 网络错误时不添加任何数据，重置hasMore状态
    hasMore.value = false;
    
    // 如果是首次加载失败，可以使用模拟数据作为备选
    if (!isLoadMore && newsList.value.length === 0) {
      newsList.value = mockNewsList;
      hasMore.value = false; // 模拟数据不支持分页
    }
  } finally {
    loading.value = false;
  }
};

// 补充资讯列表的教师信息
const enrichNewsListWithTeacherInfo = async () => {
  try {
    const response = await teacherApi.getTeacherList();
    console.log('教师API响应:', response); // 添加调试日志
    
    let teachers = [];
    if (response && response.code === 200 && response.data && Array.isArray(response.data)) {
      teachers = response.data;
    } else if (response && Array.isArray(response)) {
      teachers = response;
    }
    
    console.log('教师数据:', teachers); // 添加调试日志
    
    if (teachers.length > 0) {
      newsList.value.forEach(news => {
        if (news.teaId && !news.teaName) {
          const teacher = teachers.find(t => t.id === news.teaId);
          if (teacher) {
            news.teaName = teacher.teaName;
            news.teaPic = teacher.pic;
          }
        }
      });
    }
  } catch (error) {
    console.error('补充教师信息失败:', error);
  }
};

// 加载更多
const loadMore = () => {
  if (hasMore.value && !loading.value) {
    currentPage.value++;
    fetchNewsList(true);
  }
};

// 页面加载时获取数据
onMounted(() => {
  fetchNewsList();
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

.discover-container {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f8ff 0%, #fafafa 100%);
  position: relative;
}

.tab-container {
  display: flex;
  background: linear-gradient(135deg, #fff 0%, #f8f9fa 100%);
  border-bottom: 1rpx solid $border-color;
  box-shadow: $shadow-light;
  position: sticky;
  top: 0;
  z-index: 100;
  
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 32rpx 0;
    font-size: 32rpx;
    color: $text-secondary;
    position: relative;
    transition: all 0.3s ease;
    
    &:active {
      transform: scale(0.98);
    }
    
    &.active {
      color: $warning-color;
      font-weight: 600;
      
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 80rpx;
        height: 6rpx;
        background: linear-gradient(135deg, $warning-color, #ffec3d);
        border-radius: 3rpx;
        animation: slideIn 0.3s ease;
      }
    }
  }
}

@keyframes slideIn {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 80rpx;
    opacity: 1;
  }
}

.news-content {
  padding: 32rpx;
  box-sizing: border-box;
}

.search-container {
  margin-bottom: 32rpx;
  
  .search-box {
    display: flex;
    align-items: center;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20rpx);
    border-radius: 28rpx;
    padding: 24rpx 32rpx;
    box-shadow: $shadow-medium;
    border: 1rpx solid rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;
    
    &:focus-within {
      transform: translateY(-2rpx);
      box-shadow: $shadow-heavy;
      border-color: $primary-color;
    }
    
    .search-input {
      flex: 1;
      margin-left: 16rpx;
      font-size: 28rpx;
      color: $text-primary;
      background: transparent;
      border: none;
      
      &::placeholder {
        color: $text-disabled;
      }
    }
  }
}

.sort-container {
  display: flex;
  margin-bottom: 32rpx;
  background: #fff;
  border-radius: $radius-large;
  padding: 8rpx;
  box-shadow: $shadow-light;
  
  .sort-item {
    flex: 1;
    text-align: center;
    padding: 20rpx 0;
    font-size: 28rpx;
    color: $text-secondary;
    border-radius: $radius-medium;
    transition: all 0.3s ease;
    font-weight: 500;
    
    &:active {
      transform: scale(0.95);
    }
    
    &.active {
      background: linear-gradient(135deg, $warning-color, #ffec3d);
      color: #fff;
      font-weight: 600;
      box-shadow: $shadow-light;
    }
  }
}

.news-list {
  .news-item {
    display: flex;
    background: #fff;
    border-radius: $radius-large;
    margin-bottom: 24rpx;
    padding: 24rpx;
    box-shadow: $shadow-light;
    border: 1rpx solid $border-color;
    transition: all 0.3s ease;
    
    &:active {
      transform: translateY(-4rpx);
      box-shadow: $shadow-medium;
    }
    
    .news-cover {
      width: 200rpx;
      height: 150rpx;
      border-radius: $radius-medium;
      margin-right: 24rpx;
      flex-shrink: 0;
      overflow: hidden;
      position: relative;
      
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 70%, rgba(255, 255, 255, 0.1));
        pointer-events: none;
      }
    }
    
    .news-content-wrapper {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      
      .news-title {
        font-size: 30rpx;
        color: $text-primary;
        font-weight: 600;
        line-height: 1.5;
        margin-bottom: 20rpx;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 2;
        overflow: hidden;
      }
      
      .news-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        .news-author {
          font-size: 24rpx;
          color: $text-secondary;
          font-weight: 500;
          
          &::before {
            content: '👤';
            margin-right: 8rpx;
          }
        }
        
        .news-date {
          font-size: 24rpx;
          color: $text-disabled;
          
          &::before {
            content: '🕒';
            margin-right: 8rpx;
          }
        }
      }
    }
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 120rpx 0;
  
  &::before {
    content: '📰';
    font-size: 80rpx;
    margin-bottom: 24rpx;
    opacity: 0.6;
  }
  
  text {
    color: $text-secondary;
    font-size: 28rpx;
    font-weight: 500;
  }
}

.load-more {
  text-align: center;
  padding: 32rpx 0;
  color: $text-secondary;
  font-size: 28rpx;
  background: linear-gradient(135deg, #fff, #f8f9fa);
  border-radius: $radius-large;
  margin-top: 24rpx;
  box-shadow: $shadow-light;
  border: 1rpx solid $border-color;
  transition: all 0.3s ease;
  font-weight: 500;
  
  &:active {
    transform: scale(0.98);
    box-shadow: $shadow-medium;
  }
  
  &::before {
    content: '⬇️';
    margin-right: 12rpx;
  }
}

.community-content {
  padding: 32rpx;
  
  .coming-soon {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 200rpx 0;
    background: #fff;
    border-radius: $radius-large;
    box-shadow: $shadow-light;
    
    &::before {
      content: '🚧';
      font-size: 100rpx;
      margin-bottom: 32rpx;
      animation: bounce 2s infinite;
    }
    
    text {
      color: $text-secondary;
      font-size: 32rpx;
      font-weight: 500;
    }
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20rpx);
  }
  60% {
    transform: translateY(-10rpx);
  }
}

// 响应式适配
@media screen and (max-width: 750rpx) {
  .news-content {
    padding: 24rpx;
  }
  
  .news-list {
    .news-item {
      .news-cover {
        width: 160rpx;
        height: 120rpx;
      }
      
      .news-content-wrapper {
        .news-title {
          font-size: 28rpx;
        }
      }
    }
  }
}
</style>