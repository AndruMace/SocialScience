import { TwitterApi } from 'twitter-api-v2'
import type { PlatformAdapter, PlatformCredentials, PlatformProfile, PlatformPost, CreatePostInput } from './base.adapter.js'

function normalizeXHandleInput(raw: string): string {
  let h = raw.trim()
  if (h.startsWith('@')) h = h.slice(1)
  return h
}

/** Build a TwitterApi client from stored credentials (OAuth 1.0a JSON or OAuth 2.0 bearer). */
function createTwitterClientFromPassword(password: string): TwitterApi {
  const raw = password.trim()
  if (!raw) throw new Error('Missing X API credentials')

  if (raw.startsWith('{')) {
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>
    } catch {
      throw new Error('Invalid JSON for X credentials')
    }

    const appKey = parsed.appKey ?? parsed.apiKey ?? parsed.consumerKey
    const appSecret = parsed.appSecret ?? parsed.apiSecret ?? parsed.consumerSecret
    const accessToken = parsed.accessToken
    const accessSecret = parsed.accessSecret ?? parsed.accessTokenSecret

    if (
      typeof appKey === 'string' &&
      typeof appSecret === 'string' &&
      typeof accessToken === 'string' &&
      typeof accessSecret === 'string'
    ) {
      return new TwitterApi({
        appKey,
        appSecret,
        accessToken,
        accessSecret,
      })
    }

    if (typeof accessToken === 'string') {
      return new TwitterApi(accessToken)
    }

    throw new Error(
      'X credentials JSON must include OAuth 1.0a keys (appKey, appSecret, accessToken, accessSecret) or OAuth 2.0 user accessToken.',
    )
  }

  return new TwitterApi(raw)
}

function tweetText(tweet: { text?: string; note_tweet?: { text?: string } }): string {
  return tweet.text ?? tweet.note_tweet?.text ?? ''
}

export class XAdapter implements PlatformAdapter {
  readonly platform = 'x'
  private client: TwitterApi | null = null
  private loggedUserId: string | null = null

  private getRw() {
    if (!this.client) throw new Error('Not authenticated')
    return this.client.readWrite
  }

  async authenticate(creds: PlatformCredentials): Promise<void> {
    const expectedHandle = normalizeXHandleInput(creds.handle)
    this.client = createTwitterClientFromPassword(creds.password)
    this.loggedUserId = null

    const rw = this.getRw()
    const me = await rw.v2.me({
      'user.fields': ['profile_image_url', 'public_metrics', 'name', 'username'],
    })
    const u = me.data
    if (!u?.id) throw new Error('Could not load X profile')

    const username = u.username?.toLowerCase()
    if (username && expectedHandle && username !== expectedHandle.toLowerCase()) {
      throw new Error(
        `X handle mismatch: signed in as @${u.username}, but form had @${expectedHandle}. Use your real username.`,
      )
    }

    this.loggedUserId = u.id
  }

  async getProfile(): Promise<PlatformProfile> {
    const rw = this.getRw()
    const me = await rw.v2.me({
      'user.fields': ['profile_image_url', 'public_metrics', 'name', 'username'],
    })
    const u = me.data
    if (!u?.id) throw new Error('Could not load X profile')

    const metrics = u.public_metrics
    let avatarUrl = u.profile_image_url
    if (avatarUrl) {
      try {
        avatarUrl = TwitterApi.getProfileImageInSize(avatarUrl, 'bigger')
      } catch {
        /* keep original */
      }
    }

    return {
      platformUserId: u.id,
      handle: u.username ?? '',
      displayName: u.name ?? u.username ?? 'X user',
      avatarUrl,
      followers: metrics?.followers_count ?? 0,
      following: metrics?.following_count ?? 0,
      postsCount: metrics?.tweet_count ?? 0,
    }
  }

  async createPost(input: CreatePostInput): Promise<PlatformPost> {
    const rw = this.getRw()
    const payload: {
      text: string
      reply?: { in_reply_to_tweet_id: string }
      quote_tweet_id?: string
    } = { text: input.content }

    if (input.replyTo) {
      payload.reply = { in_reply_to_tweet_id: input.replyTo }
    }
    if (input.quoteTo) {
      payload.quote_tweet_id = input.quoteTo
    }

    const posted = await rw.v2.tweet(payload)
    const id = posted.data.id
    if (!id) throw new Error('X did not return a tweet id')

    return {
      platformPostId: id,
      content: input.content,
      createdAt: new Date(),
      likes: 0,
      reposts: 0,
      replies: 0,
    }
  }

  async deletePost(platformPostId: string): Promise<void> {
    await this.getRw().v2.deleteTweet(platformPostId)
  }

  async getPostMetrics(platformPostId: string): Promise<PlatformPost> {
    const rw = this.getRw()
    const res = await rw.v2.singleTweet(platformPostId, {
      'tweet.fields': ['created_at', 'public_metrics', 'note_tweet'],
    })
    const tweet = res.data
    if (!tweet) throw new Error('Could not fetch X post')
    const m = tweet.public_metrics
    return {
      platformPostId: tweet.id,
      content: tweetText(tweet),
      createdAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
      likes: m?.like_count ?? 0,
      reposts: m?.retweet_count ?? 0,
      replies: m?.reply_count ?? 0,
      impressions: m?.impression_count,
    }
  }

  async getRecentPosts(limit = 20): Promise<PlatformPost[]> {
    const rw = this.getRw()
    const uid = this.loggedUserId ?? (await rw.v2.me()).data.id
    if (!uid) throw new Error('Not authenticated')

    const timeline = await rw.v2.userTimeline(uid, {
      max_results: Math.min(Math.max(limit, 5), 100),
      exclude: ['retweets'],
      'tweet.fields': ['created_at', 'public_metrics', 'note_tweet'],
    })

    const out: PlatformPost[] = []
    for await (const tweet of timeline) {
      const m = tweet.public_metrics
      out.push({
        platformPostId: tweet.id,
        content: tweetText(tweet),
        createdAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
        likes: m?.like_count ?? 0,
        reposts: m?.retweet_count ?? 0,
        replies: m?.reply_count ?? 0,
        impressions: m?.impression_count,
      })
      if (out.length >= limit) break
    }
    return out
  }

  async likePost(platformPostId: string): Promise<void> {
    const rw = this.getRw()
    const uid = this.loggedUserId ?? (await rw.v2.me()).data.id
    if (!uid) throw new Error('Not authenticated')
    await rw.v2.like(uid, platformPostId)
  }

  async followUser(platformUserId: string): Promise<void> {
    const rw = this.getRw()
    const uid = this.loggedUserId ?? (await rw.v2.me()).data.id
    if (!uid) throw new Error('Not authenticated')
    await rw.v2.follow(uid, platformUserId)
  }

  getMaxPostLength(): number {
    return 280
  }
}
