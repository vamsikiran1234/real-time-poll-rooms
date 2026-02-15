export interface PollOption {
  _id: string;
  text: string;
  voteCount: number;
}

export interface Poll {
  _id: string;
  question: string;
  options: PollOption[];
  totalVotes: number;
  createdAt: string;
}

export interface CreatePollRequest {
  question: string;
  options: string[];
}

export interface CreatePollResponse {
  pollId: string;
  shareableLink: string;
  poll: Poll;
}

export interface VoteRequest {
  optionId: string;
  fingerprintToken: string;
}

export interface VoteResponse {
  message: string;
  poll: Poll;
}
