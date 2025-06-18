import { createPinia } from 'pinia'

// 创建 pinia 实例
const pinia = createPinia()

// 简单的持久化插件
const persistPlugin = (context) => {
  const { store, options } = context
  
  if (options.persist?.enabled) {
    const strategy = options.persist.strategies?.[0]
    if (strategy) {
      const { key, storage } = strategy
      
      // 从存储中恢复状态
      const savedState = storage.getItem(key)
      if (savedState) {
        try {
          const parsedState = JSON.parse(savedState)
          store.$patch(parsedState)
        } catch (error) {
          console.error('恢复状态失败:', error)
        }
      }
      
      // 监听状态变化并保存
      store.$subscribe((mutation, state) => {
        try {
          storage.setItem(key, JSON.stringify(state))
        } catch (error) {
          console.error('保存状态失败:', error)
        }
      })
    }
  }
}

// 注册插件
pinia.use(persistPlugin)

export default pinia

// 导出所有 store
export * from './banner.js'
export * from './checkin.js'
export * from './search.js'