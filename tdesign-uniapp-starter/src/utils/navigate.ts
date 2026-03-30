/**
 * 封装 navigateTo，统一错误处理
 */
export const navigateTo = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    uni.navigateTo({
      url,
      success: () => resolve(),
      fail: (err) => {
        console.error('页面跳转失败:', err);
        uni.showToast({
          title: '页面跳转失败',
          icon: 'none',
        });
        reject(err);
      },
    });
  });
};

/**
 * 封装 redirectTo
 */
export const redirectTo = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    uni.redirectTo({
      url,
      success: () => resolve(),
      fail: (err) => {
        console.error('页面重定向失败:', err);
        reject(err);
      },
    });
  });
};

/**
 * 封装 reLaunch
 */
export const reLaunch = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    uni.reLaunch({
      url,
      success: () => resolve(),
      fail: (err) => {
        console.error('页面关闭并跳转失败:', err);
        reject(err);
      },
    });
  });
};

/**
 * 封装 switchTab
 */
export const switchTab = (url: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    uni.switchTab({
      url,
      success: () => resolve(),
      fail: (err) => {
        console.error('页面切换失败:', err);
        reject(err);
      },
    });
  });
};

/**
 * 封装扫码
 */
export const scanCode = (options?: {
  success?: (res: UniApp.ScanCodeSuccess) => void;
  fail?: () => void;
}): Promise<UniApp.ScanCodeSuccess> => {
  return new Promise((resolve, reject) => {
    uni.scanCode({
      success: (res) => {
        options?.success?.(res);
        resolve(res);
      },
      fail: () => {
        options?.fail?.();
        reject(new Error('扫码取消'));
      },
    });
  });
};
