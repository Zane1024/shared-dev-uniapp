<template>
  <view class="venue-container">
    <!-- 固定的自定义导航栏 -->
    <view class="custom-nav-bar-fixed" :style="{ height: navBarHeight + 'px', paddingTop: statusBarHeight + 'px' }">
      <view class="nav-bar-content">
        <view class="nav-left">
          <t-icon name="chevron-left" size="24" color="#fff" @click="goBack" />
        </view>
        <text class="nav-title">场地管理</text>
        <view class="nav-right"></view>
      </view>
    </view>

    <!-- 导航栏占位 -->
    <view class="nav-bar-placeholder" :style="{ height: (navBarHeight + statusBarHeight) + 'px' }"></view>

    <!-- 搜索和筛选区域 -->
    <view class="search-section">
      <!-- 第一行：搜索框 + 搜索按钮 -->
      <view class="search-row">
        <view class="search-bar">
          <t-search
            v-model="searchKey"
            placeholder="搜索场地名称"
            @change="onSearchChange"
            @submit="onSearchSubmit"
            @clear="onSearchClear"
          />
        </view>
        <t-button theme="primary" size="small" @click="onSearchSubmit(searchKey)">搜索</t-button>
      </view>
      <!-- 第二行：时间筛选 -->
      <view class="time-filter-row" @click="showCalendar = true">
        <text class="filter-label">时间</text>
        <text class="filter-value">{{ currentTimeLabel }}</text>
        <t-icon name="chevron-right" size="14" color="#999" />
      </view>
    </view>

    <!-- 可滚动内容区 -->
    <t-pull-down-refresh
      class="scroll-content"
      :value="isRefreshing"
      :loading-texts="['下拉刷新', '松手刷新', '正在刷新', '刷新完成']"
      @refresh="onPullDownRefresh"
    >
      <!-- 场地列表 -->
      <view class="venue-list" v-if="venueList.length > 0">
        <view
          class="venue-item"
          v-for="item in venueList"
          :key="item.id"
        >
          <!-- 顶部：标题 + 默认角标 + 更多按钮 -->
          <view class="item-header">
            <view class="item-title-row">
              <text class="item-title">{{ item.name }}</text>
            </view>
            <view class="more-btn" @click="showMoreActions(item)">
              <t-icon name="more" size="20" color="#666" />
            </view>
          </view>
          <!-- 默认角标 -->
          <view class="default-badge" v-if="item.isDefault">
            <text class="badge-text">默认</text>
          </view>

          <!-- 地址信息 -->
          <view class="item-address">
            <t-icon name="location" size="14" color="#999" />
            <text class="address-text">{{ item.province }}{{ item.city }}{{ item.district }}{{ item.address }}</text>
          </view>

          <!-- 价格 -->
          <view class="item-price-row">
            <text class="price-label">价格:</text>
            <text class="price-value">¥{{ formatAmount(item.price) }}</text>
            <text class="price-unit">/小时</text>
          </view>

          <!-- 设备信息 -->
          <view class="item-device-row">
            <view class="device-info">
              <t-icon name="server" size="14" color="#34c759" />
              <text class="device-text">在线 {{ item.onlineDeviceCount }}/{{ item.totalDeviceCount }} 台</text>
            </view>
          </view>

          <!-- 商户信息 -->
          <view class="item-merchant-row">
            <t-icon name="user" size="14" color="#999" />
            <text class="merchant-text">{{ item.merchantName }}</text>
          </view>

          <!-- 退款信息 -->
          <view class="item-refund-row">
            <view class="refund-info">
              <text class="refund-label">退款:</text>
              <text class="refund-value">{{ item.refundCount }}次</text>
              <text class="refund-remain">(剩{{ item.remainRefundCount }}次)</text>
            </view>
            <view class="auto-refund-info">
              <text class="refund-label">自动退:</text>
              <text class="refund-value">{{ item.autoRefundCount }}次</text>
              <text class="refund-remain">(剩{{ item.remainAutoRefundCount }}次)</text>
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view class="load-more" v-if="hasMore">
          <t-loading theme="circular" size="40rpx" />
          <text class="load-more-text">加载中...</text>
        </view>
        <view class="no-more" v-else-if="venueList.length > 0">
          <text class="no-more-text">没有更多了</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else>
        <t-empty icon="search" description="暂无场地数据">
          <template #action>
            <t-button theme="primary" size="medium" @click="goToAddVenue">新增场地</t-button>
          </template>
        </t-empty>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </t-pull-down-refresh>

    <!-- 底部新增按钮 -->
    <view class="bottom-action">
      <t-button theme="primary" size="large" block @click="goToAddVenue">
        <template #icon>
          <t-icon name="add" size="20" color="#fff" />
        </template>
        新增场地
      </t-button>
    </view>


    <!-- 日期区间选择器 -->
    <t-calendar
      v-model:visible="showCalendar"
      :min-date="minDate"
      :max-date="maxDate"
      :value="tempDateRange"
      @confirm="onDateConfirm"
      @select="onDateSelect"
      class="custom-calendar"
    >
      <template #title>
        <view class="calendar-header">
          <text class="calendar-title">选择日期范围</text>
          <text class="calendar-subtitle">最多可选择60天</text>
        </view>
      </template>
    </t-calendar>

    <!-- 更多操作弹窗 -->
    <t-popup v-model:visible="showMorePopup" placement="bottom">
      <view class="action-sheet">
        <view class="action-sheet-header">
          <text class="action-sheet-title">场地操作</text>
        </view>
        <view class="action-sheet-options">
          <view class="action-sheet-item" @click="editVenue">
            <t-icon name="edit" size="20" color="#0052d9" />
            <text class="action-sheet-text">编辑场地</text>
          </view>
          <view class="action-sheet-item" @click="setDefaultVenue" v-if="!currentVenue?.isDefault">
            <t-icon name="check-circle" size="20" color="#0052d9" />
            <text class="action-sheet-text">设为默认</text>
          </view>
          <view class="action-sheet-item danger" @click="deleteVenue">
            <t-icon name="delete" size="20" color="#ff4d4f" />
            <text class="action-sheet-text">删除场地</text>
          </view>
        </view>
        <view class="action-sheet-cancel" @click="showMorePopup = false">
          <text class="cancel-text">取消</text>
        </view>
      </view>
    </t-popup>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

// 系统信息
const statusBarHeight = ref(20);
const navBarHeight = ref(44);

// 搜索
const searchKey = ref('');

// 时间筛选
const timeRange = ref('today');
const timeOptions = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '日历选择', value: 'custom' },
] as const;

const currentTimeLabel = computed(() => {
  // 如果有选择的日期范围，显示区间
  if (dateRange.value.length === 2) {
    return `${formatDateShort(dateRange.value[0])} - ${formatDateShort(dateRange.value[1])}`;
  }
  // 否则显示今日
  const todayStr = formatDateToString(new Date());
  return `${formatDateShort(todayStr)} - ${formatDateShort(todayStr)}`;
});

// 将Date对象转成YYYY-MM-DD字符串
const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// 日历
const showCalendar = ref(false);
const dateRange = ref<string[]>([]);
const tempDateRange = ref<number[]>([]);

const today = new Date();
const maxDate = ref(new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).getTime());
const minDate = ref(new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).getTime());

// 列表数据
const venueList = ref<any[]>([]);
const isRefreshing = ref(false);
const hasMore = ref(false);
const pageNum = ref(1);
const pageSize = 10;

// 更多操作
const showMorePopup = ref(false);
const currentVenue = ref<any>(null);

// 格式化日期
const formatDateShort = (dateStr: string) => {
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
};

// 验证日期范围
const validateDateRange = (startTs: number, endTs: number): boolean => {
  const daysDiff = Math.floor((endTs - startTs) / (1000 * 60 * 60 * 24));
  return daysDiff <= 60;
};

// 格式化金额
const formatAmount = (amount: number) => {
  if (!amount && amount !== 0) return '0.00';
  return amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

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

// 获取场地列表
const fetchVenueList = async () => {
  try {
    // 模拟数据
    const mockData = [
      {
        id: 1,
        name: '旗舰体验店',
        isDefault: true,
        province: '广东省',
        city: '深圳市',
        district: '南山区',
        address: '科技园南区A栋1楼',
        price: 58.00,
        onlineDeviceCount: 12,
        totalDeviceCount: 15,
        merchantName: '华强北旗舰店',
        refundCount: 3,
        remainRefundCount: 7,
        autoRefundCount: 2,
        remainAutoRefundCount: 8,
      },
      {
        id: 2,
        name: '龙华商城店',
        isDefault: false,
        province: '广东省',
        city: '深圳市',
        district: '龙华区',
        address: '龙华街道办人民路288号',
        price: 38.00,
        onlineDeviceCount: 8,
        totalDeviceCount: 10,
        merchantName: '龙华商城',
        refundCount: 1,
        remainRefundCount: 9,
        autoRefundCount: 0,
        remainAutoRefundCount: 10,
      },
      {
        id: 3,
        name: '福田CBD店',
        isDefault: false,
        province: '广东省',
        city: '深圳市',
        district: '福田区',
        address: '中心商务区会展中心旁',
        price: 68.00,
        onlineDeviceCount: 20,
        totalDeviceCount: 20,
        merchantName: 'CBD商业管理',
        refundCount: 5,
        remainRefundCount: 5,
        autoRefundCount: 3,
        remainAutoRefundCount: 7,
      },
    ];
    venueList.value = mockData;
  } catch (error) {
    console.error('获取场地列表失败:', error);
    uni.showToast({
      title: '数据加载失败',
      icon: 'none',
    });
  }
};

// 搜索相关
const onSearchChange = (e: any) => {
  console.log('search change:', e);
};

const onSearchSubmit = (value: any) => {
  // value 可能是搜索框事件对象，也可能是直接传入的字符串
  const searchValue = typeof value === 'string' ? value : (value?.detail?.value || searchKey.value);
  console.log('search submit:', searchValue);
  searchKey.value = searchValue;
  fetchVenueList();
};

const onSearchClear = () => {
  searchKey.value = '';
  fetchVenueList();
};

// 日历选择
const onDateSelect = (e: any) => {
  const { value } = e;
  if (value && value.length === 2 && !validateDateRange(value[0], value[1])) {
    uni.showToast({
      title: '最多选择60天',
      icon: 'none',
    });
    tempDateRange.value = [value[0]];
    return;
  }
  tempDateRange.value = value;
};

// 日历确认
const onDateConfirm = (e: any) => {
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
      title: '最多选择60天',
      icon: 'none',
    });
    return;
  }
  const toLocalDateString = (ts: number) => {
    const d = new Date(ts);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  dateRange.value = value.map((ts: number) => toLocalDateString(ts));
  timeRange.value = 'custom';
  tempDateRange.value = [];
  showCalendar.value = false;
  fetchVenueList();
};

// 下拉刷新
const onPullDownRefresh = async () => {
  isRefreshing.value = true;
  pageNum.value = 1;
  await fetchVenueList();
  isRefreshing.value = false;
  uni.stopPullDownRefresh();
};

// 加载更多
const onLoadMore = () => {
  if (hasMore.value) {
    pageNum.value++;
    fetchVenueList();
  }
};

// 返回
const goBack = () => {
  uni.navigateBack();
};

// 新增场地
const goToAddVenue = () => {
  uni.navigateTo({
    url: '/pages/venue/add',
  });
};

// 显示更多操作
const showMoreActions = (item: any) => {
  currentVenue.value = item;
  showMorePopup.value = true;
};

// 编辑场地
const editVenue = () => {
  showMorePopup.value = false;
  uni.showToast({
    title: '编辑场地开发中',
    icon: 'none',
  });
};

// 设为默认
const setDefaultVenue = () => {
  showMorePopup.value = false;
  uni.showToast({
    title: '设置成功',
    icon: 'success',
  });
};

// 删除场地
const deleteVenue = () => {
  showMorePopup.value = false;
  uni.showModal({
    title: '确认删除',
    content: `确定要删除场地"${currentVenue.value?.name}"吗？`,
    confirmColor: '#ff4d4f',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '删除成功',
          icon: 'success',
        });
      }
    },
  });
};

onMounted(() => {
  initSystemInfo();
  // 初始化默认日期范围为今天
  const todayStr = formatDateToString(new Date());
  dateRange.value = [todayStr, todayStr];
  fetchVenueList();
});
</script>

<style lang="less" scoped>
@import '@/styles/variable.less';

.venue-container {
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

// 搜索和筛选区域
@search-height: 66rpx;

.search-section {
  background: #fff;
  padding: 22rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .search-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 22rpx;

    .search-bar {
      flex: 1;
      --td-search-height: @search-height;
      --td-search-font-size: 16rpx;

      :deep(.t-search__input-box) {
        .t-icon {
          font-size: 28rpx !important;
        }
      }
    }

    :deep(.t-button) {
      height: @search-height !important;
      min-height: @search-height !important;
      line-height: @search-height !important;
      padding: 0 34rpx !important;
    }
  }

  .time-filter-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
    background: rgba(0, 82, 217, 0.08);
    border-radius: 32rpx;
    padding: 10rpx 16rpx;
    width: fit-content;

    .filter-label {
      font-size: 22rpx;
      color: @gy2;
    }

    .filter-value {
      font-size: 22rpx;
      color: @brand7-normal;
    }
  }
}

// 可滚动内容区
.scroll-content {
  flex: 1;
  background-color: @bg-color;
}

// 场地列表
.venue-list {
  padding: 20rpx 32rpx;
}

.venue-item {
  position: relative;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);

  .item-header {
    position: relative;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16rpx;
    padding-right: 72rpx;

    .item-title-row {
      display: flex;
      align-items: center;
      gap: 12rpx;
      flex: 1;

      .item-title {
        font-size: 30rpx;
        font-weight: 600;
        color: @gy1;
      }
    }

    .more-btn {
      width: 44rpx;
      height: 44rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .default-badge {
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-top: 72rpx solid @brand7-normal;
    border-left: 72rpx solid transparent;

    .badge-text {
      position: absolute;
      top: -60rpx;
      right: 4rpx;
      font-size: 18rpx;
      color: #fff;
      transform: rotate(45deg);
      white-space: nowrap;
    }
  }

  .item-address {
    display: flex;
    align-items: flex-start;
    gap: 8rpx;
    margin-bottom: 16rpx;

    .address-text {
      font-size: 26rpx;
      color: @gy2;
      line-height: 1.4;
      flex: 1;
    }
  }

  .item-price-row {
    display: flex;
    align-items: baseline;
    margin-bottom: 16rpx;

    .price-label {
      font-size: 24rpx;
      color: @gy2;
    }

    .price-value {
      font-size: 36rpx;
      font-weight: 600;
      color: #ff4d4f;
      margin-left: 8rpx;
    }

    .price-unit {
      font-size: 22rpx;
      color: @gy2;
      margin-left: 4rpx;
    }
  }

  .item-device-row {
    display: flex;
    align-items: center;
    margin-bottom: 16rpx;

    .device-info {
      display: flex;
      align-items: center;
      gap: 8rpx;

      .device-text {
        font-size: 24rpx;
        color: @gy1;
      }
    }
  }

  .item-merchant-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
    margin-bottom: 16rpx;

    .merchant-text {
      font-size: 24rpx;
      color: @gy2;
    }
  }

  .item-refund-row {
    display: flex;
    justify-content: space-between;
    padding-top: 16rpx;
    border-top: 1rpx solid #f5f5f5;

    .refund-info,
    .auto-refund-info {
      display: flex;
      align-items: center;
      gap: 6rpx;

      .refund-label {
        font-size: 22rpx;
        color: @gy2;
      }

      .refund-value {
        font-size: 22rpx;
        color: @gy1;
        font-weight: 500;
      }

      .refund-remain {
        font-size: 22rpx;
        color: @gy2;
      }
    }
  }
}

// 空状态
.empty-state {
  padding: 120rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

// 加载更多
.load-more,
.no-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 32rpx 0;

  .load-more-text,
  .no-more-text {
    font-size: 26rpx;
    color: @gy2;
    margin-left: 12rpx;
  }
}

// 底部占位
.bottom-placeholder {
  height: calc(120rpx + constant(safe-area-inset-bottom));
  height: calc(120rpx + env(safe-area-inset-bottom));
}

// 底部操作
.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 16rpx 32rpx;
  padding-bottom: calc(16rpx + constant(safe-area-inset-bottom));
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  box-shadow: 0 -4rpx 16rpx rgba(0, 0, 0, 0.06);
}

// 时间选择器
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
      color: @gy1;
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
      color: @gy1;

      &.active {
        color: @brand7-normal;
        background: rgba(0, 82, 217, 0.05);
      }
    }
  }
}

// 自定义日历
:deep(.t-calendar__popup) {
  top: 200rpx !important;
  border-radius: 24rpx 24rpx 0 0;
}

:deep(.t-calendar__header) {
  border-radius: 24rpx 24rpx 0 0;
}

.calendar-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx;

  .calendar-title {
    font-size: 32rpx;
    font-weight: 600;
    color: @gy1;
  }

  .calendar-subtitle {
    font-size: 24rpx;
    color: @gy2;
    margin-top: 8rpx;
  }
}

// 操作弹窗
.action-sheet {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;

  .action-sheet-header {
    padding: 32rpx;
    text-align: center;
    border-bottom: 1rpx solid #f5f5f5;

    .action-sheet-title {
      font-size: 30rpx;
      font-weight: 600;
      color: @gy1;
    }
  }

  .action-sheet-options {
    padding: 16rpx 0;

    .action-sheet-item {
      display: flex;
      align-items: center;
      gap: 20rpx;
      padding: 28rpx 32rpx;

      .action-sheet-text {
        font-size: 30rpx;
        color: @gy1;
      }

      &.danger {
        .action-sheet-text {
          color: #ff4d4f;
        }
      }
    }
  }

  .action-sheet-cancel {
    padding: 28rpx 32rpx;
    text-align: center;
    background: #f5f5f5;
    border-top: 1rpx solid #e7e7e7;

    .cancel-text {
      font-size: 30rpx;
      color: @gy1;
    }
  }
}
</style>
