'use client'

import ErrorFallback from '@/shared/ui/error-boundary/ErrorFallback'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <ErrorFallback error={error} reset={reset} type="global" />
      </body>
    </html>
  )
}