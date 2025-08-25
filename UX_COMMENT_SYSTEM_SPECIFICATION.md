# Enhanced Comment System UX Specification
## VideoPlanet Feedback Feature

**Author**: Eleanor (UX Lead)  
**Date**: 2025-08-24  
**Version**: 1.0.0  
**Status**: Ready for Implementation

---

## Executive Summary

This specification defines the enhanced comment (코멘트) system for VideoPlanet's feedback feature, emphasizing emotion-based reactions, threaded conversations, and timestamp integration with video playback.

### Key Objectives
- **Engagement**: Increase user interaction through emotion reactions
- **Context**: Link comments to specific video timestamps
- **Clarity**: Improve conversation flow with threading
- **Accessibility**: WCAG 2.1 AA compliant interactions

### Success Metrics (KPIs)
- **Comment Engagement Rate**: >60% of viewers leave at least one comment
- **Reaction Usage**: Average 3+ reactions per comment
- **Thread Depth**: 80% of comments receive replies
- **Task Completion**: <30 seconds to post a comment
- **Accessibility Score**: 100% keyboard navigable

---

## 1. Information Architecture

### 1.1 Component Hierarchy (FSD Structure)

```
/src/features/comment-system/
├── model/
│   ├── types.ts                 # Comment, Reaction, Thread types
│   ├── store.ts                 # Comment state management
│   └── api.ts                   # Backend integration
├── ui/
│   ├── EnhancedCommentSystem.tsx    # Main container (current)
│   ├── CommentItem.tsx              # Single comment component
│   ├── CommentThread.tsx           # Thread visualization
│   ├── ReactionPicker.tsx          # Emotion selector
│   └── TimestampLink.tsx           # Video timestamp integration
└── lib/
    ├── formatters.ts            # Time, date formatters
    └── validators.ts            # Input validation

/src/shared/ui/
├── Avatar/                      # Reusable avatar component
├── Button/                      # Unified button styles
└── TextArea/                    # Enhanced textarea with counter
```

### 1.2 State Model

```typescript
interface CommentState {
  // Core fields
  id: string
  content: string
  authorId: string
  authorName: string
  authorRole: 'admin' | 'member' | 'guest'
  createdAt: Date
  updatedAt: Date
  
  // Enhanced features
  videoTimestamp?: number       // Seconds from video start
  parentId?: string             // For threading
  depth: number                 // Thread nesting level (max: 2)
  
  // Reactions
  reactions: {
    like: string[]           // User IDs who liked
    dislike: string[]        // User IDs who disliked
    question: string[]       // User IDs with questions
  }
  
  // UI states
  isEditing: boolean
  isDeleting: boolean
  isReplying: boolean
  isExpanded: boolean
}

interface CommentSystemState {
  comments: CommentState[]
  loading: boolean
  error: string | null
  
  // Pagination
  page: number
  hasMore: boolean
  
  // Filters
  sortBy: 'newest' | 'oldest' | 'mostReactions' | 'timestamp'
  filterByReaction?: 'like' | 'dislike' | 'question'
  
  // Active states
  replyingTo: string | null
  editingComment: string | null
  highlightedComment: string | null  // From URL or timestamp click
}
```

---

## 2. User Flows

### 2.1 Primary Flow: Post Comment with Timestamp

```gherkin
Feature: Timestamp-linked Comment Creation
  As a viewer
  I want to comment on specific moments in the video
  So that my feedback has clear context

  Scenario: Creating a timestamped comment
    Given I am watching a video at 2:34
    And I am logged in as a member
    When I click the "코멘트 작성" button
    Then the comment form should display "현재 시점: 2:34"
    When I type "이 부분의 전환 효과가 훌륭합니다"
    And I press "코멘트 작성"
    Then my comment should appear with a timestamp badge "2:34"
    And clicking the timestamp should seek the video to 2:34
```

### 2.2 Reaction Flow

```gherkin
Feature: Emotion Reactions
  As a viewer
  I want to react to comments with emotions
  So that I can express agreement/disagreement/curiosity

  Scenario: Adding a reaction
    Given I see a comment I agree with
    When I click the "좋아요" button
    Then the like count should increment by 1
    And the button should show active state (blue background)
    And I should see a subtle animation (scale + fade)
    
  Scenario: Changing a reaction
    Given I have already liked a comment
    When I click the "질문있어요" button
    Then my like should be removed
    And the question reaction should be added
    And both counts should update accordingly
```

### 2.3 Threading Flow

```gherkin
Feature: Threaded Conversations
  As a participant
  I want to reply to specific comments
  So that conversations stay organized

  Scenario: Replying to a comment
    Given I see a comment I want to respond to
    When I click "답글"
    Then an inline reply form should appear below the comment
    And the form should show "@[author name]님에게 답글"
    When I type my reply and submit
    Then my reply should appear indented under the parent
    And the parent should show "답글 1개"
    
  Scenario: Viewing thread expansion
    Given a comment has 3 replies
    When I click "답글 3개 보기"
    Then all replies should expand with animation
    And deeply nested replies (level 3+) should be flattened
```

---

## 3. Visual Design Patterns

### 3.1 Comment Layout

```
┌─────────────────────────────────────────────────┐
│ [Avatar] Author Name (역할)     • 5분 전 • 2:34 │
│          "코멘트 내용이 여기에 표시됩니다..."    │
│                                                  │
│  👍 12  👎 3  ❓ 5    [답글]  [더보기 ...]      │
└─────────────────────────────────────────────────┘
     │
     └─> ┌──────────────────────────────────────┐
         │ [A] Reply Author • 3분 전            │
         │     "답글 내용..."                   │
         │     👍 2  👎 0  ❓ 1                 │
         └──────────────────────────────────────┘
```

### 3.2 Reaction States

```scss
// Default state
.reaction-button {
  background: transparent;
  border: 1px solid $color-gray-300;
  color: $color-gray-600;
  
  &:hover {
    background: $color-gray-50;
    border-color: $color-primary;
  }
}

// Active state (user has reacted)
.reaction-button--active {
  background: rgba($color-primary, 0.1);
  border-color: $color-primary;
  color: $color-primary;
  font-weight: 600;
  
  // Micro-animation on activation
  animation: reaction-pulse 0.3s ease-out;
}

@keyframes reaction-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}
```

### 3.3 Mobile-First Responsive Design

```scss
// Mobile (default)
.comment-system {
  padding: $spacing-md;
  
  .comment {
    padding: $spacing-sm;
    
    .reactions {
      flex-wrap: wrap;
      gap: $spacing-xs;
    }
  }
}

// Tablet and up
@include tablet-up {
  .comment-system {
    padding: $spacing-lg;
    
    .comment {
      padding: $spacing-md;
      
      &.reply {
        margin-left: $spacing-xl;
      }
    }
  }
}

// Desktop
@include desktop-up {
  .comment-system {
    max-width: 800px;
    margin: 0 auto;
    
    .comment {
      &.reply {
        margin-left: $spacing-2xl;
      }
    }
  }
}
```

---

## 4. Interaction Patterns

### 4.1 Timestamp Integration

```typescript
interface TimestampInteraction {
  // Display format
  format: "M:SS" | "H:MM:SS"  // Based on video length
  
  // Click behavior
  onClick: (timestamp: number) => {
    // 1. Seek video to timestamp
    videoPlayer.seek(timestamp)
    
    // 2. Highlight comment temporarily
    highlightComment(commentId, duration: 3000)
    
    // 3. Log analytics event
    analytics.track('comment_timestamp_clicked', {
      commentId,
      timestamp,
      videoId
    })
  }
  
  // Visual indicator
  style: {
    color: '$color-primary',
    cursor: 'pointer',
    textDecoration: 'underline-on-hover'
  }
}
```

### 4.2 Real-time Updates

```typescript
// WebSocket events for live collaboration
interface CommentEvents {
  'comment:added': (comment: Comment) => void
  'comment:updated': (commentId: string, changes: Partial<Comment>) => void
  'comment:deleted': (commentId: string) => void
  'reaction:added': (commentId: string, reaction: ReactionType, userId: string) => void
  'reaction:removed': (commentId: string, reaction: ReactionType, userId: string) => void
  'user:typing': (commentId: string, userId: string, isTyping: boolean) => void
}

// Optimistic updates with rollback
const addReaction = async (commentId: string, type: ReactionType) => {
  // 1. Optimistic update
  updateLocalState(commentId, { addReaction: type })
  
  try {
    // 2. API call
    await api.addReaction(commentId, type)
  } catch (error) {
    // 3. Rollback on failure
    updateLocalState(commentId, { removeReaction: type })
    showError('반응 추가에 실패했습니다')
  }
}
```

---

## 5. Accessibility Requirements

### 5.1 Keyboard Navigation

```typescript
// Navigation map
const keyboardShortcuts = {
  'Tab': 'Next interactive element',
  'Shift+Tab': 'Previous interactive element',
  'Enter': 'Submit comment / Activate button',
  'Space': 'Toggle reaction',
  'Escape': 'Cancel reply / Close menu',
  'Arrow Up/Down': 'Navigate between comments',
  'R': 'Quick reply to focused comment',
  'L': 'Quick like for focused comment'
}

// Focus management
const focusManagement = {
  // Trap focus in reply form
  replyForm: {
    firstElement: 'textarea',
    lastElement: 'submit-button',
    escapeAction: 'close-and-return-focus'
  },
  
  // Return focus after action
  afterSubmit: 'newly-created-comment',
  afterCancel: 'reply-button',
  afterDelete: 'next-comment-or-form'
}
```

### 5.2 ARIA Labels and Roles

```html
<!-- Comment structure with ARIA -->
<article 
  role="comment"
  aria-label="코멘트 by {authorName}"
  aria-describedby="comment-meta-{id}"
>
  <header id="comment-meta-{id}">
    <span aria-label="작성자">{authorName}</span>
    <time aria-label="작성 시간" datetime="{ISO-date}">5분 전</time>
    <button aria-label="비디오 {timestamp} 시점으로 이동">{timestamp}</button>
  </header>
  
  <div role="group" aria-label="반응">
    <button 
      aria-label="좋아요 {count}개"
      aria-pressed="{isLiked}"
      data-reaction="like"
    >
      👍 {count}
    </button>
  </div>
  
  <button
    aria-expanded="{isRepliesVisible}"
    aria-controls="replies-{id}"
  >
    답글 {replyCount}개 {isExpanded ? '숨기기' : '보기'}
  </button>
</article>
```

### 5.3 Screen Reader Announcements

```typescript
// Live region updates
const announcements = {
  commentAdded: '새 코멘트가 추가되었습니다',
  reactionAdded: (type: string) => `${type} 반응을 추가했습니다`,
  replyPosted: '답글이 작성되었습니다',
  errorOccurred: (action: string) => `${action} 중 오류가 발생했습니다`,
  
  // Provide context
  timestampNavigation: (time: string) => `비디오 ${time} 시점으로 이동합니다`,
  threadExpanded: (count: number) => `${count}개의 답글이 표시됩니다`
}

// Implementation
<div 
  role="status" 
  aria-live="polite" 
  aria-atomic="true"
  className="sr-only"
>
  {announcement}
</div>
```

---

## 6. Error States and Edge Cases

### 6.1 Error Handling Matrix

| Scenario | User Feedback | Recovery Action |
|----------|--------------|-----------------|
| Network failure | "연결이 끊어졌습니다. 다시 시도하세요." | Retry button + Auto-retry after 5s |
| Rate limiting | "너무 많은 요청입니다. 잠시 후 다시 시도하세요." | Disable actions for cooldown period |
| Invalid input | "코멘트는 1-500자 사이여야 합니다." | Show inline validation |
| Deleted parent | "원본 코멘트가 삭제되었습니다." | Gray out thread, prevent new replies |
| Permission denied | "이 작업을 수행할 권한이 없습니다." | Show login prompt for guests |

### 6.2 Loading States

```typescript
// Skeleton loading for initial load
const CommentSkeleton = () => (
  <div className="comment-skeleton">
    <div className="skeleton-avatar" />
    <div className="skeleton-content">
      <div className="skeleton-line skeleton-line--short" />
      <div className="skeleton-line skeleton-line--long" />
      <div className="skeleton-actions" />
    </div>
  </div>
)

// Inline spinners for actions
const ActionStates = {
  submitting: <Spinner size="sm" label="전송 중..." />,
  deleting: <Spinner size="sm" label="삭제 중..." />,
  loading: <Spinner size="sm" label="불러오는 중..." />
}
```

---

## 7. Performance Optimization

### 7.1 Virtualization Strategy

```typescript
// Virtual scrolling for large comment lists
const VirtualCommentList = {
  // Only render visible comments + buffer
  visibleRange: {
    overscan: 3,  // Render 3 items above/below viewport
    minBatchSize: 10,
    maxConcurrentRenders: 2
  },
  
  // Lazy load nested replies
  replyLoading: 'on-demand',  // Load when expanded
  
  // Image/avatar optimization
  avatarLoading: 'lazy',
  avatarFormat: 'webp'
}
```

### 7.2 Caching Strategy

```typescript
// Client-side caching
const CommentCache = {
  // Cache reactions locally for instant UI
  reactions: new Map<string, ReactionCache>(),
  
  // Prefetch likely interactions
  prefetch: ['next-page', 'user-replies'],
  
  // Optimistic updates
  optimisticQueue: new Queue<OptimisticUpdate>(),
  
  // Stale-while-revalidate
  revalidateInterval: 30000  // 30 seconds
}
```

---

## 8. Analytics and Metrics

### 8.1 Event Tracking

```typescript
// Core events to track
const CommentAnalytics = {
  // Engagement events
  'comment_posted': { 
    hasTimestamp: boolean,
    wordCount: number,
    depth: number 
  },
  
  'reaction_added': { 
    type: 'like' | 'dislike' | 'question',
    targetDepth: number,
    responseTime: number  // Time from comment post to reaction
  },
  
  'thread_expanded': { 
    replyCount: number,
    maxDepth: number 
  },
  
  // Performance events
  'comment_load_time': { 
    count: number,
    duration: number 
  },
  
  // Error events
  'comment_error': { 
    type: string,
    context: string 
  }
}
```

### 8.2 Success Metrics Dashboard

```typescript
// Real-time metrics to monitor
const MetricsDashboard = {
  // Engagement
  avgReactionsPerComment: number,
  commentToViewRatio: number,
  avgThreadDepth: number,
  
  // Performance  
  p50LoadTime: number,
  p95LoadTime: number,
  errorRate: number,
  
  // User behavior
  avgTimeToFirstComment: number,
  returnUserCommentRate: number,
  guestToMemberConversion: number
}
```

---

## 9. Migration Strategy

### 9.1 Phase 1: Core Enhancement (Week 1)
- Rename 댓글 → 코멘트 throughout system
- Implement reaction buttons with current data model
- Add timestamp display for existing timestamp data

### 9.2 Phase 2: Threading Implementation (Week 2)
- Add reply functionality with 2-level depth limit
- Implement thread expansion/collapse
- Update database schema for parent-child relationships

### 9.3 Phase 3: Polish & Optimization (Week 3)
- Add real-time updates via WebSocket
- Implement virtual scrolling for performance
- Complete accessibility audit and fixes
- Add analytics tracking

---

## 10. Testing Scenarios

### 10.1 E2E Test Coverage

```gherkin
# Critical Path Tests

Feature: Complete Comment Workflow
  Scenario: Guest to member comment journey
    Given I am a guest viewer
    When I try to post a comment
    Then I should see a login prompt
    When I complete registration
    Then I should return to my draft comment
    And I can successfully post it
    
  Scenario: Video timestamp round-trip
    Given I post a comment at video time 1:23
    When another user clicks my timestamp
    Then their video should seek to 1:23
    And my comment should be highlighted
    
  Scenario: Reaction conflict resolution
    Given two users react simultaneously
    When both reactions are processed
    Then the count should correctly reflect both
    And no race condition should occur
```

### 10.2 Accessibility Tests

```typescript
// Automated accessibility checks
const a11yTests = [
  'All interactive elements are keyboard accessible',
  'Focus order follows visual layout',
  'ARIA labels are present and descriptive',
  'Color contrast meets WCAG AA standards',
  'Screen reader announces all state changes',
  'No keyboard traps exist',
  'Skip links work correctly'
]
```

---

## Appendix A: Component API

```typescript
// Enhanced Comment System Props
interface EnhancedCommentSystemProps {
  // Data
  comments: Comment[]
  currentUser: User | null
  videoTimestamp?: number
  
  // Actions
  onAddComment: (content: string, timestamp?: number) => Promise<void>
  onAddReply: (parentId: string, content: string) => Promise<void>
  onUpdateComment: (id: string, content: string) => Promise<void>
  onDeleteComment: (id: string) => Promise<void>
  onAddReaction: (commentId: string, type: ReactionType) => Promise<void>
  onRemoveReaction: (commentId: string, type: ReactionType) => Promise<void>
  
  // Video integration
  onTimestampClick?: (timestamp: number) => void
  
  // Configuration
  maxDepth?: number  // Default: 2
  pageSize?: number  // Default: 20
  realTimeUpdates?: boolean  // Default: true
  allowGuestView?: boolean  // Default: true
  allowGuestReactions?: boolean  // Default: false
}
```

---

## Appendix B: Mock Data for Development

```typescript
// Deterministic test data
export const mockComments: Comment[] = [
  {
    id: 'comment-1',
    content: '이 부분의 전환 효과가 정말 인상적입니다. 특히 2:34 시점의 트랜지션이 자연스럽네요.',
    authorId: 'user-1',
    authorName: '김철수',
    authorRole: 'member',
    createdAt: new Date('2025-01-24T10:00:00'),
    videoTimestamp: 154, // 2:34
    reactions: {
      like: ['user-2', 'user-3', 'user-4'],
      dislike: [],
      question: ['user-5']
    },
    replies: [
      {
        id: 'comment-2',
        content: '동의합니다! 색상 그라데이션도 훌륭해요.',
        authorId: 'user-2',
        authorName: '이영희',
        authorRole: 'admin',
        parentId: 'comment-1',
        depth: 1,
        reactions: {
          like: ['user-1'],
          dislike: [],
          question: []
        }
      }
    ]
  }
]
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-08-24  
**Next Review**: After Phase 1 Implementation