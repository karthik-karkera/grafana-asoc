var constants = {
    ASOC_KEYLOGIN : '/api/V2/Account/ApiKeyLogin',
    ASOC_APPLICATION_LIST: '/api/V2/Apps/GetAsPage?%24inlinecount=allpages',
    GET_ALL_SCAN_LIST : '/api/v2/Scans/GetAsPageMin?%24inlinecount=allpages',
    GET_ISSUE_APPLICATION_LIST : '/api/v2/Issues/Application/${appId}',
    SCAN_LIST : '/api/v2/Issues/Application/${appId}?%24inlinecount=allpages',
    FIX_GROUPS: '/api/v2/FixGroups/Application/${appId}?applyPolicies=All&%24inlinecount=allpages',
    SUBSCRIPTION_INFO: '/api/V2/Account/TenantInfo',
    DAST_SCAN_DATA: '/api/v2/Scans/DynamicAnalyzer/${scanId}',
    SAST_SCAN_DATA: '/api/v2/Scans/StaticAnalyzer/${scanId}',
    SCAN_EXECUTION_DATA: '/api/v2/Issues/ScanExecution/${executionId}?applyPolicies=Select&$skip=0&$orderby=IssueType%20asc&$select=ApplicationId,Severity,Status,IssueType,DateCreated,IssueTypeGuid,Location,FixGroupId,LastFound,LastUpdated,Cve,Id&$inlinecount=allPages',
    SCAN_EXECUTION_COUNT: '/api/v2/Scans/${scanId}/Executions',
}

module.exports = constants;