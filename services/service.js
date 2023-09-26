const util = require('../utils/utils');
const constants = require('../utils/constants')

const log4js = require("log4js");
const logger = log4js.getLogger("igwService");

var methods = {}

methods.getApplicationList = async (appscanToken) => {
    const url = constants.ASOC_APPLICATION_LIST;
    return await util.httpRequest(url, appscanToken, "GET")
}

methods.getIssueList = async (appscanToken, appId) => {
    const url = constants.GET_ISSUE_APPLICATION_LIST.replace('${appId}', appId);
    return await util.httpRequest(url, appscanToken, "GET")
}

methods.getScanList = async (appscanToken) => {
    const url = constants.GET_ALL_SCAN_LIST;
    return await util.httpRequest(url, appscanToken, "GET")
}

methods.getFixGroupList = async (appscanToken, appId) => {
    const url = constants.FIX_GROUPS.replace('${appId}', appId);
    return await util.httpRequest(url, appscanToken, "GET")
}

module.exports = methods;