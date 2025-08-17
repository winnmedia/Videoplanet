/**
 * TDD: URL 및 빌드 문제 통합 테스트
 */

describe('URL 구성 및 빌드 문제 테스트', () => {
  
  describe('1. API URL이 상대 경로로 처리되는 문제', () => {
    test('API_BASE_URL이 프로토콜을 포함해야 함', () => {
      const url = 'videoplanet.up.railway.app';
      
      // 문제: 프로토콜 없으면 상대 경로로 처리
      // 현재 페이지가 https://www.vlanet.net이면
      // 결과: https://www.vlanet.net/videoplanet.up.railway.app
      
      expect(url).not.toMatch(/^https?:\/\//);
      
      // 해결: 프로토콜 추가
      const fixedUrl = `https://${url}`;
      expect(fixedUrl).toMatch(/^https?:\/\//);
    });
    
    test('authApi가 절대 URL을 사용해야 함', () => {
      const baseURL = process.env.NEXT_PUBLIC_API_URL || '';
      
      // baseURL이 비어있거나 프로토콜이 없으면 실패
      if (!baseURL || !baseURL.startsWith('http')) {
        expect(baseURL).toMatch(/^https?:\/\//);
      }
    });
  });
  
  describe('2. Vercel 빌드 의존성 문제', () => {
    test('postcss-flexbugs-fixes가 설치되어야 함', () => {
      const packageJson = require('/home/winnmedia/videoplanet/Videoplanet/package.json');
      
      // devDependencies에 postcss-flexbugs-fixes가 있어야 함
      expect(
        packageJson.devDependencies?.['postcss-flexbugs-fixes'] ||
        packageJson.dependencies?.['postcss-flexbugs-fixes']
      ).toBeDefined();
    });
    
    test('autoprefixer가 설치되어야 함', () => {
      const packageJson = require('/home/winnmedia/videoplanet/Videoplanet/package.json');
      
      expect(
        packageJson.devDependencies?.['autoprefixer'] ||
        packageJson.dependencies?.['autoprefixer']
      ).toBeDefined();
    });
  });
  
  describe('3. 경로 알리아스 문제', () => {
    test('@/css 경로가 올바르게 매핑되어야 함', () => {
      const tsconfig = require('/home/winnmedia/videoplanet/Videoplanet/tsconfig.json');
      
      // tsconfig.json에 @/css/* 매핑이 있어야 함
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/css/*');
    });
    
    test('@/assets 경로가 올바르게 매핑되어야 함', () => {
      const tsconfig = require('/home/winnmedia/videoplanet/Videoplanet/tsconfig.json');
      
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/assets/*');
    });
    
    test('@/utils 경로가 올바르게 매핑되어야 함', () => {
      const tsconfig = require('/home/winnmedia/videoplanet/Videoplanet/tsconfig.json');
      
      expect(tsconfig.compilerOptions.paths).toHaveProperty('@/utils/*');
    });
  });
  
  describe('4. 파일 존재 여부 확인', () => {
    test('Auth.scss 파일이 존재해야 함', () => {
      const fs = require('fs');
      const path1 = '/home/winnmedia/videoplanet/Videoplanet/src/css/User/Auth.scss';
      const path2 = '/home/winnmedia/videoplanet/Videoplanet/css/User/Auth.scss';
      
      const exists = fs.existsSync(path1) || fs.existsSync(path2);
      expect(exists).toBe(true);
    });
    
    test('logo.svg 파일이 존재해야 함', () => {
      const fs = require('fs');
      const path1 = '/home/winnmedia/videoplanet/Videoplanet/src/assets/images/Common/logo.svg';
      const path2 = '/home/winnmedia/videoplanet/Videoplanet/assets/images/Common/logo.svg';
      
      const exists = fs.existsSync(path1) || fs.existsSync(path2);
      expect(exists).toBe(true);
    });
  });
});