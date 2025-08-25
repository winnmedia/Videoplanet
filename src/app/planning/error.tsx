'use client'

import ErrorFallback from '@/shared/ui/error-boundary/ErrorFallback'

export default function PlanningError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return <ErrorFallback error={error} reset={reset} type="page" />
}