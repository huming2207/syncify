import Koa from 'koa';
import logger from 'koa-logger';
import { UserController } from './controllers/UserController';
import jwt from 'koa-jwt';
import { connectToDb } from './common/Database';
import { UnauthorisedHandler } from './controllers/BaseController';
import { PathController } from './controllers/PathController';
import { FileController } from './controllers/FileController';

require('dotenv').config();

const app = new Koa();
const userController = new UserController();
const pathController = new PathController();
const fileController = new FileController();

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
app.use(pathController.router.middleware());
app.use(fileController.router.middleware());

connectToDb()
    .then(() => {
        console.log('Database connected, starting Koa...');
        app.listen(parseInt(process.env.SYNCIFY_PORT ? process.env.SYNCIFY_PORT : '3000'));
    })
    .catch((err) => {
        console.error(`Failed to connect MongoDB: ${err}`);
        process.exit(1);
    });
