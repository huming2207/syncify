import { JSONSchema7 } from 'json-schema';

export const PathQuerySchema: JSONSchema7 = {
    $id: '#path',
    type: 'object',
    properties: {
        path: { type: 'string', pattern: '^\/' } // prettier-ignore
    },
    required: ['path'],
};
