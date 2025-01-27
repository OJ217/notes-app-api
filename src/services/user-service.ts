import { eq } from 'drizzle-orm';

import { db } from '@/db';
import { User, UserInsert, users, UserVerification, UserVerificationInsert, userVerifications } from '@/db/schema';

export const findUserByEmail = async (email: string): Promise<User | undefined> => {
	return await db.query.users.findFirst({
		where: eq(users.email, email),
	});
};

export const findUserVerificationDetails = async (userId: string) => {
	return await db.query.userVerifications.findFirst({
		where: eq(userVerifications.userId, userId),
	});
};

export const insertUserWithVerification = async (user: UserInsert, verificationDetails: Omit<UserVerificationInsert, 'userId'>) => {
	let userId: string | undefined;

	await db.transaction(async tx => {
		const insertedUsers = await tx
			.insert(users)
			.values(user)
			.onConflictDoUpdate({ target: users.email, set: { password: user.password } })
			.returning();

		userId = insertedUsers[0].id;

		await tx
			.insert(userVerifications)
			.values({ ...verificationDetails, userId })
			.onConflictDoUpdate({ target: userVerifications.userId, set: verificationDetails })
			.returning();
	});

	return userId;
};

export const upsertUserVerification = async (verificationDetails: UserVerificationInsert): Promise<UserVerification | undefined | null> => {
	const verifications = await db
		.insert(userVerifications)
		.values(verificationDetails)
		.onConflictDoUpdate({
			target: userVerifications.userId,
			set: verificationDetails,
		})
		.returning();

	return verifications[0];
};

export const verifyUser = async (userId: string) => {
	await db.transaction(async tx => {
		await tx.update(users).set({ emailVerified: true }).where(eq(users.id, userId));
		await tx.delete(userVerifications).where(eq(userVerifications.userId, userId));
	});
};

export const updateUserPassword = async ({ userId, password }: { userId: string; password: string }) => {
	return await db.update(users).set({ password }).where(eq(users.id, userId));
};
