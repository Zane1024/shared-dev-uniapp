import { ref } from 'vue';

/**
 * 获取系统信息（状态栏高度、导航栏高度）
 * 用于自定义导航栏场景
 */
export const useSystemInfo = () => {
  const statusBarHeight = ref(20);
  const navBarHeight = ref(44);

  const initSystemInfo = () => {
    const systemInfo = uni.getSystemInfoSync();
    // #ifdef MP-WEIXIN
    const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
    statusBarHeight.value = systemInfo.statusBarHeight || 20;
    // 导航栏高度 = 状态栏高度 + (胶囊按钮高度 + 上下间距)
    navBarHeight.value = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height;
    // #endif

    // #ifndef MP-WEIXIN
    statusBarHeight.value = systemInfo.statusBarHeight || 20;
    navBarHeight.value = 44;
    // #endif
  };

  // 页面加载时自动初始化
  initSystemInfo();

  return {
    statusBarHeight,
    navBarHeight,
  };
};
