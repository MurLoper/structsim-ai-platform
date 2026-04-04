import type { OrdersQueryParams } from '@/api/orders';
import { platformTrackingEvents, platformPageKeys } from '../catalog/platformTrackingCatalog';
import { trackPlatformEvent } from '../client/platformTrackingClient';

const buildFilterSummary = (filters: OrdersQueryParams) => ({
  orderNo: filters.orderNo || undefined,
  domainAccount: filters.domainAccount || undefined,
  projectId: filters.projectId || undefined,
  status: filters.status ?? undefined,
  simTypeId: filters.simTypeId || undefined,
  remark: filters.remark || undefined,
});

export const trackOrdersFilterApply = (filters: OrdersQueryParams) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.ordersFilterApply,
    eventType: 'filter',
    pagePath: '/orders',
    metadata: {
      pageKey: platformPageKeys.orders,
      featureKey: 'orders.filter.form',
      moduleKey: 'orders',
      ...buildFilterSummary(filters),
    },
  });
};

export const trackOrdersFilterReset = () => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.ordersFilterReset,
    eventType: 'filter',
    pagePath: '/orders',
    metadata: {
      pageKey: platformPageKeys.orders,
      featureKey: 'orders.filter.reset',
      moduleKey: 'orders',
    },
  });
};

export const trackOrdersResultOpen = (orderId: number, source: 'button' | 'row') => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.ordersResultOpen,
    eventType: 'navigation',
    pagePath: '/orders',
    target: String(orderId),
    metadata: {
      pageKey: platformPageKeys.orders,
      featureKey: 'orders.result.open',
      moduleKey: 'orders',
      entityId: orderId,
      source,
    },
  });
};

export const trackOrdersEditOpen = (orderId: number) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.ordersEditOpen,
    eventType: 'navigation',
    pagePath: '/orders',
    target: String(orderId),
    metadata: {
      pageKey: platformPageKeys.orders,
      featureKey: 'orders.edit.open',
      moduleKey: 'orders',
      entityId: orderId,
    },
  });
};

export const trackOrdersBaseDirCopy = (
  orderId: number,
  result: 'success' | 'failure' | 'empty'
) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.ordersBaseDirCopy,
    eventType: 'interaction',
    pagePath: '/orders',
    target: String(orderId),
    metadata: {
      pageKey: platformPageKeys.orders,
      featureKey: 'orders.base_dir.copy',
      moduleKey: 'orders',
      entityId: orderId,
      result,
    },
  });
};

export const trackOrdersPageChange = (page: number, pageSize: number) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.ordersPageChange,
    eventType: 'navigation',
    pagePath: '/orders',
    metadata: {
      pageKey: platformPageKeys.orders,
      featureKey: 'orders.pagination.page',
      moduleKey: 'orders',
      step: page,
      pageSize,
    },
  });
};

export const trackOrdersPageSizeChange = (pageSize: number) => {
  trackPlatformEvent({
    eventName: platformTrackingEvents.ordersPageSizeChange,
    eventType: 'navigation',
    pagePath: '/orders',
    metadata: {
      pageKey: platformPageKeys.orders,
      featureKey: 'orders.pagination.size',
      moduleKey: 'orders',
      pageSize,
    },
  });
};
