/**
 * AI 영상 기획 시스템 - LLM 서비스 Mock
 * 
 * INSTRUCTION.md 요구사항에 따른 LLM 호출 시뮬레이션:
 * - 4단계(기·승·전·결) 생성
 * - 12개 숏트 분해
 * - 인서트샷 3개 추천
 * 
 * @author Grace (QA Lead) - Quality-First AI Testing Framework
 */

import { test, expect } from '@playwright/test';

// AI 기획 시스템 타입 정의
export interface StoryMetadata {
  title: string;
  oneLiner: string;
  toneAndManner: string[];
  genre: string[];
  target: string;
  duration: string;
  format: string;
  tempo: 'fast' | 'normal' | 'slow';
  developmentMethod: string;
  developmentIntensity: 'as-is' | 'moderate' | 'rich';
}

export interface StoryStage {
  stage: '기' | '승' | '전' | '결';
  title: string;
  summary: string;
  content: string;
  objective: string;
  lengthHint: string;
  keyPoints: string[];
}

export interface ShotDetails {
  id: number;
  title: string;
  description: string;
  shotType: string;
  camera: string;
  composition: string;
  duration: string;
  dialogue?: string;
  subtitle?: string;
  transition: string;
  contiImageUrl?: string;
  insertShots?: InsertShot[];
}

export interface InsertShot {
  purpose: string;
  description: string;
  framing: string;
}

export interface LLMResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    retryable: boolean;
  };
  metadata: {
    tokensUsed: number;
    processingTimeMs: number;
    model: string;
  };
}

/**
 * Mock LLM 서비스 클래스
 * 실제 AI API 호출 없이 테스트 가능한 시뮬레이션 제공
 */
export class MockLLMService {
  private failureRate: number = 0;
  private latencyMs: number = 1000;
  private tokenLimit: number = 4000;
  private currentTokens: number = 0;

  constructor(options?: {
    failureRate?: number;
    latencyMs?: number;
    tokenLimit?: number;
  }) {
    if (options) {
      this.failureRate = options.failureRate ?? 0;
      this.latencyMs = options.latencyMs ?? 1000;
      this.tokenLimit = options.tokenLimit ?? 4000;
    }
  }

  /**
   * 4단계 스토리 생성 Mock
   */
  async generateFourStages(metadata: StoryMetadata): Promise<LLMResponse<StoryStage[]>> {
    await this.simulateLatency();

    if (this.shouldFail()) {
      return this.createErrorResponse('GENERATION_FAILED', '4단계 생성에 실패했습니다.');
    }

    if (this.isTokenLimitExceeded(800)) {
      return this.createErrorResponse('TOKEN_LIMIT_EXCEEDED', '토큰 한도를 초과했습니다.');
    }

    const stages: StoryStage[] = [
      {
        stage: '기',
        title: `${metadata.title} - 도입부`,
        summary: '상황 설정 및 주인물 소개',
        content: this.generateStageContent('기', metadata),
        objective: '시청자의 관심을 끌고 상황을 설정합니다.',
        lengthHint: this.calculateLengthHint(metadata.duration, 0.25),
        keyPoints: ['상황 설정', '캐릭터 소개', '갈등의 씨앗']
      },
      {
        stage: '승',
        title: `${metadata.title} - 전개부`,
        summary: '갈등 심화 및 상황 복잡화',
        content: this.generateStageContent('승', metadata),
        objective: '갈등을 심화시키고 긴장감을 조성합니다.',
        lengthHint: this.calculateLengthHint(metadata.duration, 0.35),
        keyPoints: ['갈등 심화', '장애물 등장', '긴장감 조성']
      },
      {
        stage: '전',
        title: `${metadata.title} - 절정부`,
        summary: '갈등의 절정 및 결정적 순간',
        content: this.generateStageContent('전', metadata),
        objective: '갈등이 최고조에 달하는 결정적 순간을 연출합니다.',
        lengthHint: this.calculateLengthHint(metadata.duration, 0.25),
        keyPoints: ['갈등 절정', '결정적 순간', '전환점']
      },
      {
        stage: '결',
        title: `${metadata.title} - 마무리`,
        summary: '갈등 해결 및 메시지 전달',
        content: this.generateStageContent('결', metadata),
        objective: '갈등을 해결하고 명확한 메시지를 전달합니다.',
        lengthHint: this.calculateLengthHint(metadata.duration, 0.15),
        keyPoints: ['갈등 해결', '메시지 전달', '여운 남기기']
      }
    ];

    return {
      success: true,
      data: stages,
      metadata: {
        tokensUsed: 750,
        processingTimeMs: this.latencyMs,
        model: 'mock-gpt-4'
      }
    };
  }

  /**
   * 12개 숏트 분해 Mock
   */
  async generateTwelveShots(stages: StoryStage[], metadata: StoryMetadata): Promise<LLMResponse<ShotDetails[]>> {
    await this.simulateLatency();

    if (this.shouldFail()) {
      return this.createErrorResponse('SHOT_GENERATION_FAILED', '숏트 분해에 실패했습니다.');
    }

    const shots: ShotDetails[] = [];
    let shotId = 1;

    // 각 단계를 3개씩 숏트로 분해 (총 12개)
    for (let stageIndex = 0; stageIndex < stages.length; stageIndex++) {
      const stage = stages[stageIndex];
      const shotsPerStage = 3;

      for (let shotIndex = 0; shotIndex < shotsPerStage; shotIndex++) {
        const shot: ShotDetails = {
          id: shotId++,
          title: `${stage.stage}${shotIndex + 1}: ${this.generateShotTitle(stage, shotIndex)}`,
          description: this.generateShotDescription(stage, shotIndex, metadata),
          shotType: this.generateShotType(shotIndex),
          camera: this.generateCameraMovement(metadata.tempo),
          composition: this.generateComposition(),
          duration: this.generateShotDuration(metadata.tempo),
          transition: this.generateTransition(stageIndex, shotIndex),
          insertShots: [] // 나중에 별도 호출로 생성
        };

        shots.push(shot);
      }
    }

    return {
      success: true,
      data: shots,
      metadata: {
        tokensUsed: 1200,
        processingTimeMs: this.latencyMs * 1.5,
        model: 'mock-gpt-4'
      }
    };
  }

  /**
   * 인서트샷 3개 추천 Mock
   */
  async generateInsertShots(shot: ShotDetails): Promise<LLMResponse<InsertShot[]>> {
    await this.simulateLatency(500); // 더 짧은 지연시간

    if (this.shouldFail()) {
      return this.createErrorResponse('INSERT_GENERATION_FAILED', '인서트샷 생성에 실패했습니다.');
    }

    const insertShots: InsertShot[] = [
      {
        purpose: '정보 보강',
        description: `${shot.title}의 배경 정보를 제공하는 세부 컷`,
        framing: 'Close-up'
      },
      {
        purpose: '리듬 조절',
        description: `템포 변화를 위한 컷어웨이 샷`,
        framing: 'Medium Shot'
      },
      {
        purpose: '관계 강조',
        description: `캐릭터 간의 관계성을 부각시키는 리액션 샷`,
        framing: 'Two Shot'
      }
    ];

    return {
      success: true,
      data: insertShots,
      metadata: {
        tokensUsed: 200,
        processingTimeMs: 500,
        model: 'mock-gpt-4'
      }
    };
  }

  // === Private Helper Methods ===

  private async simulateLatency(customMs?: number): Promise<void> {
    const delay = customMs ?? this.latencyMs;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private shouldFail(): boolean {
    return Math.random() < this.failureRate;
  }

  private isTokenLimitExceeded(requiredTokens: number): boolean {
    this.currentTokens += requiredTokens;
    return this.currentTokens > this.tokenLimit;
  }

  private createErrorResponse<T>(code: string, message: string): LLMResponse<T> {
    return {
      success: false,
      error: {
        code,
        message,
        retryable: code !== 'TOKEN_LIMIT_EXCEEDED'
      },
      metadata: {
        tokensUsed: 0,
        processingTimeMs: this.latencyMs,
        model: 'mock-gpt-4'
      }
    };
  }

  private generateStageContent(stage: string, metadata: StoryMetadata): string {
    const intensityMap = {
      'as-is': '간결하고 직접적인',
      'moderate': '균형 잡힌 묘사의',
      'rich': '풍부한 감정과 환경 묘사가 포함된'
    };

    const intensity = intensityMap[metadata.developmentIntensity];
    
    return `${intensity} ${stage}단계 내용입니다. ${metadata.toneAndManner.join(', ')} 톤앤매너를 반영하여 ${metadata.target} 타겟층을 위한 ${metadata.genre.join(', ')} 장르의 스토리를 전개합니다.`;
  }

  private calculateLengthHint(duration: string, ratio: number): string {
    const totalSeconds = parseInt(duration) || 60;
    const stageSeconds = Math.floor(totalSeconds * ratio);
    return `약 ${stageSeconds}초`;
  }

  private generateShotTitle(stage: StoryStage, shotIndex: number): string {
    const titleTemplates = [
      '상황 설정',
      '갈등 도입',
      '결정적 순간'
    ];
    return titleTemplates[shotIndex] || `${stage.stage} 파트 ${shotIndex + 1}`;
  }

  private generateShotDescription(stage: StoryStage, shotIndex: number, metadata: StoryMetadata): string {
    return `${stage.objective}를 위한 ${shotIndex + 1}번째 숏입니다. ${metadata.tempo} 템포로 진행됩니다.`;
  }

  private generateShotType(shotIndex: number): string {
    const shotTypes = ['Establishing Shot', 'Medium Shot', 'Close-up', 'Wide Shot', 'Over-the-shoulder'];
    return shotTypes[shotIndex % shotTypes.length];
  }

  private generateCameraMovement(tempo: string): string {
    const movementMap = {
      'fast': ['Quick Pan', 'Rapid Zoom', 'Handheld'],
      'normal': ['Smooth Pan', 'Steady Cam', 'Slow Zoom'],
      'slow': ['Static', 'Slow Dolly', 'Gradual Tilt']
    };
    const movements = movementMap[tempo] || movementMap.normal;
    return movements[Math.floor(Math.random() * movements.length)];
  }

  private generateComposition(): string {
    const compositions = ['Rule of Thirds', 'Center Framing', 'Leading Lines', 'Symmetrical', 'Dutch Angle'];
    return compositions[Math.floor(Math.random() * compositions.length)];
  }

  private generateShotDuration(tempo: string): string {
    const durationMap = {
      'fast': '4-6초',
      'normal': '6-8초',
      'slow': '8-12초'
    };
    return durationMap[tempo] || '6-8초';
  }

  private generateTransition(stageIndex: number, shotIndex: number): string {
    const transitions = ['Cut', 'Fade', 'Dissolve', 'Wipe', 'Match Cut'];
    return transitions[Math.floor(Math.random() * transitions.length)];
  }

  // === Test Helper Methods ===

  /**
   * 테스트용 설정 메서드들
   */
  setFailureRate(rate: number): void {
    this.failureRate = rate;
  }

  setLatency(ms: number): void {
    this.latencyMs = ms;
  }

  resetTokens(): void {
    this.currentTokens = 0;
  }

  getTokenUsage(): number {
    return this.currentTokens;
  }
}

/**
 * 테스트용 Mock 데이터 생성기
 */
export class MockDataGenerator {
  static createSampleMetadata(): StoryMetadata {
    return {
      title: '테스트 영상 기획안',
      oneLiner: '평범한 직장인이 특별한 하루를 경험하는 이야기',
      toneAndManner: ['따뜻한', '유머러스한'],
      genre: ['드라마', '코미디'],
      target: '20-30대 직장인',
      duration: '60',
      format: '세로형',
      tempo: 'normal',
      developmentMethod: '클래식 기승전결',
      developmentIntensity: 'moderate'
    };
  }

  static createSampleStages(): StoryStage[] {
    return [
      {
        stage: '기',
        title: '평범한 아침',
        summary: '직장인의 일상적인 아침',
        content: '알람 소리와 함께 시작되는 평범한 하루',
        objective: '일상의 평범함을 설정',
        lengthHint: '15초',
        keyPoints: ['알람', '세수', '출근 준비']
      },
      {
        stage: '승',
        title: '예상치 못한 만남',
        summary: '우연한 만남이 가져온 변화',
        content: '엘리베이터에서 만난 신비로운 인물',
        objective: '갈등과 호기심 유발',
        lengthHint: '20초',
        keyPoints: ['엘리베이터', '만남', '호기심']
      },
      {
        stage: '전',
        title: '결정의 순간',
        summary: '선택의 기로에서의 갈등',
        content: '일상을 버릴 것인가, 지킬 것인가',
        objective: '절정의 갈등 연출',
        lengthHint: '15초',
        keyPoints: ['갈등', '선택', '결정']
      },
      {
        stage: '결',
        title: '새로운 시작',
        summary: '변화된 삶에 대한 깨달음',
        content: '작은 용기가 가져온 큰 변화',
        objective: '메시지 전달과 카타르시스',
        lengthHint: '10초',
        keyPoints: ['깨달음', '변화', '희망']
      }
    ];
  }
}