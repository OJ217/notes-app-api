import { z } from 'zod';

import { statusEnum } from '@/db/schema';
import { hashString } from '@/services/auth-service';

export const dateIsPast = (date: Date | string) => {
	const now = new Date();
	const candidateDate = typeof date === 'string' ? new Date(date) : date;
	return now > candidateDate;
};

export const dateIsBefore = (date: Date | string) => {
	const now = new Date();
	const candidateDate = typeof date === 'string' ? new Date(date) : date;
	return now < candidateDate;
};

export const generateOtp = async (): Promise<{ text: string; hash: string; expiration: Date }> => {
	const otp = Math.floor(100000 + Math.random() * 900000);
	const hashedOtp = await hashString(otp.toString());

	const otpExpiration = new Date();
	otpExpiration.setMinutes(otpExpiration.getMinutes() + 5);
	otpExpiration.setSeconds(otpExpiration.getSeconds() + 30);

	return {
		text: otp.toString(),
		hash: hashedOtp,
		expiration: otpExpiration,
	};
};

export const nonEmptyObjectSchema = <T extends z.Schema>(schema: T, errorMessage: string = 'At least one key must be provided'): z.ZodEffects<T> =>
	schema.refine(
		val => {
			const keys = Object.keys(val);
			return keys.length >= 1;
		},
		{ message: errorMessage }
	);

export const noteStatusSchema = z.enum(statusEnum.enumValues);

export const noteIdParamSchema = z.object({
	noteId: z.string().uuid(),
});
