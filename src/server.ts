import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';

import authRouter from '@/routers/auth-router';
import notesRouter from '@/routers/note-router';
import userRouter from '@/routers/user-router';
import { authenticator, errorHandler } from '@/api/middleware';

const app = new Hono();

app.use(logger());
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));

app.get('/', c => {
	return c.text('Hello Hono!');
});

const publicApi = app.basePath('/v1');
const privateApi = publicApi.basePath('/api');

privateApi.use(authenticator);

publicApi.route('/auth', authRouter);
privateApi.route('/notes', notesRouter);
privateApi.route('/user', userRouter);

app.onError(errorHandler);

export default app;
