import Koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';
import * as mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const app = new Koa();
const router = new Router();

app.use(logger());
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(3000);
