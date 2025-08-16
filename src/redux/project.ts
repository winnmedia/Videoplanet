import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'

export interface ProjectState {
  user: any
  nickname: string | null
  sample_files: any[]
  project_list: any[]
  this_month_project: any[]
  next_month_project: any[]
  user_memos?: any[]
}

const initialState: ProjectState = {
  user: null,
  nickname: null,
  sample_files: [],
  project_list: [],
  this_month_project: [],
  next_month_project: [],
  user_memos: [],
}

export const ProjectSlice = createSlice<ProjectState, {
  updateProjectStore: (state: ProjectState, action: PayloadAction<Partial<ProjectState>>) => void
  resetProjectStore: (state: ProjectState, action: PayloadAction) => void
}>({
  name: 'project',
  initialState,
  reducers: {
    // 툴킷에서 자체적으로 immer 사용해서 불변성 유지함
    updateProjectStore: (state, action: PayloadAction<Partial<ProjectState>>) => {
      Object.assign(state, action.payload)
    },
    resetProjectStore: () => {
      return initialState
    },
  },
})

// 외부에서 액션 사용하기위해 export
export const { updateProjectStore, resetProjectStore } = ProjectSlice.actions

// store에 reducer 등록하기위해 export
export default ProjectSlice.reducer