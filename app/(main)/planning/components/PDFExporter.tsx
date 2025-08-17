'use client'

import { useState, useEffect } from 'react'

interface PlanningProject {
  id?: string
  title: string
  genre: string
  target_audience: string
  tone_manner: string
  duration: string
  budget: string
  purpose: string
  story_structure: string
  development_level: string
  story_content?: string
  shots?: Shot[]
  storyboard?: Storyboard
  [key: string]: any
}

interface Shot {
  id: string
  sequence: number
  type: string
  duration: string
  description: string
  camera_angle: string
  camera_movement: string
  audio: string
  props: string[]
  location: string
  lighting: string
  notes: string
}

interface StoryboardFrame {
  id: string
  shotId: string
  sequence: number
  thumbnail: string
  description: string
  technical_notes: string
  timing: string
}

interface Storyboard {
  id: string
  title: string
  frames: StoryboardFrame[]
  style: string
  created_at: string
}

interface PDFExporterProps {
  project: PlanningProject
  onComplete: (data: Partial<PlanningProject>) => void
  onValidationChange: (isValid: boolean) => void
}

const EXPORT_TEMPLATES = [
  {
    id: 'complete',
    name: '완전한 기획서',
    description: '모든 내용을 포함한 상세 기획서',
    includes: ['설정', '스토리', '숏 분할', '콘티', '부록'],
    pages: '15-25페이지',
    icon: '[기획서]'
  },
  {
    id: 'presentation',
    name: '프레젠테이션용',
    description: '발표에 최적화된 요약 기획서',
    includes: ['핵심 설정', '스토리 요약', '주요 숏', '핵심 콘티'],
    pages: '8-12페이지',
    icon: '[차트]'
  },
  {
    id: 'production',
    name: '제작용',
    description: '촬영팀을 위한 실무 기획서',
    includes: ['숏 리스트', '콘티', '기술적 노트', '체크리스트'],
    pages: '10-15페이지',
    icon: '[영상]'
  },
  {
    id: 'client',
    name: '클라이언트용',
    description: '고객 제안을 위한 기획서',
    includes: ['프로젝트 개요', '스토리', '비주얼 콘티', '견적'],
    pages: '6-10페이지',
    icon: '[비즈니스]'
  }
]

const EXPORT_OPTIONS = {
  includeStoryboard: true,
  includeShotDetails: true,
  includeTimeline: true,
  includeBudgetInfo: false,
  includeContactInfo: true,
  includeRevisionHistory: false,
  watermark: false,
  colorMode: 'color' as 'color' | 'grayscale',
  pageSize: 'A4' as 'A4' | 'Letter',
  orientation: 'portrait' as 'portrait' | 'landscape'
}

function PDFExporter({
  project,
  onComplete,
  onValidationChange
}: PDFExporterProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('complete')
  const [exportOptions, setExportOptions] = useState(EXPORT_OPTIONS)
  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)
  const [previewData, setPreviewData] = useState<any>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // 폼 유효성 검사
  useEffect(() => {
    const newErrors: Record<string, string> = {}
    
    if (!project.title?.trim()) newErrors.title = '프로젝트 제목이 필요합니다'
    if (!project.story_content?.trim()) newErrors.story = '스토리 내용이 필요합니다'
    
    // 선택된 템플릿에 따른 추가 검증
    const template = EXPORT_TEMPLATES.find(t => t.id === selectedTemplate)
    if (template) {
      if (template.includes.includes('숏 분할') && (!project.shots || project.shots.length === 0)) {
        newErrors.shots = '숏 분할 데이터가 필요합니다'
      }
      if (template.includes.includes('콘티') && !project.storyboard) {
        newErrors.storyboard = '콘티 데이터가 필요합니다'
      }
    }

    setErrors(newErrors)
    onValidationChange(Object.keys(newErrors).length === 0)
  }, [project, selectedTemplate, onValidationChange])

  // 미리보기 데이터 생성
  useEffect(() => {
    if (Object.keys(errors).length === 0) {
      generatePreview()
    }
  }, [project, selectedTemplate, exportOptions, errors])

  const generatePreview = () => {
    const template = EXPORT_TEMPLATES.find(t => t.id === selectedTemplate)
    if (!template) return

    const preview = {
      title: project.title,
      template: template.name,
      estimatedPages: template.pages,
      sections: generateSectionList(template),
      totalShots: project.shots?.length || 0,
      totalFrames: project.storyboard?.frames?.length || 0,
      storyLength: project.story_content?.length || 0
    }

    setPreviewData(preview)
  }

  const generateSectionList = (template: any) => {
    const sections = []

    if (template.includes.includes('설정') || template.includes.includes('핵심 설정') || template.includes.includes('프로젝트 개요')) {
      sections.push({
        title: '프로젝트 개요',
        pages: '1-2',
        content: `제목, 장르, 타겟, 목적 등 기본 정보`
      })
    }

    if (template.includes.includes('스토리') || template.includes.includes('스토리 요약')) {
      sections.push({
        title: '스토리',
        pages: selectedTemplate === 'presentation' ? '3-4' : '3-6',
        content: project.story_content ? `${Math.ceil(project.story_content.length / 100)} 단락` : '스토리 내용'
      })
    }

    if (template.includes.includes('숏 분할') || template.includes.includes('주요 숏') || template.includes.includes('숏 리스트')) {
      sections.push({
        title: '숏 분할',
        pages: selectedTemplate === 'presentation' ? '5-6' : '7-12',
        content: `${project.shots?.length || 0}개 숏 상세 정보`
      })
    }

    if (template.includes.includes('콘티') || template.includes.includes('핵심 콘티') || template.includes.includes('비주얼 콘티')) {
      sections.push({
        title: '콘티보드',
        pages: selectedTemplate === 'client' ? '7-8' : '13-18',
        content: `${project.storyboard?.frames?.length || 0}개 프레임`
      })
    }

    if (template.includes.includes('부록') || template.includes.includes('체크리스트')) {
      sections.push({
        title: '부록',
        pages: '19-25',
        content: '체크리스트, 연락처, 일정표 등'
      })
    }

    return sections
  }

  const handleExport = async () => {
    if (Object.keys(errors).length > 0) {
      alert('필수 정보가 누락되었습니다. 확인 후 다시 시도해주세요.')
      return
    }

    setIsExporting(true)
    setExportProgress(0)

    try {
      // PDF 생성 시뮬레이션
      for (let i = 0; i <= 100; i += 10) {
        setExportProgress(i)
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      // 실제로는 PDF 생성 라이브러리 사용
      const pdfData = await generatePDF()
      downloadPDF(pdfData)
      
      // 완료 처리
      onComplete({
        pdf_generated: true,
        pdf_template: selectedTemplate,
        pdf_exported_at: new Date().toISOString()
      })

    } catch (error) {
      console.error('PDF 생성 실패:', error)
      alert('PDF 생성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const generatePDF = async (): Promise<Blob> => {
    // 실제로는 jsPDF, PDFKit 등을 사용하여 PDF 생성
    // 여기서는 시뮬레이션
    const pdfContent = generatePDFContent()
    return new Blob([pdfContent], { type: 'application/pdf' })
  }

  const generatePDFContent = (): string => {
    const template = EXPORT_TEMPLATES.find(t => t.id === selectedTemplate)
    let content = `영상 기획서: ${project.title}\n\n`
    
    content += `템플릿: ${template?.name}\n`
    content += `생성일: ${new Date().toLocaleDateString('ko-KR')}\n\n`
    
    // 프로젝트 개요
    content += `=== 프로젝트 개요 ===\n`
    content += `제목: ${project.title}\n`
    content += `장르: ${project.genre}\n`
    content += `타겟: ${project.target_audience}\n`
    content += `톤앤매너: ${project.tone_manner}\n`
    content += `길이: ${project.duration}\n`
    content += `예산: ${project.budget}\n`
    content += `목적: ${project.purpose}\n\n`
    
    // 스토리
    if (project.story_content) {
      content += `=== 스토리 ===\n`
      content += `구조: ${project.story_structure}\n`
      content += `디벨롭 수준: ${project.development_level}\n\n`
      content += project.story_content + '\n\n'
    }
    
    // 숏 분할
    if (project.shots && project.shots.length > 0) {
      content += `=== 숏 분할 ===\n`
      project.shots.forEach((shot, index) => {
        content += `${index + 1}. ${shot.type} - ${shot.duration}\n`
        content += `   ${shot.description}\n`
        content += `   카메라: ${shot.camera_movement}, 조명: ${shot.lighting}\n\n`
      })
    }
    
    // 콘티
    if (project.storyboard && project.storyboard.frames.length > 0) {
      content += `=== 콘티보드 ===\n`
      content += `스타일: ${project.storyboard.style}\n`
      content += `총 ${project.storyboard.frames.length}개 프레임\n\n`
      
      project.storyboard.frames.forEach((frame, index) => {
        content += `프레임 ${index + 1} (${frame.timing})\n`
        content += `${frame.description}\n`
        content += `${frame.technical_notes}\n\n`
      })
    }
    
    return content
  }

  const downloadPDF = (pdfData: Blob) => {
    const url = URL.createObjectURL(pdfData)
    const link = document.createElement('a')
    link.href = url
    link.download = `영상기획서_${project.title || 'untitled'}_${selectedTemplate}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const updateOption = (key: keyof typeof EXPORT_OPTIONS, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="pdf-exporter">
      <div className="exporter-header">
        <h3 className="section-title">
          <span className="title-icon">[문서]</span>
          PDF 보고서 출력
        </h3>
        <p className="section-description">
          완성된 기획서를 전문적인 PDF 보고서로 출력합니다.
        </p>
      </div>

      <div className="exporter-form">
        {/* 템플릿 선택 */}
        <div className="form-group">
          <label className="form-label">
            출력 템플릿 선택 <span className="required">*</span>
          </label>
          <div className="template-grid">
            {EXPORT_TEMPLATES.map((template) => (
              <div
                key={template.id}
                className={`template-card ${selectedTemplate === template.id ? 'selected' : ''}`}
                onClick={() => setSelectedTemplate(template.id)}
              >
                <div className="template-header">
                  <span className="template-icon">{template.icon}</span>
                  <h4 className="template-title">{template.name}</h4>
                </div>
                <p className="template-description">{template.description}</p>
                <div className="template-details">
                  <div className="template-pages">{template.pages}</div>
                  <div className="template-includes">
                    포함 내용: {template.includes.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 출력 옵션 */}
        <div className="form-group">
          <label className="form-label">출력 옵션</label>
          <div className="options-grid">
            <div className="option-section">
              <h5>포함 내용</h5>
              <div className="checkbox-group">
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeStoryboard}
                    onChange={(e) => updateOption('includeStoryboard', e.target.checked)}
                  />
                  <span>콘티보드 포함</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeShotDetails}
                    onChange={(e) => updateOption('includeShotDetails', e.target.checked)}
                  />
                  <span>숏 상세 정보</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeTimeline}
                    onChange={(e) => updateOption('includeTimeline', e.target.checked)}
                  />
                  <span>타임라인 차트</span>
                </label>
                <label className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={exportOptions.includeBudgetInfo}
                    onChange={(e) => updateOption('includeBudgetInfo', e.target.checked)}
                  />
                  <span>예산 정보</span>
                </label>
              </div>
            </div>

            <div className="option-section">
              <h5>문서 설정</h5>
              <div className="select-group">
                <label>
                  색상 모드
                  <select
                    value={exportOptions.colorMode}
                    onChange={(e) => updateOption('colorMode', e.target.value)}
                  >
                    <option value="color">컬러</option>
                    <option value="grayscale">흑백</option>
                  </select>
                </label>
                <label>
                  용지 크기
                  <select
                    value={exportOptions.pageSize}
                    onChange={(e) => updateOption('pageSize', e.target.value)}
                  >
                    <option value="A4">A4</option>
                    <option value="Letter">Letter</option>
                  </select>
                </label>
                <label>
                  방향
                  <select
                    value={exportOptions.orientation}
                    onChange={(e) => updateOption('orientation', e.target.value)}
                  >
                    <option value="portrait">세로</option>
                    <option value="landscape">가로</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* 미리보기 */}
        {previewData && (
          <div className="preview-section">
            <h4 className="preview-title">[기획서] 문서 미리보기</h4>
            <div className="preview-card">
              <div className="preview-header">
                <h5>{previewData.title}</h5>
                <div className="preview-meta">
                  <span>템플릿: {previewData.template}</span>
                  <span>예상 페이지: {previewData.estimatedPages}</span>
                </div>
              </div>
              
              <div className="preview-stats">
                <div className="stat-item">
                  <span className="stat-value">{previewData.totalShots}</span>
                  <span className="stat-label">숏</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{previewData.totalFrames}</span>
                  <span className="stat-label">프레임</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{Math.ceil(previewData.storyLength / 100)}</span>
                  <span className="stat-label">스토리 단락</span>
                </div>
              </div>
              
              <div className="preview-sections">
                <h6>포함 섹션</h6>
                {previewData.sections.map((section: any, index: number) => (
                  <div key={index} className="section-item">
                    <span className="section-title">{section.title}</span>
                    <span className="section-pages">({section.pages}페이지)</span>
                    <div className="section-content">{section.content}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 에러 메시지 */}
        {Object.keys(errors).map(key => (
          <span key={key} className="error-message">{errors[key]}</span>
        ))}

        {/* 내보내기 버튼 */}
        <div className="export-section">
          {isExporting ? (
            <div className="export-progress">
              <div className="progress-header">
                <span>PDF 생성 중...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
              <div className="progress-status">
                {exportProgress < 30 && '문서 구조 생성 중...'}
                {exportProgress >= 30 && exportProgress < 60 && '내용 렌더링 중...'}
                {exportProgress >= 60 && exportProgress < 90 && '이미지 처리 중...'}
                {exportProgress >= 90 && 'PDF 최종화 중...'}
              </div>
            </div>
          ) : (
            <div className="export-actions">
              <button
                className="export-btn"
                onClick={handleExport}
                disabled={Object.keys(errors).length > 0}
              >
                <span>[다운로드]</span>
                PDF 보고서 생성 및 다운로드
              </button>
              
              <div className="export-info">
                <span>파일명: 영상기획서_{project.title || 'untitled'}_{selectedTemplate}.pdf</span>
              </div>
            </div>
          )}
        </div>

        {/* 완료 버튼 */}
        <div className="form-actions">
          <button
            className="complete-btn"
            onClick={() => onComplete({ export_completed: true })}
            disabled={Object.keys(errors).length > 0}
          >
            <span>[축하]</span>
            영상 기획 완료!
          </button>
        </div>
      </div>
    </div>
  )
}

export default PDFExporter