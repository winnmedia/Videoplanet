# 피드백 이메일 초대 시스템 설계 문서

## 목차
1. [시스템 개요](#시스템-개요)
2. [도메인 모델 설계](#도메인-모델-설계)
3. [데이터베이스 스키마](#데이터베이스-스키마)
4. [API 명세](#api-명세)
5. [이메일 서비스 통합](#이메일-서비스-통합)
6. [구현 전략](#구현-전략)

## 시스템 개요

### 비즈니스 요구사항
- 피드백 프로젝트에 멤버를 이메일로 초대
- 초대 이메일 발송 및 재발송 기능
- 초대 상태 추적 (발송됨, 수락됨, 거절됨, 만료됨)
- 대시보드에서 초대 현황 조회
- 초대 링크 보안 및 만료 관리

### 기술 스택
- **Backend**: Django 4.x (Railway 배포)
- **Database**: PostgreSQL
- **Email Service**: SendGrid (프로덕션) / Django Email Backend (개발)
- **Cache**: Redis (초대 토큰 캐싱)
- **Queue**: Celery + Redis (비동기 이메일 발송)

## 도메인 모델 설계

### 핵심 도메인 엔티티

```python
# Domain Layer - 비즈니스 규칙과 불변성 보장

class FeedbackInvitation:
    """피드백 초대 도메인 엔티티"""
    
    class Status(Enum):
        PENDING = "pending"          # 대기중
        SENT = "sent"               # 발송됨
        ACCEPTED = "accepted"       # 수락됨
        DECLINED = "declined"       # 거절됨
        EXPIRED = "expired"         # 만료됨
        CANCELLED = "cancelled"     # 취소됨
    
    class Role(Enum):
        VIEWER = "viewer"           # 조회만 가능
        COMMENTER = "commenter"     # 댓글 작성 가능
        REVIEWER = "reviewer"       # 리뷰어 (상태 변경 가능)
        ADMIN = "admin"            # 관리자
    
    def __init__(self, feedback_id, inviter_id, invitee_email, role):
        self.id = uuid.uuid4()
        self.feedback_id = feedback_id
        self.inviter_id = inviter_id
        self.invitee_email = invitee_email
        self.role = role
        self.status = Status.PENDING
        self.token = self._generate_secure_token()
        self.expires_at = datetime.now() + timedelta(days=7)
        self.created_at = datetime.now()
        self.sent_count = 0
        self.last_sent_at = None
    
    def can_resend(self):
        """재발송 가능 여부 확인"""
        if self.status not in [Status.PENDING, Status.SENT]:
            return False
        if self.sent_count >= 5:  # 최대 5회 제한
            return False
        if self.last_sent_at:
            # 최소 1시간 간격
            return (datetime.now() - self.last_sent_at).seconds >= 3600
        return True
    
    def mark_as_sent(self):
        """발송 완료 처리"""
        self.status = Status.SENT
        self.sent_count += 1
        self.last_sent_at = datetime.now()
    
    def accept(self, user_id):
        """초대 수락"""
        if self.is_expired():
            raise DomainException("초대가 만료되었습니다")
        if self.status != Status.SENT:
            raise DomainException("유효하지 않은 초대입니다")
        self.status = Status.ACCEPTED
        self.accepted_by = user_id
        self.accepted_at = datetime.now()
        return FeedbackMemberCreatedEvent(
            feedback_id=self.feedback_id,
            user_id=user_id,
            role=self.role
        )
```

## 데이터베이스 스키마

### 1. FeedbackInvitation 테이블

```sql
CREATE TABLE feedback_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feedback_id INTEGER NOT NULL REFERENCES feedbacks_feedback(id) ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES projects_project(id) ON DELETE CASCADE,
    inviter_id INTEGER NOT NULL REFERENCES users_user(id),
    invitee_email VARCHAR(255) NOT NULL,
    invitee_user_id INTEGER REFERENCES users_user(id),
    
    -- 초대 정보
    role VARCHAR(20) NOT NULL DEFAULT 'commenter',
    message TEXT,
    
    -- 상태 관리
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    
    -- 발송 추적
    sent_count INTEGER DEFAULT 0,
    last_sent_at TIMESTAMP,
    first_sent_at TIMESTAMP,
    
    -- 응답 추적
    accepted_at TIMESTAMP,
    declined_at TIMESTAMP,
    decline_reason TEXT,
    
    -- 메타데이터
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_token (token),
    INDEX idx_status (status),
    INDEX idx_feedback_id (feedback_id),
    INDEX idx_invitee_email (invitee_email),
    INDEX idx_expires_at (expires_at)
);
```

### 2. FeedbackInvitationActivity 테이블 (감사 로그)

```sql
CREATE TABLE feedback_invitation_activities (
    id SERIAL PRIMARY KEY,
    invitation_id UUID NOT NULL REFERENCES feedback_invitations(id) ON DELETE CASCADE,
    actor_id INTEGER REFERENCES users_user(id),
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_invitation_id (invitation_id),
    INDEX idx_created_at (created_at)
);
```

### 3. EmailTemplate 테이블

```sql
CREATE TABLE email_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    subject VARCHAR(255) NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT NOT NULL,
    variables JSONB,  -- 사용 가능한 변수 목록
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 기본 템플릿 삽입
INSERT INTO email_templates (name, subject, body_html, body_text, variables) VALUES
('feedback_invitation', 
 '[VideoPlanet] {{project_name}} 프로젝트 피드백 초대',
 '<html>...</html>',
 'text version...',
 '{"project_name": "string", "inviter_name": "string", "accept_url": "string"}'::jsonb
);
```

## API 명세

### 1. 초대 생성 및 발송

```yaml
POST /api/v1/feedbacks/{feedback_id}/invitations
Authorization: Bearer {token}
Content-Type: application/json

Request:
{
  "invitations": [
    {
      "email": "user@example.com",
      "role": "reviewer",
      "message": "프로젝트 리뷰를 부탁드립니다."
    }
  ],
  "send_immediately": true
}

Response (200 OK):
{
  "success": true,
  "data": {
    "total_invited": 1,
    "invitations": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "email": "user@example.com",
        "status": "sent",
        "role": "reviewer",
        "expires_at": "2025-08-31T23:59:59Z",
        "invitation_url": "https://videoplanet.com/invite/accept?token=..."
      }
    ]
  }
}

Error Response (400):
{
  "error": {
    "code": "DUPLICATE_INVITATION",
    "message": "이미 초대된 이메일입니다",
    "details": {
      "duplicate_emails": ["user@example.com"]
    }
  }
}
```

### 2. 초대 재발송

```yaml
POST /api/v1/invitations/{invitation_id}/resend
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "status": "sent",
    "sent_count": 2,
    "last_sent_at": "2025-08-24T10:30:00Z"
  }
}

Error Response (429 Too Many Requests):
{
  "error": {
    "code": "RESEND_LIMIT_EXCEEDED",
    "message": "재발송 제한을 초과했습니다. 1시간 후 다시 시도해주세요.",
    "retry_after": 3600
  }
}
```

### 3. 초대 목록 조회

```yaml
GET /api/v1/feedbacks/{feedback_id}/invitations
Authorization: Bearer {token}
Query Parameters:
  - status: pending|sent|accepted|declined|expired
  - page: 1
  - limit: 20

Response (200 OK):
{
  "success": true,
  "data": {
    "invitations": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "invitee": {
          "email": "user@example.com",
          "user_id": 123,
          "name": "홍길동"
        },
        "inviter": {
          "id": 456,
          "name": "김철수"
        },
        "status": "accepted",
        "role": "reviewer",
        "sent_count": 1,
        "created_at": "2025-08-24T09:00:00Z",
        "accepted_at": "2025-08-24T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 15,
      "page": 1,
      "limit": 20,
      "has_next": false
    }
  }
}
```

### 4. 초대 수락

```yaml
POST /api/v1/invitations/accept
Content-Type: application/json

Request:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user_id": 123  // 옵션: 로그인한 경우
}

Response (200 OK):
{
  "success": true,
  "data": {
    "message": "초대를 수락했습니다",
    "redirect_url": "/feedback/550e8400/view",
    "feedback": {
      "id": "550e8400",
      "project_name": "2025 브랜드 광고",
      "role": "reviewer"
    }
  }
}

Error Response (410 Gone):
{
  "error": {
    "code": "INVITATION_EXPIRED",
    "message": "초대가 만료되었습니다",
    "expired_at": "2025-08-31T23:59:59Z"
  }
}
```

### 5. 초대 취소

```yaml
DELETE /api/v1/invitations/{invitation_id}
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "message": "초대가 취소되었습니다"
}
```

### 6. 대시보드 통계

```yaml
GET /api/v1/feedbacks/{feedback_id}/invitations/stats
Authorization: Bearer {token}

Response (200 OK):
{
  "success": true,
  "data": {
    "total_invited": 25,
    "status_breakdown": {
      "pending": 5,
      "sent": 8,
      "accepted": 10,
      "declined": 1,
      "expired": 1
    },
    "role_breakdown": {
      "viewer": 5,
      "commenter": 10,
      "reviewer": 8,
      "admin": 2
    },
    "recent_activities": [
      {
        "type": "accepted",
        "user": "홍길동",
        "email": "hong@example.com",
        "timestamp": "2025-08-24T10:00:00Z"
      }
    ]
  }
}
```

## 이메일 서비스 통합

### SendGrid 설정

```python
# infrastructure/email/sendgrid_adapter.py

from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Personalization, From, To
from typing import List, Dict
import logging

logger = logging.getLogger(__name__)

class SendGridEmailAdapter(EmailServicePort):
    """SendGrid 이메일 서비스 어댑터"""
    
    def __init__(self, api_key: str, from_email: str, from_name: str):
        self.client = SendGridAPIClient(api_key)
        self.from_email = From(from_email, from_name)
    
    async def send_invitation_email(
        self,
        to_email: str,
        invitation: FeedbackInvitation,
        context: Dict
    ) -> bool:
        """초대 이메일 발송"""
        try:
            message = Mail(from_email=self.from_email)
            
            # 개인화 설정
            personalization = Personalization()
            personalization.add_to(To(to_email))
            personalization.dynamic_template_data = {
                'project_name': context['project_name'],
                'inviter_name': context['inviter_name'],
                'role': invitation.role.value,
                'message': context.get('message', ''),
                'accept_url': self._generate_accept_url(invitation.token),
                'decline_url': self._generate_decline_url(invitation.token),
                'expires_at': invitation.expires_at.strftime('%Y년 %m월 %d일'),
            }
            
            message.add_personalization(personalization)
            message.template_id = settings.SENDGRID_INVITATION_TEMPLATE_ID
            
            # 추적 설정
            message.tracking_settings = {
                'click_tracking': {'enable': True},
                'open_tracking': {'enable': True}
            }
            
            response = await self.client.send(message)
            
            if response.status_code == 202:
                logger.info(f"초대 이메일 발송 성공: {to_email}")
                return True
            else:
                logger.error(f"초대 이메일 발송 실패: {response.body}")
                return False
                
        except Exception as e:
            logger.exception(f"SendGrid 이메일 발송 오류: {str(e)}")
            return False
    
    async def send_bulk_invitations(
        self,
        invitations: List[FeedbackInvitation],
        context: Dict
    ) -> Dict[str, bool]:
        """대량 초대 이메일 발송"""
        results = {}
        
        # SendGrid 배치 처리 (최대 1000개)
        for batch in self._chunk_list(invitations, 1000):
            message = Mail(from_email=self.from_email)
            
            for invitation in batch:
                personalization = Personalization()
                personalization.add_to(To(invitation.invitee_email))
                personalization.dynamic_template_data = {
                    'project_name': context['project_name'],
                    'inviter_name': context['inviter_name'],
                    'role': invitation.role.value,
                    'accept_url': self._generate_accept_url(invitation.token),
                    'expires_at': invitation.expires_at.strftime('%Y년 %m월 %d일'),
                }
                message.add_personalization(personalization)
            
            message.template_id = settings.SENDGRID_INVITATION_TEMPLATE_ID
            
            try:
                response = await self.client.send(message)
                for invitation in batch:
                    results[invitation.invitee_email] = response.status_code == 202
            except Exception as e:
                logger.exception(f"배치 이메일 발송 오류: {str(e)}")
                for invitation in batch:
                    results[invitation.invitee_email] = False
        
        return results
```

### 이메일 템플릿

```html
<!-- email_templates/feedback_invitation.html -->
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VideoPlanet 피드백 초대</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #1631F8 0%, #667eea 100%);
            color: white;
            padding: 30px;
            border-radius: 10px 10px 0 0;
            text-align: center;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: #1631F8;
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .button:hover {
            background: #0f24c7;
        }
        .role-badge {
            display: inline-block;
            padding: 5px 15px;
            background: #e3f2fd;
            color: #1631F8;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #6c757d;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>VideoPlanet 피드백 초대</h1>
        <p>{{project_name}} 프로젝트</p>
    </div>
    
    <div class="content">
        <p>안녕하세요,</p>
        
        <p><strong>{{inviter_name}}</strong>님이 <strong>{{project_name}}</strong> 프로젝트의 피드백에 
        <span class="role-badge">{{role}}</span> 권한으로 초대했습니다.</p>
        
        {{#if message}}
        <div style="background: white; padding: 15px; border-left: 4px solid #1631F8; margin: 20px 0;">
            <p style="margin: 0;"><em>"{{message}}"</em></p>
        </div>
        {{/if}}
        
        <h3>초대 권한</h3>
        <ul>
            {{#if role == 'viewer'}}
            <li>피드백 내용 조회</li>
            <li>파일 다운로드</li>
            {{/if}}
            {{#if role == 'commenter'}}
            <li>피드백 내용 조회</li>
            <li>댓글 작성 및 수정</li>
            <li>파일 다운로드</li>
            {{/if}}
            {{#if role == 'reviewer'}}
            <li>피드백 내용 조회 및 편집</li>
            <li>댓글 작성 및 수정</li>
            <li>상태 변경 (진행중, 완료 등)</li>
            <li>파일 업로드 및 다운로드</li>
            {{/if}}
            {{#if role == 'admin'}}
            <li>모든 권한</li>
            <li>멤버 관리</li>
            <li>프로젝트 설정 변경</li>
            {{/if}}
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{accept_url}}" class="button">초대 수락하기</a>
        </div>
        
        <p style="font-size: 14px; color: #6c757d;">
            이 초대는 <strong>{{expires_at}}</strong>까지 유효합니다.
        </p>
        
        <p style="font-size: 14px; color: #6c757d;">
            초대를 원하지 않으시면 <a href="{{decline_url}}">여기</a>를 클릭하거나 이 이메일을 무시하세요.
        </p>
    </div>
    
    <div class="footer">
        <p>© 2025 VideoPlanet. All rights reserved.</p>
        <p>이 이메일은 자동으로 발송되었습니다. 회신하지 마세요.</p>
        <p>
            <a href="https://videoplanet.com/privacy">개인정보처리방침</a> | 
            <a href="https://videoplanet.com/terms">이용약관</a>
        </p>
    </div>
</body>
</html>
```

## 구현 전략

### 1. 도메인 레이어 구현

```python
# domain/feedback_invitation/services.py

from typing import List, Optional
from datetime import datetime, timedelta
import uuid

class FeedbackInvitationService:
    """피드백 초대 도메인 서비스"""
    
    def __init__(
        self,
        invitation_repo: InvitationRepositoryPort,
        email_service: EmailServicePort,
        event_bus: EventBusPort
    ):
        self.invitation_repo = invitation_repo
        self.email_service = email_service
        self.event_bus = event_bus
    
    async def create_and_send_invitations(
        self,
        feedback_id: int,
        inviter_id: int,
        invitations_data: List[Dict],
        send_immediately: bool = True
    ) -> List[FeedbackInvitation]:
        """초대 생성 및 발송"""
        
        # 1. 중복 체크
        existing_emails = await self.invitation_repo.get_existing_emails(
            feedback_id, [inv['email'] for inv in invitations_data]
        )
        
        if existing_emails:
            raise DuplicateInvitationError(
                f"이미 초대된 이메일: {', '.join(existing_emails)}"
            )
        
        # 2. 초대 엔티티 생성
        invitations = []
        for data in invitations_data:
            invitation = FeedbackInvitation(
                feedback_id=feedback_id,
                inviter_id=inviter_id,
                invitee_email=data['email'],
                role=FeedbackInvitation.Role(data['role']),
                message=data.get('message')
            )
            invitations.append(invitation)
        
        # 3. 저장
        saved_invitations = await self.invitation_repo.save_bulk(invitations)
        
        # 4. 이메일 발송
        if send_immediately:
            await self._send_invitation_emails(saved_invitations)
        
        # 5. 이벤트 발행
        for invitation in saved_invitations:
            await self.event_bus.publish(
                InvitationCreatedEvent(
                    invitation_id=invitation.id,
                    feedback_id=feedback_id,
                    invitee_email=invitation.invitee_email
                )
            )
        
        return saved_invitations
    
    async def resend_invitation(
        self,
        invitation_id: uuid.UUID,
        requester_id: int
    ) -> FeedbackInvitation:
        """초대 재발송"""
        
        # 1. 초대 조회
        invitation = await self.invitation_repo.get_by_id(invitation_id)
        if not invitation:
            raise InvitationNotFoundError()
        
        # 2. 권한 체크
        if not await self._can_manage_invitation(requester_id, invitation):
            raise PermissionDeniedError()
        
        # 3. 재발송 가능 여부 체크
        if not invitation.can_resend():
            raise ResendLimitExceededError(
                "재발송 제한을 초과했거나 대기 시간이 필요합니다"
            )
        
        # 4. 이메일 발송
        success = await self.email_service.send_invitation_email(
            invitation.invitee_email,
            invitation,
            await self._get_email_context(invitation)
        )
        
        if success:
            # 5. 상태 업데이트
            invitation.mark_as_sent()
            await self.invitation_repo.update(invitation)
            
            # 6. 활동 로그
            await self._log_activity(
                invitation_id=invitation.id,
                actor_id=requester_id,
                action='resent',
                details={'sent_count': invitation.sent_count}
            )
            
            # 7. 이벤트 발행
            await self.event_bus.publish(
                InvitationResentEvent(
                    invitation_id=invitation.id,
                    sent_count=invitation.sent_count
                )
            )
        
        return invitation
    
    async def accept_invitation(
        self,
        token: str,
        user_id: Optional[int] = None
    ) -> Dict:
        """초대 수락"""
        
        # 1. 토큰으로 초대 조회
        invitation = await self.invitation_repo.get_by_token(token)
        if not invitation:
            raise InvalidInvitationTokenError()
        
        # 2. 만료 체크
        if invitation.is_expired():
            invitation.status = FeedbackInvitation.Status.EXPIRED
            await self.invitation_repo.update(invitation)
            raise InvitationExpiredError()
        
        # 3. 이미 처리된 초대 체크
        if invitation.status in [
            FeedbackInvitation.Status.ACCEPTED,
            FeedbackInvitation.Status.DECLINED
        ]:
            raise InvitationAlreadyProcessedError()
        
        # 4. 사용자 확인/생성
        if not user_id:
            # 이메일로 사용자 조회 또는 게스트 생성
            user = await self._get_or_create_user(invitation.invitee_email)
            user_id = user.id
        
        # 5. 초대 수락 처리
        event = invitation.accept(user_id)
        await self.invitation_repo.update(invitation)
        
        # 6. 피드백 멤버 추가
        await self._add_feedback_member(
            feedback_id=invitation.feedback_id,
            user_id=user_id,
            role=invitation.role
        )
        
        # 7. 활동 로그
        await self._log_activity(
            invitation_id=invitation.id,
            actor_id=user_id,
            action='accepted'
        )
        
        # 8. 이벤트 발행
        await self.event_bus.publish(event)
        
        # 9. 알림 발송
        await self._notify_inviter(invitation, 'accepted')
        
        return {
            'invitation': invitation,
            'user_id': user_id,
            'redirect_url': f'/feedback/{invitation.feedback_id}/view'
        }
```

### 2. 애플리케이션 레이어 구현

```python
# application/feedback_invitation/use_cases.py

class SendFeedbackInvitationsUseCase:
    """피드백 초대 발송 유스케이스"""
    
    def __init__(
        self,
        invitation_service: FeedbackInvitationService,
        feedback_repo: FeedbackRepositoryPort,
        project_repo: ProjectRepositoryPort,
        user_repo: UserRepositoryPort
    ):
        self.invitation_service = invitation_service
        self.feedback_repo = feedback_repo
        self.project_repo = project_repo
        self.user_repo = user_repo
    
    async def execute(
        self,
        feedback_id: int,
        inviter_id: int,
        invitations_data: List[Dict]
    ) -> Dict:
        """초대 발송 실행"""
        
        # 1. 피드백 존재 확인
        feedback = await self.feedback_repo.get_by_id(feedback_id)
        if not feedback:
            raise FeedbackNotFoundError()
        
        # 2. 프로젝트 정보 조회
        project = await self.project_repo.get_by_feedback_id(feedback_id)
        
        # 3. 권한 확인
        if not await self._can_invite_members(inviter_id, project):
            raise PermissionDeniedError("멤버 초대 권한이 없습니다")
        
        # 4. 초대자 정보 조회
        inviter = await self.user_repo.get_by_id(inviter_id)
        
        # 5. 이메일 유효성 검증
        for data in invitations_data:
            if not self._is_valid_email(data['email']):
                raise InvalidEmailError(f"유효하지 않은 이메일: {data['email']}")
        
        # 6. 초대 생성 및 발송
        invitations = await self.invitation_service.create_and_send_invitations(
            feedback_id=feedback_id,
            inviter_id=inviter_id,
            invitations_data=invitations_data,
            send_immediately=True
        )
        
        # 7. 결과 반환
        return {
            'total_invited': len(invitations),
            'invitations': [
                {
                    'id': str(inv.id),
                    'email': inv.invitee_email,
                    'status': inv.status.value,
                    'role': inv.role.value,
                    'expires_at': inv.expires_at.isoformat(),
                    'invitation_url': self._generate_invitation_url(inv.token)
                }
                for inv in invitations
            ]
        }
```

### 3. 인프라 레이어 구현

```python
# infrastructure/repositories/feedback_invitation_repository.py

from typing import List, Optional
import uuid
from django.db import transaction

class DjangoFeedbackInvitationRepository(InvitationRepositoryPort):
    """Django ORM 초대 저장소 구현"""
    
    async def save_bulk(
        self,
        invitations: List[FeedbackInvitation]
    ) -> List[FeedbackInvitation]:
        """대량 초대 저장"""
        
        with transaction.atomic():
            db_invitations = []
            for invitation in invitations:
                db_invitation = FeedbackInvitationModel(
                    id=invitation.id,
                    feedback_id=invitation.feedback_id,
                    inviter_id=invitation.inviter_id,
                    invitee_email=invitation.invitee_email,
                    role=invitation.role.value,
                    status=invitation.status.value,
                    token=invitation.token,
                    expires_at=invitation.expires_at,
                    message=invitation.message
                )
                db_invitations.append(db_invitation)
            
            FeedbackInvitationModel.objects.bulk_create(db_invitations)
        
        return invitations
    
    async def get_by_token(self, token: str) -> Optional[FeedbackInvitation]:
        """토큰으로 초대 조회"""
        
        try:
            db_invitation = await FeedbackInvitationModel.objects.select_related(
                'feedback', 'inviter'
            ).aget(token=token)
            
            return self._to_domain(db_invitation)
        except FeedbackInvitationModel.DoesNotExist:
            return None
    
    async def get_existing_emails(
        self,
        feedback_id: int,
        emails: List[str]
    ) -> List[str]:
        """이미 초대된 이메일 확인"""
        
        existing = await FeedbackInvitationModel.objects.filter(
            feedback_id=feedback_id,
            invitee_email__in=emails,
            status__in=['pending', 'sent', 'accepted']
        ).values_list('invitee_email', flat=True)
        
        return list(existing)
    
    def _to_domain(self, db_model: FeedbackInvitationModel) -> FeedbackInvitation:
        """DB 모델을 도메인 엔티티로 변환"""
        
        invitation = FeedbackInvitation.__new__(FeedbackInvitation)
        invitation.id = db_model.id
        invitation.feedback_id = db_model.feedback_id
        invitation.inviter_id = db_model.inviter_id
        invitation.invitee_email = db_model.invitee_email
        invitation.role = FeedbackInvitation.Role(db_model.role)
        invitation.status = FeedbackInvitation.Status(db_model.status)
        invitation.token = db_model.token
        invitation.expires_at = db_model.expires_at
        invitation.sent_count = db_model.sent_count
        invitation.last_sent_at = db_model.last_sent_at
        invitation.created_at = db_model.created_at
        invitation.message = db_model.message
        
        if db_model.invitee_user_id:
            invitation.accepted_by = db_model.invitee_user_id
            invitation.accepted_at = db_model.accepted_at
        
        return invitation
```

### 4. API 뷰 구현

```python
# interfaces/api/v1/feedback_invitation_views.py

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

class FeedbackInvitationViewSet(viewsets.ModelViewSet):
    """피드백 초대 API 뷰셋"""
    
    permission_classes = [IsAuthenticated]
    
    @extend_schema(
        request=SendInvitationsSerializer,
        responses={200: InvitationResponseSerializer},
        description="피드백 프로젝트에 멤버 초대"
    )
    @action(detail=True, methods=['post'], url_path='invitations')
    async def send_invitations(self, request, pk=None):
        """초대 발송"""
        
        serializer = SendInvitationsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        use_case = SendFeedbackInvitationsUseCase(
            invitation_service=get_invitation_service(),
            feedback_repo=get_feedback_repo(),
            project_repo=get_project_repo(),
            user_repo=get_user_repo()
        )
        
        try:
            result = await use_case.execute(
                feedback_id=pk,
                inviter_id=request.user.id,
                invitations_data=serializer.validated_data['invitations']
            )
            
            return Response(
                {'success': True, 'data': result},
                status=status.HTTP_200_OK
            )
            
        except DuplicateInvitationError as e:
            return Response(
                {
                    'error': {
                        'code': 'DUPLICATE_INVITATION',
                        'message': str(e)
                    }
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        except PermissionDeniedError as e:
            return Response(
                {
                    'error': {
                        'code': 'PERMISSION_DENIED',
                        'message': str(e)
                    }
                },
                status=status.HTTP_403_FORBIDDEN
            )
    
    @extend_schema(
        responses={200: ResendResponseSerializer},
        description="초대 재발송"
    )
    @action(detail=True, methods=['post'], url_path='resend')
    async def resend_invitation(self, request, pk=None):
        """초대 재발송"""
        
        use_case = ResendInvitationUseCase(
            invitation_service=get_invitation_service()
        )
        
        try:
            result = await use_case.execute(
                invitation_id=pk,
                requester_id=request.user.id
            )
            
            return Response(
                {'success': True, 'data': result},
                status=status.HTTP_200_OK
            )
            
        except ResendLimitExceededError as e:
            return Response(
                {
                    'error': {
                        'code': 'RESEND_LIMIT_EXCEEDED',
                        'message': str(e),
                        'retry_after': 3600
                    }
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
```

### 5. 비동기 작업 처리 (Celery)

```python
# tasks/invitation_tasks.py

from celery import shared_task
from celery.utils.log import get_task_logger

logger = get_task_logger(__name__)

@shared_task(bind=True, max_retries=3)
def send_invitation_email_task(self, invitation_id: str):
    """비동기 초대 이메일 발송"""
    
    try:
        invitation = FeedbackInvitation.objects.get(id=invitation_id)
        
        # 이메일 서비스 초기화
        email_service = get_email_service()
        
        # 컨텍스트 준비
        context = {
            'project_name': invitation.feedback.project.name,
            'inviter_name': invitation.inviter.get_full_name(),
            'message': invitation.message
        }
        
        # 이메일 발송
        success = email_service.send_invitation_email(
            invitation.invitee_email,
            invitation,
            context
        )
        
        if success:
            invitation.status = 'sent'
            invitation.sent_count += 1
            invitation.last_sent_at = timezone.now()
            if not invitation.first_sent_at:
                invitation.first_sent_at = timezone.now()
            invitation.save()
            
            logger.info(f"초대 이메일 발송 성공: {invitation_id}")
        else:
            raise Exception("이메일 발송 실패")
            
    except Exception as exc:
        logger.error(f"초대 이메일 발송 실패: {exc}")
        
        # 재시도
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))

@shared_task
def check_expired_invitations():
    """만료된 초대 상태 업데이트 (매일 실행)"""
    
    expired_count = FeedbackInvitation.objects.filter(
        status__in=['pending', 'sent'],
        expires_at__lt=timezone.now()
    ).update(status='expired')
    
    logger.info(f"만료된 초대 {expired_count}개 처리 완료")

@shared_task
def send_invitation_reminder(invitation_id: str):
    """초대 리마인더 발송 (만료 1일 전)"""
    
    try:
        invitation = FeedbackInvitation.objects.get(
            id=invitation_id,
            status='sent'
        )
        
        # 만료 1일 전인지 확인
        time_until_expiry = invitation.expires_at - timezone.now()
        if time_until_expiry.days == 1:
            # 리마인더 이메일 발송
            email_service = get_email_service()
            email_service.send_reminder_email(invitation)
            
            logger.info(f"초대 리마인더 발송: {invitation_id}")
            
    except FeedbackInvitation.DoesNotExist:
        logger.warning(f"초대를 찾을 수 없음: {invitation_id}")
```

### 6. 에러 처리 및 재시도 로직

```python
# domain/feedback_invitation/exceptions.py

class FeedbackInvitationError(Exception):
    """피드백 초대 기본 예외"""
    pass

class DuplicateInvitationError(FeedbackInvitationError):
    """중복 초대 예외"""
    pass

class InvitationNotFoundError(FeedbackInvitationError):
    """초대를 찾을 수 없음"""
    pass

class InvitationExpiredError(FeedbackInvitationError):
    """초대 만료"""
    pass

class ResendLimitExceededError(FeedbackInvitationError):
    """재발송 제한 초과"""
    pass

class InvalidInvitationTokenError(FeedbackInvitationError):
    """유효하지 않은 초대 토큰"""
    pass

class InvitationAlreadyProcessedError(FeedbackInvitationError):
    """이미 처리된 초대"""
    pass

# infrastructure/error_handlers.py

from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    """커스텀 예외 핸들러"""
    
    response = exception_handler(exc, context)
    
    if response is not None:
        custom_response_data = {
            'error': {
                'code': exc.__class__.__name__,
                'message': str(exc),
                'timestamp': timezone.now().isoformat()
            }
        }
        
        if hasattr(exc, 'details'):
            custom_response_data['error']['details'] = exc.details
        
        response.data = custom_response_data
    
    return response

# 재시도 로직
class RetryableEmailService:
    """재시도 가능한 이메일 서비스"""
    
    def __init__(self, email_adapter: EmailServicePort):
        self.email_adapter = email_adapter
        self.max_retries = 3
        self.retry_delay = 1  # 초
    
    async def send_with_retry(
        self,
        to_email: str,
        template: str,
        context: Dict
    ) -> bool:
        """재시도 로직이 포함된 이메일 발송"""
        
        for attempt in range(self.max_retries):
            try:
                success = await self.email_adapter.send_email(
                    to_email, template, context
                )
                
                if success:
                    return True
                    
            except Exception as e:
                logger.error(
                    f"이메일 발송 실패 (시도 {attempt + 1}/{self.max_retries}): {e}"
                )
                
                if attempt < self.max_retries - 1:
                    await asyncio.sleep(self.retry_delay * (attempt + 1))
                else:
                    # 최종 실패 시 데드레터 큐로 전송
                    await self._send_to_dlq(to_email, template, context, str(e))
                    
        return False
    
    async def _send_to_dlq(
        self,
        to_email: str,
        template: str,
        context: Dict,
        error: str
    ):
        """실패한 이메일을 데드레터 큐로 전송"""
        
        dlq_message = {
            'to_email': to_email,
            'template': template,
            'context': context,
            'error': error,
            'failed_at': timezone.now().isoformat(),
            'retry_count': self.max_retries
        }
        
        # Redis나 다른 큐 시스템에 저장
        await redis_client.lpush('email_dlq', json.dumps(dlq_message))
```

## 다음 단계

이제 백엔드 아키텍처 설계가 완료되었습니다. 구현을 시작하시겠습니까? 

다음 작업들을 진행할 수 있습니다:
1. Django 모델 마이그레이션 파일 생성
2. API 시리얼라이저 구현
3. 테스트 코드 작성 (단위 테스트, 통합 테스트)
4. SendGrid 설정 및 환경 변수 구성
5. Celery 워커 설정
6. 프론트엔드 통합을 위한 API 문서 생성

어떤 부분부터 구현을 시작하시겠습니까?