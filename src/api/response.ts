import { Context } from 'hono';
import { ContentfulStatusCode } from 'hono/utils/http-status';

import { ApiErrorObj } from '@/api/error';

export enum HttpStatus {
	OK = 200,
	CREATED = 201,
	BAD_REQUEST = 400,
	UNAUTHORIZED = 401,
	FORBIDDEN = 403,
	NOT_FOUND = 404,
	CONFLICT = 409,
	INTERNAL_ERROR = 500,
}

export class ApiResponse {
	static create<T extends object>(c: Context, data: T, status?: ContentfulStatusCode) {
		return c.json(
			{
				success: true,
				data,
			},
			status ?? HttpStatus.OK
		);
	}

	static error(c: Context, error: ApiErrorObj, status?: ContentfulStatusCode) {
		return c.json(
			{
				success: false,
				error,
			},
			status ?? HttpStatus.INTERNAL_ERROR
		);
	}

	static updated(c: Context) {
		return c.json(
			{
				success: true,
				data: { updated: true },
			},
			HttpStatus.OK
		);
	}

	static deleted(c: Context) {
		return c.json(
			{
				success: true,
				data: { deleted: true },
			},
			HttpStatus.OK
		);
	}
}
