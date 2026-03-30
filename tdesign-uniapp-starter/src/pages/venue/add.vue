<template>
  <view class="add-venue-container">
    <!-- 固定的自定义导航栏 -->
    <view class="custom-nav-bar-fixed" :style="{ height: navBarHeight + 'px', paddingTop: statusBarHeight + 'px' }">
      <view class="nav-bar-content">
        <view class="nav-left">
          <t-icon name="chevron-left" size="24" color="#fff" @click="goBack" />
        </view>
        <text class="nav-title">新增场地</text>
        <view class="nav-right"></view>
      </view>
    </view>

    <!-- 导航栏占位 -->
    <view class="nav-bar-placeholder" :style="{ height: (navBarHeight + statusBarHeight) + 'px' }"></view>

    <!-- 表单内容 -->
    <scroll-view class="form-content" scroll-y>
      <!-- 所属地区 -->
      <view class="form-item" @click="showRegionPicker">
        <view class="form-label">
          <text class="required">*</text>
          <text>所属地区</text>
        </view>
        <view class="form-value">
          <text :class="{ placeholder: !regionText }">{{ regionText || '请选择省/市/区' }}</text>
          <t-icon name="chevron-right" size="20" color="#999" />
        </view>
      </view>

      <!-- 详细地址 -->
      <view class="form-item">
        <view class="form-label">
          <text class="required">*</text>
          <text>详细地址</text>
        </view>
        <t-input
          v-model="formData.address"
          placeholder="请输入详细地址"
          :maxlength="100"
          borderless
          class="form-input"
        />
      </view>

      <!-- 场地名称 -->
      <view class="form-item">
        <view class="form-label">
          <text class="required">*</text>
          <text>场地名称</text>
        </view>
        <t-input
          v-model="formData.name"
          placeholder="请输入场地名称"
          :maxlength="50"
          borderless
          class="form-input"
        />
      </view>

      <!-- 所属商户 -->
      <view class="form-item" @click="showMerchantPicker">
        <view class="form-label">
          <text class="required">*</text>
          <text>所属商户</text>
        </view>
        <view class="form-value">
          <text :class="{ placeholder: !merchantText }">{{ merchantText || '请选择商户' }}</text>
          <t-icon name="chevron-right" size="20" color="#999" />
        </view>
      </view>

      <!-- 默认投放场地 -->
      <view class="form-item switch-item">
        <view class="form-label">
          <text>默认投放场地</text>
        </view>
        <t-switch :value="formData.isDefault" @change="onSwitchChange" />
      </view>

      <!-- 警告提示 -->
      <view class="warning-tip">
        <t-icon name="error-circle" size="16" color="#ff4d4f" />
        <text class="warning-text">场地信息必须准确详细，别弄虚作假，否则后果自负</text>
      </view>
    </scroll-view>

    <!-- 底部提交按钮 -->
    <view class="bottom-action">
      <t-button
        theme="primary"
        size="large"
        block
        :loading="submitting"
        @click="handleSubmit"
      >
        提交
      </t-button>
    </view>

    <!-- 地区选择器 -->
    <t-picker
      v-model:visible="regionPickerVisible"
      :value="regionValue"
      title="选择地区"
      @confirm="onRegionConfirm"
      @cancel="regionPickerVisible = false"
    >
      <t-picker-item :options="provinceOptions" />
      <t-picker-item :options="cityOptions" />
      <t-picker-item :options="districtOptions" />
    </t-picker>

    <!-- 商户选择器 -->
    <t-picker
      v-model:visible="merchantPickerVisible"
      :value="merchantValue"
      title="选择商户"
      @confirm="onMerchantConfirm"
      @cancel="merchantPickerVisible = false"
    >
      <t-picker-item :options="merchantOptions" />
    </t-picker>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';

// 系统信息
const statusBarHeight = ref(20);
const navBarHeight = ref(44);

// 表单数据
const formData = reactive({
  province: '',
  city: '',
  district: '',
  address: '',
  name: '',
  merchantId: '',
  isDefault: false,
});

// 提交状态
const submitting = ref(false);

// 地区相关
const regionPickerVisible = ref(false);
const regionText = ref('');
const regionValue = ref<string[]>([]);
const provinceOptions = ref<{ label: string; value: string }[]>([
  { label: '广东省', value: '440000' },
  { label: '北京市', value: '110000' },
  { label: '上海市', value: '310000' },
]);
const cityOptions = ref<{ label: string; value: string }[]>([
  { label: '深圳市', value: '440300' },
  { label: '广州市', value: '440100' },
  { label: '东莞市', value: '441900' },
]);
const districtOptions = ref<{ label: string; value: string }[]>([
  { label: '南山区', value: '440305' },
  { label: '福田区', value: '440304' },
  { label: '龙华区', value: '440309' },
]);

// 商户相关
const merchantPickerVisible = ref(false);
const merchantText = ref('');
const merchantValue = ref<string[]>([]);
const merchantOptions = ref<{ label: string; value: string }[]>([
  { label: '华强北旗舰店', value: 'm001' },
  { label: '龙华商城', value: 'm002' },
  { label: 'CBD商业管理', value: 'm003' },
]);

// 初始化系统信息
const initSystemInfo = () => {
  const systemInfo = uni.getSystemInfoSync();
  // #ifdef MP-WEIXIN
  const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
  statusBarHeight.value = systemInfo.statusBarHeight || 20;
  navBarHeight.value = (menuButtonInfo.top - systemInfo.statusBarHeight) * 2 + menuButtonInfo.height;
  // #endif

  // #ifndef MP-WEIXIN
  statusBarHeight.value = systemInfo.statusBarHeight || 20;
  navBarHeight.value = 44;
  // #endif
};

// 显示地区选择器
const showRegionPicker = () => {
  regionPickerVisible.value = true;
};

// 地区选择确认
const onRegionConfirm = (e: any) => {
  const { value, label } = e;
  formData.province = value[0];
  formData.city = value[1];
  formData.district = value[2];
  regionText.value = label.join('');
  regionValue.value = value;
  regionPickerVisible.value = false;
};

// 显示商户选择器
const showMerchantPicker = () => {
  merchantPickerVisible.value = true;
};

// 商户选择确认
const onMerchantConfirm = (e: any) => {
  const { value, label } = e;
  formData.merchantId = value[0];
  merchantText.value = label[0];
  merchantPickerVisible.value = false;
};

// 开关切换
const onSwitchChange = (e: any) => {
  formData.isDefault = e.value;
};

// 返回
const goBack = () => {
  uni.navigateBack();
};

// 提交表单
const handleSubmit = async () => {
  // 表单验证
  if (!formData.province) {
    uni.showToast({ title: '请选择所属地区', icon: 'none' });
    return;
  }
  if (!formData.address.trim()) {
    uni.showToast({ title: '请输入详细地址', icon: 'none' });
    return;
  }
  if (!formData.name.trim()) {
    uni.showToast({ title: '请输入场地名称', icon: 'none' });
    return;
  }
  if (!formData.merchantId) {
    uni.showToast({ title: '请选择所属商户', icon: 'none' });
    return;
  }

  submitting.value = true;
  try {
    // 模拟提交
    await new Promise(resolve => setTimeout(resolve, 1500));
    uni.showToast({ title: '提交成功', icon: 'success' });
    setTimeout(() => {
      uni.navigateBack();
    }, 1500);
  } catch (error) {
    uni.showToast({ title: '提交失败', icon: 'none' });
  } finally {
    submitting.value = false;
  }
};

initSystemInfo();
</script>

<style lang="less" scoped>
@import '@/styles/variable.less';

.add-venue-container {
  height: 100vh;
  background-color: @bg-color;
  display: flex;
  flex-direction: column;
}

// 固定的自定义导航栏
.custom-nav-bar-fixed {
  background: @brand7-normal;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;

  .nav-bar-content {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 16px;

    .nav-left,
    .nav-right {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
    }

    .nav-title {
      font-size: 17px;
      font-weight: 600;
      color: #fff;
    }
  }
}

// 导航栏占位
.nav-bar-placeholder {
  flex-shrink: 0;
}

// 表单内容
.form-content {
  flex: 1;
  width: 100%;
  padding: 20rpx 32rpx;
  box-sizing: border-box;
}

// 表单项
.form-item {
  background: #fff;
  border-radius: 16rpx;
  padding: 14rpx 32rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 96rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);

  .form-label {
    font-size: 28rpx;
    color: @gy1;
    font-weight: 500;
    flex-shrink: 0;
    display: flex;
    align-items: center;

    .required {
      color: #ff4d4f;
      margin-right: 8rpx;
    }
  }

  .form-value {
    display: flex;
    align-items: center;
    gap: 8rpx;
    flex: 1;
    justify-content: flex-end;

    text {
      font-size: 28rpx;
      color: @gy1;

      &.placeholder {
        color: @gy2;
      }
    }
  }

  .form-input {
    flex: 1;
    width: 100%;
    text-align: right;
    font-size: 28rpx;
    padding: 0 !important;
    box-sizing: border-box;
  }
}

// 开关项
.switch-item {
  .form-label {
    font-size: 28rpx;
    color: @gy1;
    font-weight: 500;
  }
}

// 警告提示
.warning-tip {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
  padding: 24rpx;
  background: rgba(255, 77, 79, 0.08);
  border-radius: 12rpx;
  margin-top: 16rpx;

  .warning-text {
    font-size: 24rpx;
    color: #ff4d4f;
    line-height: 1.5;
    flex: 1;
  }
}

// 底部提交按钮
.bottom-action {
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}
</style>
