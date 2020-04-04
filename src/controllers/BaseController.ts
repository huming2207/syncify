import * as koaJoiRouter from 'koa-joi-router';

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
