import * as koaJoiRouter from 'koa-joi-router';
import { Context, Next } from 'koa';

export abstract class BaseController {
    private _router: koaJoiRouter.Router;

    public get router(): koaJoiRouter.Router {
        return this._router;
    }

    public set router(value: koaJoiRouter.Router) {
        this._router = value;
    }

    constructor() {
        this._router = koaJoiRouter.default();
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
