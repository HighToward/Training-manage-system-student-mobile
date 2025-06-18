// 定时任务调度器
export class Scheduler {
  constructor() {
    this.tasks = new Map()
    this.timers = new Map()
  }

  // 添加每日定时任务
  addDailyTask(taskId, callback, hour = 0, minute = 0) {
    const task = {
      id: taskId,
      callback,
      hour,
      minute,
      type: 'daily'
    }
    
    this.tasks.set(taskId, task)
    this.scheduleDailyTask(task)
  }

  // 调度每日任务
  scheduleDailyTask(task) {
    const now = new Date()
    const targetTime = new Date()
    targetTime.setHours(task.hour, task.minute, 0, 0)
    
    // 如果今天的目标时间已过，则设置为明天
    if (targetTime <= now) {
      targetTime.setDate(targetTime.getDate() + 1)
    }
    
    const delay = targetTime.getTime() - now.getTime()
    
    // 清除之前的定时器
    if (this.timers.has(task.id)) {
      clearTimeout(this.timers.get(task.id))
    }
    
    // 设置新的定时器
    const timer = setTimeout(() => {
      task.callback()
      // 重新调度下一次执行
      this.scheduleDailyTask(task)
    }, delay)
    
    this.timers.set(task.id, timer)
    
    console.log(`任务 ${task.id} 已调度，将在 ${targetTime.toLocaleString()} 执行`)
  }

  // 移除任务
  removeTask(taskId) {
    if (this.timers.has(taskId)) {
      clearTimeout(this.timers.get(taskId))
      this.timers.delete(taskId)
    }
    this.tasks.delete(taskId)
  }

  // 立即执行任务
  executeTask(taskId) {
    const task = this.tasks.get(taskId)
    if (task) {
      task.callback()
    }
  }

  // 清除所有任务
  clearAll() {
    this.timers.forEach(timer => clearTimeout(timer))
    this.timers.clear()
    this.tasks.clear()
  }
}

// 全局调度器实例
export const globalScheduler = new Scheduler()

// 初始化轮播图更新任务
export const initBannerUpdateTask = (bannerStore) => {
  // 添加每日0点更新轮播图的任务
  globalScheduler.addDailyTask('updateBanner', async () => {
    console.log('执行每日轮播图更新任务')
    try {
      await bannerStore.refreshBannerData()
      console.log('轮播图数据更新成功')
    } catch (error) {
      console.error('轮播图数据更新失败:', error)
    }
  }, 0, 0) // 每日0点0分执行
}