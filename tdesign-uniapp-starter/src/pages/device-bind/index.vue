<template>
  <view class="device-bind-page">
    <view
      class="custom-nav-bar-fixed"
      :style="{ height: navBarHeight + 'px', paddingTop: statusBarHeight + 'px' }"
    >
      <view class="nav-bar-content">
        <view class="nav-left">
          <t-icon name="chevron-left" size="22" color="#fff" @click="goBack" />
        </view>
        <text class="nav-title">设备注册规范阅览</text>
        <view class="nav-right"></view>
      </view>
    </view>

    <view class="nav-bar-placeholder" :style="{ height: (navBarHeight + statusBarHeight) + 'px' }"></view>

    <scroll-view class="scroll-main" scroll-y :show-scrollbar="false">
      <view class="blue-header">
        <view class="banner-top">
          <view class="meg-box">
            <t-icon name="notification" size="24" color="#ff9f43" />
          </view>
          <text class="banner-title">设备准入合法规范</text>
        </view>
        <text class="banner-desc">
          用户再注册设备时，不得注册违反国家相关法律法规以及平台的相关设备。如发现交易异常，可能被采取相关措施
        </text>
      </view>

      <view class="content-wrap">
        <view class="section-card">
          <text class="section-title">什么设备不能注册</text>
          <view class="card-row">
            <view v-for="item in forbiddenItems" :key="item.label" class="mini-card mini-card--danger">
              <t-icon :name="item.icon" size="28" color="#e64545" />
              <text class="mini-card-label">{{ item.label }}</text>
            </view>
          </view>
        </view>

        <view class="section-card">
          <text class="section-title section-title--wrap">根据用户违规的具体情况及严重程度进行处理</text>
          <view class="card-row">
            <view v-for="item in penaltyItems" :key="item.label" class="mini-card">
              <t-icon :name="item.icon" size="28" :color="item.iconColor" />
              <text class="mini-card-label">{{ item.label }}</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>

    <view class="footer-safe">
      <view class="agree-row">
        <t-checkbox
          v-model:value="agreed"
          borderless
          class="agree-checkbox"
          custom-style="padding: 0; align-items: flex-start; --td-checkbox-icon-size: 40rpx;"
        />
        <text class="agree-text">我清楚了，确定接入的设备都符合相关法律法规</text>
      </view>
      <view class="cta-btn" @click="onScanRegister">
        <text class="cta-text">扫码注册设备</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useSystemInfo } from '@/utils/system';
import { scanCode } from '@/utils/navigate';

const { statusBarHeight, navBarHeight } = useSystemInfo();

const agreed = ref(false);

const forbiddenItems = [
  { label: '博彩类', icon: 'chart' },
  { label: '套现类', icon: 'discount' },
  { label: '违规类', icon: 'error-circle' },
] as const;

const penaltyItems = [
  { label: '限制交易', icon: 'creditcard', iconColor: '#1677ff' },
  { label: '封锁账号', icon: 'lock-on', iconColor: '#1677ff' },
  { label: '移交国家机关', icon: 'location', iconColor: '#e64545' },
] as const;

const goBack = () => {
  uni.navigateBack();
};

const onScanRegister = async () => {
  if (!agreed.value) {
    uni.showToast({
      title: '请先阅读并勾选确认',
      icon: 'none',
    });
    return;
  }
  try {
    const res = await scanCode();
    uni.showModal({
      title: '扫描成功',
      content: `设备码: ${res.result}`,
      confirmText: '确认绑定',
      success: (modalRes) => {
        if (modalRes.confirm) {
          uni.showToast({
            title: '绑定成功',
            icon: 'success',
          });
        }
      },
    });
  } catch {
    // 扫码取消
  }
};
</script>

<style lang="less" scoped>
.device-bind-page {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #eff6ff;
}

.custom-nav-bar-fixed {
  background: #1677ff;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.nav-bar-content {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  box-sizing: border-box;
}

.nav-left,
.nav-right {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-title {
  flex: 1;
  text-align: center;
  font-size: 17px;
  font-weight: 600;
  color: #fff;
}

.nav-bar-placeholder {
  flex-shrink: 0;
}

.scroll-main {
  flex: 1;
  height: 0;
  min-height: 0;
}

.blue-header {
  background: #1677ff;
  padding: 12px 16px 28px;
}

.banner-top {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 12px;
}

.meg-box {
  width: 88px;
  height: 88px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.22);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.banner-title {
  font-size: 17px;
  font-weight: 600;
  color: #fff;
  line-height: 1.4;
  flex: 1;
}

.banner-desc {
  display: block;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.95);
  line-height: 1.6;
}

.content-wrap {
  padding: 12px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-card {
  background: #e8f4ff;
  border-radius: 14px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: #262626;
}

.section-title--wrap {
  line-height: 1.35;
}

.card-row {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 8px;
}

.mini-card {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 10px;
  padding: 14px 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
}

.mini-card--danger {
  /* same as mini-card */
}

.mini-card-label {
  font-size: 12px;
  color: #333;
  text-align: center;
  line-height: 1.3;
}

.footer-safe {
  flex-shrink: 0;
  padding: 0 12px 28px;
  padding-bottom: calc(28px + env(safe-area-inset-bottom));
  background: #eff6ff;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.agree-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 10px;
}

.agree-checkbox {
  flex-shrink: 0;
  margin-top: 2px;
}

.agree-text {
  flex: 1;
  font-size: 13px;
  color: #595959;
  line-height: 1.45;
}

.cta-btn {
  height: 50px;
  border-radius: 25px;
  background: #1677ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cta-text {
  font-size: 16px;
  font-weight: 600;
  color: #fff;
}
</style>
