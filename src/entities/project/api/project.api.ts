/**
 * Project Entity - API
 */

import { api } from '@shared/api';
import type { Project } from '../model/project.slice';

export interface CreateProjectRequest {
  title: string;
  description: string;
  type: Project['type'];
  startDate: string;
  endDate?: string;
  members?: string[];
  tags?: string[];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  status?: Project['status'];
  progress?: number;
}

export const projectApi = {
  // CRUD
  getAll: () => 
    api.get<Project[]>('/projects'),
    
  getById: (id: string) => 
    api.get<Project>(`/projects/${id}`),
    
  create: (data: CreateProjectRequest) => 
    api.post<Project>('/projects', data),
    
  update: (id: string, data: UpdateProjectRequest) => 
    api.put<Project>(`/projects/${id}`, data),
    
  delete: (id: string) => 
    api.delete(`/projects/${id}`),
    
  // Members
  addMember: (projectId: string, userId: string) => 
    api.post(`/projects/${projectId}/members`, { userId }),
    
  removeMember: (projectId: string, userId: string) => 
    api.delete(`/projects/${projectId}/members/${userId}`),
    
  // Status
  updateStatus: (id: string, status: Project['status']) => 
    api.patch<Project>(`/projects/${id}/status`, { status }),
    
  // Progress
  updateProgress: (id: string, progress: number) => 
    api.patch<Project>(`/projects/${id}/progress`, { progress }),
};