import { comparePasswords, hashPassword } from '@/services/auth-service';
import { findUserByEmail, updateUserPassword } from '@/services/user-service';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Bindings } from '@/types';
import { z } from 'zod';

const userRouter = new Hono<{ Bindings: Bindings }>();

userRouter.patch(
	'/password',
	zValidator(
		'json',
		z.object({
			oldPassword: z.string().min(6).max(64).optional(),
			newPassword: z.string().min(6).max(64),
		})
	),
	async c => {
		const { oldPassword, newPassword } = c.req.valid('json');

		const user = await findUserByEmail(c.env.authenticator.email);

		if (!user) {
			return c.json(
				{
					success: false,
					error: {
						message: 'User not found.',
					},
				},
				404
			);
		}

		if (user.password) {
			const passwordMatches = await comparePasswords(oldPassword ?? '', user.password);

			if (!passwordMatches) {
				return c.json(
					{
						success: false,
						error: {
							message: 'Password does not match.',
						},
					},
					400
				);
			}
		}

		const hashedPassword = await hashPassword(newPassword);

		const passwordUpdate = await updateUserPassword({
			userId: c.env.authenticator.userId,
			password: hashedPassword,
		});

		if (passwordUpdate.rowCount === 0) {
			return c.json(
				{
					success: false,
					error: {
						message: 'Could not update password',
					},
				},
				500
			);
		}

		return c.json({
			success: true,
			data: { updated: true },
		});
	}
);

export default userRouter;
