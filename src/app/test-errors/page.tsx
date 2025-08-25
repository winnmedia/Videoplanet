'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/shared/ui/Button/Button'

export default function TestErrorsPage() {
  const [testResults, setTestResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const runTest = async (testName: string, testFunction: () => Promise<any>) => {
    try {
      const result = await testFunction()
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'success',
        result: result,
        timestamp: new Date().toLocaleTimeString()
      }])
    } catch (error) {
      setTestResults(prev => [...prev, {
        name: testName,
        status: 'error',
        result: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toLocaleTimeString()
      }])
    }
  }

  const test400Error = async () => {
    const response = await fetch('/api/test-error?type=400')
    if (!response.ok) {
      const data = await response.json()
      throw new Error(`${response.status}: ${data.message}`)
    }
    return await response.json()
  }

  const test401Error = async () => {
    const response = await fetch('/api/test-error?type=401')
    if (!response.ok) {
      const data = await response.json()
      throw new Error(`${response.status}: ${data.message}`)
    }
    return await response.json()
  }

  const test403Error = async () => {
    const response = await fetch('/api/test-error?type=403')
    if (!response.ok) {
      const data = await response.json()
      throw new Error(`${response.status}: ${data.message}`)
    }
    return await response.json()
  }

  const test500Error = async () => {
    const response = await fetch('/api/test-error?type=500')
    if (!response.ok) {
      throw new Error(`${response.status}: Server Error`)
    }
    return await response.json()
  }

  const test404Error = async () => {
    const response = await fetch('/non-existent-route')
    if (!response.ok) {
      throw new Error(`${response.status}: Page not found`)
    }
    return await response.json()
  }

  const testFormValidation = async () => {
    // Simulate form submission with invalid data
    const formData = new FormData()
    formData.append('email', 'invalid-email')
    formData.append('password', '')
    
    // This would normally be a POST to a form endpoint
    throw new Error('400: Invalid email format and password required')
  }

  const testImageLoading = async () => {
    const testImages = [
      '/images/Common/w_logo02.svg',
      '/images/Home/new/visual-img.png',
      '/images/User/google_icon.svg',
      '/images/favicon/favicon.ico'
    ]
    
    const results = []
    for (const img of testImages) {
      const response = await fetch(img)
      results.push({
        url: img,
        status: response.status,
        ok: response.ok
      })
    }
    return results
  }

  const testRouteAccess = async () => {
    const routes = [
      '/',
      '/login',
      '/terms',
      '/privacy',
      '/dashboard',
      '/projects',
      '/feedback',
      '/planning'
    ]
    
    const results = []
    for (const route of routes) {
      const response = await fetch(route)
      results.push({
        route,
        status: response.status,
        ok: response.ok
      })
    }
    return results
  }

  const runAllTests = async () => {
    setIsLoading(true)
    setTestResults([])
    
    const tests = [
      { name: '400 Error Test', func: test400Error },
      { name: '401 Error Test', func: test401Error },
      { name: '403 Error Test', func: test403Error },
      { name: '500 Error Test', func: test500Error },
      { name: '404 Error Test', func: test404Error },
      { name: 'Form Validation Test', func: testFormValidation },
      { name: 'Image Loading Test', func: testImageLoading },
      { name: 'Route Access Test', func: testRouteAccess }
    ]
    
    for (const test of tests) {
      await runTest(test.name, test.func)
      // Add small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setIsLoading(false)
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <Link href="/" className="flex items-center">
              <img 
                src="/images/Common/b_logo.svg" 
                alt="브이래닛 로고" 
                className="h-8 w-auto"
              />
            </Link>
            <Link 
              href="/" 
              className="text-gray-600 hover:text-gray-900 text-sm font-medium"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">에러 테스트 페이지</h1>
          <p className="text-gray-600">
            이 페이지는 다양한 HTTP 에러와 클라이언트 측 검증을 테스트하기 위한 도구입니다.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">테스트 실행</h2>
          <div className="flex space-x-4">
            <Button
              onClick={runAllTests}
              disabled={isLoading}
              variant="primary"
              size="medium"
              loading={isLoading}
            >
              {isLoading ? '테스트 실행 중...' : '모든 테스트 실행'}
            </Button>
            <Button
              onClick={clearResults}
              disabled={isLoading}
              variant="secondary"
              size="medium"
            >
              결과 지우기
            </Button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">테스트 결과</h2>
          
          {testResults.length === 0 ? (
            <p className="text-gray-500">아직 테스트를 실행하지 않았습니다.</p>
          ) : (
            <div className="space-y-4">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border-l-4 ${
                    result.status === 'success'
                      ? 'bg-green-50 border-green-400'
                      : 'bg-red-50 border-red-400'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className={`text-sm font-medium ${
                        result.status === 'success' ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {result.name}
                      </h3>
                      <div className="mt-2">
                        <pre className={`text-xs ${
                          result.status === 'success' ? 'text-green-700' : 'text-red-700'
                        } overflow-x-auto`}>
                          {typeof result.result === 'object' 
                            ? JSON.stringify(result.result, null, 2)
                            : result.result
                          }
                        </pre>
                      </div>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {result.status === 'success' ? '✓ 성공' : '✗ 실패'}
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <span className="text-xs text-gray-500">시간: {result.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Individual Test Buttons */}
        <div className="bg-white shadow rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">개별 테스트</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={() => runTest('400 에러', test400Error)}
              disabled={isLoading}
              variant="danger"
              size="small"
            >
              400 에러
            </Button>
            <Button
              onClick={() => runTest('401 에러', test401Error)}
              disabled={isLoading}
              variant="danger"
              size="small"
            >
              401 에러
            </Button>
            <Button
              onClick={() => runTest('403 에러', test403Error)}
              disabled={isLoading}
              variant="danger"
              size="small"
            >
              403 에러
            </Button>
            <Button
              onClick={() => runTest('500 에러', test500Error)}
              disabled={isLoading}
              variant="danger"
              size="small"
            >
              500 에러
            </Button>
            <Button
              onClick={() => runTest('404 에러', test404Error)}
              disabled={isLoading}
              variant="secondary"
              size="small"
            >
              404 에러
            </Button>
            <Button
              onClick={() => runTest('폼 검증', testFormValidation)}
              disabled={isLoading}
              variant="primary"
              size="small"
            >
              폼 검증
            </Button>
            <Button
              onClick={() => runTest('이미지 로딩', testImageLoading)}
              disabled={isLoading}
              variant="primary"
              size="small"
            >
              이미지 로딩
            </Button>
            <Button
              onClick={() => runTest('라우트 접근', testRouteAccess)}
              disabled={isLoading}
              variant="success"
              size="small"
            >
              라우트 접근
            </Button>
          </div>
        </div>

        {/* Test Information */}
        <div className="bg-blue-50 rounded-lg p-6 mt-8">
          <h3 className="text-lg font-medium text-blue-900 mb-2">테스트 정보</h3>
          <div className="text-sm text-blue-700 space-y-2">
            <p><strong>400 에러:</strong> 잘못된 요청 (클라이언트 오류)</p>
            <p><strong>401 에러:</strong> 인증 필요 (로그인 필요)</p>
            <p><strong>403 에러:</strong> 접근 거부 (권한 없음)</p>
            <p><strong>404 에러:</strong> 페이지를 찾을 수 없음</p>
            <p><strong>500 에러:</strong> 서버 내부 오류</p>
            <p><strong>폼 검증:</strong> 클라이언트 측 데이터 유효성 검사</p>
            <p><strong>이미지 로딩:</strong> 정적 파일 접근 가능 여부</p>
            <p><strong>라우트 접근:</strong> 모든 페이지 접근 가능 여부</p>
          </div>
        </div>
      </main>
    </div>
  )
}