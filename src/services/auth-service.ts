import { compare, genSalt, hash } from 'bcryptjs';
import { sign, verify } from 'jsonwebtoken';
import { StringValue } from 'ms';

import { AuthPayload, Token } from '@/types';

export const generateToken = ({ subject, payload, expiresIn = '24h' }: { subject: string; payload: AuthPayload; expiresIn?: number | StringValue }): string => {
	const secretKey = process.env.JWT_SECRET;

	if (!secretKey) throw new Error('Could not find jwt secret');

	return sign(payload, secretKey, {
		subject,
		expiresIn,
		issuer: 'notes_app_api',
		audience: 'notes_web_app',
	});
};

export const verifyToken = (token: string): Token<AuthPayload> => {
	const secretKey = process.env.JWT_SECRET;

	if (!secretKey) throw new Error('Could not find jwt secret');

	return verify(token, secretKey) as Token<AuthPayload>;
};

export const hashString = async (passwordText: string, saltRounds?: number): Promise<string> => {
	const salt = await genSalt(saltRounds ?? 12);
	return await hash(passwordText, salt);
};

export const compareHash = async (candidate: string, hashed: string): Promise<boolean> => {
	return await compare(candidate, hashed);
};
