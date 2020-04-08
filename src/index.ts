import Koa from 'koa';
import logger from 'koa-logger';
import { UserController } from './controllers/UserController';
import jwt from 'koa-jwt';
import { connectToDb } from './common/Database';

require('dotenv').config();

connectToDb()
    .then(() => {
        const app = new Koa();
        const userController = new UserController();

        app.use(logger());
        app.use(
            jwt({
                secret: process.env.SYNCIFY_JWT_SECRET
                    ? process.env.SYNCIFY_JWT_SECRET
                    : 'jwtTestSecret',
                algorithms: ['HS512'],
                passthrough: true,
            }).unless({ path: [/^\/api\/user\/register/, /^\/api\/user\/login/] }),
        );
        app.use(userController.router.middleware());
        app.listen(3000);
    })
    .catch((err) => {
        console.error(`Failed to connect MongoDB: ${err}`);
        process.exit(1);
    });
