const yaml      = require('config-yaml')
const config    = yaml(`${__dirname}/../config/${process.env.ENVIRONMENT}.yml`)
const {ChainID} = require("@harmony-js/utils")

exports.get = function (key) {
    if (key === 'chain_id') {
        switch (process.env.ENVIRONMENT) {
            case 'production':
                return ChainID.HmyMainnet
            case 'local':
            default :
                return ChainID.HmyTestnet
        }
    }

    return key.split('.').reduce((o, i) => o[i], config)
}