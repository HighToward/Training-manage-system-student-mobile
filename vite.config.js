import { defineConfig } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

export default defineConfig({
  plugins: [uni()],
  base: '/',
  resolve: {
    alias: {
      // '@dcloudio/uni-ui': '@dcloudio/uni-ui/lib/index.js', // Make sure this line is deleted or commented out
      // ... your other aliases can remain if you have them
    }
  },
  server: {
    port: 5173,
    host: '0.0.0.0', // 允许外部访问
    proxy: {
      '/api': {
        target: 'https://api.nekowalker.cn/', // 后端服务地址
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      },
      '/uploads': {
        target: 'https://api.nekowalker.cn/', // 后端服务地址
        changeOrigin: true,
        secure: false
      }
    }
  }
})