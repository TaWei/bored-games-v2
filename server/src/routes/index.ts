import { Hono } from 'hono';
import { gamesRouter } from './games';
import { roomsRouter } from './rooms';

const routes = new Hono();

routes.route('/games', gamesRouter);
routes.route('/rooms', roomsRouter);

export { routes };
