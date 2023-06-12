'use strict'

// Store Transaction to database
// if params.order_no isset update transaction
async function storeTransaction(request, res) {
    let result
    let params = request.payload;

    if (params.order_no) {
    //     let product = await request.pgsql.query(`SELECT * FROM products WHERE id = ${params.id} LIMIT 1`);
    //     if (product.rowCount > 0) {
    //         product = product.rows[0];

    //         dataStore = [
    //             params.name,
    //             params.sku,
    //             params.price,
    //             (params.stock) ? params.stock : product.stock,
    //             (params.description) ? params.description : product.description,
    //             (params.image) ? imageName : product.image
    //         ];

    //         let update = await request.pgsql.query(`UPDATE products SET name = $1, sku = $2, price = $3, stock = $4, description = $5, image = $6 WHERE id = ${params.id} RETURNING name, sku, image, price, stock, description`, dataStore);
    //         result = {
    //             message: (update.rowCount > 0) ? `Success update Product by id ${params.id}` : `Failed to update product`,
    //             data: (update.rowCount) ? update.rows[0] : []
    //         };
    //     } else {
    //         result = {
    //             message: 'Data not found',
    //             data: []
    //         };
    //     }
    } else {
        let date_time = new Date();
        let order_no = 'INV/' + date_time.getFullYear() + (date_time.getMonth() + 1) + '/' + Math.floor(1000 + Math.random() * 9000)
        let items = params.items
        const resItems = []
        let amount = 0

        items.forEach(async function(item, k) {
            let product = await request.pgsql.query(`SELECT * FROM products WHERE sku = '${item.sku}' LIMIT 1`)
            if (product.rowCount > 0) {
                product = product.rows[0]
                let trxItem = [
                    order_no,
                    item.sku,
                    item.qty
                ]

                amount += product.price
                let store = await request.pgsql.query(`INSERT INTO transaction_detail (order_no, sku, qty) VALUES ($1, $2, $3)`, trxItem);
                resItems.push(store.rows)
            } 

            if (k == 0) {
                let trx = [
                    order_no,
                    amount
                ]
                await request.pgsql.query(`INSERT INTO transaction (order_no, amount) VALUES ($1, $2)`, trx);
            }
        })

        result = {
            message: 'Success store Transaction',
            data: {
                order_no: order_no,
                items: items
            }
        };
    }

    return res.response(result).code(200);
}

async function getAllTransaction(request, res) {
    let resTrxs
    let limit = request.payload.limit;
    let offset = (request.payload.page - 1) * limit;
    let result

    let trxs

    async function getTransactions(callback) {
        const result = await request.pgsql.query(`SELECT * FROM transaction ORDER BY id ASC OFFSET ${offset} LIMIT ${limit}`);

        await callback(result);
    }

    await getTransactions((result) => {
        trxs = result.rows;
    });

    let arrayTrxs = []
    async function getTransactionsItems(callback) {
        let trxItems = []
        trxs.forEach(function (trx) {
            arrayTrxs.push({
                order_no: trx.order_no,
                amount: trx.amount,
                receiver_name: trx.receiver_name,
                receiver_address: trx.receiver_address,
                receiver_phone: trx.receiver_phone,
                receiver_email: trx.receiver_email
            })
        })

        for (let index = 0 ; index < arrayTrxs.length ; index++) {
            let trx = arrayTrxs[index]
            let items

            async function getTrxItems(callback) {
                const resultTrxItems = await request.pgsql.query(`SELECT sku, qty FROM transaction_detail WHERE order_no = '${trx['order_no']}'`)

                await callback(resultTrxItems)
            };

            await getTrxItems((result) => {
                items = result.rows
            })
            trx.items = items
            trxItems.push(trx)
        }

        callback(trxItems)
    }

    await getTransactionsItems((result) => {
        resTrxs = result
    })

    result = {
        message: 'Success get all transaction',
        data: resTrxs
    };

    return res.response(result).code(200);
}

async function detailTransaction(request, res) {
    let result = []
    let idTrx = request.payload.id;

    let trx, trxItems
    let trxData = {}

    async function getTransaction(callback) {
        const result = await request.pgsql.query(`SELECT order_no FROM transaction WHERE id = ${idTrx} LIMIT 1`);

        await callback(result);
    }

    await getTransaction((result) => {
        trx = result;
    });

    if (trx.rowCount > 0) {
        async function getTrxItems(callback) {
            const resultTrxItems = await request.pgsql.query(`SELECT sku, qty FROM transaction_detail WHERE order_no = '${trx.rows[0].order_no}'`)

            await callback(resultTrxItems)
        };

        await getTrxItems((data) => {
            trxItems = data.rows
        })

        trxData = {
            order_no: trx.rows[0].order_no,
            items: trxItems
        };

        result = {
            message: `Success get Transaction by id ${idTrx}`,
            data: trxData
        };
    } else {
        result = {
            message: "Record not found",
            data: []
        }
    }

    return res.response(result).code(200);
}

module.exports = {
    storeTransaction,
    getAllTransaction,
    detailTransaction
};