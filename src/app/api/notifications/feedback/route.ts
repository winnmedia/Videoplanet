import { NextResponse } from 'next/server';

// Mock data for development
const mockFeedbackNotifications = [
  {
    id: '1',
    type: 'new_feedback',
    title: '새로운 피드백',
    message: '인트로 부분의 타이밍을 조정해주세요.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30분 전
    isRead: false,
    priority: 'high',
    projectName: '브랜드 홍보 영상',
    author: '김철수'
  },
  {
    id: '2',
    type: 'reply',
    title: '답변 도착',
    message: '수정사항 반영 완료했습니다.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2시간 전
    isRead: false,
    priority: 'medium',
    projectName: '제품 소개 영상',
    author: '이영희'
  },
  {
    id: '3',
    type: 'mention',
    title: '멘션',
    message: '@당신 이 부분 확인 부탁드립니다.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1일 전
    isRead: true,
    priority: 'low',
    projectName: '기업 소개 영상',
    author: '박민수'
  }
];

export async function GET() {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json(mockFeedbackNotifications, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch feedback notifications' },
      { status: 500 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    { message: 'Not implemented in mock API' },
    { status: 501 }
  );
}