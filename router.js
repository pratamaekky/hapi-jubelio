const { getProducts, detailProduct, deleteProduct, storeProduct, wooProducts } = require("./controllers/products.controller")

const Joi = require('joi');

const router = [
    {
        method: 'GET',
        path: '/images/{filename}',
        handler: function (request, reply) {
            return reply.file(`./images/${request.params.filename}`)
        }
    },
    {
        method: ['POST'],
        path: '/products',
        handler: getProducts,
        options: {
            validate: {
                payload: Joi.object({
                    page: Joi.number().integer().positive().default(1),
                    limit: Joi.number().integer().positive().default(10)
                }),
                failAction: (request, h, err) => {
                    throw err;
                    return;
                }
            }
        }
    },
    {
        method: ['POST'],
        path: '/products/detail',
        handler: detailProduct,
        options: {
            validate: {
                payload: Joi.object({
                    id: Joi.number().integer()
                }),
                failAction: (request, h, err) => {
                    throw err;
                    return;
                }
            }
        }
    },
    {
        method: ['POST'],
        path: '/products/delete',
        handler: deleteProduct,
        options: {
            validate: {
                payload: Joi.object({
                    id: Joi.number().integer()
                }),
                failAction: (request, h, err) => {
                    throw err;
                    return;
                }
            }
        }
    },
    {
        method: ['POST'],
        path: '/products/store',
        handler: storeProduct,
        options: {
            validate: {
                payload: Joi.object({
                    id: Joi.number().integer().positive(),
                    name: Joi.string().required(),
                    sku: Joi.string().required(),
                    price: Joi.number().integer().positive().required(),
                    stock: Joi.number().integer().positive().default(0),
                    description: Joi.string(),
                    image: Joi.string().dataUri()
                }),
                failAction: (request, h, err) => {
                    throw err;
                    return;
                }
            }
        }
    },
    {
        method: ['POST'],
        path: '/products/get-woo',
        handler: wooProducts
    }
];

module.exports = router;