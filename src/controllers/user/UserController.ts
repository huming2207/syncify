import { BaseController } from '../BaseController';
import { Context, Next } from 'koa';
import koaBody from 'koa-body';


export class UserController extends BaseController {
    constructor() {
        super('/user');
    }

    private get = async (ctx: Context, next: Next): Promise<void> => {

    }
}