import { JSONSchema7 } from 'json-schema';

export const SuccessResponseSchema: JSONSchema7 = {
    description: 'Any successful responses',
    type: 'object',
    properties: {
        message: { type: 'string' },
        data: { type: 'object', additionalProperties: true },
    },
};
