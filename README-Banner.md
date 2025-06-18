# 轮播图功能实现说明

## 功能概述

本项目已成功将首页轮播图从模拟数据改为使用推荐课程的真实数据，并实现了以下功能：

### 主要特性

1. **动态数据获取**：轮播图数据来自后端API的推荐课程接口
2. **每日自动更新**：每天0点自动刷新轮播图数据
3. **数据持久化**：使用Pinia store管理状态，支持本地存储
4. **手动刷新**：支持下拉刷新功能
5. **点击跳转**：点击轮播图可跳转到对应课程详情页
6. **内容限制**：课程标题和介绍文字限制在16字以内

## 技术实现

### 1. Pinia Store 管理

- **文件位置**：`src/stores/banner.js`
- **主要功能**：
  - 获取推荐课程数据
  - 转换为轮播图格式
  - 检查更新时机
  - 数据持久化

### 2. 定时任务调度

- **文件位置**：`src/utils/scheduler.js`
- **功能**：每日0点自动更新轮播图数据
- **初始化**：在`App.vue`的`onLaunch`中启动

### 3. 页面集成

- **文件位置**：`src/pages/index/index.vue`
- **改动**：
  - 引入Pinia store
  - 添加轮播图点击事件
  - 实现下拉刷新功能

## 数据流程

1. **应用启动**：
   - App.vue 初始化定时任务
   - 首页加载时检查是否需要更新数据

2. **数据获取**：
   - 调用 `/api/course/list` 接口
   - 获取前3个推荐课程
   - 转换为轮播图格式

3. **数据展示**：
   - 显示课程封面图片
   - 显示课程标题（最多16字）
   - 显示课程介绍（最多16字）

4. **用户交互**：
   - 点击轮播图跳转到课程详情
   - 下拉刷新更新数据

## 配置说明

### API 接口

```javascript
// 获取课程列表
GET /api/course/list?pageNum=1&pageSize=3
```

### 数据格式

轮播图数据结构：
```javascript
{
  id: Number,           // 轮播图ID
  imageUrl: String,     // 课程封面图片URL
  title: String,        // 课程标题（最多16字）
  subtitle: String,     // 课程介绍（最多16字）
  courseId: Number,     // 课程ID（用于跳转）
  originalCourse: Object // 原始课程数据
}
```

### 更新时机

- **自动更新**：每天0点0分
- **手动更新**：下拉刷新
- **强制更新**：调用 `bannerStore.refreshBannerData()`

## 使用方法

### 1. 查看轮播图数据

```javascript
import { useBannerStore } from '@/stores/banner.js'

const bannerStore = useBannerStore()
console.log(bannerStore.bannerItems)
```

### 2. 手动刷新数据

```javascript
await bannerStore.refreshBannerData()
```

### 3. 检查更新状态

```javascript
if (bannerStore.needsUpdate) {
  await bannerStore.initBannerData()
}
```

## 错误处理

1. **API请求失败**：自动使用默认轮播图数据
2. **网络错误**：显示错误提示，保持原有数据
3. **数据格式错误**：使用备用数据结构

## 注意事项

1. **图片路径处理**：自动拼接后端服务器地址
2. **文字长度限制**：超过16字自动截断并添加省略号
3. **缓存策略**：数据持久化到本地存储，减少重复请求
4. **性能优化**：只在需要时更新数据，避免频繁API调用

## 测试建议

1. **功能测试**：
   - 检查轮播图是否正常显示
   - 测试点击跳转功能
   - 验证下拉刷新效果

2. **数据测试**：
   - 确认API接口返回正确数据
   - 验证数据格式转换
   - 测试错误情况处理

3. **时间测试**：
   - 验证每日更新机制
   - 测试数据持久化
   - 检查缓存有效性