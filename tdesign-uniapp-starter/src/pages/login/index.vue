<template>
  <!-- <t-navbar left-arrow placeholder @left-click="goBack" /> -->

  <view class="login-page">
    <!-- 微信登录区域 -->
    <view class="wechat-login">
      <view class="wechat-icon">
        <t-icon name="logo-wechat-stroke" size="120rpx" color="#07c160" />
      </view>
      <view class="wechat-tips">
        <text>点击按钮进行微信授权登录</text>
        <text class="sub-tips">首次登录需绑定手机号</text>
      </view>

      <!-- #ifdef MP-WEIXIN -->
      <t-button
        class="wechat-auth-btn"
        open-type="getPhoneNumber"
        @getphonenumber="onGetPhoneNumber"
        block
      >
        <t-icon name="logo-wechat-stroke" size="40rpx" />
        <text>微信一键登录</text>
      </t-button>
      <!-- #endif -->

      <!-- #ifndef MP-WEIXIN -->
      <t-button class="wechat-auth-btn" @click="wechatLoginH5" block>
        <t-icon name="logo-wechat-stroke" size="40rpx" />
        <text>微信登录</text>
      </t-button>
      <!-- #endif -->
    </view>

    <!-- 其他登录方式 -->
    <view class="other-login">
      <text class="text-btn" @click="goPasswordLogin">账号密码登录</text>
    </view>
  </view>

  <!-- 绑定手机号弹窗（首次微信登录） -->
  <t-popup v-model:visible="showBindPhone" placement="center">
    <view class="bind-phone-popup">
      <view class="popup-title">绑定手机号</view>
      <view class="popup-desc">为了您的账号安全，请绑定手机号</view>

      <t-input
        v-model:value="bindForm.phone"
        placeholder="请输入手机号"
        type="number"
        class="bind-input"
      />

      <t-input
        v-model:value="bindForm.password"
        placeholder="请设置登录密码"
        type="password"
        class="bind-input"
      />

      <view class="popup-tips">绑定后可用手机号+密码登录</view>

      <t-button
        class="custom-login-btn bind-btn"
        :disabled="!canBind || isBinding"
        :loading="isBinding"
        block
        @click="handleBindPhone"
      >
        {{ isBinding ? '绑定中...' : '确认绑定' }}
      </t-button>
    </view>
  </t-popup>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  loginByWechat,
  bindPhone as bindPhoneApi,
} from '@/api/auth';

const isLoading = ref(false);
const isBinding = ref(false);
const showBindPhone = ref(false);

// 微信登录临时数据
const wxLoginData = ref({
  code: '',
  encryptedData: '',
  iv: '',
});

// 绑定手机号表单
const bindForm = ref({
  phone: '',
  password: '',
});

// 是否可以绑定手机号
const canBind = computed(() => {
  const phoneRegex = /^[1][3-9][0-9]{9}$/;
  const hasPhone = phoneRegex.test(bindForm.value.phone);
  const hasPassword = bindForm.value.password.length >= 6;
  return hasPhone && hasPassword && !isBinding.value;
});

// 返回上一页
const goBack = () => {
  uni.navigateBack({
    fail: () => {
      uni.switchTab({ url: '/pages/home/index' });
    },
  });
};

// 跳转到账号密码登录
const goPasswordLogin = () => {
  uni.navigateTo({
    url: '/pages/login/password',
  });
};

// 微信登录获取手机号回调（小程序）
const onGetPhoneNumber = (e: any) => {
  if (e.detail.errMsg === 'getPhoneNumber:ok') {
    // 获取到手机号加密数据
    wxLoginData.value.encryptedData = e.detail.encryptedData;
    wxLoginData.value.iv = e.detail.iv;

    // 先获取微信登录 code
    uni.login({
      provider: 'weixin',
      success: (loginRes) => {
        wxLoginData.value.code = loginRes.code;
        handleWechatLogin();
      },
      fail: () => {
        uni.showToast({ title: '微信登录失败', icon: 'none' });
      },
    });
  } else {
    uni.showToast({ title: '需要授权手机号才能登录', icon: 'none' });
  }
};

// H5 环境微信登录
const wechatLoginH5 = () => {
  uni.showToast({ title: 'H5环境请使用账号密码登录', icon: 'none' });
  setTimeout(() => {
    goPasswordLogin();
  }, 1500);
};

// 处理微信登录
const handleWechatLogin = async () => {
  isLoading.value = true;
  try {
    // 使用真实 API 或本地模拟
    const res: any = await loginByWechat({
      code: wxLoginData.value.code,
      encryptedData: wxLoginData.value.encryptedData,
      iv: wxLoginData.value.iv,
    }).catch(() => {
      // 如果接口不存在，使用本地模拟
      return mockWechatLogin({
        code: wxLoginData.value.code,
        encryptedData: wxLoginData.value.encryptedData,
        iv: wxLoginData.value.iv,
      });
    });

    const data = res.data || res;

    if (res.success || res.code === 200) {
      uni.setStorageSync('access_token', data.token || res.token);
      uni.setStorageSync('user_info', data.userInfo || res.userInfo);

      // 判断是否需要绑定手机号
      if (data.needBindPhone) {
        showBindPhone.value = true;
      } else {
        uni.showToast({ title: '登录成功', icon: 'success' });
        setTimeout(() => {
          uni.switchTab({ url: '/pages/home/index' });
        }, 1500);
      }
    } else {
      uni.showToast({ title: res.message || '登录失败', icon: 'none' });
    }
  } catch (error) {
    uni.showToast({ title: '登录失败，请稍后重试', icon: 'none' });
  } finally {
    isLoading.value = false;
  }
};

// 绑定手机号
const handleBindPhone = async () => {
  if (!canBind.value) return;

  isBinding.value = true;
  try {
    // 使用真实 API 或本地模拟
    const res: any = await bindPhoneApi({
      phone: bindForm.value.phone,
      password: bindForm.value.password,
    }).catch(() => {
      // 如果接口不存在，使用本地模拟
      return mockBindPhone({
        phone: bindForm.value.phone,
        password: bindForm.value.password,
      });
    });

    const data = res.data || res;

    if (res.success || res.code === 200) {
      uni.setStorageSync('access_token', data.token || res.token);
      uni.setStorageSync('user_info', data.userInfo || res.userInfo);

      showBindPhone.value = false;
      uni.showToast({ title: '绑定成功', icon: 'success' });

      setTimeout(() => {
        uni.switchTab({ url: '/pages/home/index' });
      }, 1500);
    } else {
      uni.showToast({ title: res.message || '绑定失败', icon: 'none' });
    }
  } catch (error) {
    uni.showToast({ title: '绑定失败，请稍后重试', icon: 'none' });
  } finally {
    isBinding.value = false;
  }
};

// ========== 本地模拟接口（后续替换为真实接口）==========

// 模拟微信登录
const mockWechatLogin = (data: { code: string; encryptedData: string; iv: string }): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟首次登录需要绑定手机号
      const isFirstLogin = !uni.getStorageSync('has_logged_before');

      resolve({
        success: true,
        data: {
          token: 'mock_wx_token_' + Date.now(),
          needBindPhone: isFirstLogin,
          userInfo: {
            id: 'wx_' + Date.now(),
            phone: '',
            nickname: '微信用户',
            avatar: '',
            role: 'user',
          },
        },
      });

      uni.setStorageSync('has_logged_before', true);
    }, 800);
  });
};

// 模拟绑定手机号
const mockBindPhone = (data: { phone: string; password: string }): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        success: true,
        data: {
          token: 'mock_token_bind_' + Date.now(),
          userInfo: {
            id: 'wx_' + Date.now(),
            phone: data.phone,
            nickname: '微信用户',
            avatar: '',
            role: 'user',
          },
        },
      });
    }, 800);
  });
};
</script>

<style lang="less" scoped>
.login-page {
  padding: 0 48rpx;
  height: 100vh;
  background: linear-gradient(180deg, #f0f5ff 0%, #ffffff 60%);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 微信登录区域
.wechat-login {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  .wechat-icon {
    width: 160rpx;
    height: 160rpx;
    background: #f0fff5;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 48rpx;
  }

  .wechat-tips {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 80rpx;

    text {
      font-size: 30rpx;
      color: rgba(0, 0, 0, 0.8);
    }

    .sub-tips {
      font-size: 26rpx;
      color: rgba(0, 0, 0, 0.5);
      margin-top: 16rpx;
    }
  }

  // 微信小程序授权按钮
  .wechat-auth-btn {
    --td-button-border-radius: 48rpx;
    --td-button-font-weight: 500;

    :deep(.t-button) {
      height: 96rpx;
      font-size: 32rpx;
      background: linear-gradient(135deg, #07c160 0%, #05a350 100%) !important;
      border-color: transparent !important;
      box-shadow: 0 8rpx 24rpx rgba(7, 193, 96, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0;

      text {
        margin-left: 16rpx;
      }
    }

    :deep(.t-button):active {
      opacity: 0.9;
      transform: scale(0.98);
    }
  }
}

// 其他登录方式
.other-login {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 60rpx;
  padding-top: 40rpx;

  .text-btn {
    font-size: 28rpx;
    color: #0052d9;
    padding: 20rpx 40rpx;

    &:active {
      opacity: 0.7;
    }
  }
}

// 绑定手机号弹窗
.bind-phone-popup {
  width: 560rpx;
  padding: 48rpx;
  background: #fff;
  border-radius: 24rpx;

  .popup-title {
    font-size: 36rpx;
    font-weight: 600;
    color: rgba(0, 0, 0, 0.9);
    text-align: center;
    margin-bottom: 16rpx;
  }

  .popup-desc {
    font-size: 28rpx;
    color: rgba(0, 0, 0, 0.6);
    text-align: center;
    margin-bottom: 48rpx;
  }

  .bind-input {
    margin-bottom: 32rpx;
  }

  .bind-btn {
    height: 88rpx !important;
    line-height: 88rpx !important;
    font-size: 30rpx !important;
  }

  .popup-tips {
    font-size: 24rpx;
    color: rgba(0, 0, 0, 0.5);
    margin-bottom: 32rpx;
    text-align: center;
  }
}

// 通用按钮样式
.custom-login-btn {
  --td-button-border-radius: 48rpx;
  --td-button-font-weight: 500;

  :deep(.t-button) {
    height: 96rpx;
    font-size: 32rpx;
    background: linear-gradient(135deg, #0052d9 0%, #0046bb 100%) !important;
    border-color: transparent !important;
    box-shadow: 0 8rpx 24rpx rgba(0, 82, 217, 0.3);
  }

  &:not(.t-button--disabled):deep(.t-button):active {
    opacity: 0.9;
    transform: scale(0.98);
  }

  :deep(.t-button--disabled) {
    background: #bbd3fb !important;
    box-shadow: none !important;
    color: #fff !important;
  }
}
</style>
