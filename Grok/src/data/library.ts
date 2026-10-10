export interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  cover: string;
  letter: string;
}

export const TRACKS: Track[] = [
  {
    id: "midnight-society",
    title: "Midnight Society",
    artist: "Neon Veil",
    album: "Afterglow Sessions",
    duration: "3:07",
    cover: "/covers/midnight-society.jpg",
    letter: "M",
  },
  {
    id: "midnight-drift",
    title: "Midnight Drift",
    artist: "Arctic Tones",
    album: "Northern Rooms",
    duration: "4:58",
    cover: "/covers/midnight-drift.jpg",
    letter: "M",
  },
  {
    id: "neon-pulse",
    title: "Neon Pulse",
    artist: "Nova Lane",
    album: "Glass Hours",
    duration: "2:42",
    cover: "/covers/neon-pulse.jpg",
    letter: "N",
  },
  {
    id: "amber-haze",
    title: "Amber Haze",
    artist: "Lumen Field",
    album: "Slow Light",
    duration: "3:19",
    cover: "/covers/amber-haze.jpg",
    letter: "A",
  },
  {
    id: "cold-river",
    title: "Cold River",
    artist: "Atlas Club",
    album: "Still Current",
    duration: "3:56",
    cover: "/covers/cold-river.jpg",
    letter: "C",
  },
  {
    id: "velvet-morning",
    title: "Velvet Morning",
    artist: "Velvet Cove",
    album: "Quiet Luxury",
    duration: "4:33",
    cover: "/covers/velvet-morning.jpg",
    letter: "V",
  },
  {
    id: "static-love",
    title: "Static Love",
    artist: "Arctic Tones",
    album: "Northern Rooms",
    duration: "3:10",
    cover: "/covers/midnight-drift.jpg",
    letter: "S",
  },
  {
    id: "kinetic",
    title: "Kinetic",
    artist: "Lumen Field",
    album: "Slow Light",
    duration: "4:19",
    cover: "/covers/amber-haze.jpg",
    letter: "K",
  },
  {
    id: "cerulean",
    title: "Cerulean",
    artist: "Kairo",
    album: "Open Water",
    duration: "3:54",
    cover: "/covers/cold-river.jpg",
    letter: "C",
  },
  {
    id: "monolith",
    title: "Monolith",
    artist: "Halo Drift",
    album: "Stone Choir",
    duration: "4:31",
    cover: "/covers/velvet-morning.jpg",
    letter: "M",
  },
  {
    id: "quartz",
    title: "Quartz",
    artist: "Opal",
    album: "Cut Light",
    duration: "2:52",
    cover: "/covers/neon-pulse.jpg",
    letter: "Q",
  },
  {
    id: "boreal",
    title: "Boreal",
    artist: "Halo Drift",
    album: "Stone Choir",
    duration: "4:06",
    cover: "/covers/midnight-society.jpg",
    letter: "B",
  },
];

export const NOW_PLAYING = TRACKS[0];
