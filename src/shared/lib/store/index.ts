import { configureStore } from '@reduxjs/toolkit'
import { persistStore, persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import { combineReducers } from '@reduxjs/toolkit'

// Import entity reducers
import { userReducer } from '@/entities/user'
import { projectReducer } from '@/entities/project'
import { feedbackReducer } from '@/entities/feedback'
import { fileReducer } from '@/entities/file'
import { planningReducer } from '@/entities/planning'

// Import feature reducers
import { authReducer } from '@/features/auth'
import { planCreationReducer } from '@/features/plan-creation'

// Import shared lib reducers
import { ganttReducer } from '@/shared/lib/gantt'
import { realTimeReducer } from '@/shared/lib/realtime'

const rootReducer = combineReducers({
  user: userReducer,
  project: projectReducer,
  feedback: feedbackReducer,
  file: fileReducer,
  planning: planningReducer,
  auth: authReducer,
  planCreation: planCreationReducer,
  gantt: ganttReducer,
  realtime: realTimeReducer,
})

const persistConfig = {
  key: 'videoplanet',
  storage,
  whitelist: ['user'], // Only persist user data
  blacklist: ['auth', 'realtime'], // Don't persist auth tokens and real-time data for security and performance
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST', 
          'persist/REHYDRATE',
          // Real-time actions that may contain non-serializable data
          'realtime/receiveEvent',
          'realtime/handleFeedbackEvent',
          'realtime/handleInvitationEvent',
          'realtime/handleProjectEvent',
          'realtime/updateDashboardSnapshot',
          'realtime/addOfflineEvent',
          'realtime/injectTestEvent',
        ],
        ignoredPaths: [
          // Ignore real-time state paths that may contain functions or complex objects
          'realtime.events.recent',
          'realtime.events.byType',
          'realtime.dashboard.snapshots',
          'realtime.offline.pendingEvents',
        ],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch