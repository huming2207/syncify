import { JSONSchema7 } from 'json-schema';

export const RenameSchema: JSONSchema7 = {
    $id: '#copyMoveForm',
    type: 'object',
    properties: {
        item: { type: 'string', pattern: '^\/' }, // prettier-ignore
        name: { type: 'string' },
    },
    required: ['item', 'name'],
};
