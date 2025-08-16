'use client';

import { Provider } from 'react-redux';
import { store } from '../src/redux/store';
import { PersistGate } from 'redux-persist/integration/react';
import { persistStore } from 'redux-persist';

// persistor를 클라이언트에서만 생성
let persistor: any = null;
if (typeof window !== 'undefined') {
  persistor = persistStore(store);
}

export function Providers({ children }: { children: React.ReactNode }) {
  // SSR 중에는 PersistGate 없이 렌더링
  if (!persistor) {
    return <Provider store={store}>{children}</Provider>;
  }

  // 클라이언트에서는 PersistGate 포함
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}