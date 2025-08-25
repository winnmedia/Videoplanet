# Enhanced Comment System E2E Test Scenarios
## VideoPlanet Feature Test Specifications

**Author**: Eleanor (UX Lead)  
**Date**: 2025-08-24  
**Version**: 1.0.0  
**Framework**: Gherkin (Cucumber/Playwright compatible)

---

## Test Suite Overview

| Category | Scenarios | Priority | Coverage |
|----------|-----------|----------|----------|
| Core Functionality | 12 | Critical | 100% |
| Reactions | 8 | High | 100% |
| Threading | 6 | High | 100% |
| Timestamp Integration | 5 | High | 100% |
| Accessibility | 7 | Critical | 100% |
| Error Handling | 8 | Medium | 80% |
| Performance | 4 | Medium | 70% |

---

## 1. Core Comment Functionality

### Scenario 1.1: Basic Comment Creation
```gherkin
Feature: Comment Creation
  As a logged-in user
  I want to create comments
  So that I can share my feedback

  Background:
    Given I am logged in as "test@example.com"
    And I am viewing the feedback page for video "sample-video-1"

  Scenario: Successfully create a comment
    When I click the comment input field
    And I type "이 영상의 편집이 정말 훌륭합니다!"
    And I click the "코멘트 작성" button
    Then I should see my comment appear in the list
    And the comment should display my name "테스트 사용자"
    And the comment should show "방금 전" as timestamp
    And the comment counter should increase by 1

  Scenario: Create comment with maximum length
    When I type a comment with exactly 500 characters
    Then the character counter should show "500/500"
    And the submit button should be enabled
    When I click the "코멘트 작성" button
    Then the comment should be posted successfully

  Scenario: Prevent exceeding character limit
    When I type a comment with 501 characters
    Then the character counter should show "501/500" in red
    And the submit button should be disabled
    And I should see error message "코멘트는 500자를 초과할 수 없습니다"
```

### Scenario 1.2: Guest User Restrictions
```gherkin
Feature: Guest User Experience
  As a guest user
  I want to view comments but need to login to interact
  So that I'm encouraged to create an account

  Scenario: Guest viewing comments
    Given I am not logged in
    When I visit the feedback page
    Then I should see all existing comments
    And I should see reaction counts
    But the comment input should show "로그인하여 코멘트를 작성하세요"

  Scenario: Guest attempting to comment
    Given I am not logged in
    When I click the comment input field
    Then I should see a login modal
    And the modal should say "코멘트를 작성하려면 로그인이 필요합니다"
    When I click "게스트로 계속하기"
    Then I should be logged in as a guest
    And the comment input should be enabled
    And my avatar should show guest indicator
```

### Scenario 1.3: Comment Editing
```gherkin
Feature: Comment Editing
  As a comment author
  I want to edit my comments
  So that I can correct mistakes

  Scenario: Edit own comment
    Given I have posted a comment "오타가 있는 댓글"
    When I click the "⋮" menu on my comment
    And I select "수정"
    Then the comment should become editable inline
    When I change the text to "수정된 코멘트"
    And I click "저장"
    Then the comment should update
    And show "(수정됨)" indicator
    And preserve all reactions

  Scenario: Cancel editing
    Given I am editing my comment
    When I press the Escape key
    Then the edit mode should cancel
    And the original text should remain
```

### Scenario 1.4: Comment Deletion
```gherkin
Feature: Comment Deletion
  As a comment author or admin
  I want to delete comments
  So that I can remove inappropriate content

  Scenario: Delete own comment without replies
    Given I have posted a comment
    When I click the "⋮" menu
    And I select "삭제"
    Then I should see confirmation "정말 삭제하시겠습니까?"
    When I click "삭제 확인"
    Then the comment should disappear
    And the comment counter should decrease by 1

  Scenario: Delete comment with replies
    Given my comment has 3 replies
    When I delete my comment
    Then my comment should show "[삭제된 코멘트]"
    But the replies should remain visible
    And new replies should be disabled
```

---

## 2. Reaction System

### Scenario 2.1: Adding Reactions
```gherkin
Feature: Comment Reactions
  As a user
  I want to react to comments
  So that I can express my opinion quickly

  Scenario: Add like reaction
    Given a comment with 0 likes
    When I click the "좋아요" button
    Then the like count should show "1"
    And the button should have active state (blue)
    And I should see a pulse animation
    And the change should persist on page refresh

  Scenario: Toggle reaction
    Given I have liked a comment
    When I click the "좋아요" button again
    Then my like should be removed
    And the count should decrease by 1
    And the button should return to default state

  Scenario: Switch reactions
    Given I have liked a comment
    When I click the "질문있어요" button
    Then my like should be removed
    And the question reaction should be added
    And both counts should update accordingly
    And only the question button should be active
```

### Scenario 2.2: Multiple Users Reacting
```gherkin
Feature: Concurrent Reactions
  As multiple users
  We want to react simultaneously
  So that all reactions are counted correctly

  Scenario: Simultaneous reactions
    Given User A and User B are viewing the same comment
    When User A clicks "좋아요" at time T
    And User B clicks "좋아요" at time T+100ms
    Then the like count should show "2"
    And both users should see their reactions as active
    And no race condition should occur

  Scenario: Real-time reaction updates
    Given I am viewing a comment with 5 likes
    When another user adds a like
    Then I should see the count update to 6 in real-time
    Without refreshing the page
```

### Scenario 2.3: Reaction Analytics
```gherkin
Feature: Reaction Tracking
  As a system
  I want to track reaction patterns
  So that we can measure engagement

  @analytics
  Scenario: Track reaction events
    When a user adds a "좋아요" reaction
    Then analytics should capture:
      | event_name        | reaction_added |
      | reaction_type     | like          |
      | comment_depth     | 0             |
      | time_to_reaction  | 1500          |
      | user_role         | member        |
```

---

## 3. Threading System

### Scenario 3.1: Creating Replies
```gherkin
Feature: Comment Threading
  As a user
  I want to reply to specific comments
  So that conversations stay organized

  Scenario: Reply to top-level comment
    Given a comment "원본 코멘트"
    When I click the "답글" button
    Then a reply form should appear below the comment
    And show "@김철수님에게 답글"
    When I type "답글 내용입니다"
    And click "답글 작성"
    Then my reply should appear indented
    And the parent should show "답글 1개"

  Scenario: Reply to a reply (nested)
    Given a comment with an existing reply
    When I reply to the reply
    Then my comment should appear at depth 2
    And further reply buttons should be disabled
    To prevent excessive nesting

  Scenario: Cancel reply
    Given I have opened a reply form
    When I click "취소" or press Escape
    Then the reply form should close
    And focus should return to the "답글" button
```

### Scenario 3.2: Thread Expansion
```gherkin
Feature: Thread Visibility
  As a user
  I want to expand/collapse threads
  So that I can manage information density

  Scenario: Expand thread with multiple replies
    Given a comment with "답글 5개"
    When I click "▶ 답글 5개 보기"
    Then all 5 replies should expand smoothly
    And the button should change to "▼ 답글 숨기기"
    And nested replies should also be visible

  Scenario: Collapse expanded thread
    Given an expanded thread
    When I click "▼ 답글 숨기기"
    Then the replies should collapse
    And only the parent comment remains visible
    And the button returns to "▶ 답글 5개 보기"

  Scenario: Auto-expand on direct link
    When I access a direct link to a nested reply
    Then the thread should auto-expand
    And the target reply should be highlighted
    And scrolled into view
```

---

## 4. Timestamp Integration

### Scenario 4.1: Timestamped Comments
```gherkin
Feature: Video Timestamp Integration
  As a user
  I want to link comments to video moments
  So that feedback has context

  Scenario: Create comment at specific time
    Given the video is playing at 2:34
    When I create a comment
    Then the comment form should show "📍 현재 시점: 2:34"
    When I submit the comment
    Then it should display with timestamp "2:34 ⏱️"
    And the timestamp should be clickable

  Scenario: Navigate via timestamp
    Given a comment with timestamp "1:45"
    When I click the timestamp
    Then the video should seek to 1:45
    And the video should resume playing
    And the comment should highlight briefly
    And analytics should track the navigation

  Scenario: Timestamp in paused state
    Given the video is paused at 3:20
    When I create a comment
    Then it should capture timestamp 3:20
    Even though the video is not playing
```

### Scenario 4.2: Timestamp Formatting
```gherkin
Feature: Timestamp Display
  As a system
  I want to format timestamps appropriately
  Based on video duration

  Scenario: Short video format
    Given a video shorter than 1 hour
    Then timestamps should use "M:SS" format
    Examples:
      | seconds | display |
      | 65      | 1:05    |
      | 125     | 2:05    |
      | 599     | 9:59    |

  Scenario: Long video format
    Given a video longer than 1 hour
    Then timestamps should use "H:MM:SS" format
    Examples:
      | seconds | display   |
      | 3665    | 1:01:05   |
      | 7200    | 2:00:00   |
```

---

## 5. Accessibility Testing

### Scenario 5.1: Keyboard Navigation
```gherkin
Feature: Keyboard Accessibility
  As a keyboard user
  I want to navigate without a mouse
  So that the interface is accessible

  Scenario: Tab navigation
    When I press Tab repeatedly
    Then focus should move through:
      | 1 | Comment input field      |
      | 2 | Submit button           |
      | 3 | Sort dropdown           |
      | 4 | First comment           |
      | 5 | Like button             |
      | 6 | Dislike button          |
      | 7 | Question button         |
      | 8 | Reply button            |
      | 9 | More menu               |
      | 10| Next comment            |

  Scenario: Keyboard shortcuts
    When I press these keys:
      | Key     | Action                    |
      | Enter   | Submit comment/Open menu  |
      | Space   | Toggle reaction          |
      | Escape  | Close menu/Cancel reply  |
      | R       | Quick reply              |
      | L       | Quick like               |
      | /       | Focus search             |
```

### Scenario 5.2: Screen Reader Support
```gherkin
Feature: Screen Reader Accessibility
  As a screen reader user
  I want proper announcements
  So that I can understand the interface

  Scenario: Comment structure announcement
    When navigating to a comment
    Then screen reader should announce:
      """
      Article, 코멘트 by 김철수
      이 영상의 편집이 훌륭합니다
      5분 전, 비디오 2분 34초 시점
      좋아요 12개 버튼, 싫어요 3개 버튼, 질문 5개 버튼
      답글 2개, 확장됨
      """

  Scenario: Live region updates
    When another user adds a comment
    Then screen reader should announce:
      "새 코멘트가 추가되었습니다"
    When I add a reaction
    Then screen reader should announce:
      "좋아요 반응을 추가했습니다"
```

### Scenario 5.3: Focus Management
```gherkin
Feature: Focus Management
  As a user
  I want focus to move logically
  So that the interface is predictable

  Scenario: Focus after comment submission
    When I submit a new comment
    Then focus should move to the newly created comment
    So I can immediately see my contribution

  Scenario: Focus after deletion
    When I delete a comment
    Then focus should move to the next comment
    Or to the comment form if no more comments

  Scenario: Focus trap in modal
    When the login modal opens
    Then focus should be trapped within the modal
    And Tab should cycle through modal elements only
    Until the modal is closed
```

---

## 6. Error Handling

### Scenario 6.1: Network Errors
```gherkin
Feature: Network Error Recovery
  As a user
  I want graceful error handling
  So that I don't lose my work

  Scenario: Comment submission failure
    Given I have typed a long comment
    When the network fails during submission
    Then I should see "전송 실패. 다시 시도하세요."
    And my comment text should be preserved
    And a retry button should appear
    When network recovers and I click retry
    Then the comment should submit successfully

  Scenario: Reaction failure with rollback
    Given a comment shows 5 likes
    When I click like but the request fails
    Then the UI should optimistically show 6
    But roll back to 5 after failure
    And show toast "반응 추가 실패"
```

### Scenario 6.2: Validation Errors
```gherkin
Feature: Input Validation
  As a system
  I want to validate user input
  So that data quality is maintained

  Scenario: Empty comment prevention
    When I try to submit an empty comment
    Then the submit button should be disabled
    And no request should be sent

  Scenario: XSS prevention
    When I submit a comment with "<script>alert('xss')</script>"
    Then the content should be sanitized
    And displayed as plain text
    Not executed as code

  Scenario: Rate limiting
    When I submit 10 comments in 1 minute
    Then I should see "너무 많은 요청입니다"
    And further submissions blocked for 60 seconds
    With a countdown timer showing remaining time
```

---

## 7. Performance Tests

### Scenario 7.1: Load Performance
```gherkin
Feature: Performance Optimization
  As a user
  I want fast load times
  So that the experience is smooth

  Scenario: Initial load performance
    When I load a page with 100 comments
    Then the first 20 should render within 500ms
    And remaining comments should lazy load
    And total blocking time should be < 300ms

  Scenario: Scroll performance
    Given 500 comments are loaded
    When I scroll quickly through the list
    Then FPS should remain above 30
    And there should be no jank
    Using virtual scrolling for optimization
```

### Scenario 7.2: Real-time Updates
```gherkin
Feature: WebSocket Performance
  As a system
  I want efficient real-time updates
  So that server resources are conserved

  Scenario: Batch updates
    When 5 reactions occur within 100ms
    Then they should be batched into one update
    Rather than 5 separate WebSocket messages

  Scenario: Connection recovery
    When WebSocket connection is lost
    Then it should attempt reconnection with backoff:
      | Attempt | Delay |
      | 1       | 1s    |
      | 2       | 2s    |
      | 3       | 4s    |
      | 4       | 8s    |
    And queue updates during disconnection
```

---

## 8. Mobile-Specific Tests

### Scenario 8.1: Touch Interactions
```gherkin
Feature: Mobile Touch Support
  As a mobile user
  I want touch-optimized interactions
  So that the experience is natural

  Scenario: Swipe to reveal actions
    When I swipe left on a comment
    Then action buttons should slide into view
    Including "답글", "반응", "더보기"

  Scenario: Long press for menu
    When I long-press on my comment
    Then the context menu should appear
    With options for edit and delete

  Scenario: Pull to refresh
    When I pull down at the top of comments
    Then a refresh indicator should appear
    And new comments should load
```

### Scenario 8.2: Responsive Layout
```gherkin
Feature: Responsive Design
  As a mobile user
  I want appropriate layouts
  For different screen sizes

  Scenario: Portrait mode layout
    Given device width is 375px
    Then comments should be single column
    And reactions should show icons only
    And thread indentation should be reduced

  Scenario: Landscape mode layout  
    Given device width is 812px (landscape)
    Then layout should adjust to two columns
    With video on left, comments on right
```

---

## Test Data Sets

### Fixed Test Users
```javascript
export const testUsers = {
  admin: {
    id: 'user-admin-1',
    name: '관리자',
    email: 'admin@videoplanet.com',
    role: 'admin'
  },
  member: {
    id: 'user-member-1',
    name: '김철수',
    email: 'member@example.com',
    role: 'member'
  },
  guest: {
    id: 'user-guest-1',
    name: '게스트사용자',
    email: null,
    role: 'guest'
  }
}
```

### Deterministic Test Comments
```javascript
export const testComments = [
  {
    id: 'comment-1',
    content: '테스트 코멘트 1번',
    authorId: 'user-member-1',
    createdAt: '2025-01-24T10:00:00Z',
    videoTimestamp: 120,
    reactions: { like: 5, dislike: 1, question: 2 }
  },
  {
    id: 'comment-2',
    content: '테스트 답글',
    parentId: 'comment-1',
    authorId: 'user-admin-1',
    createdAt: '2025-01-24T10:05:00Z',
    reactions: { like: 2, dislike: 0, question: 1 }
  }
]
```

---

## Coverage Matrix

| Feature | Unit Tests | Integration | E2E | Manual |
|---------|------------|-------------|-----|--------|
| Comment CRUD | ✅ | ✅ | ✅ | ✅ |
| Reactions | ✅ | ✅ | ✅ | ✅ |
| Threading | ✅ | ✅ | ✅ | ✅ |
| Timestamps | ✅ | ✅ | ✅ | ✅ |
| Auth/Permissions | ✅ | ✅ | ✅ | ✅ |
| Accessibility | ⚠️ | ✅ | ✅ | ✅ |
| Performance | ⚠️ | ✅ | ⚠️ | ✅ |
| Mobile | ❌ | ⚠️ | ✅ | ✅ |

Legend: ✅ Complete | ⚠️ Partial | ❌ Not Started

---

## Automation Strategy

### CI/CD Integration
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Comment Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Playwright
        run: npm ci && npx playwright install
      - name: Run E2E tests
        run: npm run test:e2e:comments
      - name: Upload test results
        uses: actions/upload-artifact@v2
        with:
          name: test-results
          path: test-results/
```

### Test Execution Commands
```bash
# Run all comment system tests
npm run test:comments

# Run specific scenario
npm run test:comments -- --grep "timestamp"

# Run with specific browser
npm run test:comments -- --browser=webkit

# Run in headed mode for debugging
npm run test:comments -- --headed

# Generate coverage report
npm run test:comments:coverage
```

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-08-24  
**Test Framework**: Playwright/Cypress  
**Related Documents**: 
- UX_COMMENT_SYSTEM_SPECIFICATION.md
- UX_COMMENT_WIREFRAMES.md