// index.js
'use strict';
const Hapi = require('hapi');
const Joi = require('joi');

const server = Hapi.server({
    port: 3000,
    host: 'localhost'
}); 
// const server = new Hapi.Server();
// server.connection({
//     port: 3000,
//     host: 'localhost'
// });
server.register({
    register: require('hapi-plugin-pg'),
    options: {
        connectionString: 'postgres://postgres:!Int3r08@localhost:5432/jubelio'
       
  }
}, (err) => {
    if (err) {
        throw err;
    }
});

// server.route({
//     method: 'GET',
//     path: '/username/{name}',
//     handler: function (request, reply) {
//         const username = request.params.name;
//         request.pg.client.query("SELECT * FROM products where name = $1", [username], (err, result) => {
//             if (err) {
//                 return reply(err).code(500);
//             }
//             if (!result || !result.rows || result.rows.length === 0) {
//                 return reply({
//                     body: 'Not Found'
//                 }).code(404);
//             }
//             return reply(result.rows);
//         });
//     },
//     config: {
//     validate: {
//         params: Joi.object({
//             name: Joi.string().alphanum().required()
//         })
//     }
// }
// });
// server.route({
//     method: 'GET',
//     path: '/id/{id}',
//     handler: function (request, reply) {
//         const id = request.params.id;
//         request.pg.client.query("SELECT * FROM users where id = $1", [id], (err, result) => {
//             if (err) {
//                 return reply(err).code(500);
//             }
//             if (!result || !result.rows || result.rows.length === 0) {
//                 return reply({
//                     body: 'Not Found'
//                 }).code(404);
//             }
//             return reply(result.rows);
//         });
//     },
//     config: {
//     validate: {
//         params: Joi.object({
//             id: Joi.number().integer().required()
//         })
//     }
// }
// });
server.start((err) => {
    if (err) {
        throw err;
    }
    console.log('Server running at: ${server.info.uri}');
});