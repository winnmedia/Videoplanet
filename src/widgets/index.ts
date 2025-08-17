// Widgets Layer - Page-level UI blocks
// FSD Architecture: Composed UI widgets for specific page sections

// Layout widgets
export * as sidebar from './sidebar';
export * as header from './header';

// Dashboard widgets
export * as projectStats from './project-stats';
export * as feedbackStats from './feedback-stats';
export * as invitationStats from './invitation-stats';

// Re-export for convenience
export { Sidebar } from './sidebar';
export { Header } from './header';
export { ProjectStatsWidget } from './project-stats';
export { FeedbackStatsWidget } from './feedback-stats';
export { InvitationStatsWidget } from './invitation-stats';