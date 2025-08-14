import { configureStore, combineReducers } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import storage from 'redux-persist/lib/storage'
import ProjectStore from './project'

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  // whitelist: ['ProjectStore'], // Only persist ProjectStore
}

const rootReducer = combineReducers({
  ProjectStore,
})

const persistedReducer = persistReducer(persistConfig, rootReducer)

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      // Only add redux-logger in development and client-side
      process.env.NODE_ENV === 'development' && typeof window !== 'undefined'
        ? [require('redux-logger').default]
        : []
    ),
  devTools: process.env.NODE_ENV !== 'production',
})

export const persistor = persistStore(store)

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch