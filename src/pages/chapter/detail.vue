<template>
  <view class="chapter-detail-container">
    <!-- 视频播放区域 -->
    <view class="video-section">
      <video 
        v-if="chapterInfo.videoUrl"
        :src="chapterInfo.videoUrl" 
        class="video-player"
        controls
        :poster="courseInfo.couPic"
        @play="onVideoPlay"
        @ended="onVideoEnded"
      ></video>
      <view v-else class="no-video">
        <uni-icons type="videocam" size="60" color="#ccc"></uni-icons>
        <text class="no-video-text">暂无视频</text>
      </view>
    </view>

    <!-- 课程信息区域 -->
    <view class="course-info-section">
      <view class="teacher-info">
        <image 
          :src="getTeacherAvatar() || '/static/images/default-avatar.png'"
          class="teacher-avatar"
          @error="onAvatarError"
        ></image>
        <view class="teacher-details">
          <text class="teacher-name">{{ teacherInfo.teaName || '未知教师' }}</text>
          <text class="teacher-title">授课教师</text>
        </view>
      </view>
      
      <view class="course-title">
        <text class="course-name">{{ courseInfo.couName }}</text>
        <text class="chapter-title">{{ chapterInfo.chaTitle }}</text>
      </view>
    </view>

    <!-- 章节列表区域 -->
    <view class="chapters-section">
      <view class="section-header">
        <text class="section-title">课程目录</text>
        <text class="chapter-count">共{{ chapters.length }}章节</text>
      </view>
      
      <scroll-view class="chapters-list" scroll-y>
        <view 
          class="chapter-item" 
          v-for="(chapter, index) in chapters" 
          :key="chapter.id"
          :class="{ active: chapter.id === currentChapterId, learned: chapter.isLearned }"
          @click="switchChapter(chapter)"
        >
          <view class="chapter-index">{{ chapter.index }}</view>
          <view class="chapter-info">
            <text class="chapter-name">{{ chapter.name }}</text>
            <view class="chapter-meta">
              <uni-icons type="videocam" size="14" color="#999"></uni-icons>
              <text class="chapter-type">视频课程</text>
            </view>
          </view>
          <uni-icons 
            :type="chapter.isLearned ? 'checkbox-filled' : (chapter.id === currentChapterId ? 'play-filled' : 'circle')" 
            size="20" 
            :color="chapter.isLearned ? '#FFC107' : (chapter.id === currentChapterId ? '#007AFF' : '#999')"
          ></uni-icons>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { chapterApi, courseApi, userApi, BASE_URL } from '@/api/index.js';

const currentChapterId = ref(null);
const courseId = ref(null);
const courseName = ref('');
const chapterInfo = ref({});
const courseInfo = ref({});
const teacherInfo = ref({});
const chapters = ref([]);

// 页面加载
onLoad((options) => {
  currentChapterId.value = parseInt(options.chapterId);
  courseId.value = parseInt(options.courseId);
  courseName.value = decodeURIComponent(options.courseName || '');
  
  // 设置页面标题
  uni.setNavigationBarTitle({
    title: courseName.value || '章节详情'
  });
  
  fetchChapterDetail();
  fetchCourseInfo();
  fetchChaptersList();
});

// 获取章节详情
// 修改 fetchChapterDetail 函数
const fetchChapterDetail = async () => {
  try {
    const response = await chapterApi.getChapterDetail(currentChapterId.value);
    if (response && (response.code === 200 || response.code === 0)) {
      const chapterData = response.data || response;
      chapterInfo.value = {
        ...chapterData,
        // 确保视频URL正确处理
        videoUrl: chapterData.chaUrl ? `${BASE_URL}${chapterData.chaUrl}` : null
      };
    }
  } catch (error) {
    console.error('获取章节详情失败:', error);
    uni.showToast({ title: '获取章节信息失败', icon: 'none' });
  }
};

// 获取课程信息
const fetchCourseInfo = async () => {
  try {
    const response = await courseApi.getCourseDetail(courseId.value);
    if (response && (response.code === 200 || response.code === 0)) {
      const courseData = response.data || response;
      courseInfo.value = courseData;
      
      // 获取教师信息
      if (courseData.teaId) {
        fetchTeacherInfo(courseData.teaId);
      }
    }
  } catch (error) {
    console.error('获取课程信息失败:', error);
  }
};

// 获取教师信息
const fetchTeacherInfo = async (teacherId) => {
  try {
    const response = await userApi.getTeacherInfo(teacherId);
    console.log('教师信息响应:', response);
    
    if (response) {
      // 处理不同的响应格式
      const teacherData = response.data || response;
      teacherInfo.value = {
        id: teacherData.id,
        teaName: teacherData.teaName,
        pic: teacherData.pic,
        coursNum: teacherData.coursNum
      };
      console.log('设置的教师信息:', teacherInfo.value);
    }
  } catch (error) {
    console.error('获取教师信息失败:', error);
    // 设置默认值
    teacherInfo.value = {
      teaName: '未知教师',
      pic: null
    };
  }
};

// 获取教师头像URL
const getTeacherAvatar = () => {
  if (!teacherInfo.value.pic) {
    return '/static/images/default-avatar.png';
  }
  
  const picPath = teacherInfo.value.pic;
  
  // 如果是完整的HTTP URL，直接返回
  if (picPath.startsWith('http')) {
    return picPath;
  }
  
  // 如果是相对路径，拼接BASE_URL
  if (picPath.startsWith('/uploads/')) {
    return `${BASE_URL}${picPath}`;
  }
  
  // 其他情况，使用默认头像
  return '/static/images/default-avatar.png';
};

// 头像加载失败处理
const onAvatarError = () => {
  console.log('头像加载失败，使用默认头像');
  // 可以在这里设置一个标志，强制使用默认头像
};

// 获取章节列表
const fetchChaptersList = async () => {
  try {
    const response = await chapterApi.getCourseChapters(courseId.value);
    if (response && (response.code === 200 || response.code === 0)) {
      const chapterData = response.data || response;
      chapters.value = Array.isArray(chapterData) ? chapterData.map(ch => ({
        id: ch.id,
        name: ch.chaTitle,
        index: ch.chaIndex,
        videoUrl: ch.chaUrl,
        isLearned: false // 这里可以根据学习记录来设置
      })).sort((a, b) => a.index - b.index) : [];
    }
  } catch (error) {
    console.error('获取章节列表失败:', error);
  }
};

// 切换章节
const switchChapter = async (chapter) => {
  if (chapter.id === currentChapterId.value) return;
  
  currentChapterId.value = chapter.id;
  
  // 重新获取章节详情以确保数据完整性
  await fetchChapterDetail();
};

// 视频播放事件
const onVideoPlay = () => {
  console.log('开始播放视频');
  // 可以在这里记录学习进度
};

// 视频播放结束事件
const onVideoEnded = () => {
  console.log('视频播放结束');
  // 可以在这里标记章节为已学习
  const currentChapter = chapters.value.find(ch => ch.id === currentChapterId.value);
  if (currentChapter) {
    currentChapter.isLearned = true;
  }
};
</script>

<style lang="scss" scoped>
.chapter-detail-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #f8f8f8;
}

.video-section {
  background-color: #000;
  position: relative;
  
  .video-player {
    width: 100%;
    height: 400rpx;
  }
  
  .no-video {
    height: 400rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    
    .no-video-text {
      color: #ccc;
      font-size: 28rpx;
      margin-top: 20rpx;
    }
  }
}

.course-info-section {
  background-color: #fff;
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
  
  .teacher-info {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    .teacher-avatar {
      width: 80rpx;
      height: 80rpx;
      border-radius: 50%;
      margin-right: 20rpx;
    }
    
    .teacher-details {
      .teacher-name {
        display: block;
        font-size: 32rpx;
        font-weight: 600;
        color: #333;
        margin-bottom: 8rpx;
      }
      
      .teacher-title {
        font-size: 24rpx;
        color: #999;
      }
    }
  }
  
  .course-title {
    .course-name {
      display: block;
      font-size: 36rpx;
      font-weight: 600;
      color: #333;
      margin-bottom: 10rpx;
    }
    
    .chapter-title {
      font-size: 28rpx;
      color: #666;
    }
  }
}

.chapters-section {
  flex: 1;
  background-color: #fff;
  display: flex;
  flex-direction: column;
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 30rpx;
    border-bottom: 1px solid #f0f0f0;
    
    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #333;
    }
    
    .chapter-count {
      font-size: 24rpx;
      color: #999;
    }
  }
  
  .chapters-list {
    flex: 1;
    
    .chapter-item {
      display: flex;
      align-items: center;
      padding: 30rpx;
      border-bottom: 1px solid #f8f8f8;
      transition: background-color 0.3s;
      
      &.active {
        background-color: #e3f2fd;
        
        .chapter-name {
          color: #007AFF;
          font-weight: 600;
        }
      }
      
      &.learned {
        .chapter-name {
          color: #FFC107;
        }
      }
      
      .chapter-index {
        width: 60rpx;
        height: 60rpx;
        border-radius: 50%;
        background-color: #f0f0f0;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24rpx;
        color: #666;
        margin-right: 20rpx;
        flex-shrink: 0;
      }
      
      .chapter-info {
        flex: 1;
        
        .chapter-name {
          display: block;
          font-size: 28rpx;
          color: #333;
          margin-bottom: 8rpx;
          line-height: 1.4;
        }
        
        .chapter-meta {
          display: flex;
          align-items: center;
          
          .chapter-type {
            font-size: 22rpx;
            color: #999;
            margin-left: 8rpx;
          }
        }
      }
    }
  }
}
</style>