import { z } from "zod";

export const createSessionSchema = z.object({
  name: z.string().min(1).max(100),
  maxUploadsPerUser: z.number().int().min(1).max(20).default(1),
  maxVotesPerUser: z.number().int().min(1).max(50).default(3),
});

export const updateSessionSchema = z.object({
  uploadOpen: z.boolean().optional(),
  votingOpen: z.boolean().optional(),
});

export const castVoteSchema = z.object({
  imageId: z.string().min(1),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;
export type UpdateSessionInput = z.infer<typeof updateSessionSchema>;
export type CastVoteInput = z.infer<typeof castVoteSchema>;
