import { JSONSchema7 } from 'json-schema';

export const ErrorCommonDataSchema: JSONSchema7 = {
    type: 'object',
    properties: {
        name: { type: 'string' },
        validation: { type: 'object' },
    },
};

export const NotFoundErrorSchema: JSONSchema7 = {
    description: 'Error raised when the required resource is not found',
    type: 'object',
    properties: {
        message: { type: 'string' },
        data: ErrorCommonDataSchema,
    },
};

export const InternalErrorSchema: JSONSchema7 = {
    description: 'Error raised when the API server has an internal error',
    type: 'object',
    properties: {
        message: { type: 'string' },
        data: ErrorCommonDataSchema,
    },
};

export const UnauthorisedSchema: JSONSchema7 = {
    description: 'Error raised when the JWT token is invalid',
    type: 'object',
    properties: {
        message: { type: 'string' },
        data: ErrorCommonDataSchema,
    },
};

export const BadRequestSchema: JSONSchema7 = {
    description: 'Error raised when an invalid request was made',
    type: 'object',
    properties: {
        message: { type: 'string' },
        data: ErrorCommonDataSchema,
    },
};

export const ErrorSchema = {
    400: BadRequestSchema,
    401: UnauthorisedSchema,
    404: NotFoundErrorSchema,
    500: InternalErrorSchema,
};
