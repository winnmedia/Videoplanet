/**
 * User Entity - API
 */

import { api } from '@shared/api';
import type { User } from '../model';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export const userApi = {
  // Auth
  login: (data: LoginRequest) => 
    api.post<LoginResponse>('/users/login', data),
    
  signup: (data: SignupRequest) => 
    api.post<LoginResponse>('/users/signup', data),
    
  logout: () => 
    api.post('/users/logout'),
    
  // Profile
  getProfile: () => 
    api.get<User>('/users/profile'),
    
  updateProfile: (data: Partial<User>) => 
    api.put<User>('/users/profile', data),
    
  // Password
  resetPassword: (email: string) => 
    api.post('/users/reset-password', { email }),
    
  changePassword: (oldPassword: string, newPassword: string) => 
    api.post('/users/change-password', { oldPassword, newPassword }),
};