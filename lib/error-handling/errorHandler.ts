// ============================================================================
// Planet 에러 처리 시스템
// 원칙: 즉시 피드백, 명확한 복구 경로, 사용자 컨텍스트 유지
// ============================================================================

import { NextRouter } from 'next/router'

// ============================================================================
// 에러 타입 정의
// ============================================================================

export enum ErrorType {
  // 인증 에러
  AUTH_EXPIRED = 'AUTH_EXPIRED',
  AUTH_INVALID = 'AUTH_INVALID',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  
  // 네트워크 에러
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_SERVER_ERROR = 'NETWORK_SERVER_ERROR',
  
  // 비즈니스 로직 에러
  PROJECT_NOT_FOUND = 'PROJECT_NOT_FOUND',
  FEEDBACK_SUBMIT_FAILED = 'FEEDBACK_SUBMIT_FAILED',
  VIDEO_UPLOAD_FAILED = 'VIDEO_UPLOAD_FAILED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  
  // 유효성 에러
  VALIDATION_FAILED = 'VALIDATION_FAILED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  UNSUPPORTED_FORMAT = 'UNSUPPORTED_FORMAT',
  
  // 일반 에러
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// ============================================================================
// 에러 심각도
// ============================================================================

export enum ErrorSeverity {
  INFO = 'info',      // 정보성 메시지
  WARNING = 'warning', // 경고 (계속 가능)
  ERROR = 'error',    // 에러 (복구 필요)
  CRITICAL = 'critical' // 치명적 (즉시 조치)
}

// ============================================================================
// 에러 인터페이스
// ============================================================================

export interface AppError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  userMessage: string // 사용자에게 보여줄 메시지
  action?: ErrorAction // 복구 액션
  context?: Record<string, any> // 디버깅용 컨텍스트
  timestamp: Date
}

export interface ErrorAction {
  label: string // 버튼 텍스트 (동사형)
  action: () => void | Promise<void> // 실행할 함수
  isPrimary?: boolean // 주요 액션 여부
}

// ============================================================================
// 에러 메시지 매핑 (사용자 친화적)
// ============================================================================

const ERROR_MESSAGES: Record<ErrorType, { title: string; description: string; action: string }> = {
  // 인증 에러
  [ErrorType.AUTH_EXPIRED]: {
    title: '세션이 만료되었습니다',
    description: '보안을 위해 다시 로그인해 주세요',
    action: '다시 로그인하기'
  },
  [ErrorType.AUTH_INVALID]: {
    title: '인증 정보가 올바르지 않습니다',
    description: '이메일과 비밀번호를 확인해 주세요',
    action: '다시 시도하기'
  },
  [ErrorType.AUTH_REQUIRED]: {
    title: '로그인이 필요합니다',
    description: '이 기능을 사용하려면 로그인해 주세요',
    action: '로그인하기'
  },
  
  // 네트워크 에러
  [ErrorType.NETWORK_OFFLINE]: {
    title: '인터넷 연결이 끊어졌습니다',
    description: '네트워크 연결을 확인해 주세요',
    action: '새로고침하기'
  },
  [ErrorType.NETWORK_TIMEOUT]: {
    title: '요청 시간이 초과되었습니다',
    description: '서버 응답이 지연되고 있습니다',
    action: '다시 시도하기'
  },
  [ErrorType.NETWORK_SERVER_ERROR]: {
    title: '일시적인 서버 오류',
    description: '잠시 후 다시 시도해 주세요',
    action: '새로고침하기'
  },
  
  // 비즈니스 로직 에러
  [ErrorType.PROJECT_NOT_FOUND]: {
    title: '프로젝트를 찾을 수 없습니다',
    description: '삭제되었거나 접근 권한이 없습니다',
    action: '프로젝트 목록으로'
  },
  [ErrorType.FEEDBACK_SUBMIT_FAILED]: {
    title: '피드백 저장 실패',
    description: '입력한 내용은 유지됩니다',
    action: '다시 저장하기'
  },
  [ErrorType.VIDEO_UPLOAD_FAILED]: {
    title: '영상 업로드 실패',
    description: '파일 크기와 형식을 확인해 주세요',
    action: '다시 업로드하기'
  },
  [ErrorType.PERMISSION_DENIED]: {
    title: '접근 권한이 없습니다',
    description: '프로젝트 관리자에게 문의하세요',
    action: '돌아가기'
  },
  
  // 유효성 에러
  [ErrorType.VALIDATION_FAILED]: {
    title: '입력 내용을 확인해 주세요',
    description: '필수 항목을 모두 입력했는지 확인하세요',
    action: '수정하기'
  },
  [ErrorType.FILE_TOO_LARGE]: {
    title: '파일 크기가 너무 큽니다',
    description: '최대 2GB까지 업로드 가능합니다',
    action: '다른 파일 선택하기'
  },
  [ErrorType.UNSUPPORTED_FORMAT]: {
    title: '지원하지 않는 파일 형식',
    description: 'MP4, MOV, AVI 형식만 가능합니다',
    action: '다른 파일 선택하기'
  },
  
  // 일반 에러
  [ErrorType.UNKNOWN_ERROR]: {
    title: '예상치 못한 오류가 발생했습니다',
    description: '문제가 지속되면 고객센터에 문의하세요',
    action: '새로고침하기'
  }
}

// ============================================================================
// 에러 핸들러 클래스
// ============================================================================

class ErrorHandler {
  private static instance: ErrorHandler
  private errorQueue: AppError[] = []
  private listeners: ((error: AppError) => void)[] = []
  
  private constructor() {}
  
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }
  
  // 에러 생성
  public createError(
    type: ErrorType,
    options?: {
      severity?: ErrorSeverity
      context?: Record<string, any>
      customMessage?: string
    }
  ): AppError {
    const errorInfo = ERROR_MESSAGES[type]
    
    return {
      type,
      severity: options?.severity || this.getSeverityByType(type),
      message: `${type}: ${options?.customMessage || errorInfo.description}`,
      userMessage: options?.customMessage || errorInfo.description,
      context: options?.context || {},
      timestamp: new Date()
    }
  }
  
  // 에러 처리
  public handleError(error: AppError, router?: NextRouter): void {
    // 에러 로깅
    this.logError(error)
    
    // 리스너에게 알림
    this.notifyListeners(error)
    
    // 심각도에 따른 처리
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        this.handleCriticalError(error, router)
        break
      case ErrorSeverity.ERROR:
        this.handleRecoverableError(error)
        break
      case ErrorSeverity.WARNING:
        this.handleWarning(error)
        break
      case ErrorSeverity.INFO:
        this.handleInfo(error)
        break
    }
    
    // 큐에 추가 (디버깅용)
    this.errorQueue.push(error)
    if (this.errorQueue.length > 50) {
      this.errorQueue.shift()
    }
  }
  
  // 복구 액션 생성
  public createRecoveryAction(
    type: ErrorType,
    router?: NextRouter
  ): ErrorAction {
    const errorInfo = ERROR_MESSAGES[type]
    
    switch (type) {
      case ErrorType.AUTH_EXPIRED:
      case ErrorType.AUTH_REQUIRED:
        return {
          label: errorInfo.action,
          action: () => {
            if (router) {
              router.push('/login')
            } else {
              window.location.href = '/login'
            }
          },
          isPrimary: true
        }
      
      case ErrorType.NETWORK_OFFLINE:
      case ErrorType.NETWORK_SERVER_ERROR:
        return {
          label: errorInfo.action,
          action: () => window.location.reload(),
          isPrimary: true
        }
      
      case ErrorType.PROJECT_NOT_FOUND:
        return {
          label: errorInfo.action,
          action: () => {
            if (router) {
              router.push('/projects')
            } else {
              window.location.href = '/projects'
            }
          },
          isPrimary: true
        }
      
      default:
        return {
          label: errorInfo.action,
          action: () => window.location.reload(),
          isPrimary: false
        }
    }
  }
  
  // 리스너 등록
  public subscribe(listener: (error: AppError) => void): () => void {
    this.listeners.push(listener)
    
    // unsubscribe 함수 반환
    return () => {
      const index = this.listeners.indexOf(listener)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }
  
  // Private 메서드들
  
  private getSeverityByType(type: ErrorType): ErrorSeverity {
    switch (type) {
      case ErrorType.AUTH_EXPIRED:
      case ErrorType.AUTH_INVALID:
      case ErrorType.PERMISSION_DENIED:
        return ErrorSeverity.ERROR
      
      case ErrorType.NETWORK_SERVER_ERROR:
      case ErrorType.VIDEO_UPLOAD_FAILED:
        return ErrorSeverity.CRITICAL
      
      case ErrorType.VALIDATION_FAILED:
      case ErrorType.FILE_TOO_LARGE:
        return ErrorSeverity.WARNING
      
      default:
        return ErrorSeverity.INFO
    }
  }
  
  private logError(error: AppError): void {
    // 프로덕션에서는 에러 트래킹 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
      // Sentry, LogRocket 등으로 전송
      console.error('[ERROR]', error)
    } else {
      console.group(`[${error.severity.toUpperCase()}] ${error.type}`)
      console.error('Message:', error.message)
      console.error('User Message:', error.userMessage)
      if (error.context) {
        console.error('Context:', error.context)
      }
      console.error('Timestamp:', error.timestamp)
      console.groupEnd()
    }
  }
  
  private notifyListeners(error: AppError): void {
    this.listeners.forEach(listener => {
      try {
        listener(error)
      } catch (e) {
        console.error('Error in error listener:', e)
      }
    })
  }
  
  private handleCriticalError(error: AppError, router?: NextRouter): void {
    // 치명적 에러는 즉시 사용자에게 알림
    // Toast나 Modal로 표시
    const action = this.createRecoveryAction(error.type, router)
    
    // 여기서 Toast/Modal 시스템 호출
    console.error('CRITICAL ERROR - User action required:', action.label)
  }
  
  private handleRecoverableError(error: AppError): void {
    // 복구 가능한 에러는 인라인 메시지로 표시
    console.warn('Recoverable error:', error.userMessage)
  }
  
  private handleWarning(error: AppError): void {
    // 경고는 일시적 알림으로 표시
    console.warn('Warning:', error.userMessage)
  }
  
  private handleInfo(error: AppError): void {
    // 정보성 메시지는 로그만
    console.info('Info:', error.userMessage)
  }
  
  // 최근 에러 조회
  public getRecentErrors(): AppError[] {
    return [...this.errorQueue]
  }
  
  // 에러 큐 초기화
  public clearErrors(): void {
    this.errorQueue = []
  }
}

// ============================================================================
// 싱글톤 인스턴스 export
// ============================================================================

export const errorHandler = ErrorHandler.getInstance()

// ============================================================================
// React Hook
// ============================================================================

export function useErrorHandler() {
  return {
    handleError: (error: AppError) => errorHandler.handleError(error),
    createError: (type: ErrorType, options?: any) => errorHandler.createError(type, options),
    createRecoveryAction: (type: ErrorType) => errorHandler.createRecoveryAction(type)
  }
}