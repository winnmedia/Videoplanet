#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
테스트 사용자 생성 스크립트
Railway 또는 로컬 환경에서 실행

사용법:
1. Railway: railway run python manage.py shell < create_test_users.py
2. 로컬: python manage.py shell < create_test_users.py
3. Django Shell: exec(open('create_test_users.py').read())
"""

import os
import sys
import django

# Django 설정 초기화
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.railway')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Django가 이미 설정되어 있지 않으면 setup 실행
if not hasattr(django, 'apps') or not django.apps.apps.ready:
    django.setup()

from users.models import User

def create_test_users():
    """테스트 사용자 생성"""
    
    # 테스트 사용자 정보 (Custom User 모델에 맞게 수정)
    test_users = [
        {
            'email': 'test@videoplanet.com',
            'password': 'Test1234!',
            'nickname': '테스트유저',
            'name': '테스트',
            'is_staff': False,
            'is_superuser': False,
            'is_active': True
        },
        {
            'email': 'admin@videoplanet.com',
            'password': 'Admin1234!',
            'nickname': '관리자',
            'name': '관리자',
            'is_staff': True,
            'is_superuser': True,
            'is_active': True
        },
        {
            'email': 'demo@videoplanet.com',
            'password': 'Demo1234!',
            'nickname': '데모계정',
            'name': '데모',
            'is_staff': False,
            'is_superuser': False,
            'is_active': True
        }
    ]
    
    created_count = 0
    updated_count = 0
    
    for user_data in test_users:
        email = user_data['email']
        
        # 사용자가 이미 존재하는지 확인
        try:
            user = User.objects.get(email=email)
            # 기존 사용자 업데이트
            password = user_data.pop('password')
            for key, value in user_data.items():
                if key != 'email':
                    setattr(user, key, value)
            user.set_password(password)
            user.save()
            print(f'✅ 업데이트: {email}')
            updated_count += 1
        except User.DoesNotExist:
            # 새 사용자 생성
            password = user_data.pop('password')
            user = User.objects.create(
                **user_data
            )
            user.set_password(password)
            user.save()
            print(f'✅ 생성: {email}')
            created_count += 1
    
    print(f'\n📊 결과 요약:')
    print(f'  - 새로 생성: {created_count}개')
    print(f'  - 업데이트: {updated_count}개')
    print(f'  - 전체: {created_count + updated_count}개')
    
    print('\n=== 테스트 계정 목록 ===')
    print('1. 일반 사용자: test@videoplanet.com / Test1234!')
    print('2. 관리자: admin@videoplanet.com / Admin1234!')
    print('3. 데모 사용자: demo@videoplanet.com / Demo1234!')
    print('========================\n')
    
    # 생성된 계정 확인
    print('\n📋 계정 상태 확인:')
    for email in ['test@videoplanet.com', 'admin@videoplanet.com', 'demo@videoplanet.com']:
        try:
            user = User.objects.get(email=email)
            print(f'  - {email}: 활성={user.is_active}, 스태프={user.is_staff}, 슈퍼유저={user.is_superuser}')
        except User.DoesNotExist:
            print(f'  - {email}: ❌ 존재하지 않음')

if __name__ == '__main__':
    print('🚀 VideoPlanet 테스트 계정 생성 시작...\n')
    try:
        create_test_users()
        print('\n✅ 테스트 계정 생성 완료!')
    except Exception as e:
        print(f'\n❌ 오류 발생: {e}')
        import traceback
        traceback.print_exc()