import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { noteRelations, notes, userRelations, users, userVerifications, userVerificationRelations } from './schema';

export const db = drizzle(
	new Pool({
		connectionString: process.env.DATABASE_URL!,
	}),
	{
		casing: 'snake_case',
		schema: {
			users,
			notes,
			userRelations,
			noteRelations,
			userVerifications,
			userVerificationRelations,
		},
	}
);
