<template>
  <t-calendar
    v-model:visible="visible"
    :min-date="minDate"
    :max-date="maxDate"
    :value="tempDateRange"
    :confirm="onConfirm"
    :select="onSelect"
    type="range"
  />
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

interface Props {
  visible: boolean;
  /** 最大可选天数，默认30天 */
  maxRange?: number;
  /** 是否自动选中今天，默认true */
  autoSelectToday?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxRange: 30,
  autoSelectToday: true,
});

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void;
  (e: 'confirm', value: string[]): void;
}>();

// 日历显示状态
const visible = ref(props.visible);

// 临时选择的日期范围（时间戳）
const tempDateRange = ref<number[]>([]);

// 确认后的日期范围（字符串）
const selectedDateRange = ref<string[]>([]);

// 计算日期范围边界（基于基准日期前后 maxRange 天）
const today = new Date();
const baseDate = ref(today.getTime());

const minDate = ref(new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).getTime());
const maxDate = ref(new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).getTime());

// 监听 visible 变化，同步日历显示状态
watch(
  () => props.visible,
  (val) => {
    visible.value = val;
    if (val) {
      // 打开日历时，如果还没有选择过日期，默认选中今天
      if (props.autoSelectToday && selectedDateRange.value.length === 0) {
        tempDateRange.value = [today.getTime()];
      } else if (selectedDateRange.value.length > 0) {
        // 回显已选择的日期范围
        tempDateRange.value = selectedDateRange.value.map((d) => new Date(d).getTime());
      }
    }
  },
);

// 监听日历显示状态变化
watch(visible, (val) => {
  emit('update:visible', val);
});

// 验证日期范围是否超过最大限制
const validateDateRange = (startTs: number, endTs: number): boolean => {
  const daysDiff = Math.floor((endTs - startTs) / (1000 * 60 * 60 * 24));
  return daysDiff <= props.maxRange;
};

// 将时间戳转换为本地日期字符串 YYYY-MM-DD
const toLocalDateString = (ts: number): string => {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 日期选择中（临时存储）
const onSelect = (e: { value: number[] }) => {
  const { value } = e;
  if (value && value.length === 1) {
    // 用户刚选择了开始日期，以该日期为基准限制前后 maxRange 天
    const base = value[0];
    const dayMs = props.maxRange * 24 * 60 * 60 * 1000;
    minDate.value = base - dayMs;
    maxDate.value = base + dayMs;
  }
  tempDateRange.value = value || [];
};

// 确认选择
const onConfirm = (e: { value: number[] }) => {
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

  // 保存确认的日期范围
  selectedDateRange.value = value.map((ts) => toLocalDateString(ts));

  // 关闭日历
  visible.value = false;

  // 重置日期范围为前后一年
  resetDateRange();

  // 发送确认事件
  emit('confirm', selectedDateRange.value);
};

// 重置日期范围为前后一年
const resetDateRange = () => {
  const now = new Date().getTime();
  const yearMs = 365 * 24 * 60 * 60 * 1000;
  minDate.value = now - yearMs;
  maxDate.value = now + yearMs;
};

// 暴露方法供父组件调用
defineExpose({
  /** 获取当前选中的日期范围 */
  getValue: () => selectedDateRange.value,
  /** 清空选择 */
  clear: () => {
    selectedDateRange.value = [];
    tempDateRange.value = [];
  },
});
</script>
