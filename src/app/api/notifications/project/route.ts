import { NextResponse } from 'next/server';

// Mock data for development
const mockProjectNotifications = [
  {
    id: '1',
    type: 'invitation',
    title: '프로젝트 초대',
    message: '새로운 프로젝트에 초대되었습니다.',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15분 전
    isRead: false,
    projectName: '신제품 런칭 영상',
    actionRequired: true
  },
  {
    id: '2',
    type: 'deadline',
    title: '마감일 임박',
    message: '프로젝트 마감일이 3일 남았습니다.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(), // 3시간 전
    isRead: false,
    projectName: '브랜드 홍보 영상',
    actionRequired: false
  },
  {
    id: '3',
    type: 'status_change',
    title: '상태 변경',
    message: '프로젝트가 리뷰 단계로 전환되었습니다.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(), // 2일 전
    isRead: true,
    projectName: '기업 소개 영상',
    actionRequired: false
  }
];

export async function GET() {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return NextResponse.json(mockProjectNotifications, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch project notifications' },
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