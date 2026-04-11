export interface ApiError {
  status: number
  code: string
  message: string
  details?: unknown
}

export interface ApiResponse<T> {
  data: T
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
}

// Auth DTOs
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  displayName?: string
}

export interface AuthResponse {
  token: string
  user: {
    id: string
    email: string
    displayName: string | null
  }
}

// Account DTOs
export interface ConnectAccountRequest {
  platform: string
  handle: string
  password: string
  serviceUrl?: string
}

/** Server calls Bluesky PDS Entryway createAccount; session is stored like a normal linked account. */
export interface RegisterBlueskyAccountRequest {
  handle: string
  password: string
  email: string
  inviteCode?: string
  verificationCode?: string
  serviceUrl?: string
}

// Post DTOs
export interface GeneratePostRequest {
  accountId: string
  contextHint?: string
}

export interface CreatePostRequest {
  accountId: string
  content: string
  scheduledFor?: string
}

export interface UpdatePostRequest {
  content?: string
  status?: string
  scheduledFor?: string | null
}
