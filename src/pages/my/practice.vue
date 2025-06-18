<template>
  <view class="practice-container">
    <!-- 日历视图 -->
    <view class="calendar-section">
      <view class="calendar-header">
        <view class="month-nav">
          <view class="nav-btn" @click="prevMonth">
            <uni-icons type="left" size="16" color="#666"></uni-icons>
          </view>
          <text class="current-month">{{ currentYear }}年{{ currentMonth }}月</text>
          <view class="nav-btn" @click="nextMonth">
            <uni-icons type="right" size="16" color="#666"></uni-icons>
          </view>
        </view>
      </view>
      
      <view class="calendar-grid">
        <!-- 星期标题 -->
        <view class="week-header">
          <text v-for="day in weekDays" :key="day" class="week-day">{{ day }}</text>
        </view>
        
        <!-- 日期网格 -->
        <view class="date-grid">
          <view 
            v-for="(date, index) in calendarDates" 
            :key="index" 
            class="date-cell"
            :class="{
              'other-month': date.isOtherMonth,
              'today': date.isToday,
              'has-practice': date.hasPractice,
              'selected': selectedDate === date.dateStr
            }"
            @click="selectDate(date)"
          >
            <text class="date-number">{{ date.day }}</text>
            <view v-if="date.hasPractice" class="practice-dot"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 实践记录列表 -->
    <view class="practice-list" v-loading="loading">
      <view class="list-header">
        <text class="list-title">
          {{ selectedDateText }}的实践记录
        </text>
        <text class="practice-count">({{ selectedPractices.length }}条)</text>
      </view>
      
      <view v-if="loading" class="loading-container">
        <uni-load-more status="loading" content-text="{ contentText: { contentdown: '加载中...', contentrefresh: '加载中...', contentnomore: '加载中...' } }"></uni-load-more>
      </view>
      
      <view v-else-if="selectedPractices.length > 0" class="practice-items">
        <view 
          v-for="(practice, index) in selectedPractices" 
          :key="index" 
          class="practice-item"
          @click="viewPractice(practice)"
        >
          <view class="practice-icon">
            <image :src="getPracticeIcon(practice.type)" class="icon"></image>
          </view>
          <view class="practice-content">
            <text class="practice-title">{{ practice.title }}</text>
            <text class="practice-desc">{{ practice.description }}</text>
            <view class="practice-location" v-if="practice.location">
              <uni-icons type="location" size="12" color="#999"></uni-icons>
              <text class="location-text">{{ practice.location }}</text>
            </view>
            <view class="practice-meta">
              <text class="practice-time">{{ practice.time }}</text>
              <view class="practice-status" :class="practice.status">
                <text class="status-text">{{ getStatusText(practice.status) }}</text>
              </view>
            </view>
          </view>
          <view class="practice-arrow">
            <uni-icons type="right" size="16" color="#ccc"></uni-icons>
          </view>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-else class="empty-state">
        <image src="/static/images/empty-practice.png" class="empty-image"></image>
        <text class="empty-text">这一天还没有实践记录</text>
        <text class="empty-tip">快去完成一些实践任务吧</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { practiceApi } from '@/api'

// 当前日期
const currentDate = new Date()
const currentYear = ref(currentDate.getFullYear())
const currentMonth = ref(currentDate.getMonth() + 1)
const selectedDate = ref('')
const loading = ref(false)
const practiceData = ref({})
const stuId = ref('')

// 星期标题
const weekDays = ['日', '一', '二', '三', '四', '五', '六']

// 获取学生实践数据
const fetchStudentPractices = async () => {
  try {
    loading.value = true
    const response = await practiceApi.getStudentPracticeList(stuId.value)
    if (response && response.data && Array.isArray(response.data)) {
      // 获取学生实践记录列表
      const studentPractices = response.data
      const groupedData = {}
      
      // 为每个学生实践记录获取对应的实践详情
      for (const studentPractice of studentPractices) {
        try {
          const practiceResponse = await practiceApi.getPracticeById(studentPractice.praId)
          if (practiceResponse && practiceResponse.data) {
            const practice = practiceResponse.data
            // 修复日期处理，避免时区问题导致日期偏移
            let date = ''
            if (practice.startTime) {
              const practiceDate = new Date(practice.startTime)
              const year = practiceDate.getFullYear()
              const month = String(practiceDate.getMonth() + 1).padStart(2, '0')
              const day = String(practiceDate.getDate()).padStart(2, '0')
              date = `${year}-${month}-${day}`
            }
            if (date) {
              if (!groupedData[date]) {
                groupedData[date] = []
              }
              groupedData[date].push({
                id: practice.id,
                title: practice.praName,
                description: practice.praMain || '暂无描述',
                type: getPracticeType(practice.praName),
                time: practice.startTime ? new Date(practice.startTime).toLocaleTimeString('zh-CN', { hour12: false, hour: '2-digit', minute: '2-digit' }) : '',
                status: getPracticeStatus(practice.status),
                location: practice.praSite,
                endTime: practice.endTime,
                courseId: practice.couId,
                teacherId: practice.teaId,
                studentPracticeId: studentPractice.id
              })
            }
          }
        } catch (error) {
          console.error(`获取实践详情失败 (ID: ${studentPractice.praId}):`, error)
        }
      }
      practiceData.value = groupedData
    }
  } catch (error) {
    console.error('获取实践数据失败:', error)
    uni.showToast({
      title: '获取实践数据失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 根据实践名称判断类型
const getPracticeType = (praName) => {
  if (praName.includes('编程') || praName.includes('代码') || praName.includes('开发')) {
    return 'coding'
  } else if (praName.includes('设计') || praName.includes('UI') || praName.includes('界面')) {
    return 'design'
  } else if (praName.includes('数据库') || praName.includes('SQL')) {
    return 'database'
  } else if (praName.includes('实验') || praName.includes('测试')) {
    return 'experiment'
  }
  return 'other'
}

// 根据状态码获取状态
const getPracticeStatus = (status) => {
  switch (status) {
    case 1: return 'pending'     // 未开始
    case 2: return 'in-progress' // 进行中
    case 3: return 'completed'   // 已结束
    default: return 'pending'
  }
}

// 生成日历数据
const calendarDates = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const firstDayWeek = firstDay.getDay()
  const daysInMonth = lastDay.getDate()
  
  const dates = []
  
  // 添加上个月的日期
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const prevMonthLastDay = new Date(prevYear, prevMonth, 0).getDate()
  
  for (let i = firstDayWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    dates.push({
      day,
      dateStr,
      isOtherMonth: true,
      isToday: false,
      hasPractice: !!practiceData.value[dateStr]
    })
  }
  
  // 添加当前月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const today = new Date()
    const isToday = year === today.getFullYear() && 
                   month === today.getMonth() + 1 && 
                   day === today.getDate()
    
    dates.push({
      day,
      dateStr,
      isOtherMonth: false,
      isToday,
      hasPractice: !!practiceData.value[dateStr]
    })
  }
  
  // 添加下个月的日期
  const totalCells = 42 // 6行 × 7列
  const remainingCells = totalCells - dates.length
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  
  for (let day = 1; day <= remainingCells; day++) {
    const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    dates.push({
      day,
      dateStr,
      isOtherMonth: true,
      isToday: false,
      hasPractice: !!practiceData.value[dateStr]
    })
  }
  
  return dates
})

// 选中日期的实践记录
const selectedPractices = computed(() => {
  return practiceData.value[selectedDate.value] || []
})

// 选中日期的文本
const selectedDateText = computed(() => {
  if (!selectedDate.value) return '今天'
  const date = new Date(selectedDate.value)
  const today = new Date()
  
  if (date.toDateString() === today.toDateString()) {
    return '今天'
  }
  
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === yesterday.toDateString()) {
    return '昨天'
  }
  
  return `${date.getMonth() + 1}月${date.getDate()}日`
})

// 上一个月
const prevMonth = () => {
  if (currentMonth.value === 1) {
    currentYear.value--
    currentMonth.value = 12
  } else {
    currentMonth.value--
  }
}

// 下一个月
const nextMonth = () => {
  if (currentMonth.value === 12) {
    currentYear.value++
    currentMonth.value = 1
  } else {
    currentMonth.value++
  }
}

// 选择日期
const selectDate = (date) => {
  if (date.isOtherMonth) return
  selectedDate.value = date.dateStr
}

// 获取实践类型图标
const getPracticeIcon = (type) => {
  const iconMap = {
    'coding': '/static/icons/coding.png',
    'design': '/static/icons/design.png',
    'database': '/static/icons/database.png',
    'experiment': '/static/icons/experiment.png',
    'test': '/static/icons/test.png',
    'other': '/static/icons/practice.png'
  }
  return iconMap[type] || '/static/icons/practice.png'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    'completed': '已完成',
    'in-progress': '进行中',
    'pending': '待开始'
  }
  return statusMap[status] || '未知'
}

// 查看实践详情
const viewPractice = (practice) => {
  uni.navigateTo({
    url: `/pages/practice/detail?id=${practice.id}`
  })
}

// 页面加载
onMounted(async () => {
  // 获取学生ID
  const userInfo = uni.getStorageSync('userInfo')
  if (userInfo && userInfo.id) {
    stuId.value = userInfo.id
  } else {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    setTimeout(() => {
      uni.switchTab({
        url: '/pages/my/my'
      })
    }, 1500)
    return
  }
  
  // 默认选择今天
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  selectedDate.value = todayStr
  
  // 加载实践数据
  await fetchStudentPractices()
  
  console.log('我的实践页面加载完成')
})
</script>

<style lang="scss" scoped>
.practice-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.calendar-section {
  background: #fff;
  margin-bottom: 20rpx;
  
  .calendar-header {
    padding: 30rpx;
    border-bottom: 1rpx solid #f0f0f0;
    
    .month-nav {
      display: flex;
      align-items: center;
      justify-content: center;
      
      .nav-btn {
        padding: 10rpx;
        margin: 0 30rpx;
      }
      
      .current-month {
        font-size: 32rpx;
        font-weight: bold;
        color: #333;
      }
    }
  }
  
  .calendar-grid {
    padding: 20rpx;
    
    .week-header {
      display: flex;
      margin-bottom: 20rpx;
      
      .week-day {
        flex: 1;
        text-align: center;
        font-size: 24rpx;
        color: #666;
        padding: 10rpx 0;
      }
    }
    
    .date-grid {
      display: flex;
      flex-wrap: wrap;
      
      .date-cell {
        width: calc(100% / 7);
        height: 80rpx;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        margin-bottom: 10rpx;
        
        .date-number {
          font-size: 26rpx;
          color: #333;
        }
        
        .practice-dot {
          width: 8rpx;
          height: 8rpx;
          background-color: #1890ff;
          border-radius: 50%;
          margin-top: 4rpx;
        }
        
        &.other-month {
          .date-number {
            color: #ccc;
          }
        }
        
        &.today {
          background-color: #1890ff;
          border-radius: 8rpx;
          
          .date-number {
            color: #fff;
          }
          
          .practice-dot {
            background-color: #fff;
          }
        }
        
        &.selected {
          background-color: #e6f7ff;
          border-radius: 8rpx;
          
          .date-number {
            color: #1890ff;
            font-weight: bold;
          }
        }
        
        &.has-practice:not(.today):not(.selected) {
          background-color: #f0f9ff;
          border-radius: 8rpx;
        }
      }
    }
  }
}

.practice-list {
  padding: 0 30rpx;
  
  .list-header {
    display: flex;
    align-items: center;
    margin-bottom: 20rpx;
    
    .list-title {
      font-size: 28rpx;
      font-weight: bold;
      color: #333;
    }
    
    .practice-count {
      font-size: 22rpx;
      color: #666;
      margin-left: 10rpx;
    }
  }
  
  .practice-items {
    background: #fff;
    border-radius: 16rpx;
    overflow: hidden;
    box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.08);
  }
  
  .practice-item {
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
    
    .practice-icon {
      width: 60rpx;
      height: 60rpx;
      margin-right: 20rpx;
      
      .icon {
        width: 100%;
        height: 100%;
        border-radius: 8rpx;
      }
    }
    
    .practice-content {
      flex: 1;
      
      .practice-title {
        font-size: 28rpx;
        font-weight: bold;
        color: #333;
        margin-bottom: 8rpx;
        display: block;
      }
      
      .practice-desc {
        font-size: 22rpx;
        color: #666;
        line-height: 1.4;
        margin-bottom: 12rpx;
        display: block;
      }
      
      .practice-location {
          display: flex;
          align-items: center;
          margin-top: 8rpx;
          margin-bottom: 8rpx;
        }
        
        .location-text {
          font-size: 22rpx;
          color: #999;
          margin-left: 4rpx;
        }
        
        .practice-meta {
          display: flex;
          align-items: center;
          justify-content: space-between;
          
          .practice-time {
            font-size: 20rpx;
            color: #999;
          }
        
        .practice-status {
          padding: 4rpx 12rpx;
          border-radius: 12rpx;
          
          &.completed {
            background-color: #f6ffed;
            
            .status-text {
              color: #52c41a;
              font-size: 20rpx;
            }
          }
          
          &.in-progress {
            background-color: #fff7e6;
            
            .status-text {
              color: #fa8c16;
              font-size: 20rpx;
            }
          }
          
          &.pending {
            background-color: #f0f0f0;
            
            .status-text {
              color: #666;
              font-size: 20rpx;
            }
          }
        }
      }
    }
    
    .practice-arrow {
      margin-left: 20rpx;
    }
  }
  
  .loading-container {
    padding: 40rpx 0;
    text-align: center;
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