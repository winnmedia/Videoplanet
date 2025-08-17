export interface FeedbackStatsData {
  total: number;
  unread: number;
  replied: number;
  pending: number;
  thisWeek: number;
}

export interface FeedbackStatsWidgetProps {
  data?: FeedbackStatsData;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  onNavigate?: (path: string) => void;
  'data-testid'?: string;
}

export interface FeedbackStatus {
  id: string;
  name: string;
  count: number;
  color: string;
  icon?: string;
}

export interface FeedbackStatsConfig {
  animationDuration: number;
  refreshInterval: number;
  enableAnimation: boolean;
  showResponseRate: boolean;
}