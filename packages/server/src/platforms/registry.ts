import type { PlatformAdapter } from './base.adapter.js'
import { BlueskyAdapter } from './bluesky.adapter.js'
import { XAdapter } from './x.adapter.js'

type AdapterFactory = () => PlatformAdapter

const adapterFactories: Record<string, AdapterFactory> = {
  bluesky: () => new BlueskyAdapter(),
  x: () => new XAdapter(),
}

export function createPlatformAdapter(platform: string): PlatformAdapter {
  const factory = adapterFactories[platform]
  if (!factory) throw new Error(`Unsupported platform: ${platform}`)
  return factory()
}

export function getSupportedPlatforms(): string[] {
  return Object.keys(adapterFactories)
}
