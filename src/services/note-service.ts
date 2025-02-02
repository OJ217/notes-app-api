import { and, arrayContains, count, desc, eq, ilike, lt, or, sql } from 'drizzle-orm';

import { PaginatedResponse } from '@/api/response';
import { db } from '@/db';
import { NoteListItem, Note, NoteInsert, notes, NoteStatus } from '@/db/schema';

export const paginateNotes = async ({
	userId,
	cursor,
	status,
	tag,
	search,
}: {
	userId: string;
	cursor?: Date;
	status?: NoteStatus;
	tag?: string;
	search?: string;
}): Promise<PaginatedResponse<NoteListItem>> => {
	const query = and(
		eq(notes.authorId, userId),
		eq(notes.status, status ?? 'active'),
		tag ? arrayContains(notes.tags, [tag]) : undefined,
		search ? or(ilike(notes.title, search), ilike(notes.content, search)) : undefined,
		cursor ? lt(notes.createdAt, cursor) : undefined
	);

	const docsPerPage = 20;
	const [{ count: totalCount }] = await db.select({ count: count() }).from(notes).where(query);
	const hasNextCursor = totalCount > docsPerPage;

	const docs = await db.query.notes.findMany({
		limit: docsPerPage,
		where: query,
		orderBy: desc(notes.createdAt),
		columns: {
			updatedAt: false,
			content: false,
			authorId: false,
		},
	});

	return {
		docs,
		meta: {
			cursor: hasNextCursor ? docs[docs.length - 1].createdAt.toISOString() : null,
		},
	};
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
