import { compareHash, hashString } from '@/services/auth-service';
import { findUserByEmail, updateUserPassword } from '@/services/user-service';
import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { Bindings } from '@/types';
import { z } from 'zod';
import { BadRequestError, InternalError, NotFoundError } from '@/api/error';
import { ApiResponse } from '@/api/response';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { notes } from '@/db/schema';

const userRouter = new Hono<{ Bindings: Bindings }>();

userRouter.patch(
	'/password',
	zValidator(
		'json',
		z
			.object({
				oldPassword: z.string().min(6).max(64).optional(),
				newPassword: z.string().min(6).max(64),
				confirmPassword: z.string().min(6).max(64),
			})
			.refine(({ newPassword, confirmPassword }) => newPassword === confirmPassword, { message: 'Password confirmation does not match' })
	),
	async c => {
		const { oldPassword, newPassword } = c.req.valid('json');

		const user = await findUserByEmail(c.env.authenticator.email);

		if (!user) {
			throw new NotFoundError('User not found.');
		}

		if (!user.password) {
			throw new BadRequestError('Password change not allowed.');
		}

		const passwordMatches = await compareHash(oldPassword ?? '', user.password);

		if (!passwordMatches) {
			throw new BadRequestError('Old password does not match.');
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

userRouter.get('/tags', async c => {
	const topTags = await db.execute(
		sql`
		  SELECT
			tag,
			COUNT(tag) AS tag_count
		  FROM (
			SELECT UNNEST(${notes.tags}) AS tag
			FROM ${notes}
			WHERE ${notes.authorId} = ${c.env.authenticator.userId}
		  ) AS flattened_tags
		  GROUP BY tag
		  ORDER BY tag_count DESC
		`
	);

	return ApiResponse.create(c, topTags.rows);
});

export default userRouter;
