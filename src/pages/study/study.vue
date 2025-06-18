<template>
  <view class="study-container">
    <!-- 今日学习时长 -->
    <view class="study-duration-banner">
      <view class="duration-info">
        <text class="label">今日学习时长</text>
        <text class="time">0 <text class="unit">分钟</text></text>
      </view>
      <image src="/static/images/study-banner-bg.png" class="banner-bg-image" mode="aspectFill"></image>
      <button class="sign-in-button" :class="{ 'disabled': !checkinStore.canCheckin }" @click="handleSignIn" :disabled="checkinStore.loading">
        {{ getCheckinButtonText }}
      </button>
    </view>

    <!-- 班级课程 -->
    <view class="class-courses-section">
      <view class="section-header">
        <text class="section-title">班级课程</text>
        <view class="class-selector" @click="selectClass">
          <text class="class-name">{{ selectedClass?.className || '选择班级' }}</text>
          <text class="arrow">▼</text>
        </view>
      </view>

      <view v-if="selectedClass && classCourses.length > 0" class="course-list">
        <view class="course-item" v-for="(course, index) in classCourses" :key="index" @click="navigateToCourseDetail(course.id)">
          <image :src="course.coverUrl || '/static/default-course.png'" class="course-cover" mode="aspectFill" @error="handleImageError"></image>
          <view class="course-details">
            <text class="course-title">{{ course.title }}</text>
            <text class="course-teacher">{{ course.teacherName }}</text>
            <view class="progress-bar-container">
              <progress :percent="course.progress" stroke-width="6" activeColor="#FFC107" backgroundColor="#E0E0E0" border-radius="3" />
            </view>
            <text class="course-progress-text">已学{{ course.learnedChapters }}/{{ course.totalChapters }}章</text>
          </view>
        </view>
      </view>
      <view v-else-if="selectedClass && classCourses.length === 0" class="empty-state">
        <text>该班级暂无课程</text>
      </view>
      <view v-else class="empty-state">
        <text>请先选择班级查看课程</text>
      </view>
    </view>

    <!-- 已购课程 -->
    <view class="purchased-courses-section">
      <view class="section-header">
        <text class="section-title">已购课程</text>
      </view>

      <view v-if="purchasedCourses.length > 0" class="course-list">
        <view class="course-item" v-for="(course, index) in purchasedCourses" :key="index" @click="navigateToCourseDetail(course.id)">
          <image :src="course.coverUrl || '/static/default-course.png'" class="course-cover" mode="aspectFill" @error="handleImageError"></image>
          <view class="course-details">
            <text class="course-title">{{ course.title }}</text>
            <text class="course-teacher">{{ course.teacherName }}</text>
            <view class="progress-bar-container">
              <progress :percent="course.progress" stroke-width="6" activeColor="#FFC107" backgroundColor="#E0E0E0" border-radius="3" />
            </view>
            <text class="course-progress-text">已学{{ course.learnedChapters }}/{{ course.totalChapters }}章</text>
          </view>
        </view>
      </view>
      <view v-else class="empty-state">
        <text>暂无已购课程</text>
      </view>
    </view>

    <view class="bottom-text">我是有底线的</view>

    <!-- 班级选择弹窗 (如果需要) -->
    <!-- <uni-popup ref="classPopup" type="bottom">
      <view class="popup-content">
        <view class="popup-item" v-for="cls in allClasses" :key="cls.id" @click="confirmSelectClass(cls)">{{ cls.name }}</view>
        <view class="popup-item cancel" @click="closeClassPopup">取消</view>
      </view>
    </uni-popup> -->
  </view>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useCheckinStore } from '@/stores/checkin.js';
import { classApi, userApi } from '@/api/index.js';
import { BASE_URL } from '@/api/index.js';
// import { classApi, courseApi } from '@/api/index.js'; // 假设API已配置

// 使用签到store
const checkinStore = useCheckinStore();

const selectedClass = ref(null); // 或者 { id: 1, name: '默认班级' } 进行初始化
const classCourses = ref([]);
const classes = ref([]); // 用于班级选择器
const purchasedCourses = ref([]); // 已购课程列表



// 签到按钮文本
const getCheckinButtonText = computed(() => {
  if (checkinStore.loading) return '签到中...';
  if (checkinStore.isCheckedIn) return '已签到';
  if (!checkinStore.canCheckin) return `${checkinStore.remainingTime}后可签到`;
  return '签到';
});

// 处理签到
const handleSignIn = async () => {
  if (!checkinStore.canCheckin || checkinStore.loading) {
    if (checkinStore.isCheckedIn) {
      uni.showToast({ title: '今日已签到', icon: 'none' });
    } else {
      uni.showToast({ title: `还需等待${checkinStore.remainingTime}`, icon: 'none' });
    }
    return;
  }
  
  const result = await checkinStore.performCheckin();
  
  if (result.success) {
    uni.showToast({ title: result.message, icon: 'success' });
  } else {
    uni.showToast({ title: result.message, icon: 'none' });
  }
};

const selectClass = () => {
  if (classes.value.length === 0) {
    uni.showToast({ title: '暂无班级数据', icon: 'none' });
    return;
  }
  
  const classNames = classes.value.map(c => c.className);
  
  uni.showActionSheet({
    itemList: classNames,
    success: function (res) {
      const selectedClassData = classes.value[res.tapIndex];
      if (selectedClassData.id !== selectedClass.value?.id) {
        selectedClass.value = selectedClassData;
        fetchClassCourses();
      }
    },
    fail: function (res) {
      console.log('取消选择班级');
    }
  });
};

const fetchClassCourses = async () => {
  if (!selectedClass.value) return;
  
  try {
    uni.showLoading({ title: '加载中...' });
    const response = await classApi.getClassCourses(selectedClass.value.id);
    console.log('班级课程响应:', response);
    
    // 后端返回Result包装的数据结构
    if (response && response.code === 200 && response.data) {
      const courses = response.data || [];
      classCourses.value = courses.map(course => ({
        id: course.couId || course.id,
        title: course.couName,
        teacherName: course.teaName,
        coverUrl: course.couPic ? (course.couPic.startsWith('http') ? course.couPic : `${BASE_URL}${course.couPic}`) : '',
        couName: course.couName,
        couPic: course.couPic,
        teaName: course.teaName,
        progress: course.progress || 0,
        totalChapters: course.couCataNum || 0,
        learnedChapters: course.learnedChapters || 0,
        couPrice: course.couPrice,
        typeName: course.typeName
      }));
    } else {
      classCourses.value = [];
      console.log('班级课程为空或格式不正确:', response);
    }
  } catch (error) {
    console.error('获取班级课程失败:', error);
    classCourses.value = [];
    uni.showToast({ title: '获取班级课程失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

const navigateToCourseDetail = (courseId) => {
  uni.navigateTo({ url: `/pages/course/detail?id=${courseId}&from=study` });
};

// 处理图片加载错误
const handleImageError = (e) => {
  console.log('图片加载失败:', e);
  // 可以在这里设置默认图片或其他处理逻辑
};



// 获取已购课程
const fetchPurchasedCourses = async () => {
  try {
    uni.showLoading({ title: '加载中...' });
    const userInfo = uni.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) {
      purchasedCourses.value = [];
      return;
    }
    
    const response = await userApi.getPurchasedCourses(userInfo.id);
    console.log('已购课程响应:', response);
    
    // 后端返回的数据结构：{ data: [...], total: number }
    if (response && response.data && Array.isArray(response.data)) {
      const courses = response.data || [];
      
      // 不过滤班级课程，允许课程在两个列表中同时显示
      purchasedCourses.value = courses.map(course => ({
        id: course.couId || course.id,
        title: course.couName,
        teacherName: course.teaName,
        coverUrl: course.couPic ? (course.couPic.startsWith('http') ? course.couPic : `${BASE_URL}${course.couPic}`) : '',
        couName: course.couName,
        couPic: course.couPic,
        teaName: course.teaName,
        progress: course.progress || 0,
        totalChapters: course.couCataNum || 0,
        learnedChapters: course.learnedChapters || 0,
        couPrice: course.couPrice,
        typeName: course.typeName
      }));
    } else {
      purchasedCourses.value = [];
      console.log('已购课程为空或格式不正确:', response);
    }
  } catch (error) {
    console.error('获取已购课程失败:', error);
    purchasedCourses.value = [];
    uni.showToast({ title: '获取已购课程失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

// 获取班级列表
const fetchClasses = async () => {
  try {
    uni.showLoading({ title: '加载中...' });
    const userInfo = uni.getStorageSync('userInfo');
    if (!userInfo || !userInfo.id) {
      classes.value = [];
      return;
    }
    
    const response = await classApi.getStudentClasses(userInfo.id);
    console.log('班级列表响应:', response);
    
    // 后端直接返回数组，不是包装在data字段中
    if (response && Array.isArray(response)) {
       classes.value = response.map(cls => ({
         id: cls.id,
         className: cls.className
       }));
       
       if (classes.value.length > 0) {
         selectedClass.value = classes.value[0];
         await fetchClassCourses();
       }
    } else {
       classes.value = [];
       console.log('班级列表为空或格式不正确:', response);
     }
   } catch (error) {
     console.error('获取班级列表失败:', error);
     classes.value = [];
     uni.showToast({ title: '获取班级列表失败', icon: 'none' });
   } finally {
     uni.hideLoading();
   }
 };
 
 // 初始化数据
 onMounted(async () => {
     // 获取真实班级数据
     await fetchClasses();
     
     // 获取已购课程
     await fetchPurchasedCourses();
     
     // 初始化签到数据
     await checkinStore.fetchUserPoints();
     checkinStore.resetDailyPoints();
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

.study-container {
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, #f0f8ff 0%, #fafafa 100%);
  min-height: 100vh;
  position: relative;
  
  &::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 20% 80%, rgba(255, 193, 7, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(24, 144, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
    z-index: 0;
  }
}

.study-duration-banner {
  position: relative;
  width: 100%;
  height: 320rpx;
  background: linear-gradient(135deg, #FFC107 0%, #ffec3d 100%);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 0 40rpx;
  box-sizing: border-box;
  overflow: hidden;
  margin-bottom: 80rpx;
  z-index: 1;
  
  &::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
    animation: float 6s ease-in-out infinite;
  }
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 2rpx;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  }

  .banner-bg-image {
    position: absolute;
    top: 0;
    right: 0;
    width: 300rpx;
    height: 100%;
    opacity: 0.6;
    filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.1));
  }

  .duration-info {
    position: relative;
    z-index: 2;
    
    .label {
      font-size: 28rpx;
      color: rgba(51, 51, 51, 0.8);
      display: block;
      margin-bottom: 12rpx;
      font-weight: 500;
      
      &::before {
        content: '📚';
        margin-right: 8rpx;
      }
    }
    
    .time {
      font-size: 64rpx;
      color: #333;
      font-weight: 700;
      text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
      
      .unit {
        font-size: 28rpx;
        margin-left: 12rpx;
        font-weight: 500;
      }
    }
  }

  .sign-in-button {
    position: absolute;
    top: 50%;
    right: 40rpx;
    transform: translateY(-50%);
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10rpx);
    color: $warning-color;
    font-size: 28rpx;
    font-weight: 600;
    padding: 16rpx 32rpx;
    border-radius: 32rpx;
    z-index: 3;
    box-shadow: $shadow-medium;
    border: 1rpx solid rgba(255, 255, 255, 0.8);
    transition: all 0.3s ease;
    
    &::before {
      content: '✅';
      margin-right: 8rpx;
    }
    
    &:active {
      transform: translateY(-50%) scale(0.95);
      box-shadow: $shadow-light;
    }
    
    &.disabled {
      background: linear-gradient(135deg, #ccc 0%, #999 100%);
      box-shadow: 0 4rpx 10rpx rgba(153, 153, 153, 0.2);
      cursor: not-allowed;
      
      &:active {
        transform: translateY(-50%);
        box-shadow: 0 4rpx 10rpx rgba(153, 153, 153, 0.2);
      }
    }
  }
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20rpx) rotate(180deg);
  }
}

.class-courses-section, .purchased-courses-section {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20rpx);
  border-radius: 24rpx 24rpx 0 0;
  margin-top: -60rpx;
  padding: 32rpx;
  position: relative;
  z-index: 1;
  min-height: 400rpx;
  box-shadow: $shadow-medium;
  border: 1rpx solid rgba(255, 255, 255, 0.8);

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;
    
    .section-title {
      font-size: 34rpx;
      font-weight: 700;
      color: $text-primary;
      padding-left: 24rpx;
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 8rpx;
        height: 32rpx;
        background: linear-gradient(135deg, $warning-color, #ffec3d);
        border-radius: 4rpx;
        box-shadow: $shadow-light;
      }
    }
    
    .class-selector {
      display: flex;
      align-items: center;
      font-size: 28rpx;
      color: $text-secondary;
      padding: 12rpx 20rpx;
      background: rgba(24, 144, 255, 0.05);
      border-radius: $radius-medium;
      transition: all 0.3s ease;
      font-weight: 500;
      
      &:active {
        transform: scale(0.95);
        background: rgba(24, 144, 255, 0.1);
      }
      
      uni-icons {
        margin-left: 8rpx;
        transition: transform 0.3s ease;
      }
    }
  }

  .course-list {
    .course-item {
      display: flex;
      margin-bottom: 24rpx;
      background: #fff;
      padding: 20rpx;
      border-radius: $radius-large;
      box-shadow: $shadow-light;
      border: 1rpx solid $border-color;
      transition: all 0.3s ease;
      
      &:active {
        transform: translateY(-4rpx);
        box-shadow: $shadow-medium;
      }

      .course-cover {
        width: 200rpx;
        height: 150rpx;
        border-radius: $radius-medium;
        margin-right: 20rpx;
        box-shadow: $shadow-light;
        transition: all 0.3s ease;
        
        &:hover {
          transform: scale(1.02);
          box-shadow: $shadow-medium;
        }
      }
      
      .course-details {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        
        .course-title {
          font-size: 30rpx;
          color: $text-primary;
          font-weight: 600;
          margin-bottom: 8rpx;
          line-height: 1.4;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 2;
          overflow: hidden;
        }
        
        .course-teacher {
          font-size: 24rpx;
          color: $text-secondary;
          margin-bottom: 12rpx;
          font-weight: 500;
          
          &::before {
            content: '👨‍🏫';
            margin-right: 8rpx;
          }
        }
        
        .progress-bar-container {
          width: 100%;
          margin-bottom: 8rpx;
          
          progress {
            width: 100%;
            border-radius: 3rpx;
            overflow: hidden;
          }
        }
        
        .course-progress-text {
          font-size: 24rpx;
          color: $text-disabled;
          align-self: flex-end;
          font-weight: 500;
          
          &::before {
            content: '📊';
            margin-right: 8rpx;
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
    padding: 80rpx 0;
    
    &::before {
      content: '📖';
      font-size: 80rpx;
      margin-bottom: 24rpx;
      opacity: 0.6;
      animation: bounce 2s infinite;
    }
    
    text {
      color: $text-secondary;
      font-size: 28rpx;
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

.purchased-courses-section {
  margin-top: 24rpx;
  margin-bottom: 24rpx;
  border-radius: $radius-large;
}

.bottom-text {
  text-align: center;
  color: $text-disabled;
  font-size: 24rpx;
  padding: 40rpx 0;
  font-weight: 500;
  position: relative;
  z-index: 1;
  
  &::before {
    content: '🎯';
    margin-right: 8rpx;
  }
}

// 响应式适配
@media screen and (max-width: 750rpx) {
  .study-duration-banner {
    height: 280rpx;
    padding: 0 32rpx;
    
    .duration-info {
      .time {
        font-size: 56rpx;
      }
    }
    
    .sign-in-button {
      right: 32rpx;
      padding: 14rpx 28rpx;
      font-size: 26rpx;
    }
  }
  
  .class-courses-section, .purchased-courses-section {
    padding: 24rpx;
    
    .section-header {
      .section-title {
        font-size: 30rpx;
      }
      
      .class-selector {
        font-size: 26rpx;
        padding: 10rpx 16rpx;
      }
    }
    
    .course-list {
      .course-item {
        padding: 16rpx;
        
        .course-cover {
          width: 160rpx;
          height: 120rpx;
        }
        
        .course-details {
          .course-title {
            font-size: 28rpx;
          }
          
          .course-teacher {
            font-size: 22rpx;
          }
          
          .course-progress-text {
            font-size: 22rpx;
          }
        }
      }
    }
  }
}
</style>