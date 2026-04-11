import type { PlatformAdapter } from './base.adapter.js'
import { BlueskyAdapter } from './bluesky.adapter.js'

type AdapterFactory = () => PlatformAdapter

const adapterFactories: Record<string, AdapterFactory> = {
  bluesky: () => new BlueskyAdapter(),
  // twitter: () => new TwitterAdapter(),  // Future
}

export function createPlatformAdapter(platform: string): PlatformAdapter {
  const factory = adapterFactories[platform]
  if (!factory) throw new Error(`Unsupported platform: ${platform}`)
  return factory()
}

export function getSupportedPlatforms(): string[] {
  return Object.keys(adapterFactories)
}
