'use strict';
require('dotenv').config();
const Hapi = require('@hapi/hapi');
const router = require('./router');

const init = async () => {
    const server = Hapi.server({
        port: 3000,
        host: 'localhost'
    });

    router.forEach((path) => server.route(path));

    await server.register({
        plugin: require('hapi-pgsql'),
        options: {
            database_url: `postgresql://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_SERVERNAME}:${process.env.DB_PORT}/${process.env.DB_NAME}`,
        }
    })

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();