<template>
  <t-popup v-model:visible="showPopup" placement="bottom">
    <view class="picker-container">
      <view class="picker-header">
        <text class="picker-title">{{ title }}</text>
        <t-icon name="close" size="20" color="#999" @click="showPopup = false" />
      </view>
      <view class="picker-options">
        <view
          v-for="option in timeOptions"
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

  <!-- 日期区间选择器 -->
  <t-calendar
    v-model:visible="showCalendar"
    :min-date="minDate"
    :max-date="maxDate"
    :value="tempDateRange"
    :confirm="onCalendarConfirm"
    :select="onCalendarSelect"
    type="range"
  />
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
  options?: TimeOption[];
  title?: string;
  /** 最大可选天数，默认30天 */
  maxRange?: number;
  /** 是否自动选中今天，默认true */
  autoSelectToday?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '选择时间范围',
  options: () => [
    { label: '今日', value: 'today' },
    { label: '本周', value: 'week' },
    { label: '本月', value: 'month' },
    { label: '日历选择', value: 'custom' },
  ],
  maxRange: 30,
  autoSelectToday: true,
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'update:modelValue', value: string): void;
  (e: 'confirm', value: { timeRange: string; dateRange?: string[] }): void;
}>();

// 时间选择弹窗
const showPopup = ref(props.visible);
const timeOptions = props.options;

// 日期区间选择
const showCalendar = ref(false);
const tempDateRange = ref<number[]>([]);
const selectedDateRange = ref<string[]>([]);

// 计算日期范围边界
const today = new Date();
const minDate = ref(new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).getTime());
const maxDate = ref(new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).getTime());

// 监听 visible 变化
watch(
  () => props.visible,
  (val) => {
    showPopup.value = val;
  },
);

watch(showPopup, (val) => {
  emit('update:visible', val);
});

// 验证日期范围
const validateDateRange = (startTs: number, endTs: number): boolean => {
  const daysDiff = Math.floor((endTs - startTs) / (1000 * 60 * 60 * 24));
  return daysDiff <= props.maxRange;
};

// 转换时间戳为本地日期字符串
const toLocalDateString = (ts: number): string => {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 选择时间选项
const selectOption = (option: TimeOption) => {
  if (option.value === 'custom') {
    // 打开日历选择
    showPopup.value = false;
    // 初始化日历
    if (props.autoSelectToday && selectedDateRange.value.length === 0) {
      tempDateRange.value = [today.getTime()];
    } else if (selectedDateRange.value.length > 0) {
      tempDateRange.value = selectedDateRange.value.map((d) => new Date(d).getTime());
    }
    showCalendar.value = true;
    return;
  }

  emit('update:modelValue', option.value);
  emit('confirm', { timeRange: option.value });
  showPopup.value = false;
};

// 日历选择中
const onCalendarSelect = (e: { value: number[] }) => {
  const { value } = e;
  if (value && value.length === 1) {
    const base = value[0];
    const dayMs = props.maxRange * 24 * 60 * 60 * 1000;
    minDate.value = base - dayMs;
    maxDate.value = base + dayMs;
  }
  tempDateRange.value = value || [];
};

// 日历确认选择
const onCalendarConfirm = (e: { value: number[] }) => {
  const { value } = e;
  if (!value || value.length < 2) {
    uni.showToast({
      title: '请选择完整的日期范围',
      icon: 'none',
    });
    return;
  }
  if (!validateDateRange(value[0], value[1])) {
    uni.showToast({
      title: `最多选择${props.maxRange}天`,
      icon: 'none',
    });
    return;
  }

  selectedDateRange.value = value.map((ts) => toLocalDateString(ts));
  showCalendar.value = false;

  // 重置日期范围
  resetDateRange();

  emit('update:modelValue', 'custom');
  emit('confirm', { timeRange: 'custom', dateRange: selectedDateRange.value });
};

// 重置日期范围
const resetDateRange = () => {
  const now = new Date().getTime();
  const yearMs = 365 * 24 * 60 * 60 * 1000;
  minDate.value = now - yearMs;
  maxDate.value = now + yearMs;
};

// 暴露方法
defineExpose({
  getDateRange: () => selectedDateRange.value,
  clear: () => {
    selectedDateRange.value = [];
    tempDateRange.value = [];
  },
});
</script>

<style lang="less" scoped>
.picker-container {
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
