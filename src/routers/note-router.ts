import { Hono } from 'hono';
import { z } from 'zod';

import { archiveNote, deleteNote, fetchNoteByIdAndAuthor, fetchNotes, insertNote, restoreNote, updateNote } from '@/services/note-service';
import { Bindings } from '@/types';
import { nonEmptyObjectSchema, noteStatusSchema } from '@/utils/validation';
import { zValidator } from '@hono/zod-validator';

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

		const notes = await fetchNotes({
			userId: c.env.authenticator.userId,
			...filters,
		});

		return c.json({
			success: true,
			data: notes,
		});
	}
);

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

		return c.json({
			success: true,
			data: insertedNote,
		});
	}
);

notesRouter.patch(
	'/:noteId',
	zValidator(
		'param',
		z.object({
			noteId: z.string().uuid(),
		})
	),
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
		const note = c.req.valid('json');

		const updatedNote = await updateNote({
			authorId: c.env.authenticator.userId,
			note,
			noteId,
		});

		return c.json({
			success: true,
			data: updatedNote,
		});
	}
);

notesRouter.post(
	'/:noteId/archive',
	zValidator(
		'param',
		z.object({
			noteId: z.string().uuid(),
		})
	),
	async c => {
		const { noteId } = c.req.valid('param');

		const note = await fetchNoteByIdAndAuthor({
			noteId,
			authorId: c.env.authenticator.userId,
		});

		if (!note) {
			return c.json(
				{
					success: false,
					error: { message: `Note not found or you don't have permissions` },
				},
				404
			);
		}

		const archiveResult = await archiveNote(noteId);

		if (archiveResult.rowCount === 0) {
			return c.json(
				{
					success: false,
					error: { message: 'Cannot archive note' },
				},
				400
			);
		}

		return c.json({
			success: true,
			data: { archived: true },
		});
	}
);

notesRouter.post(
	'/:noteId/restore',
	zValidator(
		'param',
		z.object({
			noteId: z.string().uuid(),
		})
	),
	async c => {
		const { noteId } = c.req.valid('param');

		const note = await fetchNoteByIdAndAuthor({
			noteId,
			authorId: c.env.authenticator.userId,
		});

		if (!note) {
			return c.json(
				{
					success: false,
					error: { message: `Note not found or you don't have permissions` },
				},
				404
			);
		}

		const restoreResult = await restoreNote(noteId);

		if (restoreResult.rowCount === 0) {
			return c.json(
				{
					success: false,
					error: { message: 'Cannot restore note' },
				},
				400
			);
		}

		return c.json({
			success: true,
			data: { restored: true },
		});
	}
);

notesRouter.delete(
	'/:noteId',
	zValidator(
		'param',
		z.object({
			noteId: z.string().uuid(),
		})
	),
	async c => {
		const { noteId } = c.req.valid('param');

		const note = await fetchNoteByIdAndAuthor({
			noteId,
			authorId: c.env.authenticator.userId,
		});

		if (!note) {
			return c.json(
				{
					success: false,
					error: { message: `Note not found or you don't have permissions` },
				},
				404
			);
		}

		const deleteResult = await deleteNote(noteId);

		if (deleteResult.rowCount === 0) {
			return c.json(
				{
					success: false,
					error: { message: 'Cannot delete note' },
				},
				500
			);
		}

		return c.json({
			success: true,
			data: { deleted: true },
		});
	}
);

export default notesRouter;
