<template>
  <t-popup v-model:visible="showPopup" placement="bottom" @update:visible="handleVisibleChange">
    <view class="time-picker">
      <view class="picker-header">
        <text class="picker-title">{{ title }}</text>
        <t-icon name="close" size="20" color="#999" @click="showPopup = false" />
      </view>
      <view class="picker-options">
        <view
          v-for="option in options"
          :key="option.value"
          class="picker-item"
          :class="{ active: modelValue === option.value }"
          @click="selectOption(option)"
        >
          <text>{{ option.label }}</text>
          <t-icon v-if="modelValue === option.value" name="check" size="16" color="#0052d9" />
        </view>
      </view>
    </view>
  </t-popup>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

export interface TimeOption {
  label: string;
  value: string;
}

interface Props {
  visible: boolean;
  modelValue: string;
  options: TimeOption[];
  title?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '选择时间范围',
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'update:modelValue', value: string): void;
  (e: 'confirm', value: string): void;
}>();

const showPopup = ref(props.visible);

// 监听 visible 变化
watch(
  () => props.visible,
  (val) => {
    showPopup.value = val;
  },
);

// 监听 popup 显示状态变化
watch(showPopup, (val) => {
  emit('update:visible', val);
});

const handleVisibleChange = (val: boolean) => {
  emit('update:visible', val);
};

const selectOption = (option: TimeOption) => {
  emit('update:modelValue', option.value);
  emit('confirm', option.value);
  showPopup.value = false;
};
</script>

<style lang="less" scoped>
.time-picker {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);

  .picker-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx;
    border-bottom: 1rpx solid #f5f5f5;

    .picker-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #000000e6;
    }
  }

  .picker-options {
    padding: 16rpx 0;

    .picker-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 28rpx 32rpx;
      font-size: 30rpx;
      color: #000000e6;

      &.active {
        color: #0052d9;
        background: rgba(0, 82, 217, 0.05);
      }
    }
  }
}
</style>
