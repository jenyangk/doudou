import { z } from "zod";

export const createSessionSchema = z.object({
  name: z.string().min(1).max(100),
  maxUploadsPerUser: z.number().int().min(1).max(20).default(1),
  maxVotesPerUser: z.number().int().min(1).max(50).default(3),
  totalRounds: z.number().int().min(1).max(10).default(1),
  votingDurationMinutes: z.number().int().min(1).max(1440).nullable().default(null),
});

export const startVotingSchema = z.object({});
export const closeVotingSchema = z.object({});
export const advanceRoundSchema = z.object({});

export const castVoteSchema = z.object({
  imageId: z.string().min(1),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
