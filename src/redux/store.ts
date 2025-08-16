import { configureStore, combineReducers, Store } from '@reduxjs/toolkit'
import { persistStore, persistReducer, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER } from 'redux-persist'
import ProjectStore from './project'

const rootReducer = combineReducers({
  ProjectStore,
})

export type RootState = ReturnType<typeof rootReducer>

// SSR 호환을 위한 조건부 persist 설정
const makeStore = (): Store => {
  const isServer = typeof window === 'undefined'
  
  if (isServer) {
    // 서버에서는 persist 없이 기본 store 생성
    return configureStore({
      reducer: rootReducer,
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
          serializableCheck: {
            ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
          },
        }),
      devTools: process.env.NODE_ENV !== 'production',
    })
  }
  
  // 클라이언트에서만 persist 적용
  const storage = require('redux-persist/lib/storage').default
  
  const persistConfig = {
    key: 'root',
    version: 1,
    storage,
    // whitelist: ['ProjectStore'], // Only persist ProjectStore
  }
  
  const persistedReducer = persistReducer(persistConfig, rootReducer)
  
  return configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(
        // Only add redux-logger in development and client-side
        process.env.NODE_ENV === 'development'
          ? [require('redux-logger').default]
          : []
      ),
    devTools: process.env.NODE_ENV !== 'production',
  })
}

// Create store instance
const store: Store = makeStore()

// Default export for Next.js compatibility
export default store

// Named export as well for backward compatibility
export { store }

// persistor는 클라이언트에서만 생성 (providers.tsx에서 처리)
export const persistor = typeof window !== 'undefined' ? persistStore(store) : null

export type AppDispatch = typeof store.dispatch