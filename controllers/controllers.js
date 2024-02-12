const authService = require('../services/authService');
const service = require('../services/service');
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
        logger.error(err.message);
        res.status(400).json({ 'message': err.message })
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
        let currYear = new Date().getFullYear();
        let currMonth = new Date().getMonth() + 1;
        let createTable = await queries.createApplicationTable(dbConnection);
        let createApplicationTrend = await queries.createApplicationTrendTable(dbConnection);
        let createCodeQualityTable = await queries.createPolicyTrendTable(dbConnection);
        const result = await service.getApplicationList(appscanToken);
        const scanResult = await service.getScanList(appscanToken);
        let applicationTableData = await queries.getAllData(dbConnection, 'applicationstatistics');
        let applicationSet = new Map();
        // CREATE A MAPPING OF LATEST SCAN DATE
        let tempScanResult = {};
        let tempScanId = {}
        let policyData = { true: 0, false: 0};
        let fixedScanCount = {}
        if (scanResult?.data.Items && scanResult?.data?.Items.length > 0) {
            scanResult?.data?.Items.forEach(item => {
                try{
                    if (!tempScanResult[item.AppId] || tempScanResult[item.AppId] < item.CreatedAt) {
                        tempScanResult[item.AppId] = item.CreatedAt;
                        tempScanId[item.AppId] = item.Id || '';
                    }
                }catch(err){
                    logger.error(err.message)
                }
            })
        }
        // UPDATE THE RESULT ARRAY WITH LATEST SCAN DATE FROM SCANRESULT
        if (result?.data?.Items && result?.data?.Items.length > 0) {
            try{
                await result?.data?.Items.forEach(item => {
                    try{
                        if (tempScanResult[item.Id] != undefined) {
                            applicationSet.set(item.Id, 'true');
                            item.lastScanDate = tempScanResult[item.Id],
                            item.lastScanId = tempScanId[item.Id]
                        }
                    }catch(err){
                        logger.error(err.message);
                    }
                })
                if (result.code === 200) {
                    let filterData = "";
                    let headerList = `(appId, appName, criticalIssues, highIssues, mediumIssues, lowIssues, businessImpact, lastUpdated, totalIssues, openIssues, informationalIssues, overallCompliance, status, lastScanId, lastScanDate, dateCreated)`;
                    result?.data?.Items.map(item => filterData += `('${item.Id}', "${item.Name}", ${item.CriticalIssues}, ${item.HighIssues}, ${item.MediumIssues}, ${item.LowIssues}, "${item.BusinessImpact}", ${convertToMySQLDateTime(item.LastUpdated)}, ${item.TotalIssues}, ${item.OpenIssues}, ${item.InformationalIssues}, '${item.OverallCompliance}', 'Open', '${item.lastScanId}', ${convertToMySQLDateTime(item.lastScanDate)}, ${convertToMySQLDateTime(item.DateCreated)} ),`);
                    result?.data?.Items.map(item => policyData[item.OverallCompliance]++)
                    let updateApplication = await queries.updateApplicationTable(dbConnection, 'applicationstatistics', headerList, filterData.slice(0, -1));
                    await result?.data?.Items.sort((a,b) => new Date(a.DateCreated) - new Date(b.DateCreated));
                    
                    //policy trend
                    let headerListPolicy = `(policy, dateAdded)`;
                    totalPolicyCount = policyData.true + policyData.false;
                    policyInPercent = policyData.true / totalPolicyCount;
                    filterData = `(${policyInPercent}, ${convertToMySQLDateTime(new Date())})`
                    let updatePolicy = await queries.updatePolicyTrendTable(dbConnection, 'policyTrend', headerListPolicy, filterData);

                    //applicationTrend
                    let headerApplication = `(dateAdded, applicationCount)`;
                    let filterApplicationData = '';
                    const monthlyCounts = {};
                    result?.data?.Items.forEach(item => {
                        try{
                            const date = new Date(item.DateCreated);
                            const yearMonth = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                        
                            // Increment the count for the specific month
                            monthlyCounts[yearMonth] = (monthlyCounts[yearMonth] || 0) + 1;
                        }catch(err){
                            logger.error(err.message);
                        }
                    });
                    const startDate = new Date('2020-01-01');
                    const endDate = new Date(`${currYear}-${currMonth}`);
                    const months = [];
                    let currentMonth = new Date(startDate);
                    let totalCount = 0;
                    while (currentMonth <= endDate) {
                        try{
                        const yearMonth = `${currentMonth.getFullYear()}-${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}`;
                        const count = monthlyCounts[yearMonth] || 0;
                        totalCount += count;
                        filterApplicationData += `('${yearMonth}', ${totalCount}),`;

                        currentMonth.setMonth(currentMonth.getMonth() + 1);
                        currentMonth.setDate(1)
                        currentMonth.setHours(0,0,0,0);
                        }catch(err){
                            logger.error(err.message);
                        }
                    }
                    try{
                        await queries.updateApplicationTrendTable(dbConnection, 'applicationtrend', headerApplication, filterApplicationData.slice(0, -1));
                        logger.info('Application Added');
                        res.send("Application Added");
                    }catch(err){
                        logger.error('Application Error :', err.message)
                    }
                }
            }catch(err){
                logger.error(err.message);
            }
        }

        let appList = [];
        await applicationTableData[0].map(async res => {
            try{
            if (applicationSet.has(res.appId) == false && res.appId != undefined) {
                appList.push({ 'appId': res.appId, 'status': 'Deleted' })
            }
            }catch(err){
                logger.error(err.message)
            }
        })
        let filterData = '';
        let headerList = `(appId, status)`;
        if (await appList.length > 0) {
            try{
                await appList.map(item => filterData += `("${item.appId}", "${item.status}"),`);
                await queries.updateApplicationStatus(dbConnection, 'applicationstatistics', headerList, filterData.slice(0, -1));
            }catch(err){
                logger.error(err.message);
            }
        }
    } catch (err) {
        logger.error(err.message);
        res.status(400).json({ 'message': err.stack })
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
        const applicationList = await queries.getApplicationData(dbConnection, 'applicationstatistics');
        const issuesList = await queries.getAllData(dbConnection, 'issuestatistics');
        let issueSet = new Map();
        let fixGroupTemp = [];
        let issueTemp = [];
        //Store Issue from db in MAP

        for(const app of applicationList[0]){
            try {
                let appId = app.appId;
                let appName = app.appName;
                const issueResult = await service.getIssueList(appscanToken, appId);
                const fixGroupResult = await service.getFixGroupList(appscanToken, appId);
                if (fixGroupResult?.data?.Items != undefined && fixGroupResult?.data?.Items.length > 0) {
                    let fixGroupList = [];
                    let filterData = "";
                    await fixGroupResult?.data?.Items.map(item => {
                        fixGroupTemp.push({ 'fixGroupId': item.Id, 'appId': item.AppId, 'appName': appName, 'fixGroupType': item.FixGroupType, 'fixLocationEnitityType': item.FixLocationEntityType, 'severity': item.Severity, 'severityValue': item.SeverityValue, 'totalIssues': item.NIssues, 'activeIssues': item.NOpenIssues, 'issueType': item.IssueType, 'issueTypeId': item.IssueTypeId, 'status': item.Status, 'file': item.File, 'libraryName': item.LibraryName, 'dateCreated': item.DateCreated, 'lastUpdated': item.LastUpdated })
                    })
                }
                if (issueResult?.data?.Items != undefined && issueResult?.data?.Items.length > 0) {
                    let issueList = [];
                    let filterData = "";
                    await issueResult?.data?.Items.map(issue => {
                        if(issue.ApplicationId && appName && issue.Status){
                        let statusUpdate = issue.Status == 'Fixed' || issue.Status == 'Passed' || issue.Status == 'Noise' ? issue.LastUpdated : null;
                        issueSet.set(issue.Id, issue.Status);
                        issueTemp.push({ 'issueId': issue.Id, 'appId': issue.ApplicationId, 'appName': appName, 'severity': issue.Severity, 'status': issue.Status, 'externalId': issue.ExternalId || null, 'dateCreated': issue.DateCreated, 'lastFound': issue.LastFound, 'lastUpdated': issue.LastUpdated, 'discoveryMethod': issue.DiscoveryMethod, 'scanName': issue.ScanName, 'issueType': `${issue.IssueType}`, 'statusUpdate': statusUpdate })
                        }
                    })

                    try {
                        let headerList = `(issueId, appId, appName, severity, status, externalId, dateCreated, lastFound, lastUpdated, discoveryMethod, scanName, issueType, statusUpdate)`;
                    } catch (err) {
                        logger.error(err.message)
                    }
                }
            }
            catch (err) {
                logger.error(err.message, app.appId)
            }                
        }

        // ADD FIX GROUP IN DB -- START
        let fixGroupFilterData = '';
        let fixGroupHeaderList = `(fixGroupId, appId, appName,fixGroupType, fixLocationEnitityType, severity, severityValue, totalIssues, activeIssues, issueType, issueTypeId, status, file, libraryName, dateCreated, lastUpdated)`;
        fixGroupTemp.map(item => fixGroupFilterData += `("${item.fixGroupId}", "${item.appId}", "${item.appName}", "${item.fixGroupType}", "${item.fixLocationEnitityType}", "${item.severity}", "${item.severityValue}", "${item.totalIssues}", "${item.activeIssues}", "${item.issueType}", "${item.issueTypeId}", "${item.status}", "${item.file}", "${item.libraryName}", ${convertToMySQLDateTime(item.dateCreated)}, ${convertToMySQLDateTime(item.lastUpdated)}),`);
        await queries.updateFixGroupTable(dbConnection, 'fixgroups', fixGroupHeaderList, fixGroupFilterData.slice(0, -1));
        // ADD FIX GROUP IN DB -- END
        // ADD ISSUE LIST IN DB START
        let issueFilterData = '';
        let issueHeaderList = `(issueId, appId, appName, severity, status, externalId, dateCreated, lastFound, lastUpdated, discoveryMethod, scanName, issueType, statusUpdate)`;
        await issueTemp.map(item => issueFilterData += `("${item.issueId}", "${item.appId}", "${item.appName}", "${item.severity}", "${item.status}", "${item.externalId}", ${convertToMySQLDateTime(item.dateCreated)}, ${convertToMySQLDateTime(item.lastFound)}, ${convertToMySQLDateTime(item.lastUpdated)}, "${item.discoveryMethod}", "${item.scanName}", '${item.issueType}', ${convertToMySQLDateTime(item.statusUpdate)}),`)
        await queries.updateIssueTable(dbConnection, 'issueStatistics', issueHeaderList, issueFilterData.slice(0, -1));
        // ADD ISSUE LIST IN DB END

        let issueList = [];
        let filterData = "";
        await issuesList[0].map(async issue => {
            try{
                if (issueSet.has(issue.issueId) == false && issue.issueId != undefined && issue.status != 'Resolved') {
                    issueList.push({ 'issueId': issue.issueId, 'status': 'Resolved', 'statusUpdate': new Date() })
                }
            }catch(err){
                logger.error(err.message)
            }
        })
        let headerList = `(issueId, status, statusUpdate)`;
        logger.info('Issues Added');
        res.status(200).json({ message: 'Issues Added' });
    } catch (err) {
        logger.error(err.message);
        res.status(400).json({ 'message': err.message })
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
        let scanTableData = await queries.getAllData(dbConnection, 'scansstatistics');
        let scanSet = new Map();

        if (scanResult?.data?.Items != undefined && scanResult?.data.Items.length > 0) {
            let scanList = [];
            let filterData = "";
            for(const scan of scanResult?.data?.Items){
                try{
                    scanSet.set(scan.Id, 'true');
                    let executionId = await service.getExecutionList(appscanToken, scan.Id);
                    let executionJSON = [];
                    if(executionId.data.length>0){
                        executionId.data.map(issueId => {
                        executionJSON.push(issueId.Id)
                        })
                    }
                    scanList.push({ 'scanId': scan.Id, 'appId': scan.AppId, 'scanName': scan.Name, 'appName': scan.AppName, 'executionId': JSON.stringify(executionJSON) || '', 'status': scan?.LatestExecution?.Status, 'totalIssues': scan?.LatestExecution?.NIssuesFound || 0, 'newIssues': scan?.LatestExecution?.NNewAppIssues || 0, 'criticalCount': scan?.LatestExecution?.NCriticalIssues || 0, 'highCount': scan?.LatestExecution?.NHighIssues || 0, 'mediumCount': scan?.LatestExecution?.NMediumIssues || 0, 'lowCount': scan?.LatestExecution?.NLowIssues || 0, 'infoCount': scan?.LatestExecution?.NInfoIssues || 0, 'newCriticalCount': scan?.LatestExecution?.NNewAppCriticalIssues || 0, 'newHighCount': scan?.LatestExecution?.NNewAppHighIssues || 0, 'newMediumCount': scan?.LatestExecution?.NNewAppMediumIssues || 0, 'newLowCount': scan?.LatestExecution?.NNewAppLowIssues || 0, 'newInfoCount': scan?.LatestExecution?.NNewAppInfoIssues || 0, 'technology': scan.Technology, 'executionProgress': scan?.LatestExecution?.ExecutionProgress, 'dateCreated': scan?.LatestExecution?.CreatedAt, 'endDate': scan?.LatestExecution?.ScanEndTime, 'lastUpdated': scan.LastModified, 'appCreated': scan.CreatedAt })
                }catch(err){
                    logger.error(err.message)
                }
            }
            let headerList = `(scanId, appId, scanName, appName, executionId, status, totalIssues, newIssues, criticalCount, highCount, mediumCount, lowCount, infoCount, newCriticalCount, newHighCount, newMediumCount, newLowCount, newInfoCount, technology, executionProgress, dateCreated, endDate, lastUpdated, appCreated)`;
            scanList.map(item => filterData += `('${item.scanId}', '${item.appId}', '${item.scanName}', '${item.appName}', '${item.executionId}', '${item.status}', '${item.totalIssues}', '${item.newIssues}', '${item.criticalCount}', '${item.highCount}','${item.mediumCount}','${item.lowCount}','${item.infoCount}', '${item.newCriticalCount}','${item.newHighCount}','${item.newMediumCount}','${item.newLowCount}','${item.newInfoCount}', '${item.technology}', '${item.executionProgress}', ${convertToMySQLDateTime(item.dateCreated)}, ${convertToMySQLDateTime(item.endDate)}, ${convertToMySQLDateTime(item.lastUpdated)}, ${convertToMySQLDateTime(item.appCreated)}),`);
            await queries.updateScanTable(dbConnection, 'ScansStatistics', headerList, filterData.slice(0, -1));
        }
        let scanList = [];
        let filterData = "";
        await scanTableData[0].map(async scan => {
            if (scanSet.has(scan.scanId) == false && scan.scanId != undefined) {
                scanList.push({ 'scanId': scan.scanId, 'status': 'Deleted' })
            }
        })
        let headerList = `(scanId, status)`;
        if (await scanList.length > 0) {
            await scanList.map(item => filterData += `("${item.scanId}", "${item.status}"),`);
            await queries.updateScanTableStatus(dbConnection, 'ScansStatistics', headerList, filterData.slice(0, -1));
        }
        logger.info('Scan Added');
        res.send('Scan Added')
    } catch (err) {
        logger.error(err.message);
        res.status(400).json({ 'message': err.message })
    }
}

methods.subscriptionInfo = async (req, res) => {
    if (!req.token) {
        logger.error('Authentication Error: Missing Token');
        res.status(400).send('Authentication Error: Missing Token');
    }
    try {
        const appscanToken = req.token;
        let dbConnection = await db();
        let scanTable = await queries.createSubscriptionTable(dbConnection);
        let subscriptionDetails = await service.getSubscriptionInfo(appscanToken);
        let subInfo = [];
        
        let subscriptionLists = subscriptionDetails?.data?.Subscriptions;
        for(let sub of subscriptionLists){
            subInfo.push({
                'subscriptionId': sub.SubscriptionId,
                'tenantId': subscriptionDetails?.data.TenantId,
                'offeringType': sub.OfferingType,
                'scansCompleted': sub.NTakenSeats,
                'totalScan': sub.NSeats,
                'purchaseSupplier': sub.PurchaseSupplier,
                'expirationDate': sub.ExpirationDate,
                'purchaseDate': sub.PurchaseDate
            })
        }
        let filterData = '';
        let headerList = `(subscriptionId, tenantId, offeringType, scansCompleted, totalScan, purchaseSupplier, expirationDate, purchaseDate)`;
        await subInfo.map(item => filterData +=`('${item.subscriptionId}', '${item.tenantId}', '${item.offeringType}', '${item.scansCompleted}', '${item.totalScan}', '${item.purchaseSupplier}', ${convertToMySQLDateTime(item.expirationDate)}, ${convertToMySQLDateTime(item.purchaseDate)}),`);
        let sqlResponse = await queries.updateSubscriptionTable(dbConnection, 'subscriptionstatistics', headerList, filterData.slice(0, -1));
        if (sqlResponse == 'DATA ADDED') {
            logger.info("Subscription Data Added")
            res.send("Subscription Data Added")
        } else {
            logger.error("Error:" + sqlResponse);
            res.status(400).json({ 'message': sqlResponse })
        }
    } catch (err) {
        logger.error(err.message);
        res.status(400).json({ 'message': err.message })
    }
}

methods.appscanIssuesTrend = async (req, res) => {
    if (!req.token) {
        logger.error('Authentication Error: Missing Token');
        res.status(400).send('Authentication Error: Missing Token');
    }
    try {
        let fixObj = {};
        const appscanToken = req.token;
        let dbConnection = await db();
        let scanTable = await queries.createIssuesTrendTable(dbConnection);
        let result = await service.getIssueTrend(appscanToken);
        let issueDbData = await queries.getIssueData(dbConnection, 'issuestatistics');
        issueDbData[0].map(issue => {
            if (issue.status == 'Fixed' || issue.status) {
                try{
                fixObj[issue.appId]?.fixedIssues ? fixObj[issue.appId].fixedIssues += 1 : fixObj[issue.appId] = { "fixedIssues": 1 }
                }catch(err){
                    logger.error(err)
                }
            }
        })
        let filterData = "";
        if (result.code === 200) {
            let headerList = `(appId, appName, criticalIssues, highIssues, mediumIssues, lowIssues, informationalIssues, businessImpact, lastUpdated, dateCreated, dateAdded, fixedIssues, overallCompliance, openIssues, totalIssues)`;
            result.data.Items.map(item => filterData += `('${item.Id}', '${item.Name}', ${item.CriticalIssues}, ${item.HighIssues}, ${item.MediumIssues}, ${item.LowIssues}, ${item.InformationalIssues}, "${item.BusinessImpact}", ${convertToMySQLDateTime(item.LastUpdated)},  ${convertToMySQLDateTime(item.DateCreated)}, ${convertToMySQLDateTime(new Date())}, ${fixObj[item.Id]?.fixedIssues || 0}, ${item.OverallCompliance}, ${item.OpenIssues}, ${item.TotalIssues}),`)
            await queries.updateIssueTrendTable(dbConnection, 'appscanissuetrend', headerList, filterData.slice(0, -1));
            logger.info('Issues Trend Added')
            res.send("Issues Trend Added");
        }
    } catch (err) {
        logger.error(err.message, 'AppscanIssuesTrend');
        res.status(400).json({ 'message': err.message })
    }
}

methods.codequalityTrend = async (req, res) => {
    if (!req.token) {
        logger.error('Authentication Error: Missing Token');
        res.status(400).send('Authentication Error: Missing Token');
    }
    try {
        const appscanToken = req.token;
        let dbConnection = await db();
        let scanTable = await queries.createIssuesTrendTable(dbConnection);
        let result = await service.getIssueTrend(appscanToken);
        let filterData = "";
        if (result.code === 200) {
            let headerList = `(appId, appName, criticalIssues, highIssues, mediumIssues, lowIssues, informationalIssues, businessImpact, lastUpdated, dateCreated, dateAdded, openIssues, totalIssues)`;
            result?.data?.Items.map(item => filterData += `('${item.Id}', '${item.Name}', ${item.CriticalIssues}, ${item.HighIssues}, ${item.MediumIssues}, ${item.LowIssues}, ${item.InformationalIssues}, '${item.BusinessImpact}', ${convertToMySQLDateTime(item.LastUpdated)},  ${convertToMySQLDateTime(item.DateCreated)}, ${convertToMySQLDateTime(new Date())}, ${item.OpenIssues}, ${item.TotalIssues}),`);
            await queries.updateIssueTrendTable(dbConnection, 'appscanissuetrend', headerList, filterData.slice(0, -1));
            logger.info('Code Quality Data Added')
            res.send("Code Quality Data Added");
        }
    } catch (err) {
        logger.error(err.message);
        res.status(400).json({ 'message': err.message })
    }
}

methods.fixRateTrend = async (req, res) => {
    if (!req.token) {
        logger.error('Authentication Error: Missing Token');
        res.status(400).send('Authentication Error: Missing Token');
    }
    try {
        const appscanToken = req.token;
        let dbConnection = await db();
        let scanTable = await queries.createfixRateTrendTable(dbConnection);
        let applicationDbData = await queries.getApplicationData(dbConnection, 'applicationstatistics');
        let issueDbData = await queries.getAllData(dbConnection, 'issuestatistics');
        let fixObj = {};
        applicationDbData[0].map(app => {
            if (app.appId != undefined) {
                fixObj[app.appId] = { "appId": app.appId, "appName": app.appName, openIssues: app.openIssues, totalIssues: app.totalIssues, numOfDays: 0, fixStatus: 0 }
            }
        })
        issueDbData[0].map(issue => {
            const issueDate = new Date(issue.statusUpdate);
            let currYear = new Date().getFullYear();
            const issueYear = issueDate.getFullYear();
            let currMonth = new Date().getMonth() + 1;
            const issueMonth = issueDate.getMonth() + 1;
            if (issue.status == 'Fixed' || issue.status == 'Passed' || issue.status == 'Noise') {
                if (`${issueYear}-${issueMonth}` == `${currYear}-${currMonth}`) {
                    let numOfDays = (issue.statusUpdate - issue.dateCreated) / (1000 * 60 * 60 * 24);
                    fixObj[issue.appId].numOfDays += numOfDays;
                    fixObj[issue.appId].fixStatus += 1;
                }
            }
        })
        let filterData = "";
        let headerList = `(appId, appName, openIssues, totalIssues, numOfDaysToFix, fixCount, lastUpdated, lastScanDate, date)`;
        let today = new Date();
        applicationDbData[0].map(item => {
            let appId = item.appId
            filterData += `('${fixObj[appId].appId}', "${fixObj[appId].appName}", '${fixObj[appId].openIssues}', '${fixObj[appId].totalIssues}', '${fixObj[appId].numOfDays}', '${fixObj[appId].fixStatus}', ${convertToMySQLDateTime(item.lastUpdated)}, ${convertToMySQLDateTime(item.lastScanDate)}, ${convertToMySQLDateTime(today)}),`
        });
        Promise.all(await queries.updatefixRateTrendTable(dbConnection, 'fixRateTrendTable', headerList, filterData.slice(0, -1)))
        logger.info('Fix Rate Data Added')
        res.send("Fix Rate Data Added");
    } catch (err) {
        logger.error(err.message);
        res.status(400).json({ 'message': err.message })
    }
}

methods.codeQuality = async (req, res) => {
    if (!req.token) {
        logger.error('Authentication Error: Missing Token');
        res.status(400).send('Authentication Error: Missing Token');
    }
    try {
        const appscanToken = req.token;
        let dbConnection = await db();
        let createCodeQualityTable = await queries.createcodeQualityTrendTable(dbConnection);
        let scanDbData = await queries.getAllData(dbConnection, 'scansstatistics');
        let appDbData = await queries.getApplicationData(dbConnection, 'applicationstatistics');
        let scansObj = {};
        let lastScanDateObj = {}
        let applicationIdArray = {};
        let today = new Date();
        let currYear = today.getFullYear();
        let currMonth = today.getMonth() + 1;

        if (scanDbData[0] != undefined) {
            for(const scan of scanDbData[0]){
                let issueDate = new Date(scan.endDate);
                let issueYear = issueDate.getFullYear();
                let issueMonth = issueDate.getMonth() + 1;
                try{    
                    if(`${issueYear}-${issueMonth}` == `${currYear}-${currMonth}` && scan.status != 'Deleted'){
                        if (scan.technology == 'StaticAnalyzer') {
                            let sastData = await service.getScansData(appscanToken, scan.scanId, 'SAST');
                            scansObj[scan.scanId] = sastData?.data?.LatestExecution?.NTotalLines || 0;
                        } else if (scan.technology == 'DynamicAnalyzer') {
                            let dastData = await service.getScansData(appscanToken, scan.scanId, 'DAST');
                            scansObj[scan.scanId] = dastData?.data?.LatestExecution?.NTestedEntities || 0;
                        } else {
                            scansObj[scan.scanId] = 0;
                        }
                    }
                }catch(err){
                    logger.error(err.message)
                }        
            }
            let filterData = "";
            let headerList = `(scanId, appName, appId, issuesCount, criticalIssue, highIssue, mediumIssue, lowIssue, infoIssue, executionCount, status, technology, lastScanDate, date)`;
            await scanDbData[0].map(async item => {
                if (scansObj.hasOwnProperty(item.scanId)) {
                    let scanId = item.scanId;
                    filterData += `('${scanId}', '${item.appName}', '${item.appId}', '${item.totalIssues}', '${item.criticalCount}','${item.highCount}','${item.mediumCount}','${item.lowCount}','${item.infoCount}','${scansObj[item.scanId]}', '${item.status}', '${item.technology}', ${convertToMySQLDateTime(item.dateCreated)}, ${convertToMySQLDateTime(today)}),`
                }
            });
            if(filterData != ''){
                await queries.updatecodeQualityTable(dbConnection, 'codequalitytrend', headerList, filterData.slice(0, -1));
            }
        }
        logger.info("Code Quality Data Added");
        res.send("Code Quality Data Added");
    } catch (err) {
        logger.error(err.message);
        res.status(400).json({ 'message': err.message })
    }
}

methods.monthYear = async (req, res) => {
    if (!req.token) {
        logger.error('Authentication Error: Missing Token');
        res.status(400).send('Authentication Error: Missing Token');
    }
    try {
        let dbConnection = await db();
        let createmonthYearTable = await queries.createmonthYearTable(dbConnection);
        let headerList = `(year, month, date)`;
        let filterData = '';

        const today = new Date();
        const startDate = new Date('2020-01-01')
        const currDate = new Date(startDate);

        while(currDate <= today){
            let year = currDate.getFullYear();
            let month = currDate.getMonth() + 1;
            let lastDateOfMonth;

            if(currDate.getFullYear() === today.getFullYear() && currDate.getMonth() === today.getMonth()){
                lastDateOfMonth = today.getDate();
            }else{
                lastDateOfMonth = new Date(year, month, 0).getDate();
            }

            filterData += `(${year}, ${month}, ${lastDateOfMonth}),`
            currDate.setMonth(currDate.getMonth()+1);
        }

        await queries.updatemonthYearTable(dbConnection, 'monthyear', headerList, filterData.slice(0, -1));
        logger.info("Date Added");
        res.status(200).send("Date Added");
    } catch (err) {
        logger.error(err.message);
        res.status(400).json({ 'message': err.message })
    }
}

methods.mapIssueId = async (req, res) => {
    if (!req.token) {
        logger.error('Authentication Error: Missing Token');
        res.status(400).send('Authentication Error: Missing Token');
    }
    try {
        const appscanToken = req.token;
        let issueSet = {};
        let deletedData = []
        let dbConnection = await db();
        let scanDbData = await queries.getAllData(dbConnection, 'scansstatistics');
        if (scanDbData[0].length > 0) {
            for(const scan of scanDbData[0]){
                if (scan.executionId && scan.executionId != 'undefined' && scan.status != 'Deleted') {
                    let executionIdArray = scan.executionId;
                    for(let executionId of executionIdArray){
                        try{
                            let issueData = await service.getScanExecutionData(appscanToken, executionId);
                            if (issueData.data.Items.length > 0) {
                                issueData.data.Items.map(issue => {
                                    if (issueSet[issue.Id] == undefined) {
                                        issueSet[issue.Id] = { 'executionId': scan.executionId, 'scanId': scan.scanId, 'dateCreated': scan.endDate, 'status': scan.status };
                                        issueSet[issue.Id] = { 'scanId': scan.scanId, 'lastFound': issue.LastFound, 'status': scan.status };
                                    }
                                    else if(issueSet[issue.Id].scanId != undefined){
                                        issueSet[issue.Id].lastFound = scan.LastFound;
                                        issueSet[issue.Id].scanId = scan.scanId;
                                    }
                                })
                            }                        
                        }catch(err){
                            logger.error(err.message);
                        }
                    }
                } else if (scan.status == 'Deleted') {
                    deletedData.push({scanId: scan.scanId, status: 'Deleted'})
                }
            }
        }
        let filterData = "";
        let filterDeletedData = '';
        let headerList = `(issueId, scanId)`;
        let headerListDeleted = `(scanId, status)`;
        let issueList = []
        for (let key in issueSet) {
            if (issueSet.hasOwnProperty(key)) {
                issueList.push({ 'issueId': key, 'scanId': issueSet[key].scanId })
            }
        }
        if(await issueList.length > 0){
            issueList.map(async item => {
                filterData += `('${item.issueId}','${item.scanId}'),`
            });
            await queries.updateIssueScanId(dbConnection, 'issueStatistics', headerList, filterData.slice(0, -1));
        }
        if(await deletedData.length > 0){
            deletedData.map(async item => {
                filterDeletedData += `'${item.scanId}',`
            })
            await queries.updateDeletedIssue(dbConnection, 'issueStatistics', headerList, `(${filterDeletedData.slice(0, -1)})`);
        }
        
        logger.info("Data Updated");
        res.send("Data Updated");
    } catch (err) {
        logger.error(err.message);
        res.status(400).json({ 'message': err.message })
    }
}

module.exports = methods;