<template>
  <view class="device-container">
    <!-- 使用 TDesign 导航栏组件 -->
    <t-navbar title="设备列表" left-arrow @left-click="goBack" />

    <!-- 搜索和筛选区域 -->
    <view class="search-filter-section">
      <!-- 搜索框 -->
      <view class="search-wrapper">
        <t-search
          v-model="searchKey"
          placeholder="搜索设备名称、编号或场地"
          shape="round"
          action="搜索"
          clearable
          @submit="handleSearch"
          @clear="handleClearSearch"
          @focus="handleSearchFocus"
          class="custom-search"
        />
      </view>

      <!-- 筛选和排序工具栏 -->
      <view class="toolbar-section">
        <view class="filter-tags">
          <t-tag
            v-if="selectedVenueId"
            size="small"
            theme="primary"
            variant="outline"
            closable
            @close="clearVenueFilter"
            class="filter-tag"
          >
            <t-icon name="location" size="14" />
            场地: {{ currentVenueName }}
          </t-tag>
          
          <t-tag
            v-if="selectedStatus"
            size="small"
            :theme="selectedStatus === 'online' ? 'success' : 'warning'"
            variant="outline"
            closable
            @close="clearStatusFilter"
            class="filter-tag"
          >
            <t-icon :name="selectedStatus === 'online' ? 'check-circle' : 'close-circle'" size="14" />
            状态: {{ currentStatusName }}
          </t-tag>
          
          <t-tag
            v-if="timeRange !== 'today'"
            size="small"
            theme="default"
            variant="outline"
            closable
            @close="clearTimeFilter"
            class="filter-tag"
          >
            <t-icon name="calendar" size="14" />
            时间: {{ currentTimeLabel }}
          </t-tag>
        </view>

        <!-- 筛选排序按钮 -->
        <view class="toolbar-actions">
          <t-dropdown-menu :show-overlay="false">
            <t-dropdown-item
              :title="currentSortLabel"
              :options="sortOptions"
              @change="handleSortChange"
            />
          </t-dropdown-menu>
          
          <t-button
            theme="primary"
            variant="outline"
            size="small"
            @click="showFilterPanel = true"
            class="filter-btn"
          >
            <template #icon>
              <t-icon name="filter" size="16" />
            </template>
            筛选
          </t-button>
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
      <!-- 加载状态 -->
      <view v-if="loading && !isRefreshing" class="loading-container">
        <t-skeleton theme="paragraph" :row-col="skeletonRowCol" />
      </view>

      <!-- 设备列表 -->
      <view class="device-list" v-else-if="deviceList.length > 0">
        <view
          class="device-card"
          v-for="item in deviceList"
          :key="item.id"
          @click="handleDeviceDetail(item)"
        >
          <!-- 设备头部 -->
          <view class="device-header">
            <view class="device-title-section">
              <view class="device-title-row">
                <text class="device-name">{{ item.name }}</text>
                <t-badge
                  :theme="item.status === 'online' ? 'success' : 'danger'"
                  shape="circle"
                  size="small"
                  class="status-badge"
                >
                  <view class="badge-content">
                    <t-icon
                      :name="item.status === 'online' ? 'check-circle-filled' : 'close-circle-filled'"
                      :color="item.status === 'online' ? '#34c759' : '#ff4d4f'"
                      size="12"
                    />
                    <text class="status-text">{{ item.status === 'online' ? '在线' : '离线' }}</text>
                  </view>
                </t-badge>
              </view>
              <text class="device-subtitle">代理编号: {{ item.agentCode }}</text>
            </view>
            
            <t-button
              theme="default"
              variant="text"
              size="small"
              @click.stop="showDeviceActions(item)"
              class="more-actions-btn"
            >
              <template #icon>
                <t-icon name="more" size="20" />
              </template>
            </t-button>
          </view>

          <!-- 设备信息网格 -->
          <view class="device-info-grid">
            <view class="info-item">
              <t-icon name="chip" size="16" color="#666" />
              <view class="info-content">
                <text class="info-label">硬件版本</text>
                <text class="info-value">{{ item.hardwareVersion }}</text>
              </view>
            </view>
            
            <view class="info-item">
              <t-icon name="sim-card" size="16" color="#666" />
              <view class="info-content">
                <text class="info-label">流量卡号</text>
                <text class="info-value truncated">{{ item.simCardNo }}</text>
              </view>
            </view>
            
            <view class="info-item">
              <t-icon name="location" size="16" color="#666" />
              <view class="info-content">
                <text class="info-label">场地</text>
                <text class="info-value">{{ item.venueName }}</text>
              </view>
            </view>
            
            <view class="info-item">
              <t-icon name="time" size="16" color="#666" />
              <view class="info-content">
                <text class="info-label">最后在线</text>
                <text class="info-value">{{ formatLastOnline(item.lastOnline) }}</text>
              </view>
            </view>
          </view>

          <!-- 设备操作栏 -->
          <view class="device-actions">
            <t-button
              theme="primary"
              variant="outline"
              size="small"
              @click.stop="handleDeviceConfig(item)"
              class="action-btn"
            >
              <template #icon>
                <t-icon name="setting" size="14" />
              </template>
              配置
            </t-button>
            
            <t-button
              :theme="item.status === 'online' ? 'warning' : 'default'"
              variant="outline"
              size="small"
              @click.stop="handleDeviceRestart(item)"
              :disabled="item.status === 'offline'"
              class="action-btn"
            >
              <template #icon>
                <t-icon name="refresh" size="14" />
              </template>
              重启
            </t-button>
            
            <t-button
              theme="primary"
              variant="text"
              size="small"
              @click.stop="handleDeviceDetail(item)"
              class="action-btn"
            >
              详情
              <template #suffix>
                <t-icon name="chevron-right" size="14" />
              </template>
            </t-button>
          </view>
        </view>

        <!-- 加载更多 -->
        <view class="load-more-section" v-if="hasMore">
          <t-button
            theme="default"
            variant="text"
            size="small"
            :loading="loadingMore"
            @click="loadMore"
            class="load-more-btn"
          >
            {{ loadingMore ? '加载中...' : '加载更多' }}
          </t-button>
        </view>
        
        <view class="no-more-tips" v-else-if="deviceList.length > 0">
          <t-divider>已加载全部设备</t-divider>
        </view>
      </view>

      <!-- 空状态 -->
      <view class="empty-state" v-else>
        <t-empty
          :icon="searchKey ? 'search' : 'list'"
          :description="searchKey ? '没有找到相关设备' : '暂无设备数据'"
        >
          <template v-if="searchKey" #action>
            <t-button theme="primary" variant="outline" @click="handleClearSearch">
              清除搜索条件
            </t-button>
          </template>
          <template v-else #action>
            <t-button theme="primary" @click="refreshDeviceList">
              刷新设备列表
            </t-button>
          </template>
        </t-empty>
      </view>

      <!-- 底部安全区域 -->
      <view class="safe-area-bottom"></view>
    </t-pull-down-refresh>

    <!-- 综合筛选面板 -->
    <t-popup
      v-model:visible="showFilterPanel"
      placement="right"
      :close-on-overlay-click="false"
      class="filter-panel-popup"
    >
      <view class="filter-panel">
        <view class="filter-header">
          <view class="filter-title-section">
            <t-icon name="filter" size="24" color="#0052d9" />
            <text class="filter-title">筛选设备</text>
          </view>
          <t-button theme="default" variant="text" size="small" @click="showFilterPanel = false">
            <template #icon>
              <t-icon name="close" size="20" />
            </template>
          </t-button>
        </view>

        <scroll-view scroll-y class="filter-content">
          <!-- 状态筛选 -->
          <view class="filter-section">
            <text class="filter-section-title">设备状态</text>
            <view class="filter-options">
              <t-radio-group v-model="selectedStatus">
                <view class="radio-options">
                  <t-radio
                    v-for="option in statusOptions"
                    :key="option.value"
                    :value="option.value"
                    :label="option.label"
                    class="status-radio"
                  >
                    <template #icon>
                      <view :class="['status-indicator', option.value || 'all']">
                        <t-icon
                          v-if="option.value === 'online'"
                          name="check-circle-filled"
                          size="14"
                          color="#34c759"
                        />
                        <t-icon
                          v-else-if="option.value === 'offline'"
                          name="close-circle-filled"
                          size="14"
                          color="#ff4d4f"
                        />
                        <t-icon v-else name="minus-circle-filled" size="14" color="#999" />
                      </view>
                    </template>
                  </t-radio>
                </view>
              </t-radio-group>
            </view>
          </view>

          <!-- 场地筛选 -->
          <view class="filter-section">
            <text class="filter-section-title">场地</text>
            <view class="venue-selector" @click="showVenuePopup = true">
              <view class="venue-picker-display">
                <text>{{ currentVenueName }}</text>
                <t-icon name="chevron-down" size="16" />
              </view>
            </view>
          </view>

          <!-- 场地选择弹窗 -->
          <t-popup v-model:visible="showVenuePopup" placement="bottom" round>
            <view class="venue-popup">
              <view class="venue-popup__header">
                <text class="venue-popup__title">选择场地</text>
                <t-icon name="close" size="20" @click="showVenuePopup = false" />
              </view>
              <view class="venue-popup__content">
                <view
                  v-for="option in venueOptions"
                  :key="option.id"
                  class="venue-popup__item"
                  :class="{ 'venue-popup__item--active': selectedVenueId === option.id }"
                  @click="selectVenue(option)"
                >
                  <text>{{ option.name }}</text>
                  <t-icon v-if="selectedVenueId === option.id" name="check" size="16" color="#0052d9" />
                </view>
                <view
                  class="venue-popup__item venue-popup__item--all"
                  :class="{ 'venue-popup__item--active': selectedVenueId === '' }"
                  @click="selectVenue({ id: '', name: '全部场地' })"
                >
                  <text>全部场地</text>
                  <t-icon v-if="selectedVenueId === ''" name="check" size="16" color="#0052d9" />
                </view>
              </view>
            </view>
          </t-popup>

          <!-- 时间筛选 -->
          <view class="filter-section">
            <text class="filter-section-title">时间范围</text>
            <view class="time-options">
              <t-radio-group v-model="timeRange">
                <view class="time-grid">
                  <t-radio
                    v-for="option in timeOptions"
                    :key="option.value"
                    :value="option.value"
                    :label="option.label"
                    class="time-radio"
                  />
                </view>
              </t-radio-group>
              
              <view v-if="timeRange === 'custom'" class="custom-date-range">
                <t-calendar
                  :min-date="minDate"
                  :max-date="maxDate"
                  :value="tempDateRange"
                  type="range"
                  @select="onDateSelect"
                  @confirm="onDateConfirm"
                  class="inline-calendar"
                />
              </view>
            </view>
          </view>

          <!-- 排序方式 -->
          <view class="filter-section">
            <text class="filter-section-title">排序方式</text>
            <view class="sort-options">
              <t-radio-group v-model="currentSort">
                <view class="sort-grid">
                  <t-radio
                    v-for="option in sortOptions"
                    :key="option.value"
                    :value="option.value"
                    :label="option.label"
                    class="sort-radio"
                  />
                </view>
              </t-radio-group>
            </view>
          </view>
        </scroll-view>

        <view class="filter-footer">
          <t-button theme="default" variant="outline" @click="resetFilters" class="reset-btn">
            重置筛选
          </t-button>
          <t-button theme="primary" @click="applyFilters" class="apply-btn">
            应用筛选
          </t-button>
        </view>
      </view>
    </t-popup>

    <!-- 设备操作菜单 -->
    <t-action-sheet
      v-model:visible="showDeviceActionSheet"
      :actions="deviceActions"
      :description="selectedDevice ? `设备: ${selectedDevice.name}` : ''"
      cancel-text="取消"
      @select="handleDeviceActionSelect"
    />

    <!-- 日期选择器弹窗 -->
    <t-calendar
      v-model:visible="showCalendar"
      :min-date="minDate"
      :max-date="maxDate"
      :value="tempDateRange"
      type="range"
      @confirm="onDateConfirm"
      @select="onDateSelect"
      class="date-range-calendar"
    >
      <template #title>
        <view class="calendar-header">
          <text class="calendar-title">选择日期范围</text>
          <text class="calendar-subtitle">最多可选择60天</text>
        </view>
      </template>
    </t-calendar>

    <!-- 操作结果提示 -->
    <t-toast ref="toastRef" />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { ActionSheetItem } from '@tdesign/uniapp/action-sheet';

interface Device {
  id: number;
  name: string;
  agentCode: string;
  hardwareVersion: string;
  simCardNo: string;
  venueName: string;
  status: 'online' | 'offline';
  lastOnline?: string;
  createdAt: string;
}

interface Venue {
  id: string;
  name: string;
}

// 工具函数 - 先定义工具函数
function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}-${day}`;
}

function formatLastOnline(dateStr?: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  
  if (diffHours < 1) {
    return '刚刚';
  } else if (diffHours < 24) {
    return `${diffHours}小时前`;
  } else {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}天前`;
  }
}

function toLocalDateString(ts: number): string {
  const d = new Date(ts);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 搜索和筛选状态
const searchKey = ref('');
const showFilterPanel = ref(false);

// 时间筛选
const timeRange = ref('today');
const timeOptions = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '自定义范围', value: 'custom' },
] as const;

const currentTimeLabel = computed(() => {
  if (timeRange.value === 'custom' && dateRange.value.length === 2) {
    const start = dateRange.value[0];
    const end = dateRange.value[1];
    return `${start ? formatDateShort(start) : ''} - ${end ? formatDateShort(end) : ''}`;
  }
  return timeOptions.find(opt => opt.value === timeRange.value)?.label || '今日';
});

// 场地筛选
const selectedVenueId = ref('');
const venueOptions = ref<Venue[]>([
  { id: '1', name: '旗舰体验店' },
  { id: '2', name: '龙华商城店' },
  { id: '3', name: '福田CBD店' },
]);
const showVenuePopup = ref(false);

const currentVenueName = computed(() => {
  if (selectedVenueId.value === '') return '全部场地';
  return venueOptions.value.find(v => v.id === selectedVenueId.value)?.name || '全部场地';
});

const selectVenue = (venue: { id: string; name: string }) => {
  selectedVenueId.value = venue.id;
  showVenuePopup.value = false;
};

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

// 排序
const currentSort = ref('time-desc');
const sortOptions = [
  { label: '最新添加', value: 'time-desc' },
  { label: '最早添加', value: 'time-asc' },
  { label: '名称A-Z', value: 'name-asc' },
  { label: '名称Z-A', value: 'name-desc' },
  { label: '在线优先', value: 'status-online' },
] as const;

const currentSortLabel = computed(() => {
  return sortOptions.find(opt => opt.value === currentSort.value)?.label || '最新添加';
});

// 日期选择
const showCalendar = ref(false);
const dateRange = ref<string[]>([]);
const tempDateRange = ref<number[]>([]);

const today = new Date();
const maxDate = ref(new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000).getTime());
const minDate = ref(new Date(today.getTime() - 365 * 24 * 60 * 60 * 1000).getTime());

// 列表数据状态
const deviceList = ref<Device[]>([]);
const loading = ref(true);
const loadingMore = ref(false);
const isRefreshing = ref(false);
const hasMore = ref(false);
const pageNum = ref(1);
const pageSize = 10;
const total = ref(0);

// 骨架屏配置
const skeletonRowCol = ref([
  { width: '100%', height: '200rpx', borderRadius: '16rpx' },
  { width: '100%', height: '200rpx', borderRadius: '16rpx', marginTop: '20rpx' },
  { width: '100%', height: '200rpx', borderRadius: '16rpx', marginTop: '20rpx' },
]);

// 设备操作
const showDeviceActionSheet = ref(false);
const selectedDevice = ref<Device | null>(null);
const deviceActions = computed<ActionSheetItem[]>(() => [
  { name: 'detail', label: '设备详情', icon: 'view' },
  { name: 'config', label: '设备配置', icon: 'setting' },
  { 
    name: 'restart', 
    label: '重启设备', 
    icon: 'refresh',
    disabled: selectedDevice.value?.status === 'offline'
  },
  { name: 'unbind', label: '解除绑定', icon: 'unlink', color: '#ff4d4f' },
]);

const validateDateRange = (startTs: number, endTs: number): boolean => {
  const daysDiff = Math.floor((endTs - startTs) / (1000 * 60 * 60 * 24));
  return daysDiff <= 60;
};

// 数据获取
const fetchDeviceList = async (reset = false) => {
  try {
    if (reset) {
      pageNum.value = 1;
      loading.value = true;
    } else if (pageNum.value > 1) {
      loadingMore.value = true;
    }

    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 800));

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
        lastOnline: new Date().toISOString(),
        createdAt: '2024-01-15',
      },
      {
        id: 2,
        name: '共享按摩椅-A02',
        agentCode: 'AG2024010002',
        hardwareVersion: 'V2.1.5',
        simCardNo: '15812345678902',
        venueName: '旗舰体验店',
        status: 'online',
        lastOnline: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        createdAt: '2024-01-16',
      },
      {
        id: 3,
        name: '共享按摩椅-B01',
        agentCode: 'AG2024010003',
        hardwareVersion: 'V2.0.8',
        simCardNo: '15812345678903',
        venueName: '龙华商城店',
        status: 'offline',
        lastOnline: '2024-03-20T08:00:00Z',
        createdAt: '2024-01-20',
      },
      {
        id: 4,
        name: '共享按摩椅-B02',
        agentCode: 'AG2024010004',
        hardwareVersion: 'V2.1.5',
        simCardNo: '15812345678904',
        venueName: '龙华商城店',
        status: 'online',
        lastOnline: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        createdAt: '2024-01-22',
      },
      {
        id: 5,
        name: '共享按摩椅-C01',
        agentCode: 'AG2024010005',
        hardwareVersion: 'V2.1.0',
        simCardNo: '15812345678905',
        venueName: '福田CBD店',
        status: 'online',
        lastOnline: new Date().toISOString(),
        createdAt: '2024-01-25',
      },
      {
        id: 6,
        name: '共享按摩椅-C02',
        agentCode: 'AG2024010006',
        hardwareVersion: 'V2.1.5',
        simCardNo: '15812345678906',
        venueName: '福田CBD店',
        status: 'offline',
        lastOnline: '2024-03-18T14:30:00Z',
        createdAt: '2024-01-28',
      },
      {
        id: 7,
        name: '共享按摩椅-D01',
        agentCode: 'AG2024010007',
        hardwareVersion: 'V2.2.0',
        simCardNo: '15812345678907',
        venueName: '旗舰体验店',
        status: 'online',
        lastOnline: new Date().toISOString(),
        createdAt: '2024-02-01',
      },
      {
        id: 8,
        name: '共享按摩椅-D02',
        agentCode: 'AG2024010008',
        hardwareVersion: 'V2.2.0',
        simCardNo: '15812345678908',
        venueName: '福田CBD店',
        status: 'online',
        lastOnline: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        createdAt: '2024-02-05',
      },
    ];

    // 应用筛选条件
    let filteredData = [...mockData];

    // 场地筛选
    if (selectedVenueId.value) {
      filteredData = filteredData.filter(d => 
        d.venueName === venueOptions.value.find(v => v.id === selectedVenueId.value)?.name
      );
    }

    // 状态筛选
    if (selectedStatus.value) {
      filteredData = filteredData.filter(d => d.status === selectedStatus.value);
    }

    // 搜索筛选
    if (searchKey.value.trim()) {
      const key = searchKey.value.toLowerCase().trim();
      filteredData = filteredData.filter(d =>
        d.name.toLowerCase().includes(key) ||
        d.agentCode.toLowerCase().includes(key) ||
        d.venueName.toLowerCase().includes(key) ||
        d.simCardNo.includes(key)
      );
    }

    // 应用排序
    filteredData.sort((a, b) => {
      switch (currentSort.value) {
        case 'time-desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'time-asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name-asc':
          return a.name.localeCompare(b.name);
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'status-online':
          if (a.status === 'online' && b.status !== 'online') return -1;
          if (a.status !== 'online' && b.status === 'online') return 1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    total.value = filteredData.length;
    
    // 分页处理
    const start = (pageNum.value - 1) * pageSize;
    const end = start + pageSize;
    const pagedData = filteredData.slice(start, end);
    
    if (reset) {
      deviceList.value = pagedData;
    } else {
      deviceList.value = [...deviceList.value, ...pagedData];
    }
    
    hasMore.value = end < filteredData.length;
    
  } catch (error) {
    console.error('获取设备列表失败:', error);
    uni.showToast({
      title: '数据加载失败',
      icon: 'error',
      duration: 2000,
    });
  } finally {
    loading.value = false;
    loadingMore.value = false;
    isRefreshing.value = false;
  }
};

// 搜索相关
const handleSearch = (value: any) => {
  const searchValue = typeof value === 'string' ? value : (value?.detail?.value || searchKey.value);
  searchKey.value = searchValue;
  fetchDeviceList(true);
};

const handleClearSearch = () => {
  searchKey.value = '';
  fetchDeviceList(true);
};

const handleSearchFocus = () => {
  // 可以添加搜索历史或热门搜索
};

// 筛选相关

const handleSortChange = (value: string) => {
  currentSort.value = value;
  fetchDeviceList(true);
};

const applyFilters = () => {
  showFilterPanel.value = false;
  fetchDeviceList(true);
};

const resetFilters = () => {
  selectedStatus.value = '';
  selectedVenueId.value = '';
  timeRange.value = 'today';
  dateRange.value = [];
  currentSort.value = 'time-desc';
};

const clearVenueFilter = () => {
  selectedVenueId.value = '';
  fetchDeviceList(true);
};

const clearStatusFilter = () => {
  selectedStatus.value = '';
  fetchDeviceList(true);
};

const clearTimeFilter = () => {
  timeRange.value = 'today';
  dateRange.value = [];
  fetchDeviceList(true);
};

// 日期选择
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
  
  dateRange.value = value.map((ts: number) => toLocalDateString(ts));
  timeRange.value = 'custom';
  tempDateRange.value = [];
  showCalendar.value = false;
  fetchDeviceList(true);
};

// 列表操作
const onPullDownRefresh = async () => {
  isRefreshing.value = true;
  await fetchDeviceList(true);
  uni.stopPullDownRefresh();
};

const loadMore = () => {
  if (!hasMore.value || loadingMore.value) return;
  pageNum.value += 1;
  fetchDeviceList(false);
};

const refreshDeviceList = () => {
  fetchDeviceList(true);
};

// 设备操作
const showDeviceActions = (device: Device) => {
  selectedDevice.value = device;
  showDeviceActionSheet.value = true;
};

const handleDeviceActionSelect = (action: ActionSheetItem) => {
  if (!selectedDevice.value) return;
  
  switch (action.name) {
    case 'detail':
      handleDeviceDetail(selectedDevice.value);
      break;
    case 'config':
      handleDeviceConfig(selectedDevice.value);
      break;
    case 'restart':
      handleDeviceRestart(selectedDevice.value);
      break;
    case 'unbind':
      handleDeviceUnbind(selectedDevice.value);
      break;
  }
  
  showDeviceActionSheet.value = false;
};

const handleDeviceDetail = (device: Device) => {
  uni.showToast({
    title: `查看 ${device.name} 详情`,
    icon: 'none',
  });
  // 实际项目中这里应该跳转到设备详情页
  // uni.navigateTo({ url: `/pages/device-detail/index?id=${device.id}` });
};

const handleDeviceConfig = (device: Device) => {
  uni.showModal({
    title: '设备配置',
    content: `确定要配置设备"${device.name}"吗？`,
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '打开配置页面',
          icon: 'success',
        });
      }
    },
  });
};

const handleDeviceRestart = (device: Device) => {
  uni.showModal({
    title: '确认重启',
    content: `确定要重启设备"${device.name}"吗？设备将短暂离线`,
    confirmColor: '#ff9500',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '重启指令已发送',
          icon: 'success',
        });
        // 模拟状态更新
        setTimeout(() => {
          const index = deviceList.value.findIndex(d => d.id === device.id);
          if (index !== -1) {
            deviceList.value[index].status = 'online';
            deviceList.value[index].lastOnline = new Date().toISOString();
          }
        }, 2000);
      }
    },
  });
};

const handleDeviceUnbind = (device: Device) => {
  uni.showModal({
    title: '确认解除绑定',
    content: `确定要解除设备"${device.name}"的绑定吗？此操作不可恢复`,
    confirmColor: '#ff4d4f',
    success: (res) => {
      if (res.confirm) {
        uni.showToast({
          title: '解除绑定成功',
          icon: 'success',
        });
        // 从列表中移除
        deviceList.value = deviceList.value.filter(d => d.id !== device.id);
        total.value -= 1;
      }
    },
  });
};

// 导航
const goBack = () => {
  uni.navigateBack();
};

// 监听筛选条件变化
watch([selectedStatus, selectedVenueId, timeRange], () => {
  // 筛选条件变化时自动应用（可以添加防抖）
  fetchDeviceList(true);
}, { deep: true });

// 初始化
onMounted(() => {
  fetchDeviceList(true);
});
</script>

<style lang="less" scoped>
@import '@/styles/variable.less';

.device-container {
  min-height: 100vh;
  background-color: @bg-color;
  display: flex;
  flex-direction: column;
}

// 搜索和筛选区域
.search-filter-section {
  background: #fff;
  padding: 24rpx 32rpx;
  border-bottom: 1rpx solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 100;
  
  .search-wrapper {
    margin-bottom: 24rpx;
    
    .custom-search {
      :deep(.t-search) {
        background: #f5f5f5;
        border-radius: 48rpx;
        
        .t-search__input-container {
          background: transparent;
        }
      }
    }
  }
  
  .toolbar-section {
    .filter-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 12rpx;
      margin-bottom: 16rpx;
      
      .filter-tag {
        :deep(.t-tag) {
          border-radius: 24rpx;
          padding: 8rpx 16rpx;
          font-size: 24rpx;
          
          .t-icon {
            margin-right: 4rpx;
          }
        }
      }
    }
    
    .toolbar-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      :deep(.t-dropdown-menu) {
        flex: 1;
        margin-right: 16rpx;
        
        .t-dropdown-menu__bar {
          background: transparent;
          border: none;
          height: 64rpx;
          
          .t-dropdown-menu__item {
            padding: 0;
            
            .t-dropdown-menu__item-title {
              font-size: 28rpx;
              color: @gy1;
              font-weight: 500;
            }
          }
        }
      }
      
      .filter-btn {
        :deep(.t-button) {
          border-radius: 32rpx;
          padding: 0 24rpx;
          height: 64rpx;
          
          .t-icon {
            margin-right: 8rpx;
          }
        }
      }
    }
  }
}

// 可滚动内容区
.scroll-content {
  flex: 1;
  background-color: @bg-color;
}

// 加载状态
.loading-container {
  padding: 48rpx 32rpx;
  
  :deep(.t-skeleton) {
    .t-skeleton__paragraph {
      background: #fff;
      border-radius: 16rpx;
      overflow: hidden;
    }
  }
}

// 设备列表
.device-list {
  padding: 24rpx 32rpx;
}

.device-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  
  &:active {
    transform: translateY(-2rpx);
    box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.12);
  }
  
  .device-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 24rpx;
    
    .device-title-section {
      flex: 1;
      margin-right: 16rpx;
      
      .device-title-row {
        display: flex;
        align-items: center;
        margin-bottom: 8rpx;
        
        .device-name {
          font-size: 32rpx;
          font-weight: 600;
          color: @gy1;
          margin-right: 12rpx;
          line-height: 1.4;
        }
        
        .status-badge {
          flex-shrink: 0;
          
          :deep(.t-badge) {
            .t-badge__content {
              padding: 4rpx 12rpx;
              border-radius: 20rpx;
              font-size: 20rpx;
              
              .badge-content {
                display: flex;
                align-items: center;
                gap: 4rpx;
                
                .status-text {
                  font-size: 20rpx;
                  font-weight: 500;
                }
              }
            }
            
            &--success {
              .t-badge__content {
                background: rgba(52, 199, 89, 0.1);
                color: #34c759;
              }
            }
            
            &--danger {
              .t-badge__content {
                background: rgba(255, 77, 79, 0.1);
                color: #ff4d4f;
              }
            }
          }
        }
      }
      
      .device-subtitle {
        font-size: 26rpx;
        color: @gy2;
        line-height: 1.4;
      }
    }
    
    .more-actions-btn {
      flex-shrink: 0;
      width: 48rpx;
      height: 48rpx;
      min-width: auto;
      
      :deep(.t-button) {
        width: 100%;
        height: 100%;
        padding: 0;
        
        .t-icon {
          margin: 0;
        }
      }
    }
  }
  
  .device-info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24rpx;
    margin-bottom: 24rpx;
    padding: 24rpx 0;
    border-top: 1rpx solid #f5f5f5;
    border-bottom: 1rpx solid #f5f5f5;
    
    .info-item {
      display: flex;
      align-items: center;
      gap: 12rpx;
      
      .t-icon {
        flex-shrink: 0;
      }
      
      .info-content {
        flex: 1;
        overflow: hidden;
        
        .info-label {
          display: block;
          font-size: 24rpx;
          color: @gy2;
          margin-bottom: 4rpx;
          line-height: 1.4;
        }
        
        .info-value {
          display: block;
          font-size: 26rpx;
          color: @gy1;
          font-weight: 500;
          line-height: 1.4;
          
          &.truncated {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
  }
  
  .device-actions {
    display: flex;
    align-items: center;
    gap: 16rpx;
    
    .action-btn {
      flex: 1;
      
      :deep(.t-button) {
        border-radius: 12rpx;
        height: 64rpx;
        
        .t-icon {
          margin-right: 8rpx;
        }
        
        .t-button__suffix {
          margin-left: 4rpx;
        }
        
        &--disabled {
          opacity: 0.5;
        }
      }
    }
  }
}

// 加载更多
.load-more-section {
  padding: 32rpx 0;
  text-align: center;
  
  .load-more-btn {
    :deep(.t-button) {
      color: @gy2;
      font-size: 28rpx;
      
      &:active {
        color: @gy1;
      }
    }
  }
}

.no-more-tips {
  padding: 32rpx 0;
  
  :deep(.t-divider) {
    .t-divider__inner {
      color: @gy2;
      font-size: 26rpx;
    }
  }
}

// 空状态
.empty-state {
  padding: 120rpx 32rpx;
  text-align: center;
  
  :deep(.t-empty) {
    .t-empty__description {
      color: @gy2;
      font-size: 28rpx;
      margin-top: 16rpx;
    }
    
    .t-empty__action {
      margin-top: 32rpx;
    }
  }
}

// 安全区域
.safe-area-bottom {
  height: calc(32rpx + constant(safe-area-inset-bottom));
  height: calc(32rpx + env(safe-area-inset-bottom));
}

// 筛选面板
.filter-panel-popup {
  :deep(.t-popup) {
    width: 600rpx !important;
    max-width: 100vw;
    
    .t-popup__content {
      border-radius: 32rpx 0 0 32rpx;
    }
  }
}

.filter-panel {
  height: 100vh;
  background: #fff;
  display: flex;
  flex-direction: column;
  
  .filter-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    border-bottom: 1rpx solid #f5f5f5;
    flex-shrink: 0;
    
    .filter-title-section {
      display: flex;
      align-items: center;
      gap: 12rpx;
      
      .filter-title {
        font-size: 36rpx;
        font-weight: 600;
        color: @gy1;
      }
    }
    
    :deep(.t-button) {
      width: 48rpx;
      height: 48rpx;
      min-width: auto;
      padding: 0;
      
      .t-icon {
        margin: 0;
      }
    }
  }
  
  .filter-content {
    flex: 1;
    padding: 32rpx;
    
    .filter-section {
      margin-bottom: 48rpx;
      
      &:last-child {
        margin-bottom: 0;
      }
      
      .filter-section-title {
        display: block;
        font-size: 32rpx;
        font-weight: 600;
        color: @gy1;
        margin-bottom: 24rpx;
      }
      
      .filter-options {
        .radio-options {
          .status-radio {
            margin-bottom: 16rpx;
            
            &:last-child {
              margin-bottom: 0;
            }
            
            :deep(.t-radio) {
              .t-radio__label {
                display: flex;
                align-items: center;
                gap: 12rpx;
                
                .status-indicator {
                  width: 24rpx;
                  height: 24rpx;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  
                  .t-icon {
                    margin: 0;
                  }
                }
              }
            }
          }
        }
      }
      
      .venue-selector {
        .venue-picker-display {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24rpx 32rpx;
          border-radius: 16rpx;
          border: 1rpx solid #e7e7e7;
          background: #fff;
          font-size: 28rpx;
          color: @gy1;
        }
      }
      
      .time-options {
        .time-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16rpx;
          margin-bottom: 24rpx;
          
          .time-radio {
            :deep(.t-radio) {
              .t-radio__label {
                display: block;
                text-align: center;
                padding: 24rpx 16rpx;
                border: 1rpx solid #e7e7e7;
                border-radius: 12rpx;
                font-size: 28rpx;
                color: @gy1;
                
                &:active {
                  background: #f5f5f5;
                }
              }
              
              &--checked {
                .t-radio__label {
                  border-color: @brand7-normal;
                  color: @brand7-normal;
                  background: rgba(0, 82, 217, 0.05);
                }
              }
            }
          }
        }
        
        .custom-date-range {
          margin-top: 24rpx;
          
          .inline-calendar {
            :deep(.t-calendar) {
              border: 1rpx solid #e7e7e7;
              border-radius: 16rpx;
              padding: 24rpx;
            }
          }
        }
      }
      
      .sort-options {
        .sort-grid {
          .sort-radio {
            margin-bottom: 16rpx;
            
            &:last-child {
              margin-bottom: 0;
            }
            
            :deep(.t-radio) {
              .t-radio__label {
                padding: 24rpx;
                border: 1rpx solid #e7e7e7;
                border-radius: 12rpx;
                font-size: 28rpx;
                color: @gy1;
                
                &:active {
                  background: #f5f5f5;
                }
              }
              
              &--checked {
                .t-radio__label {
                  border-color: @brand7-normal;
                  color: @brand7-normal;
                  background: rgba(0, 82, 217, 0.05);
                }
              }
            }
          }
        }
      }
    }
  }
  
  .filter-footer {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 32rpx;
    border-top: 1rpx solid #f5f5f5;
    flex-shrink: 0;
    
    .reset-btn,
    .apply-btn {
      flex: 1;
      
      :deep(.t-button) {
        height: 88rpx;
        border-radius: 16rpx;
        font-size: 32rpx;
        font-weight: 500;
      }
    }
  }
}

// 日期范围日历
.date-range-calendar {
  :deep(.t-calendar__popup) {
    top: 200rpx !important;
    border-radius: 24rpx 24rpx 0 0;
  }
  
  :deep(.t-calendar__header) {
    border-radius: 24rpx 24rpx 0 0;
  }
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

// 响应式适配
@media (max-width: 375px) {
  .device-card {
    padding: 24rpx;
    
    .device-info-grid {
      grid-template-columns: 1fr;
      gap: 20rpx;
    }
    
    .device-actions {
      flex-wrap: wrap;
      
      .action-btn {
        min-width: calc(50% - 8rpx);
      }
    }
  }
  
  .filter-panel {
    .filter-content {
      .time-options {
        .time-grid {
          grid-template-columns: 1fr;
        }
      }
    }
  }
}

// 深色模式适配
@media (prefers-color-scheme: dark) {
  .device-container {
    background-color: #121212;
  }

  .search-filter-section {
    background: #1e1e1e;
    border-bottom-color: #333;
  }

  .device-card {
    background: #1e1e1e;
    box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.3);

    .device-header {
      .device-title-section {
        .device-name {
          color: #fff;
        }

        .device-subtitle {
          color: #aaa;
        }
      }
    }

    .device-info-grid {
      border-color: #333;

      .info-item {
        .info-content {
          .info-label {
            color: #aaa;
          }

          .info-value {
            color: #fff;
          }
        }
      }
    }
  }

  .filter-panel {
    background: #1e1e1e;

    .filter-header {
      border-color: #333;

      .filter-title-section {
        .filter-title {
          color: #fff;
        }
      }
    }

    .filter-section {
      .filter-section-title {
        color: #fff;
      }

      .time-options {
        .time-grid {
          .time-radio {
            :deep(.t-radio) {
              .t-radio__label {
                border-color: #333;
                color: #fff;
                background: #2a2a2a;

                &:active {
                  background: #333;
                }
              }

              &--checked {
                .t-radio__label {
                  border-color: @brand7-normal;
                  color: @brand7-normal;
                  background: rgba(0, 82, 217, 0.2);
                }
              }
            }
          }
        }
      }

      .sort-options {
        .sort-grid {
          .sort-radio {
            :deep(.t-radio) {
              .t-radio__label {
                border-color: #333;
                color: #fff;
                background: #2a2a2a;

                &:active {
                  background: #333;
                }
              }

              &--checked {
                .t-radio__label {
                  border-color: @brand7-normal;
                  color: @brand7-normal;
                  background: rgba(0, 82, 217, 0.2);
                }
              }
            }
          }
        }
      }

      .venue-selector {
        .venue-picker-display {
          background: #2a2a2a;
          border-color: #333;
          color: #fff;
        }
      }
    }

    .filter-footer {
      border-color: #333;
    }
  }

  .venue-popup {
    background: #1e1e1e;

    &__header {
      border-color: #333;
    }

    &__item {
      color: #fff;

      &:active {
        background: #2a2a2a;
      }
    }
  }
}

// 场地选择弹窗
.venue-popup {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  max-height: 60vh;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 32rpx;
    border-bottom: 1rpx solid #f0f0f0;
  }

  &__title {
    font-size: 32rpx;
    font-weight: 600;
    color: @gy1;
  }

  &__content {
    padding: 16rpx 32rpx 32rpx;
    max-height: 50vh;
    overflow-y: auto;
  }

  &__item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 24rpx 16rpx;
    border-radius: 12rpx;
    font-size: 28rpx;
    color: @gy1;
    margin-bottom: 8rpx;

    &:active {
      background: #f5f5f5;
    }

    &--active {
      color: @brand7-normal;
      font-weight: 500;
    }

    &--all {
      border-top: 1rpx solid #f0f0f0;
      margin-top: 16rpx;
      padding-top: 24rpx;
    }
  }
}
</style>
