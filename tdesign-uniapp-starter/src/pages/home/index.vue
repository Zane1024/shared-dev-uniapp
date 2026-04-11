<template>
  <view class="dashboard-container">
    <!-- 固定的自定义导航栏 -->
    <view class="custom-nav-bar-fixed" :style="{ height: navBarHeight + 'px', paddingTop: statusBarHeight + 'px' }">
      <view class="nav-bar-content">
        <text class="nav-title">共享设备管理</text>
      </view>
    </view>

    <!-- 导航栏占位 -->
    <view class="nav-bar-placeholder" :style="{ height: (navBarHeight + statusBarHeight) + 'px' }"></view>

    <!-- 可滚动内容区 -->
    <t-pull-down-refresh
      class="scroll-content"
      :value="isRefreshing"
      :loading-texts="['下拉刷新', '松手刷新', '正在刷新', '刷新完成']"
      @refresh="onPullDownRefresh"
    >
      <!-- 头部销售看板 -->
      <view class="header-section" :style="{ paddingTop: headerPadding + 'px' }">
        <view class="header-bg"></view>
        <view class="header-content">
          <view class="sales-header">
            <view class="sales-title">
              <text class="title-text">今日销售</text>
            </view>
            <view class="time-filter" @click="showTimePopup = true">
              <text class="filter-text">{{ currentTimeLabel }}</text>
              <t-icon name="chevron-down" size="12" color="#fff" />
            </view>
          </view>

          <view class="sales-amount">
            <text class="currency">¥</text>
            <text class="amount">{{ formatMoney(dashboardData.todaySales) }}</text>
          </view>
        </view>
      </view>

      <!-- 收益统计卡片 -->
      <view class="stats-section">
        <view class="stats-grid">
          <view
            v-for="item in statItems"
            :key="item.valueKey"
            class="stat-card"
            @click="goToStatistics"
          >
            <view :class="['stat-icon', item.iconClass]">
              <t-icon :name="item.icon" size="20" color="#fff" />
            </view>
            <view class="stat-info">
              <text class="stat-label">{{ item.label }}</text>
              <text class="stat-value">{{ formatMoney(dashboardData[item.valueKey as keyof typeof dashboardData]) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 公告区域 -->
      <view class="notice-section" v-if="dashboardData.announcements?.length">
        <view class="notice-bar">
          <t-icon name="notification" size="16" color="#ff6b6b" />
          <view class="notice-content">
            <swiper
              class="notice-swiper"
              vertical
              autoplay
              circular
              interval="3000"
              duration="500"
              @change="onNoticeChange"
            >
              <swiper-item
                v-for="(item, index) in dashboardData.announcements"
                :key="index"
                class="notice-item"
              >
                <text class="notice-text">{{ item }}</text>
              </swiper-item>
            </swiper>
          </view>
          <t-icon name="chevron-right" size="14" color="#999" />
          <!-- 点击遮罩层 -->
          <view class="notice-click-mask" @click="showNoticePopup"></view>
        </view>
      </view>

      <!-- 核心功能入口 -->
      <view class="features-section">
        <view class="section-title">常用功能</view>
        <view class="features-grid">
          <view class="feature-item" @click="goToStatistics">
            <view class="feature-icon statistics">
              <t-icon name="chart" size="24" color="#fff" />
            </view>
            <text class="feature-name">经营统计</text>
            <text class="feature-desc">数据分析</text>
          </view>

          <view class="feature-item" @click="goToVenue">
            <view class="feature-icon venue">
              <t-icon name="location" size="24" color="#fff" />
            </view>
            <text class="feature-name">场地管理</text>
            <text class="feature-desc">场地维护</text>
          </view>

          <view class="feature-item" @click="bindDevice">
            <view class="feature-icon bind">
              <t-icon name="scan" size="24" color="#fff" />
            </view>
            <text class="feature-name">绑定设备</text>
            <text class="feature-desc">扫码绑定</text>
          </view>

          <view class="feature-item" @click="goToDevices">
            <view class="feature-icon device">
              <t-icon name="server" size="24" color="#fff" />
            </view>
            <text class="feature-name">设备管理</text>
            <text class="feature-desc">设备监控</text>
          </view>
        </view>
      </view>

      <!-- 快捷操作 -->
      <view class="quick-actions">
        <view class="section-title">快捷操作</view>
        <view class="action-list">
          <view
            v-for="item in actionItems"
            :key="item.handler"
            class="action-item"
            @click="handleAction(item.handler)"
          >
            <view class="action-left">
              <view :class="['action-icon', item.iconClass]">
                <t-icon :name="item.icon" size="18" color="#fff" />
              </view>
              <view class="action-info">
                <text class="action-title">{{ item.title }}</text>
                <text class="action-desc">{{ item.desc }}</text>
              </view>
            </view>
            <t-icon name="chevron-right" size="16" color="#ccc" />
          </view>
        </view>
      </view>

      <!-- 底部占位 -->
      <view class="bottom-placeholder"></view>
    </t-pull-down-refresh>

    <!-- 日期时间选择器 -->
    <DateTimePicker
      v-model:visible="showTimePopup"
      v-model="timeRange"
      @confirm="onTimeConfirm"
    />

    <!-- 公告详情弹窗 -->
    <NoticeDialog
      v-model:visible="showNoticeDialog"
      :content="currentNotice"
    />
	<view style="height: 100px;"></view>
    <CustomTabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import CustomTabBar from '@/components/custom-tab-bar.vue';
import DateTimePicker from '@/components/date-time-picker.vue';
import NoticeDialog from '@/components/notice-dialog.vue';
import request from '@/api/request';
import { useSystemInfo } from '@/utils/system';
import { formatMoney, formatDateShort } from '@/utils/format';
import { navigateTo } from '@/utils/navigate';

// 系统信息
const { statusBarHeight, navBarHeight } = useSystemInfo();

// 计算头部padding（考虑状态栏）
const headerPadding = 16;

// 时间筛选
const timeRange = ref('today');
const showTimePopup = ref(false);
const dateRange = ref<string[]>([]);

const currentTimeLabel = computed(() => {
  if (timeRange.value === 'custom' && dateRange.value.length === 2) {
    return `${formatDateShort(dateRange.value[0])} - ${formatDateShort(dateRange.value[1])}`;
  }
  const labels: Record<string, string> = { today: '今日', week: '本周', month: '本月', custom: '日历选择' };
  return labels[timeRange.value] || '今日';
});

// 公告弹框
const showNoticeDialog = ref(false);
const currentNoticeIndex = ref(0);
const currentNotice = computed(() => {
  const announcements = dashboardData.value.announcements;
  if (announcements.length === 0) return '';
  return announcements[currentNoticeIndex.value] || announcements[0];
});

// 下拉刷新状态
const isRefreshing = ref(false);

// 仪表板数据
const dashboardData = ref({
  todaySales: 0,
  todayCoinAmount: 0,
  adRevenue: 0,
  totalCoinAmount: 0,
  totalRevenue: 0,
  announcements: [] as string[],
});

// 统计数据项配置
const statItems = [
  { label: '今日投币', valueKey: 'todayCoinAmount', icon: 'money', iconClass: 'coin' },
  { label: '广告收益', valueKey: 'adRevenue', icon: 'chart-pie', iconClass: 'ad' },
  { label: '累计投币', valueKey: 'totalCoinAmount', icon: 'coins', iconClass: 'total-coin' },
  { label: '累计收益', valueKey: 'totalRevenue', icon: 'wallet', iconClass: 'total-revenue' },
];

// 快捷操作项配置
const actionItems = [
  { title: '设备列表', desc: '查看所有设备状态', icon: 'list', iconClass: 'device-list', handler: 'goToDevices' },
  { title: '积分商城', desc: '兑换商品', icon: 'shop', iconClass: 'mall', handler: 'goToMall' },
  { title: '订单管理', desc: '查看订单记录', icon: 'file-text', iconClass: 'orders', handler: 'goToOrders' },
];

// 获取仪表板数据
const fetchDashboardData = async () => {
  try {
    const res: any = await request('/home/dashboard');
    if (res.code === 200) {
      dashboardData.value = res.data;
    }
  } catch (error) {
    console.error('获取仪表板数据失败:', error);
    uni.showToast({
      title: '数据加载失败',
      icon: 'none',
    });
  }
};

// 下拉刷新
const onPullDownRefresh = async () => {
  isRefreshing.value = true;
  await fetchDashboardData();
  isRefreshing.value = false;
};

// 选择时间选项（由 DateTimePicker 组件触发）
const onTimeConfirm = (result: { timeRange: string; dateRange?: string[] }) => {
  const { timeRange: range, dateRange: dates } = result;
  if (range === 'custom' && dates) {
    dateRange.value = dates;
  } else {
    dateRange.value = [];
  }
  fetchDashboardData();
};

// 公告切换
const onNoticeChange = (e: any) => {
  currentNoticeIndex.value = e.detail.current;
};

// 显示公告弹框
const showNoticePopup = () => {
  showNoticeDialog.value = true;
};

// 跳转到经营统计
const goToStatistics = () => {
  navigateTo('/pages/data-center/index');
};

// 跳转到场地管理
const goToVenue = () => {
  navigateTo('/pages/venue/index');
};

// 绑定设备（扫码）
const bindDevice = () => {
  navigateTo('/pages/device-bind/index');
};

// 跳转到设备管理
const goToDevices = () => {
  navigateTo('/pages/device-list/index');
};

// 跳转到积分商城
const goToMall = () => {
  uni.showToast({
    title: '积分商城开发中',
    icon: 'none',
  });
};

// 跳转到订单管理
const goToOrders = () => {
  uni.showToast({
    title: '订单管理开发中',
    icon: 'none',
  });
};

// 统一处理快捷操作
const handleAction = (handler: string) => {
  const handlers: Record<string, () => void> = {
    goToDevices,
    goToMall,
    goToOrders,
  };
  handlers[handler]?.();
};

onMounted(() => {
  fetchDashboardData();
});
</script>

<style lang="less" scoped>
@import '@/styles/variable.less';

.dashboard-container {
  height: 100vh;
  background-color: @bg-color;
  display: flex;
  flex-direction: column;
}

// 固定的自定义导航栏
.custom-nav-bar-fixed {
  background: @brand7-normal;
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;

  .nav-bar-content {
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;

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

// 可滚动内容区
.scroll-content {
  flex: 1;
  background-color: @bg-color;
}

// 头部销售看板
.header-section {
  position: relative;
  padding: 24rpx 32rpx 48rpx;
  overflow: hidden;

  .header-bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 100%;
    background: @brand7-normal;
  }

  .header-content {
    position: relative;
    z-index: 1;
  }

  .sales-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;

    .sales-title {
      display: flex;
      align-items: center;
      gap: 12rpx;

      .title-text {
        font-size: 28rpx;
        font-weight: 500;
        color: #fff;
      }
    }

    .time-filter {
      display: flex;
      align-items: center;
      gap: 4rpx;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 32rpx;
      padding: 8rpx 20rpx;

      .filter-text {
        font-size: 24rpx;
        color: #fff;
      }
    }
  }

  .sales-amount {
    display: flex;
    align-items: baseline;
    gap: 8rpx;
    margin-bottom: 12rpx;

    .currency {
      font-size: 36rpx;
      color: #fff;
      font-weight: 500;
    }

    .amount {
      font-size: 64rpx;
      font-weight: 700;
      color: #fff;
      line-height: 1;
    }
  }

}

// 收益统计卡片
.stats-section {
  padding: 0 32rpx;
  margin-top: -32rpx;
  position: relative;
  z-index: 2;

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20rpx;
  }

  .stat-card {
    background: #fff;
    border-radius: 20rpx;
    padding: 28rpx;
    display: flex;
    align-items: center;
    gap: 20rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);

    .stat-icon {
      width: 72rpx;
      height: 72rpx;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.coin {
        background: linear-gradient(135deg, #ff9500 0%, #ffb84d 100%);
      }

      &.ad {
        background: linear-gradient(135deg, #5856d6 0%, #a29bfe 100%);
      }

      &.total-coin {
        background: linear-gradient(135deg, #34c759 0%, #85e085 100%);
      }

      &.total-revenue {
        background: linear-gradient(135deg, #ff2d55 0%, #ff6b9d 100%);
      }
    }

    .stat-info {
      display: flex;
      flex-direction: column;
      gap: 6rpx;
      min-width: 0;

      .stat-label {
        font-size: 22rpx;
        color: @gy2;
      }

      .stat-value {
        font-size: 28rpx;
        font-weight: 600;
        color: @gy1;
      }
    }
  }
}

// 公告区域
.notice-section {
  padding: 20rpx 32rpx;

  .notice-bar {
    background: #fff;
    border-radius: 16rpx;
    padding: 20rpx 24rpx;
    display: flex;
    align-items: center;
    gap: 16rpx;
    box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
    position: relative;

    .notice-click-mask {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 10;
    }

    .notice-content {
      flex: 1;
      height: 36rpx;
      overflow: hidden;

      .notice-swiper {
        height: 36rpx;

        .notice-item {
          display: flex;
          align-items: center;
          height: 36rpx;

          .notice-text {
            font-size: 26rpx;
            color: @gy1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }
}

// 核心功能入口
.features-section {
  padding: 20rpx 32rpx;

  .section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: @gy1;
    margin-bottom: 20rpx;
  }

  .features-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12rpx;
    background: #fff;
    border-radius: 20rpx;
    padding: 28rpx 16rpx;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  }

  .feature-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8rpx;
    padding: 12rpx 0;

    .feature-icon {
      width: 88rpx;
      height: 88rpx;
      border-radius: 20rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      &.statistics {
        background: linear-gradient(135deg, #0052d9 0%, #4a90e2 100%);
      }

      &.venue {
        background: linear-gradient(135deg, #34c759 0%, #85e085 100%);
      }

      &.bind {
        background: linear-gradient(135deg, #ff9500 0%, #ffb84d 100%);
      }

      &.device {
        background: linear-gradient(135deg, #5856d6 0%, #a29bfe 100%);
      }
    }

    .feature-name {
      font-size: 24rpx;
      color: @gy1;
      font-weight: 500;
    }

    .feature-desc {
      font-size: 20rpx;
      color: @gy2;
    }
  }
}

// 快捷操作
.quick-actions {
  padding: 20rpx 32rpx;

  .section-title {
    font-size: 30rpx;
    font-weight: 600;
    color: @gy1;
    margin-bottom: 20rpx;
  }

  .action-list {
    background: #fff;
    border-radius: 20rpx;
    overflow: hidden;
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  }

  .action-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 28rpx 24rpx;

    &:not(:last-child) {
      border-bottom: 1rpx solid #f5f5f5;
    }

    .action-left {
      display: flex;
      align-items: center;
      gap: 20rpx;
    }

    .action-icon {
      width: 64rpx;
      height: 64rpx;
      border-radius: 14rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;

      &.device-list {
        background: linear-gradient(135deg, #0052d9 0%, #4a90e2 100%);
      }

      &.mall {
        background: linear-gradient(135deg, #ff2d55 0%, #ff6b9d 100%);
      }

      &.orders {
        background: linear-gradient(135deg, #5856d6 0%, #a29bfe 100%);
      }
    }

    .action-info {
      display: flex;
      flex-direction: column;
      gap: 6rpx;

      .action-title {
        font-size: 28rpx;
        font-weight: 500;
        color: @gy1;
      }

      .action-desc {
        font-size: 24rpx;
        color: @gy2;
      }
    }
  }
}

// 自定义日历弹框顶部距离（避开胶囊按钮）
:deep(.t-calendar__popup) {
  top: 200rpx !important;
  border-radius: 24rpx 24rpx 0 0;
}

:deep(.t-calendar__header) {
  border-radius: 24rpx 24rpx 0 0;
}

.bottom-placeholder {
  height: calc(32rpx + constant(safe-area-inset-bottom));
  height: calc(32rpx + env(safe-area-inset-bottom));
}
</style>
