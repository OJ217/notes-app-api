import { relations, sql } from 'drizzle-orm';
import { boolean, index, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
	id: uuid().primaryKey().notNull().defaultRandom(),
	email: varchar({ length: 255 }).notNull().unique(),
	password: varchar({ length: 255 }),
	emailVerified: boolean().notNull().default(false),
	createdAt: timestamp().defaultNow().notNull(),
});

export const userRelations = relations(users, ({ many, one }) => ({
	notes: many(notes),
	emailVerification: one(userVerifications),
}));

export const statusEnum = pgEnum('note_status', ['active', 'archived']);

export const notes = pgTable(
	'notes',
	{
		id: uuid().primaryKey().notNull().defaultRandom(),
		title: varchar({ length: 128 }).notNull(),
		content: text().notNull(),
		tags: text()
			.array(3)
			.notNull()
			.default(sql`'{}'::text[]`),
		authorId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		status: statusEnum().default('active').notNull(),
		createdAt: timestamp().defaultNow().notNull(),
		updatedAt: timestamp(),
	},
	table => [index('author_index').on(table.authorId)]
);

export const noteRelations = relations(notes, ({ one }) => ({
	author: one(users, {
		fields: [notes.authorId],
		references: [users.id],
	}),
}));

export const userVerifications = pgTable(
	'user_verifications',
	{
		id: uuid().primaryKey().notNull().defaultRandom(),
		userId: uuid()
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' })
			.unique(),
		otp: varchar({ length: 256 }).notNull(),
		otpExpiration: timestamp().notNull(),
		createdAt: timestamp().defaultNow().notNull(),
		updatedAt: timestamp(),
	},
	table => [index('user_id_index').on(table.userId)]
);

export const userVerificationRelations = relations(userVerifications, ({ one }) => ({
	user: one(users, {
		fields: [userVerifications.userId],
		references: [users.id],
	}),
}));

export type User = typeof users.$inferSelect;
export type UserInsert = typeof users.$inferInsert;
export type Note = typeof notes.$inferSelect;
export type NoteListItem = Omit<Note, 'updatedAt' | 'content' | 'authorId'>;
export type NoteInsert = typeof notes.$inferInsert;
export type NoteStatus = (typeof statusEnum.enumValues)[number];
export type UserVerification = typeof userVerifications.$inferSelect;
export type UserVerificationInsert = typeof userVerifications.$inferInsert;
