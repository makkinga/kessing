/*************************************************************/
/* Update NGINX config
/*************************************************************/
/*
 * https://www.digitalocean.com/community/tutorials/how-to-install-nginx-on-ubuntu-20-04
 * https://www.digitalocean.com/community/tutorials/how-to-set-up-nginx-server-blocks-virtual-hosts-on-ubuntu-16-04
 *
 * $ nano /etc/nginx/sites-available/default
 * or
 * $ nano /etc/nginx/sites-available/node
 * $ systemctl restart nginx
 */

require('dotenv').config()
const express       = require('express')
const app           = express()
const cors          = require('cors')
const CryptoJS      = require('crypto-js')
const {DB, Account} = require('./utils')

app.use(cors())
app.options('*', cors())
app.use(express.json())

// Add headers before the routes are defined
app.use(function (req, res, next) {

    // Website you wish to allow connecting
    res.setHeader('Access-Control-Allow-Origin', '*')

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', '*')

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', '*')

    // Pass to next layer of middleware
    next()
})

app.get('/ping', async function (request, response) {
    response.writeHead(200, {'Content-Type': 'application/json'})
    response.write(JSON.stringify({success: true, message: `pong`}))
    response.end()

    return
})

app.post('/verify-account', async function (request, response) {
    await DB.accountHolders.sync()
    for (const param of ['id', 'address']) {
        if (typeof request.body[param] === 'undefined') {
            response.writeHead(400, {'Content-Type': 'application/json'})
            response.write(JSON.stringify({success: false, message: `Missing parameter "${param}"`}))
            response.end()

            return
        }
    }

    try {
        const id      = await CryptoJS.AES.decrypt(request.body['id'].replace(':p:', '+').replace(':s:', '/'), process.env.CREATE_ACCOUNT_CYPHER_SECRET).toString(CryptoJS.enc.Utf8)
        const address = await request.body['address']

        if (await Account.verified(address)) {
            response.writeHead(403, {'Content-Type': 'application/json'})
            response.write(JSON.stringify({success: false, message: `Account already verified`}))
            response.end()

            return
        }

        await Account.verify(address, id)

        await DB.accountHolders.create({
            user   : id,
            address: address,
            role   : false
        })

        response.writeHead(200, {'Content-Type': 'application/json'})
        response.write(JSON.stringify({success: true, id: id}))
        response.end()
    } catch (error) {
        console.log(error)

        response.writeHead(500, {'Content-Type': 'application/json'})
        response.write(JSON.stringify({success: false, message: `An error occurred`}))
        response.end()
    }
})

const api = app.listen(process.env.API_PORT, '127.0.0.1', function () {
    const host = api.address().address
    const port = api.address().port
    console.log('Barkeep Kessing API listening at http://%s:%s', host, port)
})