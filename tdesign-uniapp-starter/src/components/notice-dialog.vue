<template>
  <t-popup v-model:visible="showPopup" placement="center">
    <view class="notice-dialog">
      <view class="dialog-header">
        <t-icon name="notification" size="24" color="#ff6b6b" />
        <text class="dialog-title">{{ title }}</text>
      </view>
      <view class="dialog-content">
        <text class="notice-content-text">{{ content }}</text>
      </view>
      <view class="dialog-footer">
        <t-button theme="primary" size="medium" block @click="showPopup = false">
          {{ confirmText }}
        </t-button>
      </view>
    </view>
  </t-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  visible: boolean;
  title?: string;
  content: string;
  confirmText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '公告详情',
  confirmText: '我知道了',
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
}>();

const showPopup = ref(props.visible);

watch(
  () => props.visible,
  (val) => {
    showPopup.value = val;
  },
);

watch(showPopup, (val) => {
  emit('update:visible', val);
});
</script>

<style lang="less" scoped>
.notice-dialog {
  background: #fff;
  border-radius: 24rpx;
  width: 560rpx;
  padding: 48rpx 40rpx;

  .dialog-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 32rpx;

    .dialog-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #000000e6;
    }
  }

  .dialog-content {
    margin-bottom: 40rpx;

    .notice-content-text {
      font-size: 28rpx;
      color: #000000e6;
      line-height: 1.6;
      text-align: center;
      word-break: break-all;
    }
  }

  .dialog-footer {
    :deep(.t-button) {
      border-radius: 12rpx;
    }
  }
}
</style>
