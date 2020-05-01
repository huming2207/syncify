import './typings/FastifyTypes';
import fastify from 'fastify';
import { connectToDb } from './common/Database';
import { ProtectedMiddleware } from './controllers/middleware/ProtectedMiddleware';
import { AuthController } from './controllers/endpoints/AuthController';
import FastifySwagger from 'fastify-swagger';
import { UserFormSchema } from './common/schemas/UserFormSchema';
import { PathQuerySchema } from './common/schemas/PathQuerySchema';

require('dotenv').config();

const server = fastify();
const prefix = { prefix: '/api' };

server.register(FastifySwagger, {
    routePrefix: '/api/documentation',
    exposeRoute: true,
    swagger: {
        info: {
            title: 'Syncify',
            description: 'Cloud Computing Assignment 2',
            version: '0.0.2',
        },
        consumes: ['application/x-www-form-urlencoded'],
        produces: ['application/json'],
        definitions: { UserFormSchema, PathQuerySchema },
    },
});

server.register(new AuthController().bootstrap, prefix);
server.register(new ProtectedMiddleware().bootstrap, prefix);
server.setErrorHandler((error, req, reply) => {
    reply.code(error.statusCode ? error.statusCode : 500).send({
        message: error.message ? error.message : 'Unknown error',
        data: {
            name: error.name ? error.name : 'Unknown',
            validation: error.validation,
        },
    });
});

connectToDb()
    .then(() => {
        console.log('Database connected, starting Fastify...');
        server.listen(
            parseInt(process.env.SYNCIFY_PORT ? process.env.SYNCIFY_PORT : '3000'),
            (err, address) => {
                if (err) {
                    console.error(err);
                    process.exit(1);
                }

                server.ready((err) => {
                    if (err) {
                        console.error(err);
                        process.exit(1);
                    }
                    server.swagger();
                });
                console.log(`Fastify is listening at ${address}`);
            },
        );
    })
    .catch((err) => {
        console.error(`Failed to connect MongoDB: ${err}`);
        process.exit(1);
    });
