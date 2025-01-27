import { Hono } from 'hono';
import { z } from 'zod';

import { archiveNote, deleteNote, findNoteById, findNoteByIdAndAuthor, findNotes, insertNote, restoreNote, updateNote } from '@/services/note-service';
import { Bindings } from '@/types';
import { nonEmptyObjectSchema, noteIdParamSchema, noteStatusSchema } from '@/utils';
import { zValidator } from '@hono/zod-validator';
import { ApiResponse } from '@/api/response';
import { InternalError, NotFoundError } from '@/api/error';

const notesRouter = new Hono<{ Bindings: Bindings }>();

notesRouter.get(
	'/',
	zValidator(
		'query',
		z
			.object({
				page: z.string().pipe(z.coerce.number().int().min(1)).optional().default('1'),
				status: noteStatusSchema,
				search: z
					.string()
					.min(1)
					.transform(val => `%${val}%`),
			})
			.partial()
	),
	async c => {
		const filters = c.req.valid('query');

		const notes = await findNotes({
			userId: c.env.authenticator.userId,
			...filters,
		});

		return ApiResponse.create(c, notes);
	}
);

notesRouter.get('/:noteId', zValidator('param', noteIdParamSchema), async c => {
	const { noteId } = c.req.valid('param');

	const note = await findNoteById(noteId);

	if (!note) {
		throw new NotFoundError('Note not found');
	}

	return ApiResponse.create(c, note);
});

notesRouter.post(
	'/',
	zValidator(
		'json',
		z.object({
			title: z.string().min(1).max(128),
			content: z.string().min(1).max(10000),
			tags: z.array(z.string()).max(3).optional(),
		})
	),
	async c => {
		const note = c.req.valid('json');

		const insertedNote = await insertNote({
			...note,
			authorId: c.env.authenticator.userId,
		});

		if (!insertedNote) {
			throw new InternalError('Cannot create a note at the moment');
		}

		return ApiResponse.create(c, insertedNote);
	}
);

notesRouter.patch(
	'/:noteId',
	zValidator('param', noteIdParamSchema),
	zValidator(
		'json',

		nonEmptyObjectSchema(
			z
				.object({
					title: z.string().min(1).max(128),
					content: z.string().min(1).max(10000),
					tags: z.array(z.string()).max(3),
				})
				.partial()
		)
	),
	async c => {
		const { noteId } = c.req.valid('param');
		const updateNoteData = c.req.valid('json');

		const note = await findNoteByIdAndAuthor({
			noteId,
			authorId: c.env.authenticator.userId,
		});

		if (!note) {
			throw new NotFoundError('Note not found');
		}

		const updatedNote = await updateNote({
			noteId,
			note: updateNoteData,
		});

		if (!updatedNote) {
			throw new NotFoundError('Cannot update not at the moment');
		}

		return ApiResponse.create(c, updatedNote);
	}
);

notesRouter.post('/:noteId/archive', zValidator('param', noteIdParamSchema), async c => {
	const { noteId } = c.req.valid('param');

	const note = await findNoteByIdAndAuthor({
		noteId,
		authorId: c.env.authenticator.userId,
	});

	if (!note) {
		throw new NotFoundError('Note not found');
	}

	const archiveResult = await archiveNote(noteId);

	if (archiveResult.rowCount === 0) {
		throw new InternalError('Cannot archive note at the moment');
	}

	return ApiResponse.updated(c);
});

notesRouter.post('/:noteId/restore', zValidator('param', noteIdParamSchema), async c => {
	const { noteId } = c.req.valid('param');

	const note = await findNoteByIdAndAuthor({
		noteId,
		authorId: c.env.authenticator.userId,
	});

	if (!note) {
		throw new NotFoundError('Note not found');
	}

	const restoreResult = await restoreNote(noteId);

	if (restoreResult.rowCount === 0) {
		throw new InternalError('Cannot restore note at the moment');
	}

	return ApiResponse.updated(c);
});

notesRouter.delete('/:noteId', zValidator('param', noteIdParamSchema), async c => {
	const { noteId } = c.req.valid('param');

	const note = await findNoteByIdAndAuthor({
		noteId,
		authorId: c.env.authenticator.userId,
	});

	if (!note) {
		throw new NotFoundError('Note not found');
	}

	const deleteResult = await deleteNote(noteId);

	if (deleteResult.rowCount === 0) {
		throw new InternalError('Cannot delete note at the moment');
	}

	return ApiResponse.deleted(c);
});

export default notesRouter;
