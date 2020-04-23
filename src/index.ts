import './typings/FastifyTypes';
import fastify from 'fastify';
import { connectToDb } from './common/Database';
import { ProtectedMiddleware } from './controllers/middleware/ProtectedMiddleware';
import { AuthController } from './controllers/endpoints/AuthController';

require('dotenv').config();

const server = fastify();
const prefix = { prefix: '/api' };

server.register(new AuthController().bootstrap, prefix);
server.register(new ProtectedMiddleware().bootstrap, prefix);

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
                console.log(`Fastify is listening at ${address}`);
            },
        );
    })
    .catch((err) => {
        console.error(`Failed to connect MongoDB: ${err}`);
        process.exit(1);
    });
