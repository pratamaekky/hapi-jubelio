const { getProducts } = require("./controllers/products.controller")

const router = [
    {
        method: 'GET',
        path: '/',
        handler: (request, h) => {
            return 'Hello World!';
        }
    },
    {
        method: 'GET',
        path: '/products',
        handler: getProducts
    }
];

module.exports = router;