import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export interface User {
  id: number
  email: string
  username: string
  loginMethod: 'email' | 'google' | 'kakao' | 'naver'
  isEmailVerified: boolean
  createdAt: string
  updatedAt: string
}

interface UserState {
  currentUser: User | null
  isLoading: boolean
  error: string | null
}

const initialState: UserState = {
  currentUser: null,
  isLoading: false,
  error: null,
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload
      state.error = null
    },
    clearUser: (state) => {
      state.currentUser = null
      state.error = null
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.isLoading = false
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.currentUser) {
        state.currentUser = { ...state.currentUser, ...action.payload }
      }
    },
  },
})

export const { setUser, clearUser, setLoading, setError, updateUser } = userSlice.actions
export const userReducer = userSlice.reducer