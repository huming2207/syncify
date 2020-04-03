import Router from 'koa-router';

export abstract class BaseController {
    private _router: Router;

    public get router(): Router {
        return this._router;
    }

    public set router(value: Router) {
        this._router = value;
    }

    constructor(_prefix: string) {
        this._router = new Router({
            prefix: _prefix,
        });
    }
}
