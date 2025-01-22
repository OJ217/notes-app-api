import { Hono } from 'hono';
import { z } from 'zod';

import { comparePasswords, generateToken } from '@/services/auth-service';
import { findUserByEmail } from '@/services/user-service';
import { zValidator } from '@hono/zod-validator';

const authRouter = new Hono();

authRouter.post(
	'/login',
	zValidator(
		'json',
		z.object({
			email: z.string().email(),
			password: z.string().min(1).max(64),
		})
	),
	async c => {
		const { email, password } = c.req.valid('json');

		const user = await findUserByEmail(email);

		if (!user) {
			return c.json({
				success: false,
				error: {
					message: 'User not found.',
				},
			});
		}

		if (!user.emailVerified) {
			return c.json({
				success: false,
				error: {
					message: 'Email not verified.',
				},
			});
		}

		if (!user.password) {
			return c.json({
				success: false,
				error: {
					message: 'Invalid login method.',
				},
			});
		}

		const passwordMatches = comparePasswords(password, user.password);

		if (!passwordMatches) {
			return c.json({
				success: false,
				error: {
					message: 'Invalid credentials.',
				},
			});
		}

		const { id: userId, createdAt } = user;

		const token = generateToken({
			subject: userId,
			payload: {
				email,
				userId,
			},
		});

		return c.json({
			success: true,
			data: {
				token,
				user: {
					email,
					userId,
					createdAt,
				},
			},
		});
	}
);

export default authRouter;
