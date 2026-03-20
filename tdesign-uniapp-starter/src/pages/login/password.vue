<template>
<!--  <t-navbar left-arrow placeholder @left-click="goBack">
    <template #center>账号密码登录</template>
  </t-navbar> -->

  <view class="password-login-page">
    <!-- Logo 区域 -->
    <view class="login-header">
      <view class="logo">
        <t-icon name="shop" size="72rpx" color="#0052d9" />
      </view>
      <view class="title">共享设备管理平台</view>
    </view>

    <!-- 账号密码登录表单 -->
    <view class="login-form">
      <!-- 账号输入框 -->
      <t-input
        v-model:value="form.account"
        placeholder="请输入手机号"
        type="number"
        maxlength="11"
        clearable
        prefix-icon="user"
        class="login-input"
        @change="onAccountChange"
      />

      <!-- 密码输入框 -->
      <t-input
        v-model:value="form.password"
        placeholder="请输入密码"
        :type="showPassword ? 'text' : 'password'"
        prefix-icon="lock-on"
        class="login-input"
        @change="onPasswordChange"
      >
        <template #suffix-icon>
          <view class="password-toggle" @click="togglePassword">
            <text v-if="showPassword" class="toggle-text">ABC</text>
            <text v-else class="toggle-text">***</text>
          </view>
        </template>
      </t-input>

      <!-- 记住我和忘记密码 -->
      <view class="form-options">
        <t-checkbox v-model:value="rememberMe" label="记住我" class="agreement-checkbox" />
        <text class="forgot-link" @click="forgotPassword">忘记密码？</text>
      </view>
    </view>

    <!-- 协议同意 -->
    <view class="agreement-section">
      <t-checkbox v-model:value="agreed" class="agreement-checkbox">
        <template #label>
          <view class="agreement-text">
            <text>我已阅读并同意</text>
            <text class="link" @click.stop="showUserAgreement">《用户协议》</text>
            <text>和</text>
            <text class="link" @click.stop="showPrivacyPolicy">《隐私政策》</text>
          </view>
        </template>
      </t-checkbox>
    </view>

    <!-- 登录按钮 -->
    <t-button
      class="login-btn"
      :disabled="!canSubmit || isLoading"
      :loading="isLoading"
      block
      @click="handleLogin"
    >
      {{ isLoading ? '登录中...' : '登录' }}
    </t-button>

    <!-- 其他登录方式 -->
    <view class="other-login">
      <text class="text-btn" @click="goWechatLogin">微信授权登录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { loginByPassword } from '@/api/auth';

const isLoading = ref(false);
const agreed = ref(false);
const rememberMe = ref(false);
const showPassword = ref(false);

// 账号密码表单
const form = ref({
  account: '',
  password: '',
});

// 账号密码不为空即可点击
const canSubmit = computed(() => {
  const hasAccount = form.value.account.length > 0;
  const hasPassword = form.value.password.length > 0;
  return hasAccount && hasPassword && !isLoading.value;
});

// 返回上一页
const goBack = () => {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/pages/login/index' });
    },
  });
};

// 跳转到微信登录
const goWechatLogin = () => {
  uni.navigateBack({
    fail: () => {
      uni.redirectTo({ url: '/pages/login/index' });
    },
  });
};

// 账号输入
const onAccountChange = (e: any) => {
  let value = e?.value || e;
  // 限制11位
  if (value.length > 11) {
    value = value.slice(0, 11);
  }
  form.value.account = value;
};

// 密码输入
const onPasswordChange = (e: any) => {
  form.value.password = e?.value || e;
};

// 切换密码显示
const togglePassword = () => {
  showPassword.value = !showPassword.value;
};

// 切换记住我
const toggleRemember = () => {
  rememberMe.value = !rememberMe.value;
};

// 切换协议同意
const toggleAgree = () => {
  agreed.value = !agreed.value;
};

// 账号密码登录
const handleLogin = async () => {
  if (!canSubmit.value) return;

  isLoading.value = true;
  try {
    const res: any = await loginByPassword({
      account: form.value.account,
      password: form.value.password,
    }).catch(() => {
      return mockLogin({
        account: form.value.account,
        password: form.value.password,
      });
    });

    if (res.success || res.code === 200) {
      const data = res.data || res;
      uni.setStorageSync('access_token', data.token || res.token);
      uni.setStorageSync('user_info', data.userInfo || res.userInfo);

      if (rememberMe.value) {
        uni.setStorageSync('remember_account', form.value.account);
      }

      uni.showToast({ title: '登录成功', icon: 'success' });
      setTimeout(() => {
        uni.switchTab({ url: '/pages/home/index' });
      }, 1500);
    } else {
      uni.showToast({ title: res.message || '登录失败', icon: 'none' });
    }
  } catch (error) {
    uni.showToast({ title: '登录失败，请稍后重试', icon: 'none' });
  } finally {
    isLoading.value = false;
  }
};

// 忘记密码
const forgotPassword = () => {
  uni.showToast({ title: '功能开发中', icon: 'none' });
};

// 显示用户协议
const showUserAgreement = () => {
  uni.showModal({
    title: '用户协议',
    content: '这里是用户协议内容...',
    showCancel: false,
  });
};

// 显示隐私政策
const showPrivacyPolicy = () => {
  uni.showModal({
    title: '隐私政策',
    content: '这里是隐私政策内容...',
    showCancel: false,
  });
};

// 模拟登录
const mockLogin = (data: { account: string; password: string }): Promise<any> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (data.password.length < 6) {
        resolve({ success: false, message: '密码错误' });
        return;
      }
      resolve({
        success: true,
        data: {
          token: 'mock_token_' + Date.now(),
          userInfo: {
            id: '10001',
            phone: data.account,
            nickname: '用户' + data.account.slice(-4),
            avatar: '',
            role: 'user',
          },
        },
      });
    }, 800);
  });
};

// 初始化记住的账号
const initRememberedAccount = () => {
  const remembered = uni.getStorageSync('remember_account');
  if (remembered) {
    form.value.account = remembered;
    rememberMe.value = true;
  }
};

initRememberedAccount();
</script>

<style lang="less" scoped>
.password-login-page {
  padding: 0 48rpx;
  min-height: 100vh;
  background: linear-gradient(180deg, #f0f5ff 0%, #ffffff 50%);
  box-sizing: border-box;
}

// 头部区域
.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 120px;
  padding-bottom: 100rpx; 

  .logo {
    width: 120rpx;
    height: 120rpx;
    background: linear-gradient(135deg, #e6f0ff 0%, #f0f7ff 100%);
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 24rpx;
    box-shadow: 0 8rpx 24rpx rgba(0, 82, 217, 0.1);
  }

  .title {
    font-size: 36rpx;
    font-weight: 600;
	margin-top: 10px;
    color: rgba(0, 0, 0, 0.9);
  }
}

// 登录表单
.login-form {
  // t-input 样式调整
  

  // 密码切换按钮
  .password-toggle {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8rpx;

    .toggle-text {
      font-size: 24rpx;
      font-weight: 500;
      color: #0052d9;
      letter-spacing: 2rpx;
    }
  }

  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16rpx;
    margin-bottom: 8rpx;
 

    .forgot-link {
      font-size: 28rpx;
      color: #0052d9;
    }
  }
}

// 协议区域
.agreement-section  {
  margin-bottom: 48rpx;
  margin-top: 60rpx;

  :deep(.agreement-checkbox) {
    --td-checkbox-icon-size: 11rpx;
    --td-checkbox-label-font-size: 15rpx;
    --td-checkbox-label-color: rgba(0, 0, 0, 0.5);
    align-items: flex-start;
    border-bottom: none !important;
    padding-bottom: 0 !important;
    margin-bottom: 0 !important;

    &::after {
      display: none !important;
    }

    .t-checkbox__content-wrap {
      border-bottom: none !important;
      padding-bottom: 0 !important;
    }

    .t-checkbox__label {
      margin-left: 12rpx;
    }

    .t-cell {
      border-bottom: none !important;

      &::after {
        display: none !important;
      }
    }
  }

  .agreement-text {
    font-size: 28rpx;
    color: rgba(0, 0, 0, 0.5);
    line-height: 1.6;
    flex: 1;

    .link {
      color: #0052d9;
    }
  }
}

// 登录按钮
.login-btn {
  --td-button-border-radius: 48rpx;
  --td-button-font-weight: 500;

  margin-bottom: 32rpx;

  :deep(.t-button) {
    height: 96rpx;
    font-size: 32rpx;
    background: linear-gradient(135deg, #003bb3 0%, #003399 100%) !important;
    border-color: transparent !important;
    box-shadow: 0 8rpx 24rpx rgba(0, 82, 217, 0.4);
  }

  &:not(:deep(.t-button--disabled)):active {
    opacity: 0.9;
    transform: scale(0.98);
  }

  :deep(.t-button--disabled) {
    background: #e0e0e0 !important;
    box-shadow: none !important;
    color: #999 !important;
  }
}

// 其他登录方式
.other-login {
  display: flex;
  justify-content: center;
  align-items: center;
  padding-bottom: 60rpx;

  .text-btn {
    font-size: 28rpx;
    color: #07c160;
    padding: 20rpx 40rpx;

    &:active {
      opacity: 0.7;
    }
  }
}
</style>