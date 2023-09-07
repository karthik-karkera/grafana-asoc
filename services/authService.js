const util = require('../utils/utils')
const constants = require('../utils/constants')

var methods = {}

methods.login = async (data) => {
    const url = constants.ASOC_KEYLOGIN;
    return await util.httpRequest(url, "", "POST", JSON.stringify(data), '')
}

module.exports = methods;