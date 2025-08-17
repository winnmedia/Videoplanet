#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
테스트 사용자 생성 스크립트
"""

import os
import sys
import django

# Django 설정 초기화
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def create_test_users():
    """테스트 사용자 생성"""
    
    # 테스트 사용자 정보
    test_users = [
        {
            'username': 'test@videoplanet.com',
            'email': 'test@videoplanet.com',
            'password': 'Test1234!',
            'first_name': '테스트',
            'last_name': '사용자',
            'is_staff': False,
            'is_superuser': False
        },
        {
            'username': 'admin@videoplanet.com',
            'email': 'admin@videoplanet.com',
            'password': 'Admin1234!',
            'first_name': '관리자',
            'last_name': '계정',
            'is_staff': True,
            'is_superuser': True
        },
        {
            'username': 'demo@videoplanet.com',
            'email': 'demo@videoplanet.com',
            'password': 'Demo1234!',
            'first_name': '데모',
            'last_name': '사용자',
            'is_staff': False,
            'is_superuser': False
        }
    ]
    
    for user_data in test_users:
        username = user_data['username']
        
        # 사용자가 이미 존재하는지 확인
        if User.objects.filter(username=username).exists():
            print(f'❌ 사용자 이미 존재: {username}')
            continue
        
        # 새 사용자 생성
        password = user_data.pop('password')
        is_superuser = user_data.pop('is_superuser')
        
        if is_superuser:
            user = User.objects.create_superuser(
                **user_data,
                password=password
            )
            print(f'✅ 관리자 계정 생성: {username}')
        else:
            user = User.objects.create_user(
                **user_data,
                password=password
            )
            print(f'✅ 일반 계정 생성: {username}')
    
    print('\n=== 테스트 계정 목록 ===')
    print('1. 일반 사용자: test@videoplanet.com / Test1234!')
    print('2. 관리자: admin@videoplanet.com / Admin1234!')
    print('3. 데모 사용자: demo@videoplanet.com / Demo1234!')
    print('========================\n')

if __name__ == '__main__':
    create_test_users()