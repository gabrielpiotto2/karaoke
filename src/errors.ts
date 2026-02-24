// src/errors.ts
export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class SongNotFoundError extends ApiError {
  constructor() {
    super('Song not found.');
    this.name = 'SongNotFoundError';
  }
}

export class LyricsNotFoundError extends ApiError {
  constructor() {
    super('Lyrics not found.');
    this.name = 'LyricsNotFoundError';
  }
}

export class YoutubeVideoNotFoundError extends ApiError {
  constructor() {
    super('YouTube video not found.');
    this.name = 'YoutubeVideoNotFoundError';
  }
}

export class YoutubeApiKeyError extends ApiError {
  constructor() {
    super('YouTube API key not configured.');
    this.name = 'YoutubeApiKeyError';
  }
}

export class YoutubeQuotaError extends ApiError {
  constructor() {
    super('YouTube API quota exceeded or key is invalid.');
    this.name = 'YoutubeQuotaError';
  }
}