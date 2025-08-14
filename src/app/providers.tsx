'use client'

import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from '../redux/store'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </Provider>
  )
}