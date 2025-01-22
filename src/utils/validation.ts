import { statusEnum } from '@/db/schema';
import { z } from 'zod';

export const nonEmptyObjectSchema = <T extends z.Schema>(schema: T, errorMessage: string = 'At least one key must be provided'): z.ZodEffects<T> =>
	schema.refine(
		val => {
			const keys = Object.keys(val);
			return keys.length >= 1;
		},
		{ message: errorMessage }
	);

export const noteStatusSchema = z.enum(statusEnum.enumValues);
