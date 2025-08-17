// Public API for feedback-stats widget
export { default as FeedbackStatsWidget } from './ui/FeedbackStatsWidget';

// Types and models
export type {
  FeedbackStatsData,
  FeedbackStatsWidgetProps,
  FeedbackStatus,
  FeedbackStatsConfig,
} from './model';

// Constants and utilities
export {
  DEFAULT_FEEDBACK_STATS_CONFIG,
  FEEDBACK_STATUSES,
  calculateResponseRate,
  calculatePendingRate,
  getUrgentFeedbacks,
} from './model';