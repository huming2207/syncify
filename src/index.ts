import Koa from 'koa';
import logger from 'koa-logger';
import mongoose from 'mongoose';
import { UserController } from './controllers/user/UserController';
import jwt from 'koa-jwt';

require('dotenv').config();

mongoose.connect(
    process.env.SYNCIFY_DB_URL ? process.env.SYNCIFY_DB_URL : 'mongodb://localhost:27017/syncify',
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    },
);

const app = new Koa();
const userController = new UserController();

app.use(logger());
app.use(
    jwt({
        secret: process.env.SYNCIFY_JWT_SECRET ? process.env.SYNCIFY_JWT_SECRET : 'jwtTestSecret',
        algorithms: ['HS512'],
    }).unless({ path: [/^\/api\/user\/register/, /^\/api\/user\/login/] }),
);
app.use(userController.router.middleware());
app.listen(3000);
