import * as koaJoiRouter from 'koa-joi-router';
import { Context, Next } from 'koa';
import User, { UserDoc } from '../models/UserModel';

export abstract class BaseController {
    private _router: koaJoiRouter.Router;

    public get router(): koaJoiRouter.Router {
        return this._router;
    }

    public set router(value: koaJoiRouter.Router) {
        this._router = value;
    }

    protected getUser = async (ctx: Context, next: Next): Promise<void> => {
        if (ctx.state.user === undefined) return next();
        const userId = ctx.state.user['id'];
        const user = await User.findById(userId).populate({
            path: 'rootPath',
        });

        if (user === null) {
            ctx.status = 500;
            ctx.type = 'json';
            ctx.body = { msg: 'Cannot find user', data: null };
            return;
        }

        ctx.state.user['obj'] = user;
        return next();
    };

    constructor() {
        this._router = koaJoiRouter.default();
        this._router.use(this.getUser);
        this._router.prefix('/api');
    }
}

export async function UnauthorisedHandler(ctx: Context, next: Next): Promise<void> {
    return next().catch((err) => {
        if (err.status !== 401) throw err;
        if (ctx.state.jwtOriginalError || !ctx.state.user) {
            ctx.status = 401;
            ctx.type = 'json';
            ctx.body = { msg: "You haven't logged in!", data: err };
        } else {
            throw err;
        }
    });
}
