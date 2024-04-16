var constants = {
    ASOC_KEYLOGIN : '/api/v4/Account/ApiKeyLogin',
    ASOC_APPLICATION_LIST: '/api/v4/Apps?%24top=500&%24skip=${skipValue}&%24count=true',
    GET_ALL_SCAN_LIST : '/api/v4/Scans?%24top=500&%24skip=${skipValue}&%24orderby=CreatedAt&%24count=true',
    GET_ISSUE_APPLICATION_LIST : '/api/v4/Issues/Application/${appId}?applyPolicies=None&%24top=500&%24skip=${skipValue}&%24count=true',
    SCAN_LIST : '/api/v4/Issues/Application/${appId}?applyPolicies=None&%24top=500&%24skip=${skipValue}&%24count=true',
    FIX_GROUPS: '/api/v4/FixGroups/Application/${appId}?applyPolicies=None&%24top=500&%24skip=${skipValue}&%24count=true',
    SUBSCRIPTION_INFO: '/api/v4/Account/TenantInfo',
    DAST_SCAN_DATA: '/api/v4/Scans/Dast/${scanId}',
    SAST_SCAN_DATA: '/api/v4/Scans/Sast/${scanId}',
    IAST_SCAN_DATA: '/api/v4/Scans/DownloadIastConfig/{scanId}',
    SCA_SCAN_DATA: '/api/v4/Scans/Sca/${scanId}',
    SCAN_EXECUTION_DATA: '/api/v4/Issues/ScanExecution/${executionId}?applyPolicies=None&%24top=500&$skip=${skipValue}&$orderby=IssueType%20asc&$select=ApplicationId,Severity,Status,IssueType,DateCreated,IssueTypeGuid,Location,FixGroupId,LastFound,LastUpdated,Cve,Id&$inlinecount=allPages&%24count=true',
    SCAN_EXECUTION_COUNT: '/api/v4/Scans/${scanId}/Executions'
}

module.exports = constants;