import { ErrorHandler } from 'hono';
import { createMiddleware } from 'hono/factory';
import { ContentfulStatusCode } from 'hono/utils/http-status';
import { ZodError } from 'zod';

import { ApiError, ApiErrorObj } from '@/api/error';
import { ApiResponse, HttpStatus } from '@/api/response';
import { verifyToken } from '@/services/auth-service';
import { Bindings } from '@/types';

export const authenticator = createMiddleware<{ Bindings: Bindings }>(async (c, next) => {
	try {
		const authorizationHeader = c.req.header('Authorization');

		if (!authorizationHeader) {
			throw new Error();
		}

		const tokenParts = authorizationHeader.split(' ');

		if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer' || !tokenParts[1]) {
			throw new Error();
		}

		const { userId, email } = verifyToken(tokenParts[1]);

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

export const errorHandler: ErrorHandler = (err, c) => {
	let errorResponse: { body: ApiErrorObj; status: ContentfulStatusCode };

	switch (true) {
		case err instanceof ApiError:
			errorResponse = {
				body: {
					message: err.message,
					...(err.code !== undefined && { code: err.code }),
				},
				status: err.status,
			};
			break;
		case err instanceof ZodError:
			errorResponse = {
				body: {
					message: 'Invalid request',
					cause: {
						validationIssues: err.issues,
					},
				},
				status: HttpStatus.BAD_REQUEST,
			};
			break;
		default:
			errorResponse = {
				body: {
					message: 'Internal error',
				},
				status: HttpStatus.INTERNAL_ERROR,
			};
			break;
	}

	console.log(err);

	return ApiResponse.error(c, errorResponse.body, errorResponse.status);
};
