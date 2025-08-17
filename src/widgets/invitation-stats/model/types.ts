export interface InvitationStatsData {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
}

export interface InvitationStatsWidgetProps {
  data?: InvitationStatsData;
  isLoading?: boolean;
  error?: string | null;
  className?: string;
  onNavigate?: (path: string) => void;
  'data-testid'?: string;
}

export interface InvitationStatus {
  id: string;
  name: string;
  count: number;
  color: string;
  icon?: string;
}

export interface InvitationStatsConfig {
  animationDuration: number;
  refreshInterval: number;
  enableAnimation: boolean;
  showAcceptanceRate: boolean;
}