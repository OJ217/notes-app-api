export type Token<TPayload> = TPayload & {
	iat: number;
	exp: number;
	aud: string;
	iss: string;
	sub: string;
};

export interface AuthPayload {
	userId: string;
	email: string;
}

export interface Bindings {
	authenticator: AuthPayload;
}
