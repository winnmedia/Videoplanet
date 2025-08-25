# Comment System Visual Wireframes
## VideoPlanet Enhanced Comment UI Design

**Author**: Eleanor (UX Lead)  
**Date**: 2025-08-24  
**Version**: 1.0.0

---

## Desktop Layout (1280px+)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Enhanced Comment System                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  코멘트 (24)                                   [정렬: 최신순 ▼] │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [Avatar]  코멘트를 작성하세요...                          │  │
│  │            ┌────────────────────────────────────────┐     │  │
│  │            │                                        │     │  │
│  │            │  (Expandable textarea)                │     │  │
│  │            │                                        │     │  │
│  │            └────────────────────────────────────────┘     │  │
│  │            📍 현재 시점: 2:34                              │  │
│  │                                    [취소] [코멘트 작성]     │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [김철수]  김철수 (멤버)              • 5분 전 • 2:34 ⏱️   │  │
│  │            이 부분의 전환 효과가 정말 인상적입니다.         │  │
│  │            특히 색상 처리가 자연스럽네요.                   │  │
│  │                                                            │  │
│  │  👍 좋아요 12  👎 싫어요 3  ❓ 질문 5    [답글] [⋮]      │  │
│  │                                                            │  │
│  │  └─ [이영희]  이영희 (관리자)        • 3분 전            │  │
│  │               동의합니다! 색상 그라데이션도 훌륭해요.       │  │
│  │               👍 2  👎 0  ❓ 1           [답글]          │  │
│  │                                                            │  │
│  │     └─ [박민수]  박민수 (게스트)     • 1분 전            │  │
│  │                  어떤 도구를 사용하셨나요?                  │  │
│  │                  👍 1  👎 0  ❓ 0                        │  │
│  │                                                            │  │
│  │  [▼ 답글 2개 더보기]                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  [최지훈]  최지훈 (멤버)              • 10분 전 • 1:15 ⏱️  │  │
│  │            초반부 음악 선택이 탁월합니다.                   │  │
│  │                                                            │  │
│  │  👍 좋아요 8  👎 싫어요 0  ❓ 질문 2     [답글] [⋮]       │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [더 많은 코멘트 불러오기]                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Mobile Layout (375px)

```
┌─────────────────────────┐
│  코멘트 (24)      [▼]   │
├─────────────────────────┤
│ ┌─────────────────────┐ │
│ │ [A] 코멘트 작성...  │ │
│ │     ┌─────────────┐ │ │
│ │     │             │ │ │
│ │     └─────────────┘ │ │
│ │ 📍 2:34             │ │
│ │        [취소][작성] │ │
│ └─────────────────────┘ │
│                         │
│ ┌─────────────────────┐ │
│ │ [김]                │ │
│ │ 김철수 • 5분전      │ │
│ │ @ 2:34              │ │
│ │                     │ │
│ │ 이 부분의 전환      │ │
│ │ 효과가 정말         │ │
│ │ 인상적입니다.       │ │
│ │                     │ │
│ │ 👍12 👎3 ❓5       │ │
│ │ [답글]              │ │
│ │                     │ │
│ │ └ [이] 이영희      │ │
│ │      관리자•3분전   │ │
│ │   동의합니다!       │ │
│ │   👍2 👎0 ❓1      │ │
│ │                     │ │
│ │ [▼ 1개 더보기]     │ │
│ └─────────────────────┘ │
│                         │
│ [더 보기]               │
└─────────────────────────┘
```

---

## Component States

### 1. Reaction Button States

```
Default State:
┌──────────────┐
│  👍 좋아요 0  │  (Gray border, transparent bg)
└──────────────┘

Hover State:
┌──────────────┐
│  👍 좋아요 0  │  (Blue border, light blue bg)
└──────────────┘

Active State (User reacted):
┌──────────────┐
│  👍 좋아요 1  │  (Blue border, blue bg, white text)
└──────────────┘

Loading State:
┌──────────────┐
│  ⟳ 좋아요 -  │  (Spinning icon, disabled)
└──────────────┘
```

### 2. Comment Input States

```
Empty State:
┌────────────────────────────────┐
│ 코멘트를 작성하세요...         │
│                                │
└────────────────────────────────┘

Focused State:
┌────────────────────────────────┐
│ 코멘트를 작성하세요...         │
│ |                              │  (Blue border, shadow)
│                                │
│ 📍 현재 시점: 2:34            │
└────────────────────────────────┘

With Content:
┌────────────────────────────────┐
│ 이 장면이 정말 멋지네요!       │
│ 특히 카메라 앵글이...|         │
│                                │
│ 📍 현재 시점: 2:34            │
│ 45/500                         │  (Character counter)
└────────────────────────────────┘

Error State:
┌────────────────────────────────┐
│ (Too long content...)          │  (Red border)
│                                │
│ ⚠️ 500자를 초과했습니다        │
└────────────────────────────────┘
```

### 3. Thread Visualization

```
Collapsed Thread:
┌─────────────────────────────────┐
│ [Main Comment]                  │
│ ...content...                   │
│ 👍 12  👎 3  ❓ 5               │
│                                 │
│ [▶ 답글 3개 보기]              │
└─────────────────────────────────┘

Expanded Thread:
┌─────────────────────────────────┐
│ [Main Comment]                  │
│ ...content...                   │
│ 👍 12  👎 3  ❓ 5               │
│                                 │
│ ├─ [Reply 1]                    │
│ │   ...reply content...         │
│ │   👍 2  👎 0  ❓ 1            │
│ │                               │
│ ├─ [Reply 2]                    │
│ │   ...reply content...         │
│ │   👍 5  👎 1  ❓ 0            │
│ │                               │
│ └─ [Reply 3]                    │
│     ...reply content...         │
│     👍 1  👎 0  ❓ 2            │
│                                 │
│ [▼ 답글 숨기기]                 │
└─────────────────────────────────┘
```

---

## Interaction Flows

### Flow 1: Adding a Timestamped Comment

```
Step 1: User watches video
┌─────────────────┐
│   Video Player  │
│   ▶ 2:34/10:00 │
└─────────────────┘
        ↓
Step 2: User clicks comment
┌─────────────────┐
│ [💬 코멘트]     │
└─────────────────┘
        ↓
Step 3: Form appears with timestamp
┌─────────────────────────┐
│ 코멘트 작성...          │
│ 📍 현재 시점: 2:34      │
└─────────────────────────┘
        ↓
Step 4: User types and submits
┌─────────────────────────┐
│ "멋진 전환 효과!"       │
│ 📍 현재 시점: 2:34      │
│           [코멘트 작성] │
└─────────────────────────┘
        ↓
Step 5: Comment appears with timestamp
┌─────────────────────────┐
│ 김철수 • 방금 • 2:34 ⏱ │
│ 멋진 전환 효과!         │
│ 👍 0  👎 0  ❓ 0       │
└─────────────────────────┘
```

### Flow 2: Reaction Selection

```
Step 1: User sees comment
┌─────────────────────────┐
│ Comment content...      │
│ 👍 5  👎 2  ❓ 1       │  (All inactive)
└─────────────────────────┘
        ↓
Step 2: User hovers "좋아요"
┌─────────────────────────┐
│ Comment content...      │
│ [👍 5] 👎 2  ❓ 1      │  (Highlighted)
└─────────────────────────┘
        ↓
Step 3: User clicks "좋아요"
┌─────────────────────────┐
│ Comment content...      │
│ [👍 6] 👎 2  ❓ 1      │  (Active, +1)
└─────────────────────────┘
        ↓
Step 4: Animation feedback
┌─────────────────────────┐
│ Comment content...      │
│ [👍 6] 👎 2  ❓ 1      │  (Pulse animation)
└─────────────────────────┘
```

### Flow 3: Thread Reply

```
Step 1: User clicks "답글"
┌─────────────────────────┐
│ Original comment...     │
│ 👍 5  👎 2  ❓ 1       │
│ [답글]                  │
└─────────────────────────┘
        ↓
Step 2: Reply form appears inline
┌─────────────────────────┐
│ Original comment...     │
│ 👍 5  👎 2  ❓ 1       │
│ ┌─────────────────────┐ │
│ │ @김철수님에게 답글   │ │
│ │ [               ]   │ │
│ │     [취소] [작성]   │ │
│ └─────────────────────┘ │
└─────────────────────────┘
        ↓
Step 3: User submits reply
┌─────────────────────────┐
│ Original comment...     │
│ 👍 5  👎 2  ❓ 1       │
│                         │
│ └─ Your reply here...   │
│    👍 0  👎 0  ❓ 0    │
└─────────────────────────┘
```

---

## Responsive Breakpoints

### Mobile (< 640px)
- Single column layout
- Collapsed reactions (icon only)
- Simplified threading (max depth: 1)
- Bottom sheet for reply form
- Swipe gestures for actions

### Tablet (640px - 1024px)
- Two-column layout possible
- Full reaction labels
- Standard threading (max depth: 2)
- Inline reply forms
- Hover states enabled

### Desktop (> 1024px)
- Full feature set
- Three-column layout with sidebar
- Extended threading view
- Keyboard shortcuts active
- Rich hover interactions

---

## Color Palette

```scss
// Primary Actions
$comment-primary: #1631F8;        // Main CTA, timestamps
$comment-primary-hover: #0029d1;  // Hover state
$comment-primary-bg: #e3f2fd;     // Active reaction bg

// Reactions
$reaction-like: #1631F8;          // 좋아요
$reaction-dislike: #dc3545;       // 싫어요  
$reaction-question: #ffc107;      // 질문있어요

// User Roles
$role-admin: linear-gradient(135deg, #1631F8, #0029d1);
$role-member: linear-gradient(135deg, #6c757d, #5a6268);
$role-guest: linear-gradient(135deg, #f59e0b, #d97706);

// States
$state-hover: #f8f9fa;
$state-focus: #e3f2fd;
$state-disabled: #e0e0e0;
$state-error: #fff5f5;

// Text
$text-primary: #333333;
$text-secondary: #666666;
$text-muted: #999999;
$text-timestamp: #1631F8;
```

---

## Typography Scale

```scss
// Desktop Typography
.comment-title { 
  font-size: 18px; 
  font-weight: 600; 
}

.comment-author { 
  font-size: 14px; 
  font-weight: 600; 
}

.comment-content { 
  font-size: 14px; 
  line-height: 1.5; 
}

.comment-meta { 
  font-size: 12px; 
  color: $text-secondary; 
}

.reaction-label { 
  font-size: 12px; 
  font-weight: 600; 
  letter-spacing: 0.5px; 
}

// Mobile Typography
@media (max-width: 640px) {
  .comment-title { font-size: 16px; }
  .comment-author { font-size: 13px; }
  .comment-content { font-size: 13px; }
  .comment-meta { font-size: 11px; }
  .reaction-label { font-size: 11px; }
}
```

---

## Spacing System

```scss
// Consistent spacing tokens
$spacing-comment: 16px;      // Between comments
$spacing-thread: 40px;       // Thread indentation
$spacing-reaction: 8px;      // Between reactions
$spacing-inline: 12px;       // Inline elements

// Mobile adjustments
@media (max-width: 640px) {
  $spacing-comment: 12px;
  $spacing-thread: 20px;
  $spacing-reaction: 6px;
  $spacing-inline: 8px;
}
```

---

## Animation Specifications

```scss
// Micro-interactions
@keyframes reaction-pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.15); }
  100% { transform: scale(1); }
}

@keyframes comment-slide-in {
  from { 
    opacity: 0; 
    transform: translateY(-10px); 
  }
  to { 
    opacity: 1; 
    transform: translateY(0); 
  }
}

@keyframes thread-expand {
  from { 
    max-height: 0; 
    opacity: 0; 
  }
  to { 
    max-height: 1000px; 
    opacity: 1; 
  }
}

// Timing functions
$ease-out-cubic: cubic-bezier(0.33, 1, 0.68, 1);
$ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);

// Durations
$duration-instant: 150ms;
$duration-fast: 250ms;
$duration-normal: 350ms;
$duration-slow: 500ms;
```

---

## Icon Library

```
Reactions:
👍 좋아요 (Like)
👎 싫어요 (Dislike)  
❓ 질문있어요 (Question)

Actions:
💬 코멘트 (Comment)
↩️ 답글 (Reply)
⏱️ 타임스탬프 (Timestamp)
📍 현재 위치 (Current position)
⋮ 더보기 (More options)
▶ 펼치기 (Expand)
▼ 접기 (Collapse)

States:
⟳ 로딩 (Loading)
✓ 완료 (Complete)
⚠️ 경고 (Warning)
❌ 오류 (Error)
🔒 잠김 (Locked)
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-08-24  
**Related**: UX_COMMENT_SYSTEM_SPECIFICATION.md