export const PLATFORMS = {
  bluesky: {
    name: 'Bluesky',
    maxPostLength: 300,
    color: '#0085ff',
  },
  x: {
    name: 'X',
    maxPostLength: 280,
    color: '#000000',
  },
} as const

export type SupportedPlatform = keyof typeof PLATFORMS
