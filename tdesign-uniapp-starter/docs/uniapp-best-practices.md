# uni-app 最佳实践

本文档基于当前项目（tdesign-uniapp-starter）与 uni-app 官方约定整理，便于团队统一规范。UI 组件以 **@tdesign/uniapp** 为主，可通过 **Context7** 查询最新文档进行导入与用法确认。

---

## 一、项目与目录结构

### 1.1 推荐目录结构

```
src/
├── api/              # 接口封装（如 request.ts）
├── components/       # 公共组件
├── config.ts         # 全局配置（baseUrl、isMock 等）
├── pages/            # 页面（主包 + 分包）
├── static/           # 静态资源（图片、字体）
├── App.vue
├── main.js / main.ts
├── pages.json        # 路由与窗口配置
├── manifest.json     # 应用配置与平台配置
└── uni.scss          # 全局样式变量
```

### 1.2 分包策略（最佳实践）

- **主包**：只放首页、Tab 页等首屏必要页面，控制体积以加快启动。
- **分包**：按业务模块划分（如 `pages/login`、`pages/chat`、`pages/release`），在 `pages.json` 的 `subPackages` 中配置。
- 分包根路径示例：`"root": "pages/login"`，下挂 `pages: [{ "path": "login", ... }]`。

参考：[pages.json](../src/pages.json) 中的 `pages` 与 `subPackages` 配置。

---

## 二、页面与路由

### 2.1 新增页面步骤

1. 在 `src/pages/<模块>/<页面名>.vue` 新建页面组件。
2. 在 `pages.json` 的 `pages` 或对应 `subPackages[].pages` 中增加一项：
   - `path`：相对路径，不含扩展名，如 `"pages/home/index"`。
   - `style`：可设 `navigationStyle: "custom"` 做自定义导航栏。

### 2.2 页面生命周期（组合式 API）

- 从 `@dcloudio/uni-app` 引入页面生命周期，不要与 Vue 的 `onMounted` 等混用做“首次进入”逻辑：

```ts
import { onLoad, onShow, onUnload } from '@dcloudio/uni-app';

// 页面参数、首次加载
onLoad((options) => {
  // options 来自 url 查询或 navigateTo 的 query
});

// 每次显示（含从其他页返回）
onShow(() => {});

// 页面卸载时清理（事件、定时器等）
onUnload(() => {
  uni.$off('onChatMessage', handleChatMessage);
});
```

### 2.3 路由跳转

- `uni.navigateTo`：保留当前页，可返回。
- `uni.redirectTo`：关闭当前页再跳转（如 Tab 切换）。
- `uni.reLaunch`：关闭所有页面并打开新页（如登录后进首页）。
- 路径使用**绝对路径**：`/pages/home/index`，不要省略开头的 `/`。

---

## 三、网络与请求

### 3.1 统一封装 request

- 在 `api/request.ts` 中封装 `uni.request`，统一：
  - baseUrl（从 config 读取）
  - header（如 `content-type`、`Authorization`）
  - token：从 `uni.getStorageSync('access_token')` 读取并写入 header。
- 返回 Promise，便于 async/await；在封装层统一处理 200 与错误，页面只关心业务数据。

参考：[api/request.ts](../src/api/request.ts)。

### 3.2 并发请求

- 首屏多接口时用 `Promise.all` 并发，减少白屏时间：

```ts
const [cardRes, swiperRes] = await Promise.all([
  request('/home/cards'),
  request('/home/swipers'),
]);
```

---

## 四、静态资源

### 4.1 路径规范

- 资源放在 `src/static/`，引用时使用**绝对路径**：`/static/xxx.png`。
- 不要使用 `@/static/` 或相对路径引用静态资源，避免部分平台解析不一致。

### 4.2 图片

- 按模块分子目录（如 `static/home/`、`static/chat/`），命名清晰。
- 大图考虑压缩与合适尺寸，减少包体与内存。

---

## 五、样式与主题

### 5.1 全局变量

- 在 `uni.scss` 中定义颜色、字号等变量，各组件无需 import 即可使用（需使用 scss）。
- 修改 `$uni-color-primary` 等即可统一主题色。

### 5.2 单位与适配

- 使用 `rpx` 做宽度/高度适配，重要布局避免仅用 `px`。
- 设计稿按 750 宽度时，可直接按设计稿数值写 rpx。

### 5.3 自定义导航栏

- 在 `pages.json` 的页面 `style` 中设置 `navigationStyle: "custom"`，再在页面内使用公共的 `nav-bar` 等组件，保证多端表现一致。

---

## 六、跨页面通信与全局事件

### 6.1 事件总线

- 使用 `uni.$emit`、`uni.$on`、`uni.$off` 做跨页面或跨组件通信。
- 在 `onUnload` 中务必 `uni.$off` 已注册的监听，避免重复注册与内存泄漏。

示例（与 [chat/index.vue](../src/pages/chat/index.vue) 一致）：

```ts
onLoad(() => {
  uni.$on('updateChat', update);
  uni.$on('onChatMessage', handleChatMessage);
});

onUnload(() => {
  uni.$off('updateChat', update);
  uni.$off('onChatMessage', handleChatMessage);
});
```

### 6.2 登录态与存储

- Token 等用 `uni.setStorageSync` / `uni.getStorageSync` 存取。
- 登录成功后写入 token，再 `uni.reLaunch` 到首页；请求层从 storage 读 token 并塞入 header。

---

## 七、平台差异与条件编译

### 7.1 条件编译

- 仅在某平台使用的代码用条件编译包裹，避免其他平台报错或包体变大：

```js
// #ifdef MP-WEIXIN
const updateManager = uni.getUpdateManager();
// ...
// #endif
```

- 常用：`#ifdef H5`、`#ifdef MP-WEIXIN`、`#ifndef H5`（非 H5）。

### 7.2 平台判断

- 运行时判断可用：`uni.getSystemInfoSync().platform` 或 `process.env.UNI_PLATFORM`（构建时）。

---

## 八、UI 组件（TDesign UniApp）

### 8.1 按需使用与 easycom

- 在 `pages.json` 中配置 easycom，使 `t-*` 自动对应 `@tdesign/uniapp` 组件，无需在页面中逐个 import：

```json
"easycom": {
  "custom": {
    "^t-(.*)": "@tdesign/uniapp/$1/$1.vue"
  }
}
```

### 8.2 组件用法

- 以 **TDesign 官方文档**为准；本项目优先使用 **@tdesign/uniapp**。
- 在 Cursor 中配置 **Context7** 后，可通过「用 Context7 查 TDesign Vue / uniapp 的 xxx 组件」获取最新用法与 API。

---

## 九、性能与体验

### 9.1 首屏

- 主包体积控制、分包按需加载、接口并发（Promise.all）已见上文。
- 列表长列表考虑虚拟列表或分页，避免一次渲染过多节点。

### 9.2 交互反馈

- 提交、保存等操作后使用 `uni.showToast` 或 TDesign 的 Message 组件提示。
- 需要用户确认的用 `uni.showModal`。

### 9.3 小程序专项（如微信）

- 在 `manifest.json` 的 `mp-weixin` 中可按需开启 `lazyCodeLoading: "requiredComponents"` 等以优化体积。
- 更新逻辑使用 `uni.getUpdateManager()`，并在 `onLaunch` 中用 `#ifdef MP-WEIXIN` 包裹。

参考：[App.vue](../src/App.vue) 中的更新提示逻辑。

---

## 十、开发与调试

### 10.1 环境与命令

- 开发：`pnpm run dev:h5` 或 `pnpm run dev:mp-weixin`（以 package.json 为准）。
- 构建：`pnpm run build:h5` / `pnpm run build:mp-weixin`。
- 环境变量：`UNI_PLATFORM`、`NODE_ENV` 等由脚本配置，无需在业务代码中写死。

### 10.2 配置与 Mock

- 接口 baseUrl、是否 Mock 等放在 `config.ts`（或 `@/config`），通过环境或构建区分，避免把本地/Mock 地址提交到仓库。

---

## 十一、小结速查

| 类别         | 建议 |
|--------------|------|
| 路由         | 主包精简，其余分包；跳转用绝对路径 |
| 生命周期     | 用 `onLoad`/`onShow`/`onUnload`，并在 onUnload 里解绑事件 |
| 请求         | 统一 request 封装 + token 从 storage 读 |
| 静态资源     | 放 `static/`，引用 `/static/xxx` |
| 样式         | 用 uni.scss 变量，布局多用 rpx |
| 跨页通信     | uni.$emit / $on / $off，记得 $off |
| 平台差异     | 用 #ifdef / #ifndef 条件编译 |
| UI           | @tdesign/uniapp + easycom，查文档用 Context7 |

---

*文档基于当前仓库与 uni-app 通用实践整理，具体 API 以 [uni-app 官方文档](https://uniapp.dcloud.net.cn/) 及 [TDesign UniApp](https://tdesign.tencent.com/miniprogram/overview) 为准。*
