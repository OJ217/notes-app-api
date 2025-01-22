import { Hono } from 'hono';

import authRouter from '@/routers/auth-router';
import notesRouter from '@/routers/note-router';
import userRouter from '@/routers/user-router';
import { authenticate } from '@/api/middleware';

const app = new Hono();

app.get('/', c => {
	return c.text('Hello Hono!');
});

const publicApi = app.basePath('/v1');
const privateApi = publicApi.basePath('/api');

privateApi.use(authenticate);

publicApi.route('/auth', authRouter);
privateApi.route('/notes', notesRouter);
privateApi.route('/users', userRouter);

export default app;
