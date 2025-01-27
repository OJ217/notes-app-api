import { ContentfulStatusCode } from 'hono/utils/http-status';

import { HttpStatus } from '@/api/response';

export enum ApiErrorCode {
	BAD_REQUEST = 'bad_request',
	FORBIDDEN = 'forbidden',
	CONFLICT = 'resource_conflict',
}

export type ApiErrorObj = { message: string; code?: ApiErrorCode; cause?: any };

export class ApiError extends Error {
	status: ContentfulStatusCode;
	code?: ApiErrorCode;

	constructor({ status, message, code }: { status: ContentfulStatusCode; message: string; code?: ApiErrorCode }) {
		super(message);
		this.status = status;

		if (this.code !== undefined) {
			this.code = code;
		}
	}
}

export class BadRequestError extends ApiError {
	constructor(message: string, code?: ApiErrorCode) {
		super({ message, status: HttpStatus.BAD_REQUEST, code: code ?? ApiErrorCode.BAD_REQUEST });
	}
}

export class UnauthorizedError extends ApiError {
	constructor(message: string) {
		super({ message, status: HttpStatus.UNAUTHORIZED });
	}
}

export class ForbiddenError extends ApiError {
	constructor(message: string, code?: ApiErrorCode) {
		super({ message, status: HttpStatus.FORBIDDEN, code: code ?? ApiErrorCode.FORBIDDEN });
	}
}

export class NotFoundError extends ApiError {
	constructor(message: string) {
		super({ message, status: HttpStatus.NOT_FOUND });
	}
}

export class ConflictError extends ApiError {
	constructor(message: string, code?: ApiErrorCode) {
		super({ message, status: HttpStatus.CONFLICT, code: code ?? ApiErrorCode.CONFLICT });
	}
}

export class InternalError extends ApiError {
	constructor(message: string) {
		super({ message, status: HttpStatus.INTERNAL_ERROR });
	}
}
