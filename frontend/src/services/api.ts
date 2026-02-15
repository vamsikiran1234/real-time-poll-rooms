import axios, { AxiosError } from "axios";
import type { CreatePollRequest, CreatePollResponse, Poll, VoteRequest, VoteResponse } from "../types/poll";

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

if (!import.meta.env.VITE_API_URL) {
  console.warn('⚠️ VITE_API_URL not set, using fallback:', API_BASE_URL);
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for error handling
api.interceptors.request.use(
  (config) => {
    // Check if online before making request
    if (!navigator.onLine) {
      return Promise.reject(new Error('No internet connection'));
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for consistent error handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.code === 'ECONNABORTED') {
      error.message = 'Request timeout. Please try again.';
    } else if (error.code === 'ERR_NETWORK') {
      error.message = 'Network error. Please check your connection.';
    } else if (!navigator.onLine) {
      error.message = 'No internet connection.';
    }
    return Promise.reject(error);
  }
);

export const pollService = {
  createPoll: async (data: CreatePollRequest): Promise<CreatePollResponse> => {
    const response = await api.post<CreatePollResponse>('/api/polls', data);
    return response.data;
  },

  getPollById: async (pollId: string): Promise<Poll> => {
    const response = await api.get<Poll>(`/api/polls/${pollId}`);
    return response.data;
  },

  submitVote: async (pollId: string, data: VoteRequest): Promise<VoteResponse> => {
    const response = await api.post<VoteResponse>(`/api/polls/${pollId}/vote`, data);
    return response.data;
  }
};
