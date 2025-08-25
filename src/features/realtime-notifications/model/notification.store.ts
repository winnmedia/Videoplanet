/**
 * 알림 상태 관리 스토어
 * Zustand를 사용한 전역 상태 관리
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { 
  Notification, 
  NotificationFilter, 
  NotificationStats, 
  NotificationSettings,
  NotificationCategory,
  NotificationPriority 
} from './notification.types';

interface NotificationState {
  // 상태
  notifications: Notification[];
  filter: NotificationFilter;
  settings: NotificationSettings;
  stats: NotificationStats;
  isLoading: boolean;
  error: string | null;

  // 액션
  addNotification: (notification: Notification) => void;
  addNotifications: (notifications: Notification[]) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: (filter?: NotificationFilter) => void;
  
  markAsRead: (id: string) => void;
  markAllAsRead: (filter?: NotificationFilter) => void;
  
  setFilter: (filter: NotificationFilter) => void;
  setSettings: (settings: Partial<NotificationSettings>) => void;
  
  calculateStats: () => void;
  
  // 선택자
  getUnreadCount: () => number;
  getFilteredNotifications: () => Notification[];
  getNotificationById: (id: string) => Notification | undefined;
}

// 기본 설정
const defaultSettings: NotificationSettings = {
  enabled: true,
  sound: true,
  vibration: true,
  desktop: true,
  email: false,
  categories: {
    [NotificationCategory.FEEDBACK]: true,
    [NotificationCategory.PROJECT]: true,
    [NotificationCategory.COMMENT]: true,
    [NotificationCategory.MENTION]: true,
    [NotificationCategory.SYSTEM]: true,
    [NotificationCategory.COLLABORATION]: true,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '08:00',
  },
};

// 초기 통계
const initialStats: NotificationStats = {
  total: 0,
  unread: 0,
  byCategory: {
    [NotificationCategory.FEEDBACK]: 0,
    [NotificationCategory.PROJECT]: 0,
    [NotificationCategory.COMMENT]: 0,
    [NotificationCategory.MENTION]: 0,
    [NotificationCategory.SYSTEM]: 0,
    [NotificationCategory.COLLABORATION]: 0,
  },
  byPriority: {
    [NotificationPriority.LOW]: 0,
    [NotificationPriority.MEDIUM]: 0,
    [NotificationPriority.HIGH]: 0,
    [NotificationPriority.URGENT]: 0,
  },
};

export const useNotificationStore = create<NotificationState>()(
  devtools(
    persist(
      (set, get) => ({
        // 초기 상태
        notifications: [],
        filter: {},
        settings: defaultSettings,
        stats: initialStats,
        isLoading: false,
        error: null,

        // 알림 추가
        addNotification: (notification) => {
          set((state) => {
            // 중복 체크
            if (state.notifications.find(n => n.id === notification.id)) {
              return state;
            }

            // 최대 개수 제한 (1000개)
            const notifications = [notification, ...state.notifications];
            if (notifications.length > 1000) {
              notifications.pop();
            }

            return { 
              notifications,
              error: null 
            };
          });
          
          get().calculateStats();
          
          // 알림 표시 (설정에 따라)
          if (get().settings.enabled && get().settings.categories[notification.category]) {
            get().showNotification(notification);
          }
        },

        // 여러 알림 추가
        addNotifications: (newNotifications) => {
          set((state) => {
            const existingIds = new Set(state.notifications.map(n => n.id));
            const uniqueNotifications = newNotifications.filter(n => !existingIds.has(n.id));
            
            let notifications = [...uniqueNotifications, ...state.notifications];
            
            // 최대 개수 제한
            if (notifications.length > 1000) {
              notifications = notifications.slice(0, 1000);
            }

            return { 
              notifications,
              error: null 
            };
          });
          
          get().calculateStats();
        },

        // 알림 업데이트
        updateNotification: (id, updates) => {
          set((state) => ({
            notifications: state.notifications.map(n =>
              n.id === id ? { ...n, ...updates } : n
            ),
            error: null
          }));
          
          get().calculateStats();
        },

        // 알림 제거
        removeNotification: (id) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id),
            error: null
          }));
          
          get().calculateStats();
        },

        // 알림 지우기
        clearNotifications: (filter) => {
          set((state) => {
            if (!filter) {
              return { notifications: [], error: null };
            }

            let filtered = state.notifications;

            if (filter.categories?.length) {
              filtered = filtered.filter(n => !filter.categories?.includes(n.category));
            }

            if (filter.priorities?.length) {
              filtered = filtered.filter(n => !filter.priorities?.includes(n.priority));
            }

            if (filter.read !== undefined) {
              filtered = filtered.filter(n => n.read !== filter.read);
            }

            return { 
              notifications: filtered,
              error: null 
            };
          });
          
          get().calculateStats();
        },

        // 읽음 표시
        markAsRead: (id) => {
          set((state) => ({
            notifications: state.notifications.map(n =>
              n.id === id ? { ...n, read: true } : n
            ),
            error: null
          }));
          
          get().calculateStats();
        },

        // 모두 읽음 표시
        markAllAsRead: (filter) => {
          set((state) => {
            let toMark = state.notifications;

            if (filter) {
              if (filter.categories?.length) {
                toMark = toMark.filter(n => filter.categories?.includes(n.category));
              }

              if (filter.priorities?.length) {
                toMark = toMark.filter(n => filter.priorities?.includes(n.priority));
              }
            }

            const markedIds = new Set(toMark.map(n => n.id));

            return {
              notifications: state.notifications.map(n =>
                markedIds.has(n.id) ? { ...n, read: true } : n
              ),
              error: null
            };
          });
          
          get().calculateStats();
        },

        // 필터 설정
        setFilter: (filter) => {
          set({ filter, error: null });
        },

        // 설정 변경
        setSettings: (settings) => {
          set((state) => ({
            settings: { ...state.settings, ...settings },
            error: null
          }));
        },

        // 통계 계산
        calculateStats: () => {
          const notifications = get().notifications;
          
          const stats: NotificationStats = {
            total: notifications.length,
            unread: notifications.filter(n => !n.read).length,
            byCategory: { ...initialStats.byCategory },
            byPriority: { ...initialStats.byPriority },
          };

          notifications.forEach(n => {
            stats.byCategory[n.category]++;
            stats.byPriority[n.priority]++;
          });

          set({ stats });
        },

        // 읽지 않은 개수
        getUnreadCount: () => {
          return get().notifications.filter(n => !n.read).length;
        },

        // 필터링된 알림
        getFilteredNotifications: () => {
          const { notifications, filter } = get();
          let filtered = [...notifications];

          if (filter.categories?.length) {
            filtered = filtered.filter(n => filter.categories?.includes(n.category));
          }

          if (filter.priorities?.length) {
            filtered = filtered.filter(n => filter.priorities?.includes(n.priority));
          }

          if (filter.read !== undefined) {
            filtered = filtered.filter(n => n.read === filter.read);
          }

          if (filter.dateFrom) {
            filtered = filtered.filter(n => n.timestamp >= filter.dateFrom!);
          }

          if (filter.dateTo) {
            filtered = filtered.filter(n => n.timestamp <= filter.dateTo!);
          }

          if (filter.search) {
            const search = filter.search.toLowerCase();
            filtered = filtered.filter(n =>
              n.title.toLowerCase().includes(search) ||
              n.message.toLowerCase().includes(search)
            );
          }

          return filtered;
        },

        // ID로 알림 찾기
        getNotificationById: (id) => {
          return get().notifications.find(n => n.id === id);
        },

        // 알림 표시 (private)
        showNotification: (notification: Notification) => {
          const { settings } = get();

          // Quiet Hours 체크
          if (settings.quietHours?.enabled) {
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const { start, end } = settings.quietHours;
            
            if (start <= end) {
              if (currentTime >= start && currentTime <= end) return;
            } else {
              if (currentTime >= start || currentTime <= end) return;
            }
          }

          // 브라우저 알림
          if (settings.desktop && 'Notification' in window && Notification.permission === 'granted') {
            const browserNotification = new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              tag: notification.id,
              data: notification,
              requireInteraction: notification.priority === NotificationPriority.URGENT,
            });

            browserNotification.onclick = () => {
              window.focus();
              // 액션 처리
              if (notification.actions?.[0]?.url) {
                window.location.href = notification.actions[0].url;
              }
            };
          }

          // 사운드
          if (settings.sound && notification.sound !== false) {
            const audio = new Audio('/sounds/notification.mp3');
            audio.play().catch(() => {});
          }

          // 진동
          if (settings.vibration && notification.vibrate !== false && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
        },
      }),
      {
        name: 'notification-storage',
        partialize: (state) => ({
          notifications: state.notifications.slice(0, 100), // 최근 100개만 저장
          settings: state.settings,
        }),
      }
    )
  )
);