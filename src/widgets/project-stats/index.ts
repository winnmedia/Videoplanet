// Public API for project-stats widget
export { default as ProjectStatsWidget } from './ui/ProjectStatsWidget';

// Types and models
export type {
  ProjectStatsData,
  ProjectStatsWidgetProps,
  ProjectStatus,
  ProjectStatsConfig,
} from './model';

// Constants and utilities
export {
  DEFAULT_PROJECT_STATS_CONFIG,
  PROJECT_STATUSES,
  calculateCompletionRate,
  calculateActiveRate,
} from './model';