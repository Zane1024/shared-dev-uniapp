<template>
  <view class="custom-tab-bar">
    <view class="tab-bar-inner">
      <!-- 左侧 tab -->
      <view
        class="tab-item left"
        :class="{ active: value === 'home' }"
        @click="switchTab('home')"
      >
        <t-tab-bar-item icon="home" value="home">首页</t-tab-bar-item>
      </view>

      <!-- 中间凸起按钮 -->
      <view class="tab-item center">
        <view class="center-btn" @click="handleCenterClick">
          <view class="icon-wrapper">
            <!-- 使用本地 SVG 图标文件 -->
            <image class="scan-icon-image" src="/static/icons/scan.svg" mode="aspectFit" />
          </view>
        </view>
        <text class="center-text">扫一扫</text>
      </view>

      <!-- 右侧 tab -->
      <view
        class="tab-item right"
        :class="{ active: value === 'my' }"
        @click="switchTab('my')"
      >
        <t-tab-bar-item icon="user" value="my">我的</t-tab-bar-item>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const value = ref('');
const unreadNum = ref(0);

// 使用挂载在 uni 上的全局数据，解决页面切换后 inject 失效的问题
const globalData = (uni as any).$globalData;
const eventBus = (uni as any).$eventBus;

// 获取当前页面对应的 tab 值
const getCurrentTabValue = () => {
  const pages = getCurrentPages();
  const curPage = pages[pages.length - 1];
  if (curPage) {
    const route = (curPage as any).route || '';
    const nameRe = /pages\/(\w+)\/index/.exec(route);
    if (nameRe && nameRe[1]) {
      return nameRe[1];
    }
  }
  return '';
};

// 同步状态
const syncState = () => {
  // 同步当前 tab 值
  value.value = getCurrentTabValue();

  // 同步全局未读消息数量
  if (globalData) {
    unreadNum.value = globalData.unreadNum || 0;
  }
};

onMounted(() => {
  syncState();
});

// 监听未读消息数量变化
eventBus?.on('unread-num-change', (num: number) => {
  unreadNum.value = num;
});

const switchTab = (val: string) => {
  // 如果点击的是当前页面，不做任何操作
  if (val === value.value) {
    return;
  }

  // 使用 redirectTo 切换页面（关闭当前页后跳转，避免页面栈累积）
  uni.redirectTo({
    url: `/pages/${val}/index`,
  });
};

const handleCenterClick = () => {
  // 中间按钮点击事件，可自定义跳转
  uni.redirectTo({
    url: '/pages/release/index',
  });
};
</script>

<style lang="less" scoped>
@import '@/styles/variable.less';

.custom-tab-bar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
  background-color: #fff;
  padding-bottom: env(safe-area-inset-bottom);
  box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.05);
}

.tab-bar-inner {
  display: flex;
  align-items: center;
  justify-content: center;
  height: @tab-bar-height;
  padding: 0 60rpx;
  position: relative;
}

.tab-item {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;

  &.left,
  &.right {
    :deep(.t-tab-bar-item) {
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
  }

  &.center {
    position: relative;
    z-index: 10;
    flex: 0 0 140rpx;
    display: flex;
    flex-direction: column;
    align-items: center;

    .center-btn {
      width: 88rpx;
      height: 88rpx;
      border-radius: 50%;
      background: #fff;
      border: 10rpx solid #0052d4;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6rpx;
      box-shadow: 0 10rpx 30rpx rgba(0, 82, 212, 0.35);

      .icon-wrapper {
        width: 80rpx;
        height: 80rpx;
        border-radius: 50%;
        background: linear-gradient(135deg, #0052d4, #4364f7);
        display: flex;
        align-items: center;
        justify-content: center;

        .scan-icon-image {
          width: 48rpx;
          height: 48rpx;
        }
      }

      &:active {
        transform: scale(0.95);
        box-shadow: 0 6rpx 16rpx rgba(0, 82, 212, 0.25);
      }
    }

    .center-text {
      font-size: 22rpx;
      color: #0052d4;
      font-weight: 500;
      margin-bottom: 70rpx;
    }
  }

  &.left {
    justify-content: flex-start;
  }

  &.right {
    justify-content: flex-end;
  }
}
</style>
