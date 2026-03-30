<template>
  <view class="device-container">
    <!-- 固定的自定义导航栏 -->
    <view class="custom-nav-bar-fixed" :style="{ height: navBarHeight + 'px', paddingTop: statusBarHeight + 'px' }">
      <view class="nav-bar-content">
        <view class="nav-left">
          <t-icon name="chevron-left" size="24" color="#fff" @click="goBack" />
        </view>
        <text class="nav-title">设备列表</text>
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
            placeholder="搜索设备名称/编号"
            @change="onSearchChange"
            @submit="onSearchSubmit"
            @clear="onSearchClear"
          />
        </view>
        <t-button theme="primary" size="medium" @click="onSearchSubmit(searchKey)">搜索</t-button>
      </view>

      <!-- 第二行：筛选条件 -->
      <view class="filter-row">
        <!-- 时间筛选 -->
        <view class="filter-item time-filter" @click="showTimePopup = true">
          <t-icon name="calendar" size="14" color="#0052d9" />
          <text class="filter-text">{{ currentTimeLabel }}</text>
          <t-icon name="chevron-down" size="12" color="#999" />
        </view>

        <!-- 场地筛选 -->
        <view class="filter-item" @click="showVenuePopup = true">
          <t-icon name="location" size="14" color="#0052d9" />
          <text class="filter-text">{{ currentVenueName }}</text>
          <t-icon name="chevron-down" size="12" color="#999" />
        </view>

        <!-- 状态筛选 -->
        <view class="filter-item" @click="showStatusPopup = true">
          <t-icon name="filter" size="14" color="#0052d9" />
          <text class="filter-text">{{ currentStatusName }}</text>
          <t-icon name="chevron-down" size="12" color="#999" />
        </view>
      </view>
    </view>

    <!-- 可滚动内容区 -->
    <t-pull-down-refresh
      class="scroll-content"
      :value="isRefreshing"
      :loading-texts="['下拉刷新', '松手刷新', '正在刷新', '刷新完成']"
      @refresh="onPullDownRefresh"
    >
      <!-- 设备列表 -->
      <view class="device-list" v-if="deviceList.length > 0">
        <view
          class="device-item"
          v-for="item in deviceList"
          :key="item.id"
        >
          <!-- 设备信息头部 -->
          <view class="item-header">
            <view class="device-info">
              <text class="device-name">{{ item.name }}</text>
              <view :class="['status-badge', item.status === 'online' ? 'online' : 'offline']">
                <view class="status-dot"></view>
                <text class="status-text">{{ item.status === 'online' ? '在线' : '离线' }}</text>
              </view>
            </view>
            <view class="more-btn" @click="showMoreActions(item)">
              <t-icon name="more" size="20" color="#666" />
            </view>
          </view>

          <!-- 设备详情 -->
          <view class="item-detail">
            <view class="detail-row">
              <view class="detail-item">
                <text class="detail-label">代理编号</text>
                <text class="detail-value">{{ item.agentCode }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">硬件版本</text>
                <text class="detail-value">{{ item.hardwareVersion }}</text>
              </view>
            </view>
            <view class="detail-row">
              <view class="detail-item">
                <text class="detail-label">流量卡号</text>
                <text class="detail-value">{{ item.simCardNo }}</text>
              </view>
              <view class="detail-item">
                <text class="detail-label">场地</text>
                <text class="detail-value">{{ item.venueName }}</text>
              </view>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view class="item-actions">
            <t-button theme="primary" variant="outline" size="small" @click="handleDeviceDetail(item)">
              <template #icon>
                <t-icon name="view" size="14" />
              </template>
              详情
            </t-button>
            <t-button theme="warning" variant="outline" size="small" @click="handleDeviceConfig(item)">
              <template #icon>
                <t-icon name="setting" size="14" />
              </template>
              配置
            </t-button>
            <t-button theme="danger" variant="outline" size="small" @click="handleDeviceRestart(item)">
              <template #icon>
                <t-icon name="refresh" size="14" />
              </template>
              重启
            </t-button>
          </view>
        </view>

        <!-- 加载更多 -->
        <view class="load-more" v-if="hasMore">
          <t-loading theme="circular" size="40rpx" />
          <text class="load-more-text">加载中...</text>
        </view>
        <view class="no-more" v-else-if="deviceList.length > 0">
          <text class="no-more-text">没有更多了</text>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else>
        <t-empty icon="search" description="暂无设备数据" />
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </t-pull-down-refresh>

    <!-- 时间选择器弹窗 -->
    <t-popup v-model:visible="showTimePopup" placement="bottom">
      <view class="time-picker">
        <view class="picker-header">
          <text class="picker-title">选择时间范围</text>
          <t-icon name="close" size="20" color="#999" @click="showTimePopup = false" />
        </view>
        <view class="picker-options">
          <view
            v-for="option in timeOptions"
            :key="option.value"
            class="picker-item"
            :class="{ active: timeRange === option.value }"
            @click="selectTime(option.value)"
          >
            <text>{{ option.label }}</text>
            <t-icon v-if="timeRange === option.value" name="check" size="16" color="#0052d9" />
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

    <!-- 场地选择弹窗 -->
    <t-popup v-model:visible="showVenuePopup" placement="bottom">
      <view class="venue-picker">
        <view class="picker-header">
          <text class="picker-title">选择场地</text>
          <t-icon name="close" size="20" color="#999" @click="showVenuePopup = false" />
        </view>
        <scroll-view scroll-y class="venue-list">
          <view
            class="venue-item"
            :class="{ active: selectedVenueId === '' }"
            @click="selectVenue('')"
          >
            <text>全部场地</text>
            <t-icon v-if="selectedVenueId === ''" name="check" size="16" color="#0052d9" />
          </view>
          <view
            v-for="venue in venueOptions"
            :key="venue.id"
            class="venue-item"
            :class="{ active: selectedVenueId === venue.id }"
            @click="selectVenue(venue.id)"
          >
            <text>{{ venue.name }}</text>
            <t-icon v-if="selectedVenueId === venue.id" name="check" size="16" color="#0052d9" />
          </view>
        </scroll-view>
      </view>
    </t-popup>

    <!-- 状态选择弹窗 -->
    <t-popup v-model:visible="showStatusPopup" placement="bottom">
      <view class="status-picker">
        <view class="picker-header">
          <text class="picker-title">选择状态</text>
          <t-icon name="close" size="20" color="#999" @click="showStatusPopup = false" />
        </view>
        <view class="picker-options">
          <view
            v-for="option in statusOptions"
            :key="option.value"
            class="picker-item"
            :class="{ active: selectedStatus === option.value }"
            @click="selectStatus(option.value)"
          >
            <view class="status-option">
              <view :class="['status-dot', option.value || 'all']"></view>
              <text>{{ option.label }}</text>
            </view>
            <t-icon v-if="selectedStatus === option.value" name="check" size="16" color="#0052d9" />
          </view>
        </view>
      </view>
    </t-popup>

    <!-- 更多操作弹窗 -->
    <t-popup v-model:visible="showMorePopup" placement="bottom">
      <view class="action-sheet">
        <view class="action-sheet-header">
          <text class="action-sheet-title">设备操作</text>
        </view>
        <view class="action-sheet-options">
          <view class="action-sheet-item" @click="handleDeviceDetail">
            <t-icon name="view" size="20" color="#0052d9" />
            <text class="action-sheet-text">设备详情</text>
          </view>
          <view class="action-sheet-item" @click="handleDeviceConfig">
            <t-icon name="setting" size="20" color="#0052d9" />
            <text class="action-sheet-text">设备配置</text>
          </view>
          <view class="action-sheet-item" @click="handleDeviceRestart">
            <t-icon name="refresh" size="20" color="#0052d9" />
            <text class="action-sheet-text">重启设备</text>
          </view>
          <view class="action-sheet-item danger" @click="handleDeviceUnbind">
            <t-icon name="unlink" size="20" color="#ff4d4f" />
            <text class="action-sheet-text">解除绑定</text>
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

interface Device {
  id: number;
  name: string;
  agentCode: string;
  hardwareVersion: string;
  simCardNo: string;
  venueName: string;
  status: 'online' | 'offline';
}

interface Venue {
  id: string;
  name: string;
}

// 系统信息
const statusBarHeight = ref(20);
const navBarHeight = ref(44);

// 搜索
const searchKey = ref('');
const showTimePopup = ref(false);
const showVenuePopup = ref(false);
const showStatusPopup = ref(false);

// 时间筛选
const timeRange = ref('today');
const timeOptions = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '日历选择', value: 'custom' },
] as const;

const currentTimeLabel = computed(() => {
  if (timeRange.value === 'custom' && dateRange.value.length === 2) {
    return `${formatDateShort(dateRange.value[0])} - ${formatDateShort(dateRange.value[1])}`;
  }
  return timeOptions.find(opt => opt.value === timeRange.value)?.label || '今日';
});

// 场地筛选
const selectedVenueId = ref('');
const venueOptions = ref<Venue[]>([]);
const currentVenueName = computed(() => {
  if (selectedVenueId.value === '') return '全部场地';
  return venueOptions.value.find(v => v.id === selectedVenueId.value)?.name || '全部场地';
});

// 状态筛选
const selectedStatus = ref('');
const statusOptions = [
  { label: '全部', value: '' },
  { label: '在线', value: 'online' },
  { label: '离线', value: 'offline' },
] as const;
const currentStatusName = computed(() => {
  return statusOptions.find(opt => opt.value === selectedStatus.value)?.label || '全部';
});

// 日历
const showCalendar = ref(false);
const dateRange = ref<string[]>([]);
const tempDateRange = ref<number[]>([]);

const today = new Date();
const maxDate = ref(new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).getTime());
const minDate = ref(new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).getTime());

// 列表数据
const deviceList = ref<Device[]>([]);
const isRefreshing = ref(false);
const hasMore = ref(false);
const pageNum = ref(1);
const pageSize = 10;

// 更多操作
const showMorePopup = ref(false);
const currentDevice = ref<Device | null>(null);

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
  // 模拟场地数据
  venueOptions.value = [
    { id: '1', name: '旗舰体验店' },
    { id: '2', name: '龙华商城店' },
    { id: '3', name: '福田CBD店' },
  ];
};

// 获取设备列表
const fetchDeviceList = async () => {
  try {
    // 模拟数据
    const mockData: Device[] = [
      {
        id: 1,
        name: '共享按摩椅-A01',
        agentCode: 'AG2024010001',
        hardwareVersion: 'V2.1.5',
        simCardNo: '15812345678901',
        venueName: '旗舰体验店',
        status: 'online',
      },
      {
        id: 2,
        name: '共享按摩椅-A02',
        agentCode: 'AG2024010002',
        hardwareVersion: 'V2.1.5',
        simCardNo: '15812345678902',
        venueName: '旗舰体验店',
        status: 'online',
      },
      {
        id: 3,
        name: '共享按摩椅-B01',
        agentCode: 'AG2024010003',
        hardwareVersion: 'V2.0.8',
        simCardNo: '15812345678903',
        venueName: '龙华商城店',
        status: 'offline',
      },
      {
        id: 4,
        name: '共享按摩椅-B02',
        agentCode: 'AG2024010004',
        hardwareVersion: 'V2.1.5',
        simCardNo: '15812345678904',
        venueName: '龙华商城店',
        status: 'online',
      },
      {
        id: 5,
        name: '共享按摩椅-C01',
        agentCode: 'AG2024010005',
        hardwareVersion: 'V2.1.0',
        simCardNo: '15812345678905',
        venueName: '福田CBD店',
        status: 'online',
      },
      {
        id: 6,
        name: '共享按摩椅-C02',
        agentCode: 'AG2024010006',
        hardwareVersion: 'V2.1.5',
        simCardNo: '15812345678906',
        venueName: '福田CBD店',
        status: 'offline',
      },
    ];

    // 根据筛选条件过滤
    let filteredData = mockData;

    // 场地筛选
    if (selectedVenueId.value) {
      filteredData = filteredData.filter(d => d.venueName === venueOptions.value.find(v => v.id === selectedVenueId.value)?.name);
    }

    // 状态筛选
    if (selectedStatus.value) {
      filteredData = filteredData.filter(d => d.status === selectedStatus.value);
    }

    // 搜索筛选
    if (searchKey.value) {
      const key = searchKey.value.toLowerCase();
      filteredData = filteredData.filter(d =>
        d.name.toLowerCase().includes(key) ||
        d.agentCode.toLowerCase().includes(key)
      );
    }

    deviceList.value = filteredData;
  } catch (error) {
    console.error('获取设备列表失败:', error);
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
  const searchValue = typeof value === 'string' ? value : (value?.detail?.value || searchKey.value);
  console.log('search submit:', searchValue);
  searchKey.value = searchValue;
  fetchDeviceList();
};

const onSearchClear = () => {
  searchKey.value = '';
  fetchDeviceList();
};

// 选择时间
const selectTime = (value: string) => {
  if (value === 'custom') {
    showTimePopup.value = false;
    if (!dateRange.value || dateRange.value.length === 0) {
      const todayTime = new Date().getTime();
      tempDateRange.value = [todayTime];
    } else {
      tempDateRange.value = dateRange.value.map(d => new Date(d).getTime());
    }
    showCalendar.value = true;
    return;
  }
  timeRange.value = value;
  showTimePopup.value = false;
  dateRange.value = [];
  fetchDeviceList();
};

// 选择场地
const selectVenue = (id: string) => {
  selectedVenueId.value = id;
  showVenuePopup.value = false;
  fetchDeviceList();
};

// 选择状态
const selectStatus = (value: string) => {
  selectedStatus.value = value;
  showStatusPopup.value = false;
  fetchDeviceList();
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
  fetchDeviceList();
};

// 下拉刷新
const onPullDownRefresh = async () => {
  isRefreshing.value = true;
  pageNum.value = 1;
  await fetchDeviceList();
  isRefreshing.value = false;
  uni.stopPullDownRefresh();
};

// 返回
const goBack = () => {
  uni.navigateBack();
};

// 显示更多操作
const showMoreActions = (item: Device) => {
  currentDevice.value = item;
  showMorePopup.value = true;
};

// 设备详情
const handleDeviceDetail = (item?: Device) => {
  showMorePopup.value = false;
  const device = item || currentDevice.value;
  if (!device) return;
  uni.showToast({
    title: `查看 ${device.name} 详情`,
    icon: 'none',
  });
};

// 设备配置
const handleDeviceConfig = (item?: Device) => {
  showMorePopup.value = false;
  const device = item || currentDevice.value;
  if (!device) return;
  uni.showToast({
    title: `配置 ${device.name}`,
    icon: 'none',
  });
};

// 重启设备
const handleDeviceRestart = (item?: Device) => {
  showMorePopup.value = false;
  const device = item || currentDevice.value;
  if (!device) return;
  uni.showModal({
    title: '确认重启',
    content: `确定要重启设备"${device.name}"吗？`,
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '重启指令已发送',
          icon: 'success',
        });
      }
    },
  });
};

// 解除绑定
const handleDeviceUnbind = () => {
  showMorePopup.value = false;
  const device = currentDevice.value;
  if (!device) return;
  uni.showModal({
    title: '确认解除绑定',
    content: `确定要解除设备"${device.name}"的绑定吗？`,
    confirmColor: '#ff4d4f',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '解除绑定成功',
          icon: 'success',
        });
      }
    },
  });
};

onMounted(() => {
  initSystemInfo();
  fetchVenueList();
  fetchDeviceList();
});
</script>

<style lang="less" scoped>
@import '@/styles/variable.less';

.device-container {
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
.search-section {
  background: #fff;
  padding: 12rpx 24rpx 20rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .search-row {
    display: flex;
    align-items: center;
    gap: 12rpx;
    margin-bottom: 16rpx;

    .search-bar {
      flex: 1;
    }
  }

  .filter-row {
    display: flex;
    align-items: center;
    gap: 16rpx;

    .filter-item {
      display: flex;
      align-items: center;
      gap: 6rpx;
      background: rgba(0, 82, 217, 0.08);
      border-radius: 32rpx;
      padding: 10rpx 16rpx;

      .filter-text {
        font-size: 22rpx;
        color: @brand7-normal;
        max-width: 120rpx;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &.time-filter {
        flex-shrink: 0;
      }
    }
  }
}

// 可滚动内容区
.scroll-content {
  flex: 1;
  background-color: @bg-color;
}

// 设备列表
.device-list {
  padding: 20rpx 32rpx;
}

.device-item {
  position: relative;
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);

  .item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20rpx;
    padding-right: 60rpx;

    .device-info {
      display: flex;
      align-items: center;
      gap: 16rpx;
      flex: 1;

      .device-name {
        font-size: 30rpx;
        font-weight: 600;
        color: @gy1;
      }

      .status-badge {
        display: flex;
        align-items: center;
        gap: 6rpx;
        padding: 4rpx 12rpx;
        border-radius: 20rpx;
        font-size: 20rpx;

        .status-dot {
          width: 8rpx;
          height: 8rpx;
          border-radius: 50%;
        }

        &.online {
          background: rgba(52, 199, 89, 0.1);
          color: #34c759;
          .status-dot {
            background: #34c759;
          }
        }

        &.offline {
          background: rgba(255, 77, 79, 0.1);
          color: #ff4d4f;
          .status-dot {
            background: #ff4d4f;
          }
        }
      }
    }

    .more-btn {
      position: absolute;
      top: 0;
      right: 0;
      width: 44rpx;
      height: 44rpx;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .item-detail {
    margin-bottom: 20rpx;

    .detail-row {
      display: flex;
      margin-bottom: 12rpx;

      &:last-child {
        margin-bottom: 0;
      }

      .detail-item {
        flex: 1;
        display: flex;
        align-items: center;

        .detail-label {
          font-size: 24rpx;
          color: @gy2;
          margin-right: 8rpx;
        }

        .detail-value {
          font-size: 24rpx;
          color: @gy1;
          font-weight: 500;
        }
      }
    }
  }

  .item-actions {
    display: flex;
    gap: 16rpx;
    padding-top: 20rpx;
    border-top: 1rpx solid #f5f5f5;

    :deep(.t-button) {
      flex: 1;
      border-radius: 8rpx;
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
  height: calc(32rpx + constant(safe-area-inset-bottom));
  height: calc(32rpx + env(safe-area-inset-bottom));
}

// 时间选择器
.time-picker,
.venue-picker,
.status-picker {
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
    max-height: 600rpx;

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

      .status-option {
        display: flex;
        align-items: center;
        gap: 12rpx;

        .status-dot {
          width: 16rpx;
          height: 16rpx;
          border-radius: 50%;

          &.all {
            background: #999;
          }

          &.online {
            background: #34c759;
          }

          &.offline {
            background: #ff4d4f;
          }
        }
      }
    }
  }
}

// 场地列表
.venue-list {
  max-height: 600rpx;

  .venue-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 28rpx 32rpx;
    font-size: 30rpx;
    color: @gy1;
    border-bottom: 1rpx solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    &.active {
      color: @brand7-normal;
      background: rgba(0, 82, 217, 0.05);
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
