import './typings/FastifyTypes';
import fastify from 'fastify';
import { connectToDb } from './common/Database';
import { ProtectedMiddleware } from './controllers/middleware/ProtectedMiddleware';
import { AuthController } from './controllers/endpoints/AuthController';
import FastifyOas from 'fastify-oas';
import { UserFormSchema } from './common/schemas/UserFormSchema';
import { PathQuerySchema } from './common/schemas/PathQuerySchema';
import { ErrorHandler } from './controllers/middleware/ErrorHandler';

require('dotenv').config();

const server = fastify();
const prefix = { prefix: '/api' };

server.register(FastifyOas, {
    routePrefix: '/api/documentation',
    exposeRoute: true,
    swagger: {
        info: {
            title: 'Syncify',
            description: 'Cloud Computing Assignment 2',
            version: '0.1.0',
        },
        produces: ['application/json'],
        definitions: { UserFormSchema, PathQuerySchema },
        securityDefinitions: {
            JWT: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
            },
        },
    },
});

server.register(new AuthController().bootstrap, prefix);
server.register(new ProtectedMiddleware().bootstrap, prefix);
server.setErrorHandler(ErrorHandler);

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
                    server.oas();
                });
                console.log(`Fastify is listening at ${address}`);
            },
        );
    })
    .catch((err) => {
        console.error(`Failed to connect MongoDB: ${err}`);
        process.exit(1);
    });
