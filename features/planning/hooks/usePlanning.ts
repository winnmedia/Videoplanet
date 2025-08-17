// ==========================================================================
// Planning Hook - VideoPlanet AI 영상 기획 모듈
// ==========================================================================

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { 
  PlanningProject, 
  PlanningState, 
  PlanningActions,
  StoryDevelopment,
  Shot,
  Storyboard,
  StoryboardStyleType,
  PDFExportOptions,
  PDFExportResult,
  ValidationResult
} from '../types/planning.types'
import { aiService } from '../services/aiService'

// ====== 로컬 스토리지 키 ======
const STORAGE_KEYS = {
  PROJECTS: 'videoplanet_planning_projects',
  CURRENT_PROJECT: 'videoplanet_current_project',
  AUTO_SAVE: 'videoplanet_auto_save_enabled',
  LAST_BACKUP: 'videoplanet_last_backup'
} as const

// ====== 초기 상태 ======
const initialState: PlanningState = {
  currentProject: null,
  savedProjects: [],
  isLoading: false,
  isGenerating: false,
  currentStep: 1,
  completedSteps: [],
  errors: {}
}

// ====== 메인 훅 ======
export function usePlanning(): PlanningState & PlanningActions {
  const [state, setState] = useState<PlanningState>(initialState)
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null)
  const isInitialized = useRef(false)

  // ====== 초기화 ======
  useEffect(() => {
    if (!isInitialized.current) {
      loadFromStorage()
      isInitialized.current = true
    }
  }, [])

  // ====== 자동 저장 설정 ======
  useEffect(() => {
    if (state.currentProject && autoSaveRef.current) {
      clearTimeout(autoSaveRef.current)
    }

    if (state.currentProject) {
      autoSaveRef.current = setTimeout(() => {
        autoSaveProject()
      }, 30000) // 30초마다 자동 저장
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current)
      }
    }
  }, [state.currentProject])

  // ====== 로컬 스토리지 관리 ======
  const loadFromStorage = useCallback(() => {
    try {
      const savedProjectsStr = localStorage.getItem(STORAGE_KEYS.PROJECTS)
      const currentProjectStr = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT)

      const savedProjects = savedProjectsStr ? JSON.parse(savedProjectsStr) : []
      const currentProject = currentProjectStr ? JSON.parse(currentProjectStr) : null

      setState(prev => ({
        ...prev,
        savedProjects,
        currentProject,
        completedSteps: currentProject ? calculateCompletedSteps(currentProject) : []
      }))
    } catch (error) {
      console.error('[usePlanning] Failed to load from storage:', error)
    }
  }, [])

  const saveToStorage = useCallback((projects: PlanningProject[], current: PlanningProject | null) => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))
      if (current) {
        localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT, JSON.stringify(current))
      } else {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT)
      }
    } catch (error) {
      console.error('[usePlanning] Failed to save to storage:', error)
    }
  }, [])

  const autoSaveProject = useCallback(async () => {
    if (state.currentProject) {
      try {
        await saveProject(state.currentProject, true)
      } catch (error) {
        console.error('[usePlanning] Auto-save failed:', error)
      }
    }
  }, [state.currentProject])

  // ====== 프로젝트 관리 액션 ======
  const createProject = useCallback((title: string) => {
    const newProject: PlanningProject = {
      id: `project_${Date.now()}`,
      title: title.trim() || '새 프로젝트',
      genre: '',
      target_audience: '',
      tone_manner: '',
      duration: '',
      budget: '',
      purpose: '',
      story_structure: '',
      development_level: '',
      created_at: new Date().toISOString(),
      status: 'draft'
    }

    setState(prev => ({
      ...prev,
      currentProject: newProject,
      currentStep: 1,
      completedSteps: [],
      errors: {}
    }))

    // 즉시 저장
    const updatedProjects = [...state.savedProjects, newProject]
    saveToStorage(updatedProjects, newProject)
  }, [state.savedProjects, saveToStorage])

  const loadProject = useCallback(async (projectId: string) => {
    setState(prev => ({ ...prev, isLoading: true, errors: {} }))

    try {
      const project = state.savedProjects.find(p => p.id === projectId)
      if (!project) {
        throw new Error('프로젝트를 찾을 수 없습니다')
      }

      const completedSteps = calculateCompletedSteps(project)
      const currentStep = completedSteps.length > 0 ? 
        Math.min((completedSteps[completedSteps.length - 1] || 0) + 1, 5) : 1

      setState(prev => ({
        ...prev,
        currentProject: project,
        currentStep,
        completedSteps,
        isLoading: false
      }))

      saveToStorage(state.savedProjects, project)
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        errors: { ...prev.errors, load: error instanceof Error ? error.message : '프로젝트 로드에 실패했습니다' }
      }))
    }
  }, [state.savedProjects, saveToStorage])

  const saveProject = useCallback(async (projectData: Partial<PlanningProject>, isAutoSave = false) => {
    if (!state.currentProject && !projectData.id) {
      throw new Error('저장할 프로젝트가 없습니다')
    }

    const updatedProject: PlanningProject = {
      ...state.currentProject!,
      ...projectData,
      updated_at: new Date().toISOString()
    }

    const updatedProjects = state.savedProjects.map(p => 
      p.id === updatedProject.id ? updatedProject : p
    )

    // 새 프로젝트인 경우 추가
    if (!state.savedProjects.find(p => p.id === updatedProject.id)) {
      updatedProjects.push(updatedProject)
    }

    setState(prev => ({
      ...prev,
      currentProject: updatedProject,
      savedProjects: updatedProjects,
      lastSaved: new Date().toISOString(),
      completedSteps: calculateCompletedSteps(updatedProject)
    }))

    saveToStorage(updatedProjects, updatedProject)

    if (!isAutoSave) {
      console.log('[usePlanning] Project saved successfully')
    }
  }, [state.currentProject, state.savedProjects, saveToStorage])

  const deleteProject = useCallback(async (projectId: string) => {
    setState(prev => ({ ...prev, isLoading: true }))

    try {
      const updatedProjects = state.savedProjects.filter(p => p.id !== projectId)
      let newCurrentProject = state.currentProject

      if (state.currentProject?.id === projectId) {
        newCurrentProject = null
      }

      setState(prev => ({
        ...prev,
        savedProjects: updatedProjects,
        currentProject: newCurrentProject,
        currentStep: 1,
        completedSteps: [],
        isLoading: false
      }))

      saveToStorage(updatedProjects, newCurrentProject)
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        errors: { ...prev.errors, delete: '프로젝트 삭제에 실패했습니다' }
      }))
    }
  }, [state.savedProjects, state.currentProject, saveToStorage])

  // ====== AI 생성 액션 ======
  const generateStory = useCallback(async (project: PlanningProject): Promise<StoryDevelopment> => {
    setState(prev => ({ ...prev, isGenerating: true, errors: {} }))

    try {
      const validation = validateStoryGeneration(project)
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors)[0])
      }

      const response = await aiService.generateStory(project)
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'AI 스토리 생성에 실패했습니다')
      }

      // 생성 완료 후 프로젝트 업데이트
      const updatedProject = {
        ...project,
        ...response.data,
        updated_at: new Date().toISOString()
      }

      await saveProject(updatedProject)
      markStepCompleted(2) // 스토리 개발 단계 완료

      setState(prev => ({ ...prev, isGenerating: false }))
      
      return response.data
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        errors: { ...prev.errors, story: error instanceof Error ? error.message : 'AI 스토리 생성에 실패했습니다' }
      }))
      throw error
    }
  }, [saveProject])

  const generateShots = useCallback(async (project: PlanningProject): Promise<Shot[]> => {
    setState(prev => ({ ...prev, isGenerating: true, errors: {} }))

    try {
      const validation = validateShotGeneration(project)
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors)[0])
      }

      const response = await aiService.generateShots(project)
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'AI 숏 분할 생성에 실패했습니다')
      }

      // 생성 완료 후 프로젝트 업데이트
      const updatedProject = {
        ...project,
        shots: response.data,
        updated_at: new Date().toISOString()
      }

      await saveProject(updatedProject)
      markStepCompleted(3) // 숏 분할 단계 완료

      setState(prev => ({ ...prev, isGenerating: false }))
      
      return response.data
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        errors: { ...prev.errors, shots: error instanceof Error ? error.message : 'AI 숏 분할 생성에 실패했습니다' }
      }))
      throw error
    }
  }, [saveProject])

  const generateStoryboard = useCallback(async (
    project: PlanningProject, 
    style: StoryboardStyleType = 'realistic'
  ): Promise<Storyboard> => {
    setState(prev => ({ ...prev, isGenerating: true, errors: {} }))

    try {
      const validation = validateStoryboardGeneration(project)
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors)[0])
      }

      const response = await aiService.generateStoryboard(project, style)
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'AI 콘티 생성에 실패했습니다')
      }

      // 생성 완료 후 프로젝트 업데이트
      const updatedProject = {
        ...project,
        storyboard: response.data,
        updated_at: new Date().toISOString()
      }

      await saveProject(updatedProject)
      markStepCompleted(4) // 콘티 생성 단계 완료

      setState(prev => ({ ...prev, isGenerating: false }))
      
      return response.data
    } catch (error) {
      setState(prev => ({
        ...prev,
        isGenerating: false,
        errors: { ...prev.errors, storyboard: error instanceof Error ? error.message : 'AI 콘티 생성에 실패했습니다' }
      }))
      throw error
    }
  }, [saveProject])

  // ====== PDF 출력 액션 ======
  const exportToPDF = useCallback(async (
    project: PlanningProject, 
    options: PDFExportOptions
  ): Promise<PDFExportResult> => {
    setState(prev => ({ ...prev, isLoading: true, errors: {} }))

    try {
      const validation = validatePDFExport(project, options)
      if (!validation.isValid) {
        throw new Error(Object.values(validation.errors)[0])
      }

      // PDF 생성 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 3000))

      const fileName = `영상기획서_${project.title}_${options.template}.pdf`
      const result: PDFExportResult = {
        success: true,
        fileName,
        fileSize: 2048576, // 2MB
        downloadUrl: `#` // 실제로는 Blob URL
      }

      // 출력 완료 후 프로젝트 업데이트
      const updatedProject = {
        ...project,
        pdf_generated: true,
        pdf_template: options.template,
        pdf_exported_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await saveProject(updatedProject)
      markStepCompleted(5) // PDF 출력 단계 완료

      setState(prev => ({ ...prev, isLoading: false }))
      
      return result
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        errors: { ...prev.errors, export: error instanceof Error ? error.message : 'PDF 출력에 실패했습니다' }
      }))
      throw error
    }
  }, [saveProject])

  // ====== 단계 관리 액션 ======
  const setCurrentStep = useCallback((step: number) => {
    if (step >= 1 && step <= 5) {
      setState(prev => ({ ...prev, currentStep: step }))
    }
  }, [])

  const markStepCompleted = useCallback((step: number) => {
    setState(prev => {
      const newCompletedSteps = [...prev.completedSteps]
      if (!newCompletedSteps.includes(step)) {
        newCompletedSteps.push(step)
        newCompletedSteps.sort((a, b) => a - b)
      }
      return { ...prev, completedSteps: newCompletedSteps }
    })
  }, [])

  const clearErrors = useCallback(() => {
    setState(prev => ({ ...prev, errors: {} }))
  }, [])

  const reset = useCallback(() => {
    setState(initialState)
    localStorage.removeItem(STORAGE_KEYS.CURRENT_PROJECT)
  }, [])

  // ====== 반환 객체 ======
  return {
    // State
    ...state,
    
    // Actions
    createProject,
    loadProject,
    saveProject,
    deleteProject,
    generateStory,
    generateShots,
    generateStoryboard,
    exportToPDF,
    setCurrentStep,
    markStepCompleted,
    clearErrors,
    reset
  }
}

// ====== 유틸리티 함수 ======
function calculateCompletedSteps(project: PlanningProject): number[] {
  const completed: number[] = []
  
  // 1단계: 기본 설정
  if (project.genre && project.target_audience && project.tone_manner && 
      project.duration && project.budget && project.purpose) {
    completed.push(1)
  }
  
  // 2단계: 스토리 개발
  if (project.story_content && project.story_structure && project.development_level) {
    completed.push(2)
  }
  
  // 3단계: 숏 분할
  if (project.shots && project.shots.length > 0) {
    completed.push(3)
  }
  
  // 4단계: 콘티 생성
  if (project.storyboard && project.storyboard.frames && project.storyboard.frames.length > 0) {
    completed.push(4)
  }
  
  // 5단계: PDF 출력
  if ((project as any).pdf_generated) {
    completed.push(5)
  }
  
  return completed
}

function validateStoryGeneration(project: PlanningProject): ValidationResult {
  const errors: Record<string, string> = {}
  
  if (!project.title?.trim()) errors.title = '프로젝트 제목이 필요합니다'
  if (!project.genre) errors.genre = '장르 선택이 필요합니다'
  if (!project.target_audience) errors.audience = '타겟 오디언스 선택이 필요합니다'
  if (!project.tone_manner) errors.tone = '톤앤매너 선택이 필요합니다'
  if (!project.story_structure) errors.structure = '스토리 구조 선택이 필요합니다'
  if (!project.development_level) errors.level = '개발 수준 선택이 필요합니다'
  
  return { isValid: Object.keys(errors).length === 0, errors }
}

function validateShotGeneration(project: PlanningProject): ValidationResult {
  const errors: Record<string, string> = {}
  
  if (!project.story_content?.trim()) {
    errors.story = '스토리 내용이 필요합니다'
  }
  
  return { isValid: Object.keys(errors).length === 0, errors }
}

function validateStoryboardGeneration(project: PlanningProject): ValidationResult {
  const errors: Record<string, string> = {}
  
  if (!project.shots || project.shots.length === 0) {
    errors.shots = '숏 분할 데이터가 필요합니다'
  }
  
  return { isValid: Object.keys(errors).length === 0, errors }
}

function validatePDFExport(project: PlanningProject, options: PDFExportOptions): ValidationResult {
  const errors: Record<string, string> = {}
  
  if (!project.title?.trim()) errors.title = '프로젝트 제목이 필요합니다'
  if (!project.story_content?.trim()) errors.story = '스토리 내용이 필요합니다'
  
  // 템플릿별 추가 검증
  if (options.template === 'complete' || options.template === 'production') {
    if (!project.shots || project.shots.length === 0) {
      errors.shots = '숏 분할 데이터가 필요합니다'
    }
  }
  
  if (options.includeStoryboard && !project.storyboard) {
    errors.storyboard = '콘티보드 데이터가 필요합니다'
  }
  
  return { isValid: Object.keys(errors).length === 0, errors }
}

// ====== 추가 훅들 ======

// 프로젝트 통계 훅
export function usePlanningStats() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    completedProjects: 0,
    totalShots: 0,
    totalFrames: 0,
    avgProjectDuration: '0분',
    mostUsedGenre: 'commercial',
    mostUsedTone: 'bright'
  })

  useEffect(() => {
    const savedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS)
    if (savedProjects) {
      const projects: PlanningProject[] = JSON.parse(savedProjects)
      calculateStats(projects)
    }
  }, [])

  const calculateStats = (projects: PlanningProject[]) => {
    const completed = projects.filter(p => p.status === 'completed').length
    const totalShots = projects.reduce((sum, p) => sum + (p.shots?.length || 0), 0)
    const totalFrames = projects.reduce((sum, p) => sum + (p.storyboard?.frames?.length || 0), 0)
    
    // 장르별 카운트
    const genreCounts: Record<string, number> = {}
    projects.forEach(p => {
      if (p.genre) {
        genreCounts[p.genre] = (genreCounts[p.genre] || 0) + 1
      }
    })
    
    const mostUsedGenre = Object.keys(genreCounts).reduce((a, b) => 
      (genreCounts[a] || 0) > (genreCounts[b] || 0) ? a : b, 'commercial')

    setStats({
      totalProjects: projects.length,
      completedProjects: completed,
      totalShots,
      totalFrames,
      avgProjectDuration: '5분', // 계산 로직 추가 필요
      mostUsedGenre: mostUsedGenre as any,
      mostUsedTone: 'bright' as any // 계산 로직 추가 필요
    })
  }

  return stats
}

// 자동 저장 훅
export function useAutoSave(project: PlanningProject | null, enabled = true) {
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!enabled || !project) return

    const timer = setTimeout(async () => {
      setIsSaving(true)
      try {
        // 자동 저장 로직
        localStorage.setItem(`autosave_${project.id}`, JSON.stringify(project))
        setLastSaved(new Date().toISOString())
      } catch (error) {
        console.error('[useAutoSave] Failed to auto-save:', error)
      } finally {
        setIsSaving(false)
      }
    }, 30000) // 30초

    return () => clearTimeout(timer)
  }, [project, enabled])

  return { lastSaved, isSaving }
}

export default usePlanning