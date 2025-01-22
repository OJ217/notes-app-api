import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { User, UserInsert, users } from '@/db/schema';

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
	return await db.query.users.findFirst({
		where: eq(users.email, email),
	});
};

export const insertUser = async (user: UserInsert): Promise<User | undefined> => {
	const insertedUsers = await db.insert(users).values(user).returning();

	if (!insertedUsers || insertedUsers.length < 1) {
		throw new Error('Could not insert user');
	}

	return insertedUsers[0];
};

export const updateUserPassword = async ({ userId, password }: { userId: string; password: string }) => {
	return await db.update(users).set({ password }).where(eq(users.id, userId));
};
