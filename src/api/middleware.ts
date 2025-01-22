import { createMiddleware } from 'hono/factory';

import { Bindings } from '@/types';
import { verifyToken } from '@/services/auth-service';

export const authenticate = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
	try {
		const authorizationHeader = c.req.header('Authorization');

		if (!authorizationHeader) {
			throw new Error();
		}

		const tokenParts = authorizationHeader.split(' ');

		if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
			throw new Error();
		}

		const token = verifyToken(tokenParts[1]);

		const { userId, email } = token;

		c.env.authenticator = {
			userId,
			email,
		};

		return await next();
	} catch (error) {
		return c.json(
			{
				success: false,
				error: {
					message: 'Unauthorized',
				},
			},
			401
		);
	}
});
