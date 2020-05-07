import { JSONSchema7 } from 'json-schema';

export const LoginFormSchema: JSONSchema7 = {
    $id: '#loginForm',
    type: 'object',
    properties: {
        username: { type: 'string', minLength: 3, maxLength: 60 },
        password: { type: 'string', minLength: 8, maxLength: 20 },
    },
    required: ['username', 'password'],
};

export const RegisterFormSchema: JSONSchema7 = {
    $id: '#regForm',
    type: 'object',
    properties: {
        username: { type: 'string', minLength: 3, maxLength: 60, not: { format: 'email' } },
        password: { type: 'string', minLength: 8, maxLength: 20 },
        email: { type: 'string', format: 'email' },
    },
    required: ['username', 'password', 'email'],
};
