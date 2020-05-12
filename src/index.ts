import './typings/FastifyTypes';
import fastify from 'fastify';
import { connectToDb } from './common/Database';
import { ProtectedMiddleware } from './controllers/middleware/ProtectedMiddleware';
import { AuthController } from './controllers/endpoints/AuthController';
import FastifyOas from 'fastify-oas';
import { LoginFormSchema, RegisterFormSchema } from './common/schemas/request/UserFormSchema';
import { PathQuerySchema } from './common/schemas/request/PathQuerySchema';
import { ErrorHandler } from './controllers/middleware/ErrorHandler';

require('dotenv').config();

const server = fastify({
    logger: {
        level: process.env.SYNCIFY_LOG_LEVEL ? process.env.PP_LOG_LEVEL : 'warn',
        prettyPrint: process.env.SYNCIFY_LOG_PRETTY === 'true' ? { colorize: true } : false,
        sync: process.env.SYNCIFY_LOG_SYNC === 'true',
    },
});
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
        servers: [
            {
                url: 'http://127.0.0.1:3000',
                description: 'Dev server',
            },
        ],
        definitions: { LoginFormSchema, RegisterFormSchema, PathQuerySchema },
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
