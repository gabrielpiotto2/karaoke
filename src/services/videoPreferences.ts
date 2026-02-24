// src/services/videoPreferences.ts

const PREFERENCES_KEY = 'video_preferences';

interface VideoPreferences {
  [songId: string]: {
    liked: string[];
    disliked: string[];
  };
}

const getPreferences = (): VideoPreferences => {
  const stored = localStorage.getItem(PREFERENCES_KEY);
  return stored ? JSON.parse(stored) : {};
};

const savePreferences = (preferences: VideoPreferences) => {
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
};

export const addLikedVideo = (songId: string, videoId: string) => {
  const preferences = getPreferences();
  if (!preferences[songId]) {
    preferences[songId] = { liked: [], disliked: [] };
  }
  if (!preferences[songId].liked.includes(videoId)) {
    preferences[songId].liked.push(videoId);
  }
  // Remove from disliked if it was previously disliked
  preferences[songId].disliked = preferences[songId].disliked.filter(id => id !== videoId);
  savePreferences(preferences);
};

export const addDislikedVideo = (songId: string, videoId: string) => {
  const preferences = getPreferences();
  if (!preferences[songId]) {
    preferences[songId] = { liked: [], disliked: [] };
  }
  if (!preferences[songId].disliked.includes(videoId)) {
    preferences[songId].disliked.push(videoId);
  }
  // Remove from liked if it was previously liked
  preferences[songId].liked = preferences[songId].liked.filter(id => id !== videoId);
  savePreferences(preferences);
};

export const getLikedVideos = (songId: string): string[] => {
  const preferences = getPreferences();
  return preferences[songId]?.liked || [];
};

export const getDislikedVideos = (songId: string): string[] => {
  const preferences = getPreferences();
  return preferences[songId]?.disliked || [];
};

export const getAllDislikedVideos = (): { songId: string, videoId: string }[] => {
  const preferences = getPreferences();
  const allDisliked: { songId: string, videoId: string }[] = [];
  for (const songId in preferences) {
    if (Object.prototype.hasOwnProperty.call(preferences, songId)) {
      preferences[songId].disliked.forEach(videoId => {
        allDisliked.push({ songId, videoId });
      });
    }
  }
  return allDisliked;
};

export const removeDislikedVideo = (songId: string, videoId: string) => {
  const preferences = getPreferences();
  if (preferences[songId]) {
    preferences[songId].disliked = preferences[songId].disliked.filter(id => id !== videoId);
    savePreferences(preferences);
  }
};
