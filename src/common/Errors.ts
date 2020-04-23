import { FastifyError, ValidationResult } from 'fastify';

export abstract class BaseError implements FastifyError {
    statusCode?: number | undefined;
    validation?: ValidationResult[] | undefined;
    name = '';
    message = '';
    stack?: string | undefined;
}

export class BadRequestError extends BaseError {
    constructor(msg: string) {
        super();
        this.name = 'Bad Request';
        this.message = msg;
        this.statusCode = 400;
    }
}

export class UnauthorisedError extends BaseError {
    constructor(msg: string) {
        super();
        this.name = 'Unauthorised';
        this.message = msg;
        this.statusCode = 401;
    }
}

export class ForbiddenError extends BaseError {
    constructor(msg: string) {
        super();
        this.name = 'Forbidden';
        this.message = msg;
        this.statusCode = 403;
    }
}

export class NotFoundError extends BaseError {
    constructor(msg: string) {
        super();
        this.name = 'Not Found';
        this.message = msg;
        this.statusCode = 404;
    }
}

export class InternalError extends BaseError {
    constructor(msg: string) {
        super();
        this.name = 'Internal Server Error';
        this.message = msg;
        this.statusCode = 500;
    }
}
