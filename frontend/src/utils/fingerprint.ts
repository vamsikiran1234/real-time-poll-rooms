export const generateFingerprint = (): string => {
  const stored = localStorage.getItem('pollroom_fingerprint');
  if (stored) {
    return stored;
  }

  const fingerprint = `fp_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  localStorage.setItem('pollroom_fingerprint', fingerprint);
  return fingerprint;
};

export const getStoredVote = (pollId: string): string | null => {
  return localStorage.getItem(`vote_${pollId}`);
};

export const storeVote = (pollId: string, optionId: string): void => {
  localStorage.setItem(`vote_${pollId}`, optionId);
};
