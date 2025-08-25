/**
 * AI 영상 기획 시스템 - Google Images API Mock
 * 
 * INSTRUCTION.md 요구사항:
 * - 콘티(스케치 느낌의 러프) 생성
 * - "storyboard pencil sketch, rough, monochrome" 스타일
 * - 생성/재생성/다운로드 기능
 * - GOOGLE_API_KEY 서버 보관
 * 
 * @author Grace (QA Lead) - AI API Testing Specialist
 */

import { test, expect } from '@playwright/test';

// Google Images API 응답 타입
export interface GoogleImageGenerationRequest {
  prompt: string;
  style: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  seed?: number;
}

export interface GoogleImageGenerationResponse {
  success: boolean;
  data?: {
    imageUrl: string;
    thumbnailUrl: string;
    metadata: {
      prompt: string;
      style: string;
      dimensions: { width: number; height: number };
      seed: number;
      generationTimeMs: number;
    };
  };
  error?: {
    code: 'QUOTA_EXCEEDED' | 'INVALID_PROMPT' | 'API_ERROR' | 'TIMEOUT';
    message: string;
    retryAfterSeconds?: number;
  };
}

export interface ContiImageVersion {
  version: number;
  imageUrl: string;
  thumbnailUrl: string;
  prompt: string;
  createdAt: string;
}

/**
 * Mock Google Images API 서비스
 * 실제 Google API 없이 콘티 이미지 생성 시뮬레이션
 */
export class MockGoogleImagesAPI {
  private quotaUsed: number = 0;
  private dailyQuotaLimit: number = 100;
  private failureRate: number = 0;
  private latencyMs: number = 3000;
  private apiKeyValid: boolean = true;
  
  // Mock 이미지 데이터베이스
  private mockImages: Map<string, string> = new Map([
    // 기 단계 콘티 이미지들
    ['storyboard pencil sketch office morning scene', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
    ['storyboard pencil sketch elevator meeting scene', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
    ['storyboard pencil sketch decision moment scene', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
    // 승 단계 콘티 이미지들  
    ['storyboard pencil sketch conflict tension scene', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
    ['storyboard pencil sketch obstacle challenge scene', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
    ['storyboard pencil sketch pressure building scene', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
    // 전 단계 콘티 이미지들
    ['storyboard pencil sketch climax peak scene', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
    ['storyboard pencil sketch turning point scene', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
    ['storyboard pencil sketch decisive moment scene', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
    // 결 단계 콘티 이미지들
    ['storyboard pencil sketch resolution ending scene', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
    ['storyboard pencil sketch message delivery scene', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='],
    ['storyboard pencil sketch hope new beginning scene', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==']
  ]);

  constructor(options?: {
    dailyQuotaLimit?: number;
    failureRate?: number;
    latencyMs?: number;
    apiKeyValid?: boolean;
  }) {
    if (options) {
      this.dailyQuotaLimit = options.dailyQuotaLimit ?? 100;
      this.failureRate = options.failureRate ?? 0;
      this.latencyMs = options.latencyMs ?? 3000;
      this.apiKeyValid = options.apiKeyValid ?? true;
    }
  }

  /**
   * 콘티 이미지 생성 Mock
   */
  async generateContiImage(request: GoogleImageGenerationRequest): Promise<GoogleImageGenerationResponse> {
    await this.simulateLatency();

    // API 키 검증
    if (!this.apiKeyValid) {
      return this.createErrorResponse('API_ERROR', 'Invalid API key');
    }

    // 쿼터 제한 체크
    if (this.isQuotaExceeded()) {
      return this.createErrorResponse('QUOTA_EXCEEDED', 'Daily quota exceeded', 3600);
    }

    // 프롬프트 검증
    if (!this.isValidPrompt(request.prompt)) {
      return this.createErrorResponse('INVALID_PROMPT', 'Prompt contains inappropriate content');
    }

    // 랜덤 실패 시뮬레이션
    if (this.shouldFail()) {
      return this.createErrorResponse('API_ERROR', 'Image generation failed');
    }

    // 성공적인 이미지 생성 시뮬레이션
    this.quotaUsed++;
    const imageUrl = this.getMockImageUrl(request.prompt);
    const seed = Math.floor(Math.random() * 1000000);

    return {
      success: true,
      data: {
        imageUrl,
        thumbnailUrl: this.generateThumbnail(imageUrl),
        metadata: {
          prompt: request.prompt,
          style: request.style,
          dimensions: { 
            width: request.width ?? 512, 
            height: request.height ?? 768 
          },
          seed,
          generationTimeMs: this.latencyMs
        }
      }
    };
  }

  /**
   * 프롬프트 기반 콘티 프롬프트 생성
   */
  generateContiPrompt(shotDescription: string, shotType: string, composition: string): string {
    const baseStyle = "storyboard pencil sketch, rough, monochrome, hand-drawn";
    const negativePrompts = [
      "no text", "no words", "no letters", 
      "no glitch", "no artifacts", "no unrealistic lighting",
      "no oversaturation", "no digital noise"
    ];

    const sceneDescription = `${shotDescription} ${shotType} ${composition}`;
    const fullPrompt = `${baseStyle}, ${sceneDescription.toLowerCase()}`;

    return fullPrompt;
  }

  /**
   * 콘티 재생성 (버전 관리)
   */
  async regenerateContiImage(
    originalRequest: GoogleImageGenerationRequest, 
    currentVersion: number
  ): Promise<GoogleImageGenerationResponse> {
    // 기존 요청에 변형을 가해 재생성
    const modifiedRequest: GoogleImageGenerationRequest = {
      ...originalRequest,
      seed: Math.floor(Math.random() * 1000000), // 새로운 시드
      prompt: this.addVariation(originalRequest.prompt, currentVersion)
    };

    return await this.generateContiImage(modifiedRequest);
  }

  /**
   * 이미지 다운로드 링크 생성
   */
  generateDownloadLink(imageUrl: string, shotId: number, version: number): string {
    const filename = `S${shotId.toString().padStart(2, '0')}-conti-v${version}.png`;
    // 실제로는 임시 URL을 생성하지만, Mock에서는 blob URL 시뮬레이션
    return `blob:http://localhost:3000/${filename}#${Date.now()}`;
  }

  /**
   * 이미지 메타데이터 추출
   */
  extractImageMetadata(imageUrl: string) {
    return {
      filename: this.extractFilenameFromUrl(imageUrl),
      size: Math.floor(Math.random() * 500000) + 100000, // 100KB - 600KB
      format: 'PNG',
      createdAt: new Date().toISOString()
    };
  }

  // === Private Helper Methods ===

  private async simulateLatency(): Promise<void> {
    // Google API 특성상 이미지 생성은 시간이 걸림
    const delay = this.latencyMs + Math.random() * 2000; // ±2초 랜덤
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private isQuotaExceeded(): boolean {
    return this.quotaUsed >= this.dailyQuotaLimit;
  }

  private shouldFail(): boolean {
    return Math.random() < this.failureRate;
  }

  private isValidPrompt(prompt: string): boolean {
    // 부적절한 콘텐츠 필터링
    const forbiddenWords = ['violence', 'inappropriate', 'explicit'];
    return !forbiddenWords.some(word => prompt.toLowerCase().includes(word));
  }

  private getMockImageUrl(prompt: string): string {
    // 프롬프트와 가장 유사한 Mock 이미지 반환
    for (const [key, value] of this.mockImages) {
      if (this.calculateSimilarity(prompt, key) > 0.3) {
        return value;
      }
    }
    // 기본 이미지 반환
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
  }

  private generateThumbnail(imageUrl: string): string {
    // 썸네일은 원본과 동일하게 처리 (Mock에서는 간소화)
    return imageUrl;
  }

  private addVariation(originalPrompt: string, version: number): string {
    const variations = [
      'different angle', 
      'alternative perspective', 
      'varied composition',
      'modified lighting',
      'adjusted framing'
    ];
    const variation = variations[version % variations.length];
    return `${originalPrompt}, ${variation}`;
  }

  private extractFilenameFromUrl(url: string): string {
    const matches = url.match(/([^\/]+)\.png$/);
    return matches ? matches[0] : `conti-${Date.now()}.png`;
  }

  private calculateSimilarity(prompt1: string, prompt2: string): number {
    // 간단한 키워드 기반 유사도 계산
    const words1 = prompt1.toLowerCase().split(' ');
    const words2 = prompt2.toLowerCase().split(' ');
    const intersection = words1.filter(word => words2.includes(word));
    return intersection.length / Math.max(words1.length, words2.length);
  }

  private createErrorResponse(
    code: GoogleImageGenerationResponse['error']['code'], 
    message: string, 
    retryAfterSeconds?: number
  ): GoogleImageGenerationResponse {
    return {
      success: false,
      error: {
        code,
        message,
        retryAfterSeconds
      }
    };
  }

  // === Test Helper Methods ===

  /**
   * 테스트용 설정 메서드들
   */
  setQuotaLimit(limit: number): void {
    this.dailyQuotaLimit = limit;
  }

  setFailureRate(rate: number): void {
    this.failureRate = rate;
  }

  setLatency(ms: number): void {
    this.latencyMs = ms;
  }

  setApiKeyValid(valid: boolean): void {
    this.apiKeyValid = valid;
  }

  resetQuota(): void {
    this.quotaUsed = 0;
  }

  getQuotaUsage(): number {
    return this.quotaUsed;
  }

  getRemainingQuota(): number {
    return this.dailyQuotaLimit - this.quotaUsed;
  }

  addMockImage(prompt: string, imageData: string): void {
    this.mockImages.set(prompt, imageData);
  }
}

/**
 * 콘티 이미지 버전 관리 시스템
 */
export class ContiVersionManager {
  private versions: Map<number, ContiImageVersion[]> = new Map();

  addVersion(shotId: number, imageUrl: string, thumbnailUrl: string, prompt: string): number {
    const shotVersions = this.versions.get(shotId) || [];
    const newVersion = shotVersions.length + 1;
    
    const versionData: ContiImageVersion = {
      version: newVersion,
      imageUrl,
      thumbnailUrl,
      prompt,
      createdAt: new Date().toISOString()
    };

    shotVersions.push(versionData);
    
    // 최대 5개 버전 유지
    if (shotVersions.length > 5) {
      shotVersions.shift();
      // 버전 번호 재조정
      shotVersions.forEach((v, index) => {
        v.version = index + 1;
      });
    }

    this.versions.set(shotId, shotVersions);
    return versionData.version;
  }

  getVersion(shotId: number, version: number): ContiImageVersion | null {
    const shotVersions = this.versions.get(shotId);
    return shotVersions?.find(v => v.version === version) || null;
  }

  getLatestVersion(shotId: number): ContiImageVersion | null {
    const shotVersions = this.versions.get(shotId);
    return shotVersions?.[shotVersions.length - 1] || null;
  }

  getAllVersions(shotId: number): ContiImageVersion[] {
    return this.versions.get(shotId) || [];
  }

  deleteVersion(shotId: number, version: number): boolean {
    const shotVersions = this.versions.get(shotId);
    if (!shotVersions) return false;

    const index = shotVersions.findIndex(v => v.version === version);
    if (index === -1) return false;

    shotVersions.splice(index, 1);
    
    // 버전 번호 재조정
    shotVersions.forEach((v, idx) => {
      v.version = idx + 1;
    });

    return true;
  }
}

/**
 * 테스트용 Mock 데이터 생성기
 */
export class MockContiGenerator {
  static createSampleRequest(): GoogleImageGenerationRequest {
    return {
      prompt: "storyboard pencil sketch, office morning scene, establishing shot, rule of thirds",
      style: "storyboard pencil sketch, rough, monochrome",
      negativePrompt: "no text, no glitch, no unrealistic lighting",
      width: 512,
      height: 768,
      seed: 123456
    };
  }

  static createBatchRequests(shotCount: number = 12): GoogleImageGenerationRequest[] {
    const scenes = [
      'office morning scene', 'elevator meeting', 'decision moment',
      'conflict tension', 'obstacle challenge', 'pressure building',
      'climax peak scene', 'turning point', 'decisive moment',
      'resolution ending', 'message delivery', 'hope new beginning'
    ];

    return scenes.slice(0, shotCount).map((scene, index) => ({
      prompt: `storyboard pencil sketch, ${scene}, medium shot, rule of thirds`,
      style: "storyboard pencil sketch, rough, monochrome",
      negativePrompt: "no text, no glitch, no unrealistic lighting",
      width: 512,
      height: 768,
      seed: 123456 + index
    }));
  }
}