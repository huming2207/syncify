import Koa from 'koa';
import Router from 'koa-router';
import logger from 'koa-logger';

const app = new Koa();
const router = new Router();

app.use(logger());
app.use(router.routes());
app.use(router.allowedMethods());
app.listen(3000);
