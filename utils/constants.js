var constants = {
    ASOC_KEYLOGIN : '/api/V2/Account/ApiKeyLogin',
    ASOC_APPLICATION_LIST: '/api/V2/Apps/GetAsPage?%24inlinecount=allpages',
    GET_ALL_SCAN_LIST : '/api/v2/Scans/GetAsPageMin?%24inlinecount=allpages',
    GET_ISSUE_APPLICATION_LIST : '/api/v2/Issues/Application/${appId}',
    SCAN_LIST : '/api/v2/Apps/${appId}/Scans'
}

module.exports = constants;