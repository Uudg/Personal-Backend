import fastify from "fastify";
import fastifyAutoload from "@fastify/autoload";
import fastifyCors from "@fastify/cors";
import fastifyMongodb from "@fastify/mongodb";
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config'
    
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = fastify({
    logger: true
})

const start = () => {
    try {
        app.listen({
            port: process.env.PORT || 3000,
            host: '0.0.0.0'
        })
    } catch (err) {
        app.log.error(err)
        process.exit(1)
    }
}

app
    .register(fastifyAutoload, {
        dir: path.join(__dirname, 'src', 'routes'),
        options: Object.assign({
            prefix: '/api'
        }),
    })
    .register(fastifyCors, {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE']
    })

app.register(fastifyMongodb, {
        url: process.env.MONGODB_URI,
        database: process.env.MONGODB_DB,
        forceClose: true
        // useNewUrlParser: true
    })
    .then(() => {
        app.log.info('MongoDB connected')
    })
    .catch(err => {
        app.log.error(err)
    })
    
app.ready(() => start())