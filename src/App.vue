<script>
import { useBannerStore } from '@/stores/banner.js'
import { initBannerUpdateTask } from '@/utils/scheduler.js'

export default {
  onLaunch: function() {
    console.log('App Launch')
    
    // 初始化轮播图定时更新任务
    const bannerStore = useBannerStore()
    initBannerUpdateTask(bannerStore)
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style>
/*每个页面公共css */
</style>
