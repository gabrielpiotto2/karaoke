export interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number; // Em segundos
}

export interface LyricLine {
  id: string;
  time: number;
  text: string;
}

export interface GroupedArtistSongs {
  artist: string;
  songs: Song[];
}