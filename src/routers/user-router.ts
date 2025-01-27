import { compareHash, hashString } from '@/services/auth-service';
import { findUserByEmail, updateUserPassword } from '@/services/user-service';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Bindings } from '@/types';
import { z } from 'zod';
import { BadRequestError, InternalError, NotFoundError } from '@/api/error';
import { ApiResponse } from '@/api/response';

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
			throw new NotFoundError('User not found.');
		}

		if (user.password) {
			const passwordMatches = await compareHash(oldPassword ?? '', user.password);

			if (!passwordMatches) {
				throw new BadRequestError('Password does not match.');
			}
		}

		const hashedPassword = await hashString(newPassword);

		const passwordUpdate = await updateUserPassword({
			userId: c.env.authenticator.userId,
			password: hashedPassword,
		});

		if (passwordUpdate.rowCount === 0) {
			throw new InternalError('Cannot update password at the moment');
		}

		return ApiResponse.updated(c);
	}
);

export default userRouter;
