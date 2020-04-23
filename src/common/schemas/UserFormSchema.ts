import { JSONSchema7 } from 'json-schema';

export const UserFormSchema: JSONSchema7 = {
    $id: '#userForm',
    type: 'object',
    properties: {
        username: { type: 'string', minLength: 3, maxLength: 60 },
        password: { type: 'string', minLength: 8, maxLength: 20 },
        email: { type: 'string', format: 'email' },
    },
    required: ['username', 'password'],
};
