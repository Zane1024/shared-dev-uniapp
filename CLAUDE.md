# CLAUDE.md

本文档为 Claude Code (claude.ai/code) 在此代码库中工作提供指导。

## 项目概览

这是一个 uni-app 项目（使用 Vue.js 2 的跨平台框架），位于 `my-alpha-project/` 子目录中。项目目标平台包括：H5、微信小程序。它使用官方的 uni-app 工具链，集成了 Vue CLI。

- **包管理器**: `pnpm`（首选），但也可以使用 `npm`。
- **Vue 版本**: 2.x (Vue 2)。
- **构建系统**: 通过 `@vue/cli-service` 使用 Webpack，配合 uni-app 插件。
- **测试**: 使用 Jest 和 `@dcloudio/uni-automator` 进行跨平台自动化测试。

## 常用开发命令

所有命令都应在 `my-alpha-project/` 目录下运行，除非另有说明。

### 安装与设置
```bash
cd my-alpha-project
pnpm install
```

### 开发服务器
- **H5 开发**（默认）：`pnpm run serve` 或 `pnpm run dev:h5`
- **平台特定开发模式**：使用 `pnpm run dev:<platform>`（例如，`dev:mp-weixin` 用于微信小程序）。`--watch` 标志会自动添加。

### 生产环境构建
- **H5 生产构建**：`pnpm run build` 或 `pnpm run build:h5`
- **平台特定构建**：`pnpm run build:<platform>`（参见 `package.json` 中的 scripts 获取所有目标）。

### 测试
- **运行所有测试**：`pnpm test:h5`（H5 环境）或其他平台的 `pnpm test:<platform>`。
- **单个测试文件**：直接使用 `jest` 加上测试文件路径（例如 `npx jest src/...`）。
- **测试环境**：测试依赖 `UNI_PLATFORM` 和 `UNI_OS_NAME` 环境变量。

### 项目信息
- **显示项目信息**：`pnpm run info`

## 项目架构

### 目录结构 (`my-alpha-project/src/`)
- `App.vue` – 根 Vue 组件，包含 uni-app 生命周期钩子。
- `main.js` – Vue 应用程序入口点。
- `pages/` – 每个页面是一个 Vue 单文件组件，位于自己的子目录中。
- `pages.json` – Uni‑app 页面配置（路由、导航栏样式）。
- `manifest.json` – 平台特定设置（应用 ID、权限、SDK 配置）。
- `uni.scss` – 全局 SCSS 变量和混合。
- `static/` – 静态资源（图片、字体等）。

### 配置文件
- `babel.config.js` – 包含 uni‑app 优化的 Babel 配置。
- `jest.config.js` – 用于 uni‑automator 的 Jest 配置。
- `postcss.config.js` – 包含 autoprefixer 和 uni‑app 插件的 PostCSS 配置。
- `package.json` – 包含所有平台特定的构建脚本和依赖项。

### 关键依赖
- `@dcloudio/uni-app` – 核心 uni‑app 运行时。
- `@dcloudio/vue-cli-plugin-uni` – 用于 uni‑app 的 Vue CLI 插件。
- `vue`, `vuex` – Vue 2 和状态管理。
- `flyio` – HTTP 客户端。
- `core-js` –  polyfills。

### UI 组件
- `@tdesign-uniapp` - 优先使用的UI，通过use Context7查询最新文档进行导入使用。

## 开发注意事项

1. **环境变量**
   - `UNI_PLATFORM` 确定目标平台（例如 `h5`、`mp-weixin`）。
   - `NODE_ENV` 用于在开发和生产构建之间切换。
   - 使用 `cross-env` 跨平台设置这些变量（已在 npm 脚本中配置）。

2. **平台特定代码**
   - 在 `.vue` 或 `.js` 文件中使用 `#ifdef` / `#ifndef` 注释进行条件编译，以包含/排除特定平台的代码。

3. **添加页面**
   - 在 `src/pages/<页面名称>/<页面名称>.vue` 中创建新的 `.vue` 文件。
   - 在 `src/pages.json` 中的 `pages` 数组下添加条目。

4. **静态资源**
   - 将图片、字体等放在 `src/static/` 中。使用以 `/static/` 开头的绝对路径引用它们。

5. **全局样式**
   - 编辑 `src/uni.scss` 以设置项目范围的 SCSS 变量和混合。此文件会自动导入到每个组件的样式块中。

6. **测试**
   - 测试文件应命名为 `*.test.js` 或 `*.spec.js`，并与被测试代码放在一起。
   - 测试环境使用 `@dcloudio/uni-automator` 来模拟 uni‑app API。

## 根目录文件

- `folder-alias.json` 和 `private-folder-alias.json` – 空的配置文件（可能用于 IDE 工作区别名）。