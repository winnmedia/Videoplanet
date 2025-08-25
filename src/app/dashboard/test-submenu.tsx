'use client'

import { useEffect } from 'react'

export function TestSubmenu() {
  useEffect(() => {
    const testSubmenu = () => {
      console.log('🧪 서브메뉴 자동 테스트 시작')
      
      // 1. 서브메뉴 DOM 확인
      const submenu = document.querySelector('[data-testid="submenu"]')
      if (submenu) {
        console.log('✅ 서브메뉴 DOM 발견')
        console.log('  - data-open:', (submenu as HTMLElement).dataset.open)
        console.log('  - data-tab:', (submenu as HTMLElement).dataset.tab)
        
        const styles = window.getComputedStyle(submenu)
        console.log('  - visibility:', styles.visibility)
        console.log('  - opacity:', styles.opacity)
        console.log('  - transform:', styles.transform)
      } else {
        console.log('❌ 서브메뉴 DOM을 찾을 수 없음')
      }
      
      // 2. 메뉴 버튼 찾기
      const buttons = Array.from(document.querySelectorAll('button'))
      const projectBtn = buttons.find(b => b.textContent?.includes('프로젝트 관리'))
      
      if (projectBtn) {
        console.log('🔍 프로젝트 관리 버튼 발견')
        
        // 3초 후 자동 클릭
        setTimeout(() => {
          console.log('🖱️ 프로젝트 관리 버튼 자동 클릭...')
          projectBtn.click()
          
          // 클릭 후 상태 확인
          setTimeout(() => {
            const submenuAfter = document.querySelector('[data-testid="submenu"]')
            if (submenuAfter) {
              const afterStyles = window.getComputedStyle(submenuAfter)
              console.log('📊 클릭 후 서브메뉴 상태:')
              console.log('  - data-open:', (submenuAfter as HTMLElement).dataset.open)
              console.log('  - visibility:', afterStyles.visibility)
              console.log('  - opacity:', afterStyles.opacity)
              
              if ((submenuAfter as HTMLElement).dataset.open === 'true' && 
                  afterStyles.visibility === 'visible') {
                console.log('🎉 서브메뉴가 성공적으로 열렸습니다!')
              } else {
                console.log('⚠️ 서브메뉴가 여전히 닫혀있습니다')
                
                // 강제로 열기
                console.log('💪 서브메뉴를 강제로 열기...')
                ;(submenuAfter as HTMLElement).style.transform = 'translateX(0)'
                ;(submenuAfter as HTMLElement).style.opacity = '1'
                ;(submenuAfter as HTMLElement).style.visibility = 'visible'
                ;(submenuAfter as HTMLElement).style.pointerEvents = 'auto'
                console.log('✅ 서브메뉴를 강제로 열었습니다')
              }
            }
          }, 1000)
        }, 3000)
      } else {
        console.log('❌ 프로젝트 관리 버튼을 찾을 수 없음')
      }
    }
    
    // 페이지 로드 완료 후 테스트 시작
    if (document.readyState === 'complete') {
      testSubmenu()
    } else {
      window.addEventListener('load', testSubmenu)
    }
    
    return () => {
      window.removeEventListener('load', testSubmenu)
    }
  }, [])
  
  return null
}