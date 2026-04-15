import { AtpAgent } from '@atproto/api'
import type { PlatformAdapter, PlatformCredentials, PlatformProfile, PlatformPost, CreatePostInput } from './base.adapter.js'

/** Normalize user input into a full handle (default Bluesky suffix when no domain given). */
export function normalizeBlueskyHandleInput(raw: string): string {
  let h = raw.trim()
  if (h.startsWith('@')) h = h.slice(1)
  if (!h.includes('.')) h = `${h}.bsky.social`
  return h
}

export class BlueskyAdapter implements PlatformAdapter {
  readonly platform = 'bluesky'
  private agent: AtpAgent

  constructor() {
    this.agent = new AtpAgent({ service: 'https://bsky.social' })
  }

  async authenticate(creds: PlatformCredentials): Promise<void> {
    const service = creds.serviceUrl ?? 'https://bsky.social'
    this.agent = new AtpAgent({ service })
    await this.agent.login({
      identifier: creds.handle,
      password: creds.password,
    })
  }

  async getProfile(): Promise<PlatformProfile> {
    const did = this.agent.session?.did
    if (!did) throw new Error('Not authenticated')
    const { data } = await this.agent.getProfile({ actor: did })
    return {
      platformUserId: data.did,
      handle: data.handle,
      displayName: data.displayName ?? data.handle,
      avatarUrl: data.avatar,
      followers: data.followersCount ?? 0,
      following: data.followsCount ?? 0,
      postsCount: data.postsCount ?? 0,
    }
  }

  async createPost(input: CreatePostInput): Promise<PlatformPost> {
    const record: Record<string, unknown> = {
      $type: 'app.bsky.feed.post',
      text: input.content,
      createdAt: new Date().toISOString(),
      langs: ['en'],
    }

    if (input.replyTo) {
      record['reply'] = {
        root: { uri: input.replyTo, cid: '' },
        parent: { uri: input.replyTo, cid: '' },
      }
    }

    const response = await this.agent.post(record)
    return {
      platformPostId: response.uri,
      content: input.content,
      createdAt: new Date(),
      likes: 0,
      reposts: 0,
      replies: 0,
    }
  }

  async deletePost(platformPostId: string): Promise<void> {
    await this.agent.deletePost(platformPostId)
  }

  async getPostMetrics(platformPostId: string): Promise<PlatformPost> {
    const { data } = await this.agent.getPostThread({ uri: platformPostId })
    const thread = data.thread
    if (thread.$type !== 'app.bsky.feed.defs#threadViewPost') {
      throw new Error('Could not fetch post')
    }
    const post = thread.post as unknown as {
      uri: string
      record: { text: string; createdAt: string }
      likeCount?: number
      repostCount?: number
      replyCount?: number
    }
    return {
      platformPostId: post.uri,
      content: post.record.text,
      createdAt: new Date(post.record.createdAt),
      likes: post.likeCount ?? 0,
      reposts: post.repostCount ?? 0,
      replies: post.replyCount ?? 0,
    }
  }

  async getRecentPosts(limit = 20): Promise<PlatformPost[]> {
    const did = this.agent.session?.did
    if (!did) throw new Error('Not authenticated')
    const { data } = await this.agent.getAuthorFeed({ actor: did, limit })
    return data.feed
      .filter((item) => !item.reason) // exclude reposts
      .map((item) => {
        const post = item.post as unknown as {
          uri: string
          record: { text: string; createdAt: string }
          likeCount?: number
          repostCount?: number
          replyCount?: number
        }
        return {
          platformPostId: post.uri,
          content: post.record.text,
          createdAt: new Date(post.record.createdAt),
          likes: post.likeCount ?? 0,
          reposts: post.repostCount ?? 0,
          replies: post.replyCount ?? 0,
        }
      })
  }

  async likePost(platformPostId: string): Promise<void> {
    const { data } = await this.agent.getPostThread({ uri: platformPostId })
    const thread = data.thread
    if (thread.$type !== 'app.bsky.feed.defs#threadViewPost') return
    const post = thread.post as unknown as { uri: string; cid: string }
    await this.agent.like(post.uri, post.cid)
  }

  async followUser(platformUserId: string): Promise<void> {
    await this.agent.follow(platformUserId)
  }

  getMaxPostLength(): number {
    return 300
  }
}
