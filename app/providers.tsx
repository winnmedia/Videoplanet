'use client'

import { Provider } from 'react-redux'
import store from '../src/redux/store'

export function Providers({ children }: { children: React.ReactNode }) {
  // Redux Persist를 완전히 제거하고 기본 Provider만 사용
  return <Provider store={store}>{children}</Provider>
}