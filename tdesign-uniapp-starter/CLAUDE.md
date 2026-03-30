# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

基于 Vue 3 + TypeScript + Vite + TDesign Uniapp 的跨端移动应用模板，支持 H5、微信小程序等多平台开发。

- **包管理器**: pnpm（首选）
- **Vue 版本**: Vue 3
- **构建系统**: Vite 5
- **UI 组件库**: TDesign Uniapp（通过 easycom 自动导入）
- **样式预处理器**: LESS
- **目标平台**: H5、微信小程序、支付宝小程序等

## 常用命令

所有命令在 `tdesign-uniapp-starter/` 目录下运行：

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev:h5              # H5 开发
pnpm dev:mp-weixin       # 微信小程序开发

# 生产构建
pnpm build:h5            # H5 生产构建
pnpm build:mp-weixin     # 微信小程序构建

# 代码检查
pnpm lint                # ESLint 检查
pnpm lint:fix            # ESLint 自动修复
pnpm type-check          # TypeScript 类型检查
```

## 项目架构

### 页面结构

所有页面位于 `src/pages/`，使用分包（subPackages）实现懒加载：

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `pages/home/index` | 共享设备管理仪表板 |
| 消息 | `pages/message/index` | 消息列表 |
| 我的 | `pages/my/index` | 个人中心 |
| 数据中心 | `pages/data-center/index` | 经营统计 |
| 场地管理 | `pages/venue/index` | 场地列表/新增 |
| 设备列表 | `pages/device-list/index` | 设备管理 |
| 登录 | `pages/login/index`, `pages/login/password` | 登录页 |

### 路由配置

`src/pages.json` 管理所有页面路由，页面使用 `navigationStyle: "custom"` 自定义导航栏。

### 组件自动导入

TDesign 组件通过 easycom 自动导入，配置在 `pages.json` 中：

```json
"easycom": {
  "autoscan": true,
  "custom": {
    "^t-(.*)": "@tdesign/uniapp/$1/$1.vue"
  }
}
```

使用方式：`<t-button>`, `<t-icon>`, `<t-calendar>` 等，直接使用无需 import。

### 全局状态管理

**全局数据**（`App.vue`）：
- `uni.$globalData` - 全局状态对象（用户信息、未读消息数、WebSocket 连接）
- `uni.$eventBus` - 全局事件总线（基于自定义事件，用于页面间通信）

### API 请求

`src/api/request.ts` - 基于 `uni.request` 的请求封装：
- 自动携带 `Authorization: Bearer {token}` 请求头
- 从 `uni.getStorageSync('access_token')` 获取 token
- Mock 模式下自动延迟 500ms

### Mock 数据系统

`src/mock/index.ts` - 拦截 `uni.request` 实现本地 Mock：
- 初始化时注册 mock 数据到 `mockStore`
- 请求匹配到已注册的 key 时，直接返回 mock 数据
- 通过 `src/config.ts` 的 `isMock` 开关控制

### 样式系统

- **全局变量**: `src/styles/variable.less` - 定义颜色、字体大小、间距等
- **全局样式**: `src/styles/index.less` - 全局公共样式
- **uni.scss**: `src/uni.scss` - uni-app 全局样式变量

### 自定义导航栏

所有页面使用自定义导航栏（`navigationStyle: "custom"`），需要在页面中：
1. 获取系统信息：`uni.getSystemInfoSync()`
2. 获取胶囊按钮信息：`uni.getMenuButtonBoundingClientRect()`（微信小程序）
3. 计算导航栏高度并设置 padding

### 关键文件

| 文件 | 说明 |
|------|------|
| `src/App.vue` | 根组件，初始化全局状态、事件总线、WebSocket |
| `src/main.ts` | 应用入口，引入 TDesign 样式 |
| `src/config.ts` | 配置文件（isMock、baseUrl） |
| `src/pages.json` | 页面路由和 easycom 配置 |
| `src/manifest.json` | 应用配置（AppID、权限等） |

### 平台条件编译

使用 `#ifdef` / `#ifndef` 注释进行条件编译：

```vue
// #ifdef MP-WEIXIN
const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
// #endif

// #ifndef MP-WEIXIN
navBarHeight.value = 44;
// #endif
```
