import Koa from 'koa';
import logger from 'koa-logger';
import mongoose from 'mongoose';
import { UserController } from './controllers/user/UserController';

mongoose.connect('mongodb://localhost:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const app = new Koa();
const userController = new UserController();

app.use(logger());
app.use(userController.router.middleware());
app.listen(3000);
