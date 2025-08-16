// Atomic Design - Organisms
// Molecules와 Atoms를 조합한 복잡한 UI 컴포넌트들

export { default as Header } from './Header';
export type { HeaderProps } from '../../types/layout';

export { default as Sidebar } from './Sidebar';
export type { SidebarProps } from '../../types/layout';

export { default as Submenu } from './Submenu';
export type { SubmenuProps } from '../../types/layout';

// 기존 컴포넌트들 (확장 예정)
// export { default as FeedbackForm } from './FeedbackForm';
// export { default as ProjectCard } from './ProjectCard';