const authService = require('../services/authService');
const service = require('../services/service');
const sql = require('msnodesqlv8')
var log4js = require("log4js");
var logger = log4js.getLogger();
const queries = require('../models/query');
const { convertToMySQLDateTime } = require('../utils/utils')
const db = require('../db');

var methods = {};

methods.auth = async (req, res, next) => {
    try {
        if (!process.env.keyId || !process.env.keySecret) {
            logger.error('Unauthorized - Missing KeyId or KeySecret')
            return res.status(401).send(`Unauthorized - Missing KeyId or KeySecret`)
        }
        var inputData = {};
        inputData["keyId"] = process.env.keyId;
        inputData["keySecret"] = process.env.keySecret;
        const result = await authService.login(inputData);
        req.token = result.data.Token;
        next();
    } catch (err) {
        logger.error(err)
    }
}

// APPLICATON TABLE
methods.applicationList = async (req, res) => {
    if (!req.token) {
        logger.error('Authentication Error: Missing Token');
        res.status(400).send('Authentication Error: Missing Token');
    }
    try {
        const appscanToken = req.token;
        let dbConnection = await db();
        let createTable = await queries.createApplicationTable(dbConnection);
        const result = await service.getApplicationList(appscanToken);
        const scanResult = await service.getScanList(appscanToken);
        // CREATE A MAPPING OF LATEST SCAN DATE
        let tempScanResult = {};
        scanResult.data.Items.forEach(item => {
            if (!tempScanResult[item.AppId] || tempScanResult[item.AppId] < item.CreatedAt) {
                tempScanResult[item.AppId] = item.CreatedAt;
            }
        })
        // UPDATE THE RESULT ARRAY WITH LATEST SCAN DATE FROM SCANRESULT
        await result.data.Items.forEach(item => {
            if (tempScanResult[item.Id] != undefined) {
                item.lastScanDate = tempScanResult[item.Id]
            }
        })

        if (result.code === 200) {
            let filterData = "";
            let headerList = `(appId, appName, criticalIssues, highIssues, mediumIssues, lowIssues, businessImpact, lastUpdated, totalIssues, lastScanDate, dateCreated)`;
            result.data.Items.map(item => filterData += `('${item.Id}', '${item.Name}', ${item.CriticalIssues}, ${item.HighIssues}, ${item.MediumIssues}, ${item.LowIssues}, '${item.BusinessImpact}', ${convertToMySQLDateTime(item.LastUpdated)}, ${item.TotalIssues}, ${convertToMySQLDateTime(item.lastScanDate)}, ${convertToMySQLDateTime(item.DateCreated)} ),`);
            await queries.updateApplicationTable(dbConnection, 'ApplicationStatistics', headerList, filterData.slice(0, -1));
            logger.info('Application Added')
            res.send("Application Added");
        }
    } catch (err) {
        logger.error(err);
    }
}

// ISSUE TABLE
methods.issueList = async (req, res) => {
    if (!req.token) {
        logger.error('Authentication Error: Missing Token');
        res.status(400).send('Authentication Error: Missing Token');
    }
    try {
        const appscanToken = req.token;
        let dbConnection = await db();
        let createIssueTable = await queries.createIssueTable(dbConnection);
        let createFixGroupTable = await queries.createFixGroupsTable(dbConnection);
        const applicationList = await queries.getAllData('ApplicationStatistics');
        if (applicationList != undefined) {
            applicationList.map(async app => {
                let appId = app.appId;
                let appName = app.appName
                const issueResult = await service.getIssueList(appscanToken, appId);
                const fixGroupResult = await service.getFixGroupList(appscanToken, appId);
                if (fixGroupResult?.data.Items != undefined && fixGroupResult?.data.Items.length > 0) {
                    let fixGroupList = [];
                    let filterData = "";
                    fixGroupResult?.data?.Items.map(item => {
                        fixGroupList.push({ 'fixGroupId': item.Id, 'appId': item.AppId, 'appName': appName, 'fixGroupType': item.FixGroupType, 'fixLocationEnitityType': item.FixLocationEntityType, 'severity': item.Severity, 'severityValue': item.SeverityValue, 'totalIssues': item.NIssues, 'activeIssues': item.NOpenIssues, 'issueType': item.IssueType, 'issueTypeId': item.IssueTypeId, 'status': item.Status, 'file': item.File, 'libraryName': item.LibraryName, 'dateCreated': item.DateCreated, 'lastUpdated': item.LastUpdated })
                    })
                    let headerList = `(fixGroupId, appId, appName,fixGroupType, fixLocationEnitityType, severity, severityValue, totalIssues, activeIssues, issueType, issueTypeId, status, file, libraryName, dateCreated, lastUpdated)`;
                    fixGroupList.map(item => filterData += `('${item.fixGroupId}', '${item.appId}', '${item.appName}', '${item.fixGroupType}', '${item.fixLocationEnitityType}', '${item.severity}', '${item.severityValue}', '${item.totalIssues}', '${item.activeIssues}', '${item.issueType}', '${item.issueTypeId}', '${item.status}', '${item.file}', '${item.libraryName}', ${convertToMySQLDateTime(item.dateCreated)}, ${convertToMySQLDateTime(item.lastUpdated)}),`);
                    await queries.updateFixGroupTable(dbConnection, 'fixgroups', headerList, filterData.slice(0, -1));
                }
                if (issueResult?.data?.Items != undefined && issueResult?.data.Items.length > 0) {
                    let issueList = [];
                    let filterData = "";
                    issueResult?.data?.Items.map(issue => {
                        issueList.push({ 'issueId': issue.Id, 'appId': issue.ApplicationId, 'appName': appName, 'severity': issue.Severity, 'status': issue.Status, 'externalId': issue.ExternalId || null, 'dateCreated': issue.DateCreated, 'lastFound': issue.LastFound, 'lastUpdated': issue.LastUpdated, 'discoveryMethod': issue.DiscoveryMethod, 'scanName': issue.ScanName, 'issueType': issue.IssueType })
                    })
                    let headerList = `(issueId, appId, appName, severity, status, externalId, dateCreated, lastFound, lastUpdated, discoveryMethod, scanName, issueType)`;
                    issueList.map(item => filterData += `('${item.issueId}', '${item.appId}', '${item.appName}', '${item.severity}', '${item.status}', '${item.externalId}', ${convertToMySQLDateTime(item.dateCreated)}, ${convertToMySQLDateTime(item.lastFound)}, ${convertToMySQLDateTime(item.lastUpdated)}, '${item.discoveryMethod}', '${item.scanName}', '${item.issueType}'),`);
                    await queries.updateIssueTable(dbConnection, 'issueStatistics', headerList, filterData.slice(0, -1));
                }
            })
            logger.info('Issues Added')
            res.send('Issues Added')
        }
    } catch (err) {
        logger.error(err);
    }
}

// SCAN TABLE
methods.scanList = async (req, res) => {
    if (!req.token) {
        logger.error('Authentication Error: Missing Token');
        res.status(400).send('Authentication Error: Missing Token');
    }
    try {
        const appscanToken = req.token;
        let dbConnection = await db();
        let scanTable = await queries.createScanTable(dbConnection);
        const scanResult = await service.getScanList(appscanToken);
        if (scanResult?.data?.Items != undefined && scanResult?.data.Items.length > 0) {
            let scanList = [];
            let filterData = "";
            scanResult?.data?.Items.map(scan => {
                scanList.push({ 'scanId': scan.Id, 'appId': scan.AppId, 'scanName': scan.Name, 'appName': scan.AppName, 'status': scan?.LatestExecution?.Status, 'technology': scan.Technology, 'executionProgress': scan?.LatestExecution.ExecutionProgress, 'dateCreated': scan.LatestExecution.CreatedAt, 'lastUpdated': scan.LastModified, 'appCreated': scan.CreatedAt })
            })
            let headerList = `(scanId, appId, scanName, appName, status, technology, executionProgress, dateCreated, lastUpdated, appCreated)`;
            scanList.map(item => filterData += `('${item.scanId}', '${item.appId}', '${item.scanName}', '${item.appName}', '${item.status}', '${item.technology}', '${item.executionProgress}', ${convertToMySQLDateTime(item.dateCreated)}, ${convertToMySQLDateTime(item.lastUpdated)}, ${convertToMySQLDateTime(item.appCreated)}),`);
            await queries.updateScanTable(dbConnection, 'ScansStatistics', headerList, filterData.slice(0, -1));
        }
        logger.info('Scan Added');
        res.send('Scan Added')
    } catch (err) {
        logger.error(err)
    }
}

module.exports = methods;