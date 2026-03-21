<template>
  <Nav
    nav-type="title"
    title-text="扫一扫"
  />
  <view class="scan-container">
    <view class="scan-icon">
      <t-icon name="scan" size="120" color="#0052D9" />
    </view>
    <text class="scan-tip">点击下方按钮开始扫码</text>
    <view class="scan-btn">
      <t-button theme="primary" size="large" @click="startScan">开始扫码</t-button>
    </view>
  </view>
  <CustomTabBar />
</template>

<script setup lang="ts">
import Nav from '@/components/nav-bar.vue';
import CustomTabBar from '@/components/custom-tab-bar.vue';

const startScan = () => {
  uni.scanCode({
    success: (res) => {
      console.log('扫码结果:', res);
      uni.showModal({
        title: '扫描成功',
        content: `结果: ${res.result}`,
        confirmText: '确定',
        showCancel: false,
      });
    },
    fail: () => {
      uni.showToast({
        title: '扫码取消',
        icon: 'none',
      });
    },
  });
};
</script>

<style lang="less" scoped>
page {
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
  height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom) + 112rpx);
}

.scan-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 200rpx;
}

.scan-icon {
  margin-bottom: 48rpx;
}

.scan-tip {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 64rpx;
}

.scan-btn {
  width: 600rpx;
}
</style>
