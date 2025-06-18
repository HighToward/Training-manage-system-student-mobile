<template>
  <view class="course-detail-container">
    <!-- 课程头部信息 -->
    <view class="course-header">
      <image :src="getImageUrl(courseInfo.couPic)" class="course-cover-bg" mode="aspectFill"></image>
      <view class="header-content">
        <image :src="getImageUrl(courseInfo.couPic)" class="course-cover-thumb" mode="aspectFill"></image>
        <view class="course-meta">
          <text class="course-title">{{ courseInfo.couName || '课程加载中...' }}</text>
          <text class="course-teacher">老师：{{ courseInfo.teaName || '未知' }}</text>
          <view class="course-stats">
            <text class="course-price">{{ convertPriceToPoints(courseInfo.couPrice) }} 积分</text>
            <text class="course-buyers">{{ courseInfo.purchase || 0 }}人购买</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 标签页 -->
    <view class="tabs">
      <view class="tab-item" :class="{ active: activeTab === 'intro' }" @click="switchTab('intro')">介绍</view>
      <view class="tab-item" :class="{ active: activeTab === 'chapters' }" @click="switchTab('chapters')">目录</view>
      <view class="tab-item" :class="{ active: activeTab === 'reviews' }" @click="switchTab('reviews')">
        评价
        <text v-if="appraiseStatistics.totalCount" class="review-count">({{ appraiseStatistics.totalCount }})</text>
      </view>
    </view>

    <!-- 标签页内容 -->
    <view class="tab-content">
      <!-- 课程介绍 -->
      <view v-if="activeTab === 'intro'" class="intro-section">
        <view class="intro-content">
          <text class="intro-text">{{ courseInfo.couIntroduction || '暂无课程介绍' }}</text>
        </view>
        <view class="course-details">
          <view class="detail-item">
            <text class="detail-label">课程分类：</text>
            <text class="detail-value">{{ courseInfo.typeName || '未分类' }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">章节数量：</text>
            <text class="detail-value">{{ courseInfo.couCataNum || 0 }}章</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">收藏数：</text>
            <text class="detail-value">{{ courseInfo.couCollNum || 0 }}</text>
          </view>
          <view class="detail-item">
            <text class="detail-label">点赞数：</text>
            <text class="detail-value">{{ courseInfo.couLikeNum || 0 }}</text>
          </view>
        </view>
      </view>

      <!-- 目录 -->
      <view v-if="activeTab === 'chapters'" class="chapters-section">
        <view class="chapter-item" v-for="(chapter, index) in chapters" :key="chapter.id" 
              :class="{ learned: chapter.isLearned }" @click="playChapter(chapter)">
          <view class="chapter-index">{{ chapter.index }}</view>
          <view class="chapter-info">
            <text class="chapter-name">{{ chapter.name }}</text>
            <view class="chapter-meta">
              <uni-icons type="videocam" size="14" color="#999"></uni-icons>
              <text class="chapter-type">视频课程</text>
            </view>
          </view>
          <uni-icons :type="chapter.isLearned ? 'checkbox-filled' : 'circle'" 
                     size="20" :color="chapter.isLearned ? '#FFC107' : '#999'"></uni-icons>
        </view>
        <view v-if="chapters.length === 0" class="empty-tab-content">
          <text>暂无章节信息</text>
        </view>
      </view>

      <!-- 评价 -->
      <view v-if="activeTab === 'reviews'" class="reviews-section">
        <view class="overall-rating">
          <text class="rating-label">综合评价</text>
          <uni-rate :value="overallRating" readonly size="24"></uni-rate>
          <text class="rating-text">{{ overallRating.toFixed(1) }}</text>
          <text class="rating-count" v-if="appraiseStatistics.totalCount">
            ({{ appraiseStatistics.totalCount }}人评价)
          </text>
        </view>
        
        <!-- 评价操作区域 -->
        <view v-if="isPurchased" class="review-action-section">
          <view v-if="myAppraise" class="my-review">
            <view class="review-header">
              <text class="review-title">我的评价</text>
              <uni-rate :value="myAppraise.evaluateScore" readonly size="20"></uni-rate>
            </view>
            <text class="review-content">{{ myAppraise.couAppraise }}</text>
            <text class="review-time">{{ formatDate(myAppraise.createTime) }}</text>
            <button class="edit-review-btn" @click="editReview">修改评价</button>
          </view>
          <view v-else class="no-review">
            <text class="no-review-text">您还未评价此课程</text>
            <button class="add-review-btn" @click="addReview">写评价</button>
          </view>
        </view>
        
        <!-- 其他评价列表 -->
        <view class="reviews-list">
          <view class="review-item" v-for="appraise in appraises" :key="appraise.id">
            <view class="review-header">
              <text class="reviewer-name">学员{{ appraise.stuId }}</text>
              <uni-rate :value="appraise.evaluateScore" readonly size="18"></uni-rate>
            </view>
            <text class="review-content">{{ appraise.couAppraise }}</text>
            <text class="review-time">{{ formatDate(appraise.createTime) }}</text>
          </view>
        </view>
        
        <view v-if="!hasReviews" class="empty-tab-content">
          <text>暂无评论</text>
        </view>
      </view>
    </view>

    <!-- 底部购买栏 -->
    <view class="bottom-bar" v-if="!isPurchased">
      <!-- 积分信息区域 -->
      <view class="points-section">
        <view class="points-item">
          <text class="points-label">我的积分</text>
          <text class="points-value">{{ userPoints }}</text>
        </view>
        <view class="points-item">
          <text class="points-label">需要积分</text>
          <text class="points-value required">{{ convertPriceToPoints(courseInfo.couPrice) }}</text>
        </view>
      </view>
      
      <!-- 底部操作区域 -->
      <view class="bottom-actions">
        <!-- 左侧功能按钮 -->
        <view class="function-buttons">
          <view class="function-item">
            <button class="function-btn collection-btn" :class="{ active: isCollected }" @click="toggleCollection">
              <uni-icons :type="isCollected ? 'heart-filled' : 'heart'" size="20" :color="isCollected ? '#ff4757' : '#666'"></uni-icons>
            </button>
            <text class="count-text">{{ courseInfo.couCollNum || 0 }}</text>
          </view>
          
          <view class="function-item">
            <button class="function-btn like-btn" :class="{ active: isFancied }" @click="toggleFancy">
              <text class="like-text" :style="{ color: isFancied ? '#ff69b4' : '#666' }">赞</text>
            </button>
            <text class="count-text">{{ courseInfo.couLikeNum || 0 }}</text>
          </view>
          
          <view class="function-item">
            <button class="function-btn" @click="goToCart">
              <uni-icons type="cart" size="20" color="#666"></uni-icons>
            </button>
            <text class="count-text">{{ cartCount || 0 }}</text>
          </view>
        </view>
        
        <!-- 右侧购买按钮 -->
        <view class="action-buttons">
          <button class="add-cart-btn" @click="addToCart">
            加入购物车
          </button>
          <button class="purchase-btn" :disabled="!canPurchase" @click="purchaseCourse">
            {{ canPurchase ? '立即购买' : '积分不足' }}
          </button>
        </view>
      </view>
    </view>

    <view class="purchased-bar" v-else>
      <text class="purchased-text">✓ 已购买此课程</text>
      <button class="start-study-btn" @click="goToChapters">前往学习</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { courseApi, chapterApi, userApi, appraiseApi, BASE_URL } from '@/api/index.js';

const courseId = ref(null);
const courseInfo = ref({});
const activeTab = ref('intro');
const chapters = ref([]);
const appraises = ref([]);
const appraiseStatistics = ref({});
const myAppraise = ref(null);
const overallRating = ref(0);
const hasReviews = ref(false);
const isPurchased = ref(false);
const userPoints = ref(0);
const loading = ref(false);

// 新增：收藏、点赞、购物车相关状态
const isCollected = ref(false);
const isFancied = ref(false);
const fancyCount = ref(0);
const cartCount = ref(0);
const currentStudentId = ref(null);

// 将价格转换为积分（1元 = 10积分）
const convertPriceToPoints = (price) => {
  if (!price) return 0;
  return Math.ceil(price * 10);
};

// 切换收藏状态
const toggleCollection = async () => {
  if (!currentStudentId.value) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  
  try {
    uni.showLoading({ title: isCollected.value ? '取消收藏中...' : '收藏中...' });
    
    let response;
    if (isCollected.value) {
      response = await userApi.removeCollection(currentStudentId.value, courseId.value);
    } else {
      response = await userApi.addCollection(currentStudentId.value, courseId.value);
    }
    
    if (response && (response.code === 200 || response.code === 0)) {
      isCollected.value = !isCollected.value;
      // 更新收藏数量
      if (isCollected.value) {
        courseInfo.value.couCollNum = (courseInfo.value.couCollNum || 0) + 1;
      } else {
        courseInfo.value.couCollNum = Math.max(0, (courseInfo.value.couCollNum || 0) - 1);
      }
      uni.showToast({ 
        title: isCollected.value ? '收藏成功' : '取消收藏成功', 
        icon: 'success' 
      });
    } else {
      uni.showToast({ title: response?.message || '操作失败', icon: 'none' });
    }
  } catch (error) {
    console.error('收藏操作失败:', error);
    uni.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 切换点赞状态
const toggleFancy = async () => {
  if (!currentStudentId.value) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  
  try {
    uni.showLoading({ title: isFancied.value ? '取消点赞中...' : '点赞中...' });
    
    let response;
    if (isFancied.value) {
      response = await userApi.removeFancy(currentStudentId.value, courseId.value);
    } else {
      response = await userApi.addFancy(currentStudentId.value, courseId.value);
    }
    
    if (response && (response.code === 200 || response.code === 0)) {
      isFancied.value = !isFancied.value;
      // 更新点赞数量
      if (isFancied.value) {
        fancyCount.value += 1;
        courseInfo.value.couLikeNum = (courseInfo.value.couLikeNum || 0) + 1;
      } else {
        fancyCount.value = Math.max(0, fancyCount.value - 1);
        courseInfo.value.couLikeNum = Math.max(0, (courseInfo.value.couLikeNum || 0) - 1);
      }
      uni.showToast({ 
        title: isFancied.value ? '点赞成功' : '取消点赞成功', 
        icon: 'success' 
      });
    } else {
      uni.showToast({ title: response?.message || '操作失败', icon: 'none' });
    }
  } catch (error) {
    console.error('点赞操作失败:', error);
    uni.showToast({ title: '操作失败，请稍后重试', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 前往购物车
const goToCart = () => {
  uni.navigateTo({
    url: '/pages/my/cart'
  });
};

// 获取购物车数量
const fetchCartCount = async () => {
  if (!currentStudentId.value) return;
  
  try {
    const response = await userApi.getCartCount(currentStudentId.value);
    if (response && (response.code === 200 || response.code === 0)) {
      cartCount.value = response.data?.count || response.count || 0;
    }
  } catch (error) {
    console.error('获取购物车数量失败:', error);
  }
};

// 添加到购物车
const addToCart = async () => {
  if (!currentStudentId.value) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  
  // 检查课程是否已在购物车中
  try {
    const checkResponse = await userApi.checkInCart(currentStudentId.value, courseId.value);
    if (checkResponse && (checkResponse.code === 200 || checkResponse.code === 0)) {
      if (checkResponse.data === true || checkResponse.inCart === true) {
        // 课程已在购物车中，显示模态框询问是否跳转
        uni.showModal({
          title: '提示',
          content: '该课程已添加到购物车，是否前往购物车查看？',
          confirmText: '去购物车',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              goToCart();
            }
          }
        });
        return;
      }
    }
  } catch (error) {
    console.log('检查购物车状态失败，继续添加操作');
  }
  
  try {
    uni.showLoading({ title: '添加中...' });
    
    console.log('添加到购物车参数:', {
      stuId: currentStudentId.value,
      couId: courseId.value
    });
    
    const response = await userApi.addToCart({
      stuId: currentStudentId.value,
      couId: courseId.value
    });
    
    console.log('添加到购物车响应:', response);
    
    if (response && (response.code === 200 || response.code === 0 || response.success === true)) {
      // 更新购物车数量
      await fetchCartCount();
      
      // 如果返回了课程信息，可以在这里使用
      const courseInfo = response.courseInfo || response.data?.courseInfo;
      if (courseInfo) {
        console.log('添加的课程信息:', courseInfo);
      }
      
      uni.hideLoading();
      uni.showModal({
        title: '添加成功',
        content: courseInfo ? `《${courseInfo.couName}》已添加到购物车，是否前往购物车查看？` : '课程已添加到购物车，是否前往购物车查看？',
        confirmText: '去购物车',
        cancelText: '继续浏览',
        success: (res) => {
          if (res.confirm) {
            goToCart();
          }
        }
      });
    } else {
      uni.hideLoading();
      const errorMsg = response?.message || response?.msg || '添加失败';
      
      // 如果是课程已在购物车或已购买的错误，显示模态框
      if (errorMsg.includes('已在购物车') || errorMsg.includes('已购买')) {
        uni.showModal({
          title: '提示',
          content: errorMsg.includes('已购买') ? '您已购买该课程，可在学习页面查看' : '该课程已添加到购物车，是否前往购物车查看？',
          confirmText: errorMsg.includes('已购买') ? '去学习' : '去购物车',
          cancelText: '取消',
          success: (res) => {
            if (res.confirm) {
              if (errorMsg.includes('已购买')) {
                // 跳转到学习页面
                uni.switchTab({
                  url: '/pages/study/study'
                });
              } else {
                goToCart();
              }
            }
          }
        });
      } else {
        uni.showToast({ title: errorMsg, icon: 'none' });
      }
      console.error('添加到购物车失败:', response);
    }
  } catch (error) {
    uni.hideLoading();
    console.error('添加到购物车异常:', error);
    
    // 更详细的错误处理
    let errorMessage = '添加失败，请稍后重试';
    if (error.message) {
      if (error.message.includes('Token已过期')) {
        errorMessage = '登录已过期，请重新登录';
      } else if (error.message.includes('网络错误')) {
        errorMessage = '网络连接失败，请检查网络';
      }
    }
    
    uni.showToast({ title: errorMessage, icon: 'none' });
  }
};

// 检查是否可以购买
const canPurchase = computed(() => {
  const requiredPoints = convertPriceToPoints(courseInfo.value.couPrice);
  return userPoints.value >= requiredPoints && !isPurchased.value;
});



// 在script setup部分修复以下函数

onLoad(async (options) => {
  courseId.value = options.id;
  console.log('Course ID:', courseId.value);
  
  // 获取用户信息
  const userInfo = uni.getStorageSync('userInfo');
  if (userInfo && userInfo.id) {
    currentStudentId.value = userInfo.id;
  }
  
  // 按顺序执行异步操作
  await Promise.all([
    fetchCourseDetails(),
    fetchUserPoints()
  ]);
  
  // 如果有用户ID但没有通过详情接口获取到状态，单独获取
  if (currentStudentId.value && !isCollected.value && !isFancied.value) {
    await checkCollectionAndFancyStatus();
  }
  
  // 重要：确保购买状态检查在最后执行
  await checkPurchaseStatus();
  
  // 获取章节信息（无论是否购买都可以查看）
  await fetchChapters();
  
  // 获取评价统计（无论是否购买都可以看到）
  await fetchAppraiseStatistics();
  
  console.log('页面加载完成，购买状态:', isPurchased.value, '收藏状态:', isCollected.value, '点赞状态:', isFancied.value);
});

// 获取课程详情
const fetchCourseDetails = async () => {
  if (!courseId.value) return;
  
  try {
    uni.showLoading({ title: '加载中...' });
    
    // 如果有学生ID，使用详情接口获取包含收藏、点赞状态的数据
    let response;
    if (currentStudentId.value) {
      response = await courseApi.getCourseDetailInfo(courseId.value, currentStudentId.value);
    } else {
      response = await courseApi.getCourseById(courseId.value);
    }
    
    // 统一处理响应格式
    if (response && (response.code === 200 || response.code === 0)) {
      const data = response.data || response;
      
      if (currentStudentId.value && data.course) {
        // 使用详情接口返回的数据
        courseInfo.value = data.course;
        userPoints.value = data.studentPoints || 0;
        isCollected.value = data.isCollected || false;
        isFancied.value = data.isFancied || false;
        fancyCount.value = data.fancyCount || 0;
        
        // 确保课程信息中的数量字段正确设置
        courseInfo.value.couLikeNum = data.fancyCount || 0;
        courseInfo.value.couCollNum = data.collectionCount || 0;
      } else {
        // 使用基础课程信息
        courseInfo.value = data;
        
        // 如果没有学生ID，需要单独获取收藏和点赞状态
        if (currentStudentId.value) {
          await checkCollectionAndFancyStatus();
        }
      }
    } else {
      console.error('获取课程详情失败:', response);
      uni.showToast({ title: response?.message || '获取课程信息失败', icon: 'none' });
    }
  } catch (error) {
    console.error('获取课程详情失败:', error);
    uni.showToast({ title: '网络错误，请稍后重试', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 获取用户积分
const fetchUserPoints = async () => {
  try {
    const response = await userApi.getStudentProfile();
    if (response && (response.code === 200 || response.code === 0)) {
      const userData = response.data || response;
      userPoints.value = userData.stuScore || 0;
    }
  } catch (error) {
    console.error('获取用户积分失败:', error);
    // 设置默认值
    userPoints.value = 0;
  }
};

// 单独检查收藏和点赞状态
const checkCollectionAndFancyStatus = async () => {
  if (!currentStudentId.value || !courseId.value) return;
  
  try {
    // 检查收藏状态
    const collectionResponse = await userApi.checkCollectionStatus(currentStudentId.value, courseId.value);
    if (collectionResponse && (collectionResponse.code === 200 || collectionResponse.code === 0)) {
      isCollected.value = collectionResponse.data || false;
    }
    
    // 检查点赞状态
    const fancyResponse = await userApi.checkFancyStatus(currentStudentId.value, courseId.value);
    if (fancyResponse && (fancyResponse.code === 200 || fancyResponse.code === 0)) {
      isFancied.value = fancyResponse.data || false;
    }
    
    // 获取收藏数量
    const collectionCountResponse = await userApi.getCollectionCount(courseId.value);
    if (collectionCountResponse && (collectionCountResponse.code === 200 || collectionCountResponse.code === 0)) {
      courseInfo.value.couCollNum = collectionCountResponse.data || 0;
    }
    
    // 获取点赞数量
    const fancyCountResponse = await userApi.getFancyCount(courseId.value);
    if (fancyCountResponse && (fancyCountResponse.code === 200 || fancyCountResponse.code === 0)) {
      courseInfo.value.couLikeNum = fancyCountResponse.data || 0;
      fancyCount.value = fancyCountResponse.data || 0;
    }
  } catch (error) {
    console.error('获取收藏和点赞状态失败:', error);
  }
};

const getImageUrl = (imagePath) => {
  if (!imagePath) return '/static/images/course-default.png';
  
  // 如果已经是完整URL，直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // 拼接后端服务器地址
  return `${BASE_URL}/uploads/${imagePath.replace(/^\/?uploads\//, '')}`;
};

// 检查购买状态 - 替换现有的 checkPurchaseStatus 函数
const checkPurchaseStatus = async () => {
  try {
    const response = await userApi.checkCoursePurchased(courseId.value);
    if (response && (response.code === 200 || response.code === 0)) {
      isPurchased.value = response.data?.purchased || false;  // 修改为 purchased
    } else {
      // 处理直接返回的情况
      isPurchased.value = response?.purchased || false;
    }
  } catch (error) {
    console.error('检查购买状态失败:', error);
    isPurchased.value = false;
  }
};

// 修复购买课程请求
const purchaseCourse = async () => {
  if (!canPurchase.value) {
    uni.showToast({ title: '积分不足，无法购买', icon: 'none' });
    return;
  }
  
  uni.showModal({
    title: '确认购买',
    content: `确定花费 ${convertPriceToPoints(courseInfo.value.couPrice)} 积分购买此课程吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '购买中...' });
          
          // 发送完整的课程信息
          const response = await userApi.purchaseCourse({
            courseId: courseId.value,
            coursePrice: convertPriceToPoints(courseInfo.value.couPrice),
            courseName: courseInfo.value.couName || '',
            teacherName: courseInfo.value.teaName || '未知讲师', // 提供默认值
            coursePic: courseInfo.value.couPic || ''
          });
          
          if (response && (response.code === 200 || response.code === 0 || response.success)) {
            uni.hideLoading();
            uni.showToast({ title: '购买成功！', icon: 'success' });
            
            // 重新检查购买状态，确保与后端数据同步
            await checkPurchaseStatus();
            await fetchUserPoints();
            
            // 如果确认已购买，再获取章节信息
            if (isPurchased.value) {
              await fetchChapters();
            }
          } else {
            uni.hideLoading();
            uni.showToast({ title: response?.message || '购买失败', icon: 'none' });
          }
          
        } catch (error) {
          uni.hideLoading();
          console.error('购买失败:', error);
          uni.showToast({ title: '购买失败，请稍后重试', icon: 'none' });
        }
      }
    }
  });
};

// 获取章节列表 - 更新此函数
const fetchChapters = async () => {
  if (!courseId.value) return;
  
  try {
    console.log('正在获取课程章节，courseId:', courseId.value);
    const response = await chapterApi.getCourseChapters(courseId.value);
    console.log('章节API响应:', response);
    
    if (response && (response.code === 200 || response.code === 0)) {
      const chapterData = response.data || response;
      console.log('章节原始数据:', chapterData);
      
      chapters.value = Array.isArray(chapterData) ? chapterData.map(ch => ({
        id: ch.id,
        name: ch.chaTitle,  // 修复：使用chaTitle而不是chaName
        index: ch.chaIndex,
        videoUrl: ch.chaUrl,  // 修复：使用chaUrl而不是chaVideo
        isLearned: false
      })).sort((a, b) => a.index - b.index) : [];
      
      console.log('处理后的章节数据:', chapters.value);
    } else {
      console.log('章节API返回失败:', response);
      chapters.value = [];
    }
  } catch (error) {
    console.error('获取章节列表失败:', error);
    chapters.value = [];
  }
};

// 获取课程评价列表
const fetchAppraises = async () => {
  if (!courseId.value) return;
  
  try {
    const response = await appraiseApi.getCourseAppraises(courseId.value);
    if (response && (response.code === 200 || response.code === 0)) {
      const appraiseData = response.data || response;
      appraises.value = Array.isArray(appraiseData) ? appraiseData : [];
      hasReviews.value = appraises.value.length > 0;
    } else {
      appraises.value = [];
      hasReviews.value = false;
    }
  } catch (error) {
    console.error('获取评价列表失败:', error);
    appraises.value = [];
    hasReviews.value = false;
  }
};

// 获取评价统计
const fetchAppraiseStatistics = async () => {
  if (!courseId.value) return;
  
  try {
    const response = await appraiseApi.getCourseAppraiseStatistics(courseId.value);
    if (response && (response.code === 200 || response.code === 0)) {
      appraiseStatistics.value = response.data || response;
      overallRating.value = appraiseStatistics.value.averageScore || 0;
    } else {
      appraiseStatistics.value = {};
      overallRating.value = 0;
    }
  } catch (error) {
    console.error('获取评价统计失败:', error);
    appraiseStatistics.value = {};
    overallRating.value = 0;
  }
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 获取我的评价
const fetchMyAppraise = async () => {
  try {
    const response = await appraiseApi.getMyAppraiseForCourse(courseId.value);
    myAppraise.value = response.data || response;
  } catch (error) {
    console.warn('获取我的评价失败，但不影响其他功能:', error);
    // 设置为null，表示没有评价或获取失败
    myAppraise.value = null;
    // 不显示错误提示，因为这不是必须功能
  }
};

// 切换标签页 - 更新此函数
const switchTab = async (tab) => {
  activeTab.value = tab;
  
  if (tab === 'chapters' && chapters.value.length === 0) {
    await fetchChapters();
  } else if (tab === 'reviews') {
    // 并行执行，即使某个失败也不影响其他
    await Promise.allSettled([
      appraises.value.length === 0 ? fetchAppraises() : Promise.resolve(),
      currentStudentId.value ? fetchMyAppraise() : Promise.resolve() // 只有登录用户才获取我的评价
    ]);
  }
};

// 添加评价
const addReview = () => {
  if (!isPurchased.value) {
    uni.showToast({ title: '请先购买课程', icon: 'none' });
    return;
  }
  
  if (!currentStudentId.value) {
    uni.showToast({ title: '请先登录', icon: 'none' });
    return;
  }
  
  showReviewModal();
};

// 编辑评价
const editReview = () => {
  if (!myAppraise.value) {
    uni.showToast({ title: '未找到评价信息', icon: 'none' });
    return;
  }
  
  showReviewModal(myAppraise.value);
};

// 显示评价弹窗
const showReviewModal = (existingReview = null) => {
  const isEdit = !!existingReview;
  const initialRating = existingReview ? existingReview.evaluateScore : 5;
  const initialContent = existingReview ? existingReview.couAppraise : '';
  
  uni.showModal({
    title: isEdit ? '修改评价' : '课程评价',
    editable: true,
    placeholderText: '请输入您对课程的评价...',
    content: initialContent,
    success: async (res) => {
      if (res.confirm && res.content && res.content.trim()) {
        // 显示评分选择
        uni.showActionSheet({
          itemList: ['⭐ 1分', '⭐⭐ 2分', '⭐⭐⭐ 3分', '⭐⭐⭐⭐ 4分', '⭐⭐⭐⭐⭐ 5分'],
          success: async (ratingRes) => {
            const rating = ratingRes.tapIndex + 1;
            await submitReviewData({
              couId: courseId.value,
              couAppraise: res.content.trim(),
              evaluateScore: rating
            }, isEdit);
          }
        });
      } else if (res.confirm) {
        uni.showToast({ title: '请输入评价内容', icon: 'none' });
      }
    }
  });
};

// 提交评价数据
const submitReviewData = async (reviewData, isEdit = false) => {
  try {
    uni.showLoading({ title: isEdit ? '修改中...' : '提交中...' });
    
    const response = await appraiseApi.submitAppraise(reviewData);
    
    if (response && (response.code === 200 || response.code === 0 || response.success)) {
      uni.hideLoading();
      uni.showToast({ 
        title: isEdit ? '修改成功' : '评价成功', 
        icon: 'success' 
      });
      
      // 重新获取我的评价和评价列表
      await Promise.allSettled([
        fetchMyAppraise(),
        fetchAppraises(),
        fetchAppraiseStatistics()
      ]);
    } else {
      uni.hideLoading();
      uni.showToast({ 
        title: response?.message || (isEdit ? '修改失败' : '评价失败'), 
        icon: 'none' 
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('提交评价失败:', error);
    uni.showToast({ 
      title: isEdit ? '修改失败，请稍后重试' : '评价失败，请稍后重试', 
      icon: 'none' 
    });
  }
};

// 提交评价（保留原有函数名以兼容）
const submitReview = () => {
  addReview();
};

// 更新 onLoad 函数
onLoad(async (options) => {
  courseId.value = options.id;
  console.log('Course ID:', courseId.value);
  
  // 获取当前学生ID
  const userInfo = uni.getStorageSync('userInfo');
  if (userInfo && userInfo.id) {
    currentStudentId.value = userInfo.id;
  }
  
  // 按顺序执行异步操作
  await Promise.all([
    fetchCourseDetails(),
    fetchUserPoints()
  ]);
  
  // 重要：确保购买状态检查在最后执行
  await checkPurchaseStatus();
  
  // 如果已购买，获取章节信息
  if (isPurchased.value) {
    await fetchChapters();
  }
  
  // 获取评价统计（无论是否购买都可以看到）
  await fetchAppraiseStatistics();
  
  // 获取购物车数量
  if (currentStudentId.value) {
    await fetchCartCount();
  }
  
  console.log('页面加载完成，购买状态:', isPurchased.value);
});

// 开始学习
// 在script setup部分，修改startStudy函数并添加goToChapters函数
// 开始学习（保留原有逻辑）
const startStudy = () => {
  if (chapters.value.length > 0) {
    const firstChapter = chapters.value[0];
    playChapter(firstChapter);
  } else {
    uni.showToast({ title: '暂无章节信息', icon: 'none' });
  }
};

// 新增：前往学习 - 切换到目录tab
const goToChapters = () => {
  if (chapters.value.length > 0) {
    // 切换到目录tab
    activeTab.value = 'chapters';
  } else {
    uni.showToast({ title: '暂无章节信息', icon: 'none' });
  }
};
const playChapter = (chapter) => {
  if (!isPurchased.value) {
    uni.showToast({ title: '请先购买课程', icon: 'none' });
    return;
  }
  console.log('播放章节:', chapter.name);
  // 跳转到章节详情页
  uni.navigateTo({ 
    url: `/pages/chapter/detail?chapterId=${chapter.id}&courseId=${courseId.value}&courseName=${encodeURIComponent(courseInfo.value.couName || '')}` 
  });
};
</script>

<style lang="scss" scoped>
.course-detail-container {
  display: flex;
  flex-direction: column;
  background-color: #f8f8f8;
  min-height: 100vh;
}

.course-header {
  position: relative;
  height: 400rpx; // 根据效果图调整
  overflow: hidden;
  .course-cover-bg {
    width: 100%;
    height: 100%;
    filter: blur(10px); // 背景虚化
    transform: scale(1.1); // 稍微放大避免边缘模糊问题
  }
  .header-content {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.3); // 半透明遮罩
    display: flex;
    align-items: center;
    padding: 40rpx;
    box-sizing: border-box;
    .course-cover-thumb {
      width: 160rpx;
      height: 120rpx;
      border-radius: 10rpx;
      margin-left: 30rpx;
      border: 2rpx solid rgba(255,255,255,0.5);
    }
    .course-meta {
      flex: 1;
      color: #fff;
      .course-title {
        font-size: 36rpx;
        font-weight: bold;
        display: block;
        margin-bottom: 10rpx;
      }
      .course-progress-info {
        font-size: 24rpx;
        margin-bottom: 15rpx;
        opacity: 0.9;
      }
      .progress-bar-wrapper {
        display: flex;
        align-items: center;
        progress {
          flex: 1;
          margin-right: 15rpx;
        }
        .progress-text {
          font-size: 24rpx;
          min-width: 60rpx; // 防止文字跳动
        }
      }
    }
  }
}

.tabs {
  display: flex;
  background-color: #fff;
  border-bottom: 1rpx solid #eee;
  .tab-item {
    flex: 1;
    text-align: center;
    padding: 25rpx 0;
    font-size: 30rpx;
    color: #666;
    position: relative;
    &.active {
      color: #FFC107; // 主题黄
      font-weight: bold;
      &::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 50%;
        transform: translateX(-50%);
        width: 60rpx;
        height: 6rpx;
        background-color: #FFC107;
        border-radius: 3rpx;
      }
    }
  }
}

.tab-content {
  flex: 1;
  background-color: #fff;
  // padding: 20rpx;
}

.chapters-section {
  padding: 20rpx;
  .chapter-item {
    display: flex;
    align-items: center;
    padding: 25rpx 10rpx;
    border-bottom: 1rpx solid #f5f5f5;
    font-size: 28rpx;
    color: #333;
    &:last-child {
      border-bottom: none;
    }
    .chapter-name {
      flex: 1;
      margin-left: 20rpx;
    }
    &.learned {
      .chapter-name {
        color: #999; // 已学章节颜色变灰
      }
    }
  }
}

.empty-tab-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
  font-size: 28rpx;
  color: #999;
}

.reviews-section {
  padding: 30rpx;
  .overall-rating {
    display: flex;
    align-items: center;
    margin-bottom: 30rpx;
    .rating-label {
      font-size: 30rpx;
      color: #333;
      margin-right: 20rpx;
    }
  }
}

.fab-add-review {
  position: fixed;
  right: 40rpx;
  bottom: 100rpx; // 适配 tabBar 高度，如果存在
  width: 100rpx;
  height: 100rpx;
  background-color: #FFC107; // 主题黄
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.2);
  z-index: 10;
}

// 在现有样式的最后添加以下样式

// 课程介绍优化
.intro-section {
  padding: 30rpx;
  
  .intro-content {
    margin-bottom: 40rpx;
    
    .intro-text {
      font-size: 28rpx;
      line-height: 1.6;
      color: #333;
      text-align: justify;
      white-space: pre-wrap; // 保持换行格式
    }
  }
  
  .course-details {
    background-color: #f8f9fa;
    border-radius: 12rpx;
    padding: 30rpx;
    
    .detail-item {
      display: flex;
      align-items: center;
      padding: 15rpx 0;
      border-bottom: 1rpx solid #eee;
      
      &:last-child {
        border-bottom: none;
      }
      
      .detail-label {
        font-size: 28rpx;
        color: #666;
        min-width: 160rpx;
      }
      
      .detail-value {
        font-size: 28rpx;
        color: #333;
        font-weight: 500;
      }
    }
  }
}

// 课程头部信息优化
.course-header {
  .header-content {
    .course-meta {
      .course-teacher {
        font-size: 28rpx;
        margin-bottom: 15rpx;
        opacity: 0.9;
        display: block;
      }
      
      .course-stats {
        display: flex;
        align-items: center;
        justify-content: space-between;
        
        .course-price {
          font-size: 32rpx;
          font-weight: bold;
          color: #FFC107;
        }
        
        .course-buyers {
          font-size: 24rpx;
          opacity: 0.8;
        }
      }
    }
  }
}

// 底部购买栏样式
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 15rpx 20rpx 20rpx 20rpx;
  border-top: 1rpx solid #eee;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
  z-index: 100;
  
  /* 积分信息区域 */
  .points-section {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15rpx;
    
    .points-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex: 1;
      
      .points-label {
        font-size: 24rpx;
        color: #666;
        margin-bottom: 5rpx;
      }
      
      .points-value {
        font-size: 28rpx;
        font-weight: bold;
        color: #FFC107;
        
        &.required {
          color: #ff4757;
        }
      }
    }
  }
  
  /* 底部操作区域 */
  .bottom-actions {
    display: flex;
    align-items: center;
    justify-content: space-between;
    
    /* 左侧功能按钮 */
    .function-buttons {
      display: flex;
      gap: 15rpx;
      
      .function-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8rpx;
        
        .function-btn {
          width: 60rpx;
          height: 60rpx;
          border-radius: 12rpx;
          background: #f8f9fa;
          border: 1rpx solid #e9ecef;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          
          &:active {
            transform: scale(0.9);
          }
          
          &.active {
            background: #fff;
            border-color: #ff4757;
            box-shadow: 0 2rpx 8rpx rgba(255, 71, 87, 0.2);
          }
          
          .like-text {
            font-size: 24rpx;
            font-weight: bold;
            transition: color 0.3s ease;
          }
        }
        
        .count-text {
          font-size: 20rpx;
          color: #666;
          font-weight: 500;
          text-align: center;
          min-width: 60rpx;
        }
      }
    }
    
    /* 右侧购买按钮 */
    .action-buttons {
      display: flex;
      gap: 12rpx;
      
      .add-cart-btn {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: #fff;
        border: none;
        border-radius: 25rpx;
        padding: 18rpx 24rpx;
        font-size: 26rpx;
        font-weight: bold;
        box-shadow: 0 3rpx 8rpx rgba(102, 126, 234, 0.3);
        transition: all 0.3s ease;
        
        &:active {
          transform: translateY(1rpx);
          box-shadow: 0 2rpx 6rpx rgba(102, 126, 234, 0.4);
        }
      }
      
      .purchase-btn {
        background: linear-gradient(135deg, #FFC107 0%, #FF8F00 100%);
        color: #333;
        border: none;
        border-radius: 25rpx;
        padding: 18rpx 30rpx;
        font-size: 28rpx;
        font-weight: bold;
        box-shadow: 0 3rpx 8rpx rgba(255, 193, 7, 0.3);
        transition: all 0.3s ease;
        
        &:disabled {
          background: #ccc;
          color: #666;
          box-shadow: none;
        }
        
        &:not(:disabled):active {
          transform: translateY(1rpx);
          box-shadow: 0 2rpx 6rpx rgba(255, 193, 7, 0.4);
        }
      }
    }
  }
}

// 已购买状态栏
.purchased-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: #fff;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #eee;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.1);
  z-index: 100;
  
  .purchased-text {
    font-size: 28rpx;
    color: #52c41a;
    font-weight: bold;
  }
  
  .start-study-btn {
    background-color: #52c41a;
    color: #fff;
    border: none;
    border-radius: 50rpx;
    padding: 20rpx 40rpx;
    font-size: 28rpx;
    font-weight: bold;
    
    &:active {
      background-color: #389e0d;
    }
  }
}

// 为了避免底部栏遮挡内容，给容器添加底部内边距
.course-detail-container {
  padding-bottom: 120rpx; // 为底部栏留出空间
}

// 新增样式
.review-count {
  font-size: 24rpx;
  color: #999;
  margin-left: 8rpx;
}

.chapter-item {
  display: flex;
  align-items: center;
  padding: 25rpx 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
  
  .chapter-index {
    width: 60rpx;
    height: 60rpx;
    background-color: #f0f0f0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24rpx;
    color: #666;
    margin-right: 20rpx;
  }
  
  .chapter-info {
    flex: 1;
    
    .chapter-name {
      font-size: 28rpx;
      color: #333;
      display: block;
      margin-bottom: 8rpx;
    }
    
    .chapter-meta {
      display: flex;
      align-items: center;
      
      .chapter-type {
        font-size: 24rpx;
        color: #999;
        margin-left: 8rpx;
      }
    }
  }
  
  &.learned {
    .chapter-index {
      background-color: #FFC107;
      color: #fff;
    }
    .chapter-name {
      color: #999;
    }
  }
}

.overall-rating {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #f8f9fa;
  border-radius: 12rpx;
  
  .rating-label {
    font-size: 30rpx;
    color: #333;
    margin-right: 20rpx;
  }
  
  .rating-text {
    font-size: 28rpx;
    color: #FFC107;
    margin-left: 10rpx;
    font-weight: bold;
  }
  
  .rating-count {
    font-size: 24rpx;
    color: #999;
    margin-left: 10rpx;
  }
}

.review-action-section {
  margin-bottom: 20rpx;
}

.my-review {
  background-color: #e8f5e8;
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
  position: relative;
  
  .review-title {
    color: #2e7d32;
    font-weight: bold;
  }
}

.edit-review-btn {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  background: #007aff;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 8rpx 16rpx;
  font-size: 24rpx;
}

.no-review {
  background: #f8f9fa;
  padding: 30rpx;
  border-radius: 12rpx;
  text-align: center;
  margin-bottom: 20rpx;
}

.no-review-text {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  display: block;
}

.add-review-btn {
  background: #ff6b35;
  color: white;
  border: none;
  border-radius: 8rpx;
  padding: 12rpx 24rpx;
  font-size: 28rpx;
  font-weight: bold;
}

.reviews-list {
  .review-item {
    padding: 20rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
  }
}

.review-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 15rpx;
  
  .reviewer-name {
    font-size: 26rpx;
    color: #666;
  }
}

.review-content {
  font-size: 28rpx;
  color: #333;
  line-height: 1.6;
  display: block;
  margin-bottom: 10rpx;
}

.review-time {
  font-size: 24rpx;
  color: #999;
}

.fab-add-review {
  position: fixed;
  right: 40rpx;
  bottom: 100rpx;
  width: 100rpx;
  height: 100rpx;
  background-color: #FFC107;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4rpx 10rpx rgba(0,0,0,0.2);
  z-index: 10;
}

</style>