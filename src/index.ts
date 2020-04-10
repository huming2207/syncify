import Koa from 'koa';
import logger from 'koa-logger';
import { UserController } from './controllers/UserController';
import jwt from 'koa-jwt';
import { connectToDb } from './common/Database';
import { UnauthorisedHandler } from './controllers/BaseController';

require('dotenv').config();

const app = new Koa();
const userController = new UserController();

app.use(logger());
app.use(UnauthorisedHandler);

app.use(
    jwt({
        secret: process.env.SYNCIFY_JWT_SECRET ? process.env.SYNCIFY_JWT_SECRET : 'jwtTestSecret',
        algorithms: ['HS512'],
        passthrough: false,
    }).unless({ path: [/^\/api\/user\/register/, /^\/api\/user\/login/] }),
);
app.use(userController.router.middleware());

connectToDb()
    .then(() => {
        app.listen(parseInt(process.env.SYNCIFY_PORT ? process.env.SYNCIFY_PORT : '3000'));
    })
    .catch((err) => {
        console.error(`Failed to connect MongoDB: ${err}`);
        process.exit(1);
    });
