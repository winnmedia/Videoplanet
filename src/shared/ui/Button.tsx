// Compatibility wrapper - re-export version 3 (standard Button component)
// This file exists to maintain backward compatibility with existing imports
// All imports from '@/shared/ui/Button' will use the standard Button component

export { Button, type ButtonProps } from './Button/Button';
export { Button as default } from './Button/Button';