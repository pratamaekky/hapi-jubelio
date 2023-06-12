'use strict'
const fs = require('fs');
const WooCommerceRestApi = require("@woocommerce/woocommerce-rest-api").default;
const axios = require('axios')

const path = './images/'

async function createDir() {
    if (!fs.existsSync('./images')) {
        await fs.promises.mkdir('images');
    }
}

async function imageUrlToBase64(url) {
    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer',
        });

        const contentType = response.headers['content-type'];

        const base64String = `data:${contentType};base64,${Buffer.from(
            response.data,
        ).toString('base64')}`;

        return base64String;
    } catch (err) {
        console.log(err);
    }
}

async function getProducts(request, res) {
    let baseUrl = request.server.info.uri;
    let resProducts = []
    let limit = request.payload.limit;
    let offset = (request.payload.page - 1) * limit;

    let products = await request.pgsql.query(`SELECT name, sku, image, price, stock FROM products ORDER BY name ASC OFFSET ${offset} LIMIT ${limit}`);
    
    products.rows.forEach(function (product) {
        product.image = (product.image !== null) ? baseUrl + '/images/' + product.image : product.image
        resProducts.push(product)
    })

    let result = {
        message: (products.rowCount > 0) ? 'Success get all products' : 'No recourd found',
        data: resProducts
    };

    return res.response(result).code(200);
}

async function detailProduct(request, res) {
    let idProduct = request.payload.id;
    let baseUrl = request.server.info.uri;

    let product = await request.pgsql.query(`SELECT name, sku, image, price, stock, description FROM products WHERE id = ${idProduct} LIMIT 1`);

    let resProduct = (product.rowCount) ? product.rows[0] : []
    resProduct.image = (resProduct.image !== null) ? baseUrl + '/images/' + resProduct.image : resProduct.image

    let result = {
        message: (product.rowCount > 0) ? `Success get Product by id ${idProduct}` : 'Data not found',
        data: resProduct
    };

    return res.response(result).code(200);
}

// Store product to database
// if params.id isset update product
async function storeProduct(request, res) {
    createDir()
    let result, dataStore;
    let params = request.payload;
    let imageName = Date.now() + '.png';
    let imageData = request.payload.image;

    let imagePath = path + imageName;

    // to convert base64 format into random filename
    const base64Data = imageData.replace(/^data:([A-Za-z-+/]+);base64,/, '');
    fs.writeFileSync(imagePath, base64Data, { encoding: 'base64' });

    if (params.id) {
        let product = await request.pgsql.query(`SELECT * FROM products WHERE id = ${params.id} LIMIT 1`);
        if (product.rowCount > 0) {
            product = product.rows[0];

            dataStore = [
                params.name,
                params.sku,
                params.price,
                (params.stock) ? params.stock : product.stock,
                (params.description) ? params.description : product.description,
                (params.image) ? imageName : product.image
            ];

            let update = await request.pgsql.query(`UPDATE products SET name = $1, sku = $2, price = $3, stock = $4, description = $5, image = $6 WHERE id = ${params.id} RETURNING name, sku, image, price, stock, description`, dataStore);
            result = {
                message: (update.rowCount > 0) ? `Success update Product by id ${params.id}` : `Failed to update product`,
                data: (update.rowCount) ? update.rows[0] : []
            };
        } else {
            result = {
                message: 'Data not found',
                data: []
            };
        }
    } else {
        let store = await request.pgsql.query(`INSERT INTO products (name, sku, price, stock, image, description) VALUES ($1, $2, $3, $4, $5, $6) RETURNING name, sku, image, price, stock, description`, [params.name, params.sku, params.price, params.stock, imageName, params.description]);

        result = {
            message: (store.rowCount > 0) ? 'Success store Product' : 'Failed to store product',
            data: (store.rowCount) ? store.rows[0] : []
        };
    }

    return res.response(result).code(200);
}

async function deleteProduct(request, res) {
    let idProduct = request.payload.id;

    let product = await request.pgsql.query(`DELETE FROM products WHERE id = ${idProduct} RETURNING name, sku, image, price, stock, description`);
    let result = {
        message: (product.rowCount > 0) ? `Success delete Product by id ${idProduct}` : 'Data not found',
        data: (product.rowCount) ? product.rows[0] : []
    };

    return res.response(result).code(200);
}

async function wooProducts(request, res) {
    createDir();
    let products
    const WooCommerce = new WooCommerceRestApi({
        url: 'https://codetesting.jubelio.store/',
        consumerKey: 'ck_1cbb2c1902d56b629cd9a555cc032c4b478b26ce',
        consumerSecret: 'cs_7be10f0328c5b1d6a1a3077165b226af71d8b9dc',
        version: 'wc/v3'
    });

    let wooGetProducts = function (data) {
        return WooCommerce.get("products")
    }

    let resdata = await wooGetProducts()

    products = resdata.data
    products.forEach(async function (product, key) {
        let dataStore = []
        let checkProductIsExists = await request.pgsql.query(`SELECT * FROM products WHERE sku = '${product.sku}' LIMIT 1`);
        if (checkProductIsExists.rowCount == 0) {
            let productImage = [];
            let productImageSrc = [];
            product.images.forEach(function(image) {
                let imageName = Date.now() + '.png';

                productImage.push(imageName);
                productImageSrc.push({
                    name: imageName,
                    url: image.src
                });
            });

            productImageSrc.forEach(async function(img) {
                let imageBase64 = await imageUrlToBase64(img.url)
                let imagePath = path + img.name;
                let base64Data = imageBase64.replace(/^data:([A-Za-z-+/]+);base64,/, '');
                fs.writeFileSync(imagePath, base64Data, { encoding: 'base64' });
            })

            dataStore = [
                product.name,
                product.sku,
                Math.ceil(product.price),
                productImage.join(';'),
                product.description
            ];

            await request.pgsql.query(`INSERT INTO products (name, sku, price, image, description) VALUES ($1, $2, $3, $4, $5) RETURNING name, sku, image, price, stock, description`, dataStore);
        }
    });

    let result = {
        message: (resdata.data.length > 0) ? `Success get Products WooCommerce` : 'Data not found',
        data: (resdata.data.length) ? resdata.data : []
    };

    return res.response(result).code(200);
}

module.exports = {
    getProducts,
    detailProduct,
    storeProduct,
    deleteProduct,
    wooProducts
};