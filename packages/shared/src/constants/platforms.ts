export const PLATFORMS = {
  bluesky: {
    name: 'Bluesky',
    maxPostLength: 300,
    color: '#0085ff',
  },
} as const

export type SupportedPlatform = keyof typeof PLATFORMS
