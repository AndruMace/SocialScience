import { z } from 'zod'

export const engagementRulesSchema = z.object({
  autoLike: z.boolean().default(false),
  autoReply: z.boolean().default(false),
  followBack: z.boolean().default(false),
  quotePostTrending: z.boolean().default(false),
})

export const strategySchema = z.object({
  niche: z.string().min(1).max(255),
  tone: z.string().min(1).max(100),
  personaPrompt: z.string().max(2000).nullable().optional(),
  postFrequency: z.number().int().min(1).max(20).default(3),
  scheduleStart: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default('09:00'),
  scheduleEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .default('21:00'),
  timezone: z.string().default('UTC'),
  postMode: z.enum(['auto', 'queue']).default('queue'),
  llmProvider: z.string().nullable().optional(),
  llmModel: z.string().nullable().optional(),
  engagementRules: engagementRulesSchema.default({}),
}).superRefine((input, ctx) => {
  const toMinutes = (value: string) => {
    const [hours, minutes] = value.split(':').map(Number)
    return hours * 60 + minutes
  }

  if (toMinutes(input.scheduleEnd) <= toMinutes(input.scheduleStart)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['scheduleEnd'],
      message: 'Schedule end must be after schedule start',
    })
  }
})

export type StrategyInput = z.infer<typeof strategySchema>
