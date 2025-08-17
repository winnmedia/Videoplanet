export interface ProjectStatsData {
  total: number;
  active: number;
  completed: number;
  pending: number;
}

export interface ProjectStatsWidgetProps {
  data?: ProjectStatsData;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  onNavigate?: (path: string) => void;
  'data-testid'?: string;
}

export interface ProjectStatus {
  id: string;
  name: string;
  count: number;
  color: string;
  icon?: string;
}

export interface ProjectStatsConfig {
  animationDuration: number;
  refreshInterval: number;
  enableAnimation: boolean;
}