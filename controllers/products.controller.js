
const getProducts = (request, res) => {
    const products = request.pgsql.query('SELECT name, sku, image, price, stock FROM products')
    // status 
    return products.rows;
}
 
module.exports = {
    getProducts
};