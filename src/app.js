// 在App.vue的onLaunch中添加
export default {
  onLaunch: function() {
    console.log('App Launch');
    
    // 检查token有效性
    this.checkTokenOnLaunch();
    
    // 设置定时检查token（每10分钟检查一次）
    setInterval(() => {
      this.checkTokenPeriodically();
    }, 10 * 60 * 1000);
  },
  
  methods: {
    checkTokenOnLaunch() {
      const token = uni.getStorageSync('token');
      const tokenExpiry = uni.getStorageSync('tokenExpiry');
      
      if (token && tokenExpiry) {
        const now = Date.now();
        const expiryTime = parseInt(tokenExpiry);
        
        // 如果token已过期，清除数据
        if (now >= expiryTime) {
          uni.removeStorageSync('token');
          uni.removeStorageSync('tokenExpiry');
          uni.removeStorageSync('userInfo');
        }
      }
    },
    
    checkTokenPeriodically() {
      const token = uni.getStorageSync('token');
      const tokenExpiry = uni.getStorageSync('tokenExpiry');
      
      if (token && tokenExpiry) {
        const now = Date.now();
        const expiryTime = parseInt(tokenExpiry);
        
        // 改为token在10分钟内过期才提示
        if ((expiryTime - now) <= 10 * 60 * 1000 && (expiryTime - now) > 0) {
          uni.showModal({
            title: '登录即将过期',
            content: '您的登录即将过期，是否重新登录？',
            confirmText: '重新登录',
            cancelText: '稍后再说',
            success: (res) => {
              if (res.confirm) {
                uni.reLaunch({
                  url: '/pages/login/login'
                });
              }
            }
          });
        }
      }
    }
  }
};