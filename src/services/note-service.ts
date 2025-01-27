import { and, desc, eq, ilike, or, sql } from 'drizzle-orm';

import { db } from '@/db';
import { Note, NoteInsert, notes, NoteStatus } from '@/db/schema';

export const findNotes = async ({ userId, page, search, status }: { userId: string; page?: number; search?: string; status?: NoteStatus }): Promise<Note[]> => {
	return await db.query.notes.findMany({
		limit: 20,
		offset: page ? (page - 1) * 20 : 0,
		where: and(eq(notes.authorId, userId), eq(notes.status, status ?? 'active'), search ? or(ilike(notes.title, search), ilike(notes.content, search)) : undefined),
		orderBy: desc(notes.createdAt),
	});
};

export const findNoteById = async (id: string) => {
	return await db.query.notes.findFirst({ where: eq(notes.id, id) });
};

export const findNoteByIdAndAuthor = async ({ noteId, authorId }: { noteId: string; authorId: string }): Promise<Note | undefined> => {
	return await db.query.notes.findFirst({
		where: and(eq(notes.id, noteId), eq(notes.authorId, authorId)),
	});
};

export const insertNote = async (note: NoteInsert): Promise<Note | undefined> => {
	const insertedNotes = await db.insert(notes).values(note).returning();

	return insertedNotes[0];
};

export const updateNote = async ({ noteId, note }: { noteId: string; note: Partial<NoteInsert> }): Promise<Note | undefined> => {
	const updatedNotes = await db
		.update(notes)
		.set({
			...note,
			updatedAt: sql`NOW()`,
		})
		.where(eq(notes.id, noteId))
		.returning();

	return updatedNotes[0];
};

export const archiveNote = async (noteId: string) => {
	return await db
		.update(notes)
		.set({
			status: 'archived',
			updatedAt: sql`NOW()`,
		})
		.where(and(eq(notes.id, noteId), eq(notes.status, 'active')));
};

export const restoreNote = async (noteId: string) => {
	return await db
		.update(notes)
		.set({
			status: 'active',
			updatedAt: sql`NOW()`,
		})
		.where(and(eq(notes.id, noteId), eq(notes.status, 'archived')));
};

export const deleteNote = async (noteId: string) => {
	return await db.delete(notes).where(eq(notes.id, noteId));
};
