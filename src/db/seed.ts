import { eq } from 'drizzle-orm';
import { seed } from 'drizzle-seed';

import { db } from '@/db';
import { notes, statusEnum, users } from '@/db/schema';
import { hashString } from '@/services/auth-service';

const main = async () => {
	if (process.env.STAGE !== 'local_development') {
		console.error('Seeding anly allowed in local development ⚠️');
		process.exit(1);
	}

	try {
		const adminData = {
			email: 'admin@notes.app',
			emailVerified: true,
			password: 'Admin$123',
		};

		let admin = await db.query.users.findFirst({
			where: eq(users.email, adminData.email),
		});

		if (!admin) {
			adminData.password = await hashString(adminData.password);
			const insertedUsers = await db.insert(users).values(adminData).returning();

			if (!insertedUsers || insertedUsers.length < 1) {
				throw new Error('Could not insert admin user.');
			}

			admin = insertedUsers[0];
		}

		const notesCount = await db.$count(notes);

		if (!notesCount) {
			await seed(db, {
				notes,
			}).refine(funcs => ({
				notes: {
					count: 100,
					columns: {
						authorId: funcs.default({
							defaultValue: admin.id,
						}),
						title: funcs.string({
							isUnique: false,
						}),
						content: funcs.loremIpsum({
							sentencesCount: 5,
						}),
						status: funcs.weightedRandom([
							{
								weight: 0.7,
								value: funcs.default({
									defaultValue: statusEnum.enumValues[0],
								}),
							},
							{
								weight: 0.3,
								value: funcs.default({
									defaultValue: statusEnum.enumValues[1],
								}),
							},
						]),
						tags: funcs.valuesFromArray({
							values: [
								'Work',
								'Personal',
								'Ideas',
								'To-Do',
								'Projects',
								'Meetings',
								'Books',
								'Travel',
								'Recipes',
								'Goals',
								'Health',
								'Fitness',
								'Learning',
								'Finances',
								'Mindfulness',
								'Quotes',
								'Hobbies',
								'Reminders',
								'Gratitude',
								'Brainstorming',
							],
							arraySize: 3,
						}),
						createdAt: funcs.date({
							minDate: new Date('01/01/2005'),
							maxDate: new Date(),
						}),
					},
				},
			}));
		}

		console.log('Seeded database successfully 🌱');
	} catch (error) {
		console.error('Could not seed database ❌', error);
		process.exit(1);
	}
};

main();
