<template>
  <view class="practice-detail-container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading-container">
      <uni-load-more status="loading"></uni-load-more>
    </view>
    
    <!-- 实践详情 -->
    <view v-else-if="practiceDetail" class="practice-content">
      <!-- 头部信息 -->
      <view class="practice-header">
        <view class="practice-title">{{ practiceDetail.praName }}</view>
        <view class="practice-status" :class="getStatusClass(practiceDetail.status)">
          <text class="status-text">{{ getStatusText(practiceDetail.status) }}</text>
        </view>
      </view>
      
      <!-- 基本信息 -->
      <view class="practice-info">
        <view class="info-item">
          <view class="info-label">
            <uni-icons type="location" size="16" color="#666"></uni-icons>
            <text>实践地点</text>
          </view>
          <text class="info-value">{{ practiceDetail.praSite || '待定' }}</text>
        </view>
        
        <view class="info-item">
          <view class="info-label">
            <uni-icons type="calendar" size="16" color="#666"></uni-icons>
            <text>开始时间</text>
          </view>
          <text class="info-value">{{ formatDateTime(practiceDetail.startTime) }}</text>
        </view>
        
        <view class="info-item">
          <view class="info-label">
            <uni-icons type="calendar" size="16" color="#666"></uni-icons>
            <text>结束时间</text>
          </view>
          <text class="info-value">{{ formatDateTime(practiceDetail.endTime) }}</text>
        </view>
        
        <view class="info-item" v-if="practiceDetail.teacherName">
          <view class="info-label">
            <uni-icons type="person" size="16" color="#666"></uni-icons>
            <text>指导教师</text>
          </view>
          <text class="info-value">{{ practiceDetail.teacherName }}</text>
        </view>
      </view>
      
      <!-- 实践内容 -->
      <view class="practice-description">
        <view class="section-title">实践内容</view>
        <view class="description-content">
          {{ practiceDetail.praMain || '暂无详细描述' }}
        </view>
      </view>
      
      <!-- 我的参与状态 -->
      <view class="participation-status">
        <view class="section-title">我的参与状态</view>
        <view class="status-card" :class="participationStatusClass">
          <view class="status-icon">
            <uni-icons :type="participationStatusIcon" size="20" :color="participationStatusColor"></uni-icons>
          </view>
          <view class="status-info">
            <text class="status-title">{{ participationStatusText }}</text>
            <text class="status-desc">{{ participationStatusDesc }}</text>
          </view>
        </view>
      </view>
      
      <!-- 实践报告 -->
      <view v-if="hasJoined && practiceDetail.status >= 2" class="practice-report">
        <view class="section-title">实践报告</view>
        <view v-if="reportData" class="report-content">
          <view class="report-item">
            <text class="report-label">提交时间：</text>
            <text class="report-value">{{ formatDateTime(reportData.submitTime) }}</text>
          </view>
          <view class="report-item">
            <text class="report-label">报告内容：</text>
            <view class="report-text">{{ reportData.content }}</view>
          </view>
        </view>
        <view v-else class="no-report">
          <text class="no-report-text">还未提交实践报告</text>
          <button v-if="practiceDetail.status === 2" class="submit-report-btn" @click="showReportDialog">
            提交报告
          </button>
        </view>
      </view>
    </view>
    
    <!-- 底部操作按钮 -->
    <view class="bottom-actions" v-if="practiceDetail && !loading">
      <button 
        v-if="!hasJoined && practiceDetail.status === 1" 
        class="action-btn join-btn" 
        @click="joinPractice"
        :loading="actionLoading"
      >
        参与实践
      </button>
      

      
      <button 
        v-else-if="hasJoined && practiceDetail.status === 2 && !reportData" 
        class="action-btn submit-btn" 
        @click="showReportDialog"
      >
        提交报告
      </button>
      
      <view v-else-if="practiceDetail.status === 3" class="completed-tip">
        <text>实践已结束</text>
      </view>
    </view>
    
    <!-- 提交报告对话框 -->
    <uni-popup ref="reportPopup" type="bottom">
      <view class="report-dialog">
        <view class="dialog-header">
          <text class="dialog-title">提交实践报告</text>
          <view class="close-btn" @click="closeReportDialog">
            <uni-icons type="close" size="20" color="#666"></uni-icons>
          </view>
        </view>
        
        <view class="dialog-content">
          <textarea 
            v-model="reportContent" 
            placeholder="请输入实践报告内容..." 
            class="report-textarea"
            maxlength="1000"
          ></textarea>
          <view class="char-count">{{ reportContent.length }}/1000</view>
        </view>
        
        <view class="dialog-actions">
          <button class="cancel-btn" @click="closeReportDialog">取消</button>
          <button 
            class="confirm-btn" 
            @click="submitReport" 
            :loading="submitLoading"
            :disabled="!reportContent.trim()"
          >
            提交
          </button>
        </view>
      </view>
    </uni-popup>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { practiceApi } from '@/api'

// 页面参数
const practiceId = ref('')
const stuId = ref('')

// 数据状态
const loading = ref(false)
const actionLoading = ref(false)
const submitLoading = ref(false)
const practiceDetail = ref(null)
const reportData = ref(null)
const hasJoined = ref(false)

// 报告相关
const reportPopup = ref(null)
const reportContent = ref('')

// 获取实践详情
const fetchPracticeDetail = async () => {
  try {
    loading.value = true
    const response = await practiceApi.getPracticeById(practiceId.value)
    if (response && response.data) {
      practiceDetail.value = response.data
      console.log('实践详情数据:', practiceDetail.value)
      // 检查是否已参与并获取实践记录
      await fetchPracticeReport()
    } else {
      uni.showToast({
        title: '实践不存在',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('获取实践详情失败:', error)
    uni.showToast({
      title: '获取实践详情失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 检查参与状态 - 使用后端StudentPracticeController
const checkParticipationStatus = async () => {
  try {
    const response = await practiceApi.checkStudentPractice(stuId.value, practiceId.value)
    hasJoined.value = response.data || false
  } catch (error) {
    console.error('检查参与状态失败:', error)
    hasJoined.value = false
  }
}

// 获取学生实践记录（包含报告信息）
const fetchPracticeReport = async () => {
  try {
    const response = await practiceApi.getStudentPracticeRecord(stuId.value, practiceId.value)
    if (response && response.data) {
      reportData.value = response.data
      // 如果有记录，说明已参与
      hasJoined.value = true
    }
  } catch (error) {
    console.error('获取实践记录失败:', error)
    // 如果获取失败，可能是未参与
    hasJoined.value = false
  }
}

// 参与实践
const joinPractice = async () => {
  try {
    actionLoading.value = true
    await practiceApi.joinPractice(practiceId.value, stuId.value)
    hasJoined.value = true
    uni.showToast({
      title: '参与成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('参与实践失败:', error)
    uni.showToast({
      title: '参与失败',
      icon: 'none'
    })
  } finally {
    actionLoading.value = false
  }
}



// 显示报告对话框
const showReportDialog = () => {
  reportPopup.value.open()
}

// 关闭报告对话框
const closeReportDialog = () => {
  reportPopup.value.close()
  reportContent.value = ''
}

// 提交报告 - 使用updateStudentPractice接口
const submitReport = async () => {
  if (!reportContent.value.trim()) {
    uni.showToast({
      title: '请输入报告内容',
      icon: 'none'
    })
    return
  }
  
  try {
    submitLoading.value = true
    // 更新学生实践记录，添加报告内容
    await practiceApi.updateStudentPractice({
      practiceId: practiceId.value,
      studentId: stuId.value,
      reportContent: reportContent.value.trim(),
      reportSubmitTime: new Date().toISOString()
    })
    
    uni.showToast({
      title: '提交成功',
      icon: 'success'
    })
    
    closeReportDialog()
    fetchPracticeReport() // 重新获取报告数据
  } catch (error) {
    console.error('提交报告失败:', error)
    uni.showToast({
      title: '提交失败',
      icon: 'none'
    })
  } finally {
    submitLoading.value = false
  }
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '待定'
  try {
    const date = new Date(dateTime)
    if (isNaN(date.getTime())) return '待定'
    
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error('日期格式化错误:', error)
    return '待定'
  }
}

// 获取状态文本
const getStatusText = (status) => {
  switch (status) {
    case 1: return '未开始'
    case 2: return '进行中'
    case 3: return '已结束'
    default: return '未知'
  }
}

// 获取状态样式类
const getStatusClass = (status) => {
  switch (status) {
    case 1: return 'status-pending'
    case 2: return 'status-active'
    case 3: return 'status-completed'
    default: return 'status-unknown'
  }
}

// 参与状态相关计算属性
const participationStatusClass = computed(() => {
  if (!hasJoined.value) return 'status-not-joined'
  if (practiceDetail.value?.status === 3) return 'status-finished'
  return 'status-joined'
})

const participationStatusIcon = computed(() => {
  if (!hasJoined.value) return 'info'
  if (practiceDetail.value?.status === 3) return 'checkmarkempty'
  return 'person-filled'
})

const participationStatusColor = computed(() => {
  if (!hasJoined.value) return '#999'
  if (practiceDetail.value?.status === 3) return '#67C23A'
  return '#409EFF'
})

const participationStatusText = computed(() => {
  if (!hasJoined.value) return '未参与'
  if (practiceDetail.value?.status === 3) return '已完成'
  return '已参与'
})

const participationStatusDesc = computed(() => {
  if (!hasJoined.value) return '您还未参与此实践活动'
  if (practiceDetail.value?.status === 3) return '实践活动已结束，感谢您的参与'
  return '您已成功参与此实践活动'
})

// 页面加载
onMounted(() => {
  // 获取页面参数
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  practiceId.value = currentPage.options.id
  
  // 获取学生ID
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo && userInfo.id) {
    stuId.value = userInfo.id
  }
  
  if (practiceId.value) {
    fetchPracticeDetail()
  } else {
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})
</script>

<style lang="scss" scoped>
.practice-detail-container {
  min-height: 100vh;
  background: #f5f5f5;
  padding-bottom: 120rpx;
}

.loading-container {
  padding: 100rpx 0;
  text-align: center;
}

.practice-content {
  padding: 20rpx;
}

.practice-header {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.practice-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
  margin-right: 20rpx;
}

.practice-status {
  padding: 8rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  
  &.status-pending {
    background: #FDF6EC;
    color: #E6A23C;
  }
  
  &.status-active {
    background: #EDF2FC;
    color: #409EFF;
  }
  
  &.status-completed {
    background: #F0F9FF;
    color: #67C23A;
  }
}

.practice-info {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  display: flex;
  align-items: center;
  font-size: 28rpx;
  color: #666;
  
  text {
    margin-left: 8rpx;
  }
}

.info-value {
  font-size: 28rpx;
  color: #333;
  text-align: right;
  flex: 1;
  margin-left: 20rpx;
}

.practice-description {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 20rpx;
}

.description-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.participation-status {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.status-card {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-radius: 12rpx;
  
  &.status-not-joined {
    background: #F5F7FA;
  }
  
  &.status-joined {
    background: #EDF2FC;
  }
  
  &.status-finished {
    background: #F0F9FF;
  }
}

.status-icon {
  margin-right: 16rpx;
}

.status-info {
  flex: 1;
}

.status-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  display: block;
  margin-bottom: 8rpx;
}

.status-desc {
  font-size: 24rpx;
  color: #666;
}

.practice-report {
  background: #fff;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
}

.report-content {
  .report-item {
    margin-bottom: 20rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .report-label {
    font-size: 26rpx;
    color: #666;
    margin-bottom: 8rpx;
    display: block;
  }
  
  .report-value {
    font-size: 28rpx;
    color: #333;
  }
  
  .report-text {
    font-size: 28rpx;
    color: #333;
    line-height: 1.6;
    background: #F5F7FA;
    padding: 20rpx;
    border-radius: 8rpx;
  }
}

.no-report {
  text-align: center;
  padding: 40rpx 0;
}

.no-report-text {
  font-size: 28rpx;
  color: #999;
  display: block;
  margin-bottom: 20rpx;
}

.submit-report-btn {
  background: #409EFF;
  color: #fff;
  border: none;
  border-radius: 8rpx;
  padding: 16rpx 32rpx;
  font-size: 26rpx;
}

.bottom-actions {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 20rpx 30rpx;
  border-top: 1rpx solid #f0f0f0;
  z-index: 100;
}

.action-btn {
  width: 100%;
  height: 88rpx;
  border-radius: 44rpx;
  font-size: 32rpx;
  border: none;
  
  &.join-btn {
    background: #409EFF;
    color: #fff;
  }
  

  
  &.submit-btn {
    background: #67C23A;
    color: #fff;
  }
}

.completed-tip {
  text-align: center;
  padding: 20rpx;
  color: #999;
  font-size: 28rpx;
}

.report-dialog {
  background: #fff;
  border-radius: 20rpx 20rpx 0 0;
  padding: 30rpx;
  max-height: 80vh;
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.dialog-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
}

.close-btn {
  padding: 10rpx;
}

.dialog-content {
  margin-bottom: 30rpx;
}

.report-textarea {
  width: 100%;
  min-height: 300rpx;
  padding: 20rpx;
  border: 1rpx solid #ddd;
  border-radius: 8rpx;
  font-size: 28rpx;
  line-height: 1.5;
  resize: none;
}

.char-count {
  text-align: right;
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.dialog-actions {
  display: flex;
  gap: 20rpx;
}

.cancel-btn, .confirm-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 8rpx;
  font-size: 28rpx;
  border: none;
}

.cancel-btn {
  background: #F5F7FA;
  color: #666;
}

.confirm-btn {
  background: #409EFF;
  color: #fff;
  
  &:disabled {
    background: #C0C4CC;
  }
}
</style>