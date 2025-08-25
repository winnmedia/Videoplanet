/**
 * AI 영상 기획 시스템 - PDF 생성 Mock
 * 
 * INSTRUCTION.md 요구사항:
 * - JSON → 여백 0 A4 가로 기준 PDF 생성
 * - 홈페이지 UI처럼 페이지 단위 디자인
 * - 표지 → 4단계 → 12숏트 카드 순 구성
 * - 콘티 이미지 임베딩
 * 
 * @author Grace (QA Lead) - Document Generation Testing Specialist
 */

import { StoryMetadata, StoryStage, ShotDetails } from './mock-llm-service';

// PDF 생성 관련 타입 정의
export interface PDFGenerationRequest {
  metadata: StoryMetadata;
  stages: StoryStage[];
  shots: ShotDetails[];
  includeContiImages: boolean;
  layoutStyle: 'card' | 'list' | 'grid';
}

export interface PDFPage {
  pageNumber: number;
  pageType: 'cover' | 'stages-overview' | 'shots-detail' | 'appendix';
  content: PDFPageContent;
}

export interface PDFPageContent {
  title?: string;
  sections: PDFSection[];
  images?: PDFImageElement[];
  footer?: string;
}

export interface PDFSection {
  type: 'text' | 'metadata' | 'stage-card' | 'shot-card' | 'insert-shots';
  title?: string;
  content: string | object;
  style?: PDFStyleOptions;
}

export interface PDFImageElement {
  src: string;
  alt: string;
  position: { x: number; y: number };
  dimensions: { width: number; height: number };
  caption?: string;
}

export interface PDFStyleOptions {
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  color: string;
  backgroundColor?: string;
  padding: { top: number; right: number; bottom: number; left: number };
  margin: { top: number; right: number; bottom: number; left: number };
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed';
  };
}

export interface PDFGenerationResponse {
  success: boolean;
  data?: {
    pdfUrl: string;
    downloadUrl: string;
    metadata: {
      totalPages: number;
      fileSizeBytes: number;
      generationTimeMs: number;
      format: 'A4' | 'Letter';
      orientation: 'landscape' | 'portrait';
      margins: { top: number; right: number; bottom: number; left: number };
    };
  };
  error?: {
    code: 'GENERATION_FAILED' | 'CONTENT_TOO_LARGE' | 'IMAGE_LOAD_FAILED' | 'TEMPLATE_ERROR';
    message: string;
    details?: any;
  };
}

export interface PDFTemplate {
  name: string;
  description: string;
  layout: {
    pageSize: 'A4' | 'Letter';
    orientation: 'landscape' | 'portrait';
    margins: { top: number; right: number; bottom: number; left: number };
    columns: number;
    gutterWidth: number;
  };
  styles: {
    heading1: PDFStyleOptions;
    heading2: PDFStyleOptions;
    heading3: PDFStyleOptions;
    body: PDFStyleOptions;
    metadata: PDFStyleOptions;
    card: PDFStyleOptions;
  };
}

/**
 * Mock PDF 생성 서비스
 * 실제 PDF 라이브러리 없이 PDF 생성 시뮬레이션
 */
export class MockPDFGenerator {
  private failureRate: number = 0;
  private latencyMs: number = 5000;
  private maxFileSizeBytes: number = 50 * 1024 * 1024; // 50MB
  private imageCompressionRatio: number = 0.7;
  
  // PDF 템플릿 정의
  private templates: Map<string, PDFTemplate> = new Map([
    ['ai-planning-default', {
      name: 'AI 영상 기획 기본 템플릿',
      description: '여백 0, 카드형 레이아웃, A4 가로 기준',
      layout: {
        pageSize: 'A4',
        orientation: 'landscape',
        margins: { top: 0, right: 0, bottom: 0, left: 0 },
        columns: 2,
        gutterWidth: 20
      },
      styles: {
        heading1: { fontSize: 24, fontWeight: 'bold', color: '#1631F8', padding: { top: 20, right: 20, bottom: 10, left: 20 }, margin: { top: 0, right: 0, bottom: 20, left: 0 } },
        heading2: { fontSize: 18, fontWeight: 'bold', color: '#333333', padding: { top: 15, right: 15, bottom: 8, left: 15 }, margin: { top: 0, right: 0, bottom: 15, left: 0 } },
        heading3: { fontSize: 14, fontWeight: 'bold', color: '#666666', padding: { top: 10, right: 10, bottom: 5, left: 10 }, margin: { top: 0, right: 0, bottom: 10, left: 0 } },
        body: { fontSize: 12, fontWeight: 'normal', color: '#333333', padding: { top: 5, right: 15, bottom: 5, left: 15 }, margin: { top: 0, right: 0, bottom: 10, left: 0 } },
        metadata: { fontSize: 10, fontWeight: 'normal', color: '#888888', padding: { top: 5, right: 10, bottom: 5, left: 10 }, margin: { top: 0, right: 0, bottom: 5, left: 0 } },
        card: { 
          fontSize: 12, 
          fontWeight: 'normal', 
          color: '#333333', 
          backgroundColor: '#FAFAFA',
          padding: { top: 15, right: 15, bottom: 15, left: 15 }, 
          margin: { top: 0, right: 10, bottom: 20, left: 10 },
          border: { width: 1, color: '#E0E0E0', style: 'solid' }
        }
      }
    }]
  ]);

  constructor(options?: {
    failureRate?: number;
    latencyMs?: number;
    maxFileSizeBytes?: number;
    imageCompressionRatio?: number;
  }) {
    if (options) {
      this.failureRate = options.failureRate ?? 0;
      this.latencyMs = options.latencyMs ?? 5000;
      this.maxFileSizeBytes = options.maxFileSizeBytes ?? 50 * 1024 * 1024;
      this.imageCompressionRatio = options.imageCompressionRatio ?? 0.7;
    }
  }

  /**
   * AI 기획안 PDF 생성 Mock
   */
  async generatePlanningPDF(request: PDFGenerationRequest): Promise<PDFGenerationResponse> {
    await this.simulateLatency();

    if (this.shouldFail()) {
      return this.createErrorResponse('GENERATION_FAILED', 'PDF generation failed due to system error');
    }

    // 콘텐츠 크기 검증
    const estimatedSize = this.estimateFileSize(request);
    if (estimatedSize > this.maxFileSizeBytes) {
      return this.createErrorResponse('CONTENT_TOO_LARGE', `Estimated file size ${Math.round(estimatedSize/1024/1024)}MB exceeds limit`);
    }

    // PDF 페이지 구성 생성
    const pages = await this.generatePages(request);
    
    // 이미지 로딩 검증
    if (request.includeContiImages) {
      const imageLoadResult = await this.validateImages(request.shots);
      if (!imageLoadResult.success) {
        return this.createErrorResponse('IMAGE_LOAD_FAILED', `Failed to load images: ${imageLoadResult.failedCount} images`);
      }
    }

    // 성공적인 PDF 생성 시뮬레이션
    const pdfBlob = this.generateMockPDFBlob(pages);
    const downloadUrl = this.createDownloadURL(pdfBlob, request.metadata.title);

    return {
      success: true,
      data: {
        pdfUrl: downloadUrl,
        downloadUrl,
        metadata: {
          totalPages: pages.length,
          fileSizeBytes: estimatedSize,
          generationTimeMs: this.latencyMs,
          format: 'A4',
          orientation: 'landscape',
          margins: { top: 0, right: 0, bottom: 0, left: 0 }
        }
      }
    };
  }

  /**
   * PDF 페이지 구성 생성
   */
  private async generatePages(request: PDFGenerationRequest): Promise<PDFPage[]> {
    const pages: PDFPage[] = [];

    // 1. 표지 페이지
    pages.push(this.generateCoverPage(request.metadata));

    // 2. 4단계 개요 페이지
    pages.push(this.generateStagesOverviewPage(request.stages));

    // 3. 12개 숏트 상세 페이지들 (한 페이지에 2-3개씩)
    const shotPages = this.generateShotPages(request.shots, request.includeContiImages);
    pages.push(...shotPages);

    return pages;
  }

  /**
   * 표지 페이지 생성
   */
  private generateCoverPage(metadata: StoryMetadata): PDFPage {
    return {
      pageNumber: 1,
      pageType: 'cover',
      content: {
        title: metadata.title,
        sections: [
          {
            type: 'text',
            title: '한줄 스토리',
            content: metadata.oneLiner,
            style: { fontSize: 16, fontWeight: 'normal', color: '#333', padding: { top: 20, right: 40, bottom: 20, left: 40 }, margin: { top: 0, right: 0, bottom: 30, left: 0 } }
          },
          {
            type: 'metadata',
            content: {
              '톤앤매너': metadata.toneAndManner.join(', '),
              '장르': metadata.genre.join(', '),
              '타겟': metadata.target,
              '분량': metadata.duration + '초',
              '포맷': metadata.format,
              '템포': metadata.tempo,
              '전개방식': metadata.developmentMethod,
              '전개강도': metadata.developmentIntensity
            }
          }
        ],
        footer: `AI 영상 기획안 - 생성일: ${new Date().toLocaleDateString('ko-KR')}`
      }
    };
  }

  /**
   * 4단계 개요 페이지 생성
   */
  private generateStagesOverviewPage(stages: StoryStage[]): PDFPage {
    return {
      pageNumber: 2,
      pageType: 'stages-overview',
      content: {
        title: '4단계 스토리 구성',
        sections: stages.map(stage => ({
          type: 'stage-card',
          title: `${stage.stage}: ${stage.title}`,
          content: {
            summary: stage.summary,
            content: stage.content,
            objective: stage.objective,
            lengthHint: stage.lengthHint,
            keyPoints: stage.keyPoints
          }
        }))
      }
    };
  }

  /**
   * 12개 숏트 상세 페이지들 생성
   */
  private generateShotPages(shots: ShotDetails[], includeImages: boolean): PDFPage[] {
    const pages: PDFPage[] = [];
    const shotsPerPage = 2; // 한 페이지에 2개 숏트씩
    
    for (let i = 0; i < shots.length; i += shotsPerPage) {
      const pageShotsData = shots.slice(i, i + shotsPerPage);
      const pageNumber = Math.floor(i / shotsPerPage) + 3; // 표지(1) + 개요(2) 다음부터
      
      const page: PDFPage = {
        pageNumber,
        pageType: 'shots-detail',
        content: {
          title: `숏트 ${i + 1}-${Math.min(i + shotsPerPage, shots.length)}`,
          sections: pageShotsData.map(shot => ({
            type: 'shot-card',
            title: shot.title,
            content: {
              description: shot.description,
              shotType: shot.shotType,
              camera: shot.camera,
              composition: shot.composition,
              duration: shot.duration,
              dialogue: shot.dialogue,
              subtitle: shot.subtitle,
              transition: shot.transition,
              insertShots: shot.insertShots
            }
          })),
          images: includeImages ? pageShotsData.map((shot, index) => ({
            src: shot.contiImageUrl || 'placeholder',
            alt: `${shot.title} 콘티`,
            position: { x: index % 2 === 0 ? 50 : 450, y: 100 + Math.floor(index / 2) * 300 },
            dimensions: { width: 200, height: 300 },
            caption: `Shot ${shot.id} 콘티`
          })) : undefined
        }
      };
      
      pages.push(page);
    }
    
    return pages;
  }

  /**
   * 파일 크기 추정
   */
  private estimateFileSize(request: PDFGenerationRequest): number {
    let baseSize = 100 * 1024; // 100KB 기본 크기
    
    // 텍스트 콘텐츠 크기
    const textContent = JSON.stringify(request).length;
    baseSize += textContent * 2; // 텍스트는 대략 2배 증가
    
    // 이미지 크기 (콘티 이미지들)
    if (request.includeContiImages) {
      const imageCount = request.shots.filter(shot => shot.contiImageUrl).length;
      baseSize += imageCount * 200 * 1024 * this.imageCompressionRatio; // 이미지당 200KB 압축
    }
    
    return baseSize;
  }

  /**
   * 이미지 검증
   */
  private async validateImages(shots: ShotDetails[]): Promise<{ success: boolean; failedCount: number }> {
    const imageUrls = shots.map(shot => shot.contiImageUrl).filter(Boolean);
    let failedCount = 0;
    
    // Mock 이미지 로딩 시뮬레이션
    for (const url of imageUrls) {
      if (Math.random() < 0.1) { // 10% 실패율
        failedCount++;
      }
      await new Promise(resolve => setTimeout(resolve, 100)); // 이미지 로딩 시뮬레이션
    }
    
    return {
      success: failedCount === 0,
      failedCount
    };
  }

  /**
   * Mock PDF Blob 생성
   */
  private generateMockPDFBlob(pages: PDFPage[]): Blob {
    // 실제로는 PDF 라이브러리를 사용하지만, Mock에서는 텍스트로 시뮬레이션
    const pdfContent = {
      title: "AI 영상 기획안",
      pages: pages.length,
      content: pages,
      metadata: {
        creator: "VideoPlanet AI Planning System",
        createdAt: new Date().toISOString(),
        format: "A4 Landscape",
        margins: "0mm"
      }
    };
    
    return new Blob([JSON.stringify(pdfContent, null, 2)], { type: 'application/json' });
  }

  /**
   * 다운로드 URL 생성
   */
  private createDownloadURL(blob: Blob, title: string): string {
    const filename = `${title.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_기획안_${Date.now()}.pdf`;
    return `blob:http://localhost:3000/${filename}`;
  }

  // === Layout Helper Methods ===

  /**
   * 여백 0 레이아웃 설정 검증
   */
  validateZeroMarginLayout(template: PDFTemplate): boolean {
    const { margins } = template.layout;
    return margins.top === 0 && margins.right === 0 && margins.bottom === 0 && margins.left === 0;
  }

  /**
   * 모바일/데스크톱 호환 폰트 크기 검증
   */
  validateMinimumFontSizes(template: PDFTemplate): boolean {
    const minSizes = {
      heading1: 18,
      heading2: 14,
      heading3: 12,
      body: 10,
      metadata: 8
    };

    return Object.entries(minSizes).every(([style, minSize]) => {
      return template.styles[style].fontSize >= minSize;
    });
  }

  /**
   * 카드 레이아웃 균형 검증
   */
  validateCardLayout(imageWidth: number, textWidth: number, totalWidth: number): boolean {
    const imageRatio = imageWidth / totalWidth;
    const textRatio = textWidth / totalWidth;
    
    // 이미지 30-40%, 텍스트 50-60% 비율 권장
    return imageRatio >= 0.3 && imageRatio <= 0.4 && textRatio >= 0.5 && textRatio <= 0.6;
  }

  // === Private Helper Methods ===

  private async simulateLatency(): Promise<void> {
    // PDF 생성은 시간이 오래 걸리므로 더 긴 지연시간
    const delay = this.latencyMs + Math.random() * 3000; // ±3초 랜덤
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private shouldFail(): boolean {
    return Math.random() < this.failureRate;
  }

  private createErrorResponse(
    code: PDFGenerationResponse['error']['code'], 
    message: string, 
    details?: any
  ): PDFGenerationResponse {
    return {
      success: false,
      error: {
        code,
        message,
        details
      }
    };
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

  setMaxFileSize(bytes: number): void {
    this.maxFileSizeBytes = bytes;
  }

  setImageCompression(ratio: number): void {
    this.imageCompressionRatio = ratio;
  }

  getTemplate(name: string): PDFTemplate | undefined {
    return this.templates.get(name);
  }

  addTemplate(name: string, template: PDFTemplate): void {
    this.templates.set(name, template);
  }
}

/**
 * PDF 품질 검증 도구
 */
export class PDFQualityValidator {
  
  /**
   * DoD 기준에 따른 PDF 품질 검증
   */
  static validatePDFQuality(response: PDFGenerationResponse): {
    passed: boolean;
    issues: string[];
    score: number;
  } {
    const issues: string[] = [];
    let score = 100;

    if (!response.success) {
      issues.push('PDF 생성 실패');
      score = 0;
    } else {
      const metadata = response.data.metadata;
      
      // 필수 요구사항 검증
      if (metadata.format !== 'A4') {
        issues.push('A4 형식이 아님');
        score -= 20;
      }
      
      if (metadata.orientation !== 'landscape') {
        issues.push('가로 방향이 아님');
        score -= 15;
      }
      
      if (metadata.margins.top !== 0 || metadata.margins.right !== 0 || 
          metadata.margins.bottom !== 0 || metadata.margins.left !== 0) {
        issues.push('여백이 0이 아님');
        score -= 25;
      }
      
      if (metadata.totalPages < 3) {
        issues.push('최소 페이지 수(3페이지) 미달');
        score -= 20;
      }
      
      if (metadata.fileSizeBytes > 50 * 1024 * 1024) {
        issues.push('파일 크기가 50MB 초과');
        score -= 10;
      }
      
      if (metadata.generationTimeMs > 30000) {
        issues.push('생성 시간이 30초 초과');
        score -= 10;
      }
    }

    return {
      passed: score >= 70, // 70점 이상 합격
      issues,
      score: Math.max(0, score)
    };
  }
}

/**
 * 테스트용 Mock 데이터 생성기
 */
export class MockPDFDataGenerator {
  static createSampleRequest(): PDFGenerationRequest {
    return {
      metadata: {
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
      },
      stages: [
        {
          stage: '기',
          title: '평범한 아침',
          summary: '직장인의 일상적인 아침',
          content: '알람 소리와 함께 시작되는 평범한 하루',
          objective: '일상의 평범함을 설정',
          lengthHint: '15초',
          keyPoints: ['알람', '세수', '출근 준비']
        }
      ],
      shots: Array.from({ length: 12 }, (_, i) => ({
        id: i + 1,
        title: `Shot ${i + 1}`,
        description: `Shot ${i + 1} 설명`,
        shotType: 'Medium Shot',
        camera: 'Steady Cam',
        composition: 'Rule of Thirds',
        duration: '5초',
        transition: 'Cut',
        contiImageUrl: `data:image/png;base64,mock-image-${i + 1}`
      })),
      includeContiImages: true,
      layoutStyle: 'card'
    };
  }
}