const util = require('../utils/utils');
const constants = require('../utils/constants')

const log4js = require("log4js");
const logger = log4js.getLogger("igwService");

var methods = {}

methods.getApplicationList = async (appscanToken, skipValue) => {
    try {
        const url = constants.ASOC_APPLICATION_LIST.replace('${skipValue}', skipValue);
        return await util.httpRequest(url, appscanToken, "GET")
    }
    catch (err) {
        throw err
    }
}

methods.getIssueList = async (appscanToken, skipValue, appId) => {
    try {
        const url = constants.GET_ISSUE_APPLICATION_LIST.replace('${appId}', appId).replace('${skipValue}', skipValue);
        return await util.httpRequest(url, appscanToken, "GET");
    }
    catch (err) {
        throw err
    }
}

methods.getScanList = async (appscanToken, skipValue) => {
    try {
        const url = constants.GET_ALL_SCAN_LIST.replace('${skipValue}', skipValue);
        return await util.httpRequest(url, appscanToken, "GET")
    }
    catch (err) {
        throw err
    }
}

methods.getExecutionList = async (appscanToken, scanId) => {
    try {
        const url = constants.SCAN_EXECUTION_COUNT.replace('${scanId}', scanId);
        return await util.httpRequest(url, appscanToken, "GET")
    }
    catch (err) {
        throw err
    }
}

methods.getFixGroupList = async (appscanToken, skipValue, appId) => {
    try {
        const url = constants.FIX_GROUPS.replace('${appId}', appId).replace('${skipValue}', skipValue);
        return await util.httpRequest(url, appscanToken, "GET")
    }
    catch (err) {
        throw err
    }
}

methods.getSubscriptionInfo = async (appscanToken) => {
    try {
        const url = constants.SUBSCRIPTION_INFO;
        return await util.httpRequest(url, appscanToken, "GET");
    }
    catch (err) {
        throw err
    }
}

methods.getIssueTrend = async (appscanToken, skipValue) => {
    try {
        const url = constants.ASOC_APPLICATION_LIST.replace('${skipValue}', skipValue);
        return await util.httpRequest(url, appscanToken, "GET")
    }
    catch (err) {
        throw err
    }
}

methods.getScansData = async (appscanToken, scanId, technology) => {
    try {
        const url = technology == 'SAST' ? constants.SAST_SCAN_DATA.replace('${scanId}', scanId) : technology == 'DAST' ? constants.DAST_SCAN_DATA.replace('${scanId}', scanId) : technology == 'SCA' ? constants.SCA_SCAN_DATA.replace('${scanId}', scanId) : undefined
        if (url == undefined || scanId == undefined) {
            return "ERROR";
        } else {
            return await util.httpRequest(url, appscanToken, "GET")
        }
    }
    catch (err) {
        throw err
    }
}

methods.getScanExecutionData = async (appscanToken, skipValue, executionId) => {
    try {
        const url = constants.SCAN_EXECUTION_DATA.replace('${executionId}', executionId).replace('${skipValue}', skipValue);
        return await util.httpRequest(url, appscanToken, "GET")
    }
    catch (err) {
        throw err
    }
}


module.exports = methods;