import axios from "axios";
import type { CreatePollRequest, CreatePollResponse, Poll, VoteRequest, VoteResponse } from "../types/poll";

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: API_BASE_URL,
});

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
