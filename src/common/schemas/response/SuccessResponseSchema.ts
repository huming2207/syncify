import { JSONSchema7 } from 'json-schema';

export const SuccessResponseSchema: JSONSchema7 = {
    description: 'Error raised when the required resource is not found',
    type: 'object',
    properties: {
        message: { type: 'string' },
        data: { type: 'object', additionalProperties: true },
    },
};
