import {
	createSSRApp
} from "vue";
import pinia from './stores/index.js';
import App from './App.vue'

// 引入 uni-ui 组件
import uniIcons from '@dcloudio/uni-ui/lib/uni-icons/uni-icons.vue'
import uniSearchBar from '@dcloudio/uni-ui/lib/uni-search-bar/uni-search-bar.vue'
import uniRate from '@dcloudio/uni-ui/lib/uni-rate/uni-rate.vue'
// 如果还有其他 uni-ui 组件，请在此处继续引入

export function createApp() {
  const app = createSSRApp(App)
 
  // 全局注册 uni-ui 组件，如果项目中多处使用
  // 如果只在特定页面使用，建议在页面内局部引入注册
  app.component('uni-icons', uniIcons)
  app.component('uni-search-bar', uniSearchBar)
  app.component('uni-rate', uniRate)
  // 继续注册其他全局组件

  app.use(pinia);

  return {
    app
  }
}
