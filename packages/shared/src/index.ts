// Types
export type { Platform, Account, AccountWithStats, AccountSummary } from './types/account.js'
export type { PostStatus, PostMode, Post } from './types/post.js'
export type { EngagementRules, Strategy } from './types/strategy.js'
export type {
  AchievementCategory,
  GameState,
  Achievement,
  AchievementDef,
  XpEvent,
  LeaderboardEntry,
} from './types/game.js'
export type { AnalyticsSnapshot, PostAnalytics } from './types/analytics.js'
export type {
  ApiError,
  ApiResponse,
  PaginatedResponse,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  ConnectAccountRequest,
  RegisterBlueskyAccountRequest,
  GeneratePostRequest,
  CreatePostRequest,
  UpdatePostRequest,
} from './types/api.js'

// Constants
export {
  XP_REWARDS,
  xpForLevel,
  levelFromXp,
  LEVEL_TITLES,
  getLevelTitle,
  ACHIEVEMENTS,
} from './constants/game.js'
export { PLATFORMS } from './constants/platforms.js'
export type { SupportedPlatform } from './constants/platforms.js'
export { LLM_PROVIDERS } from './constants/llm.js'
export type { LLMProviderName } from './constants/llm.js'

// Validators
export { strategySchema, engagementRulesSchema } from './validators/strategy.js'
export type { StrategyInput } from './validators/strategy.js'
export { loginSchema, registerSchema, connectAccountSchema, registerBlueskyAccountSchema } from './validators/auth.js'

export { suggestSubaddressEmail } from './util/email-subaddress.js'
