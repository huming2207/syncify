import { JSONSchema7 } from 'json-schema';

export const CopyMoveSchema: JSONSchema7 = {
    $id: '#copyMoveForm',
    type: 'object',
    properties: {
        orig: { type: 'string', pattern: '^\/' }, // prettier-ignore
        dest: { type: 'string', pattern: '^\/' } // prettier-ignore
    },
    required: ['orig', 'dest'],
};
