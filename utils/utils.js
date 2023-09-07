const axios = require('axios');

var methods = {};

methods.httpRequest = async (url, token, method, data, etag) => {
    const httpOptions = httpConfig(url, token, method, data, etag);
    let result = await httpCall(httpOptions);
    return result;
}

const httpConfig = (url, token, method, data, etag) => {
    return {
        method: method,
        url: `${process.env.ASOC_URL}${url}`,
        data: data,
        headers: {
            'Content-Type': 'application/json',
            'asc_xsrf_token': token,
            'If-Match': etag ? etag : '',
            'Authorization': "Bearer " + token
        }
    };
}

const httpCall = async (httpOptions) => {
    const result = await axios(httpOptions);

    return { "code": result.status, "data": result.data };
}

methods.convertToMySQLDateTime = (dateString) => {
    try {
        if(dateString == undefined || dateString == null){
            return null
        }
        return "'" + new Date(dateString).toISOString().slice(0, 19).replace('T', ' ') + "'";
    } catch (error) {
        console.log(error)
        // logger.error('Error converting date:', error);
        return null; // Return a default or null value if conversion fails
    }
}

module.exports = methods;