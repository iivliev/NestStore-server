import z from 'zod';

export const googleTokenResponseSchema = z.object({
	access_token: z.string(),
	expires_in: z.number(),
	scope: z.string(),
	token_type: z.string(),
	id_token: z.string(),
});

export const googlePayloadSchema = z.object({
	sub: z.string(),
	email: z.string().email(),
	name: z.string(),
	picture: z.string().url(),
	email_verified: z.boolean(),
});

export type GoogleTokenResponse = z.infer<typeof googleTokenResponseSchema>;
export type GooglePayload = z.infer<typeof googlePayloadSchema>;
