import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface Feedback {
  id: number
  projectId: number
  authorId: number
  content: string
  timestamp: number
  section: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
  updatedAt: string
}

interface FeedbackState {
  feedbacks: Feedback[]
  currentFeedback: Feedback | null
  isLoading: boolean
  error: string | null
}

const initialState: FeedbackState = {
  feedbacks: [],
  currentFeedback: null,
  isLoading: false,
  error: null,
}

const feedbackSlice = createSlice({
  name: 'feedback',
  initialState,
  reducers: {
    setFeedbacks: (state, action: PayloadAction<Feedback[]>) => {
      state.feedbacks = action.payload
      state.error = null
    },
    setCurrentFeedback: (state, action: PayloadAction<Feedback>) => {
      state.currentFeedback = action.payload
    },
    addFeedback: (state, action: PayloadAction<Feedback>) => {
      state.feedbacks.push(action.payload)
    },
    updateFeedback: (state, action: PayloadAction<{ id: number; updates: Partial<Feedback> }>) => {
      const index = state.feedbacks.findIndex(f => f.id === action.payload.id)
      if (index !== -1) {
        state.feedbacks[index] = { ...state.feedbacks[index], ...action.payload.updates }
      }
      if (state.currentFeedback?.id === action.payload.id) {
        state.currentFeedback = { ...state.currentFeedback, ...action.payload.updates }
      }
    },
    removeFeedback: (state, action: PayloadAction<number>) => {
      state.feedbacks = state.feedbacks.filter(f => f.id !== action.payload)
      if (state.currentFeedback?.id === action.payload) {
        state.currentFeedback = null
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
    },
  },
})

export const { 
  setFeedbacks, 
  setCurrentFeedback, 
  addFeedback, 
  updateFeedback, 
  removeFeedback, 
  setLoading, 
  setError 
} = feedbackSlice.actions
export const feedbackReducer = feedbackSlice.reducer