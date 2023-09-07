const authService = require('../services/authService');
const service = require('../services/service');
const sql = require('msnodesqlv8')
var log4js = require("log4js");
var logger = log4js.getLogger();
const queries = require('../models/query');
const { convertToMySQLDateTime } = require('../utils/utils')
const db = require('../db');

var methods = {};

// var dbConfig = {
//     server: process.env.SERVER,
//     database: process.env.DATABASE,
//     driver: process.env.DRIVER,

//     options: {
//         trustedConnection: true
//     }
// }
// const db = sql.connect(dbConfig, (err) => {
//     console.log(dbConfig)
//     if(err) throw err;
//     console.log("Connected")
// });

// const connectionString = "server=LP1-AP-52178079\SQLEXPRESS01;Database=asoc_grafana;Trusted_Connection=Yes;Driver=msnodesqlv8";
const connectionString = "server=LP1-AP-52178079\\SQLEXPRESS01;Database=asoc_grafana;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";

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
        // logger.error(`${err.response.status} - ${err.response.data.Message}`);
        // return res.status(err.response.status).send(err.response.data.Message)
    }
}

methods.applicationList = async (req, res) => {
    if (!req.token) {
        console.log('No Token')
    }
    try {
        const appscanToken = req.token;

        let a = await db()
        let b = await queries.createApplicationTable(a);
        console.log(b)
        const result = await service.getApplicationList(appscanToken);
        const scanResult = await service.getScanList(appscanToken);

        // CREATE A MAPPING OF LATEST SCAN DATE
        let tempScanResult = {};
        scanResult.data.Items.forEach(item => {
            // console.log(item)
            if (!tempScanResult[item.AppId] || tempScanResult[item.AppId] < item.CreatedAt) {
                tempScanResult[item.AppId] = item.CreatedAt;
            }
        })
        // console.log(tempScanResult)
        // UPDATE THE RESULT ARRAY WITH LATEST SCAN DATE FROM SCANRESULT
        await result.data.Items.forEach(item => {
            if (tempScanResult[item.Id] != undefined) {
                item.lastScanDate = tempScanResult[item.Id]
            }
        })
        // console.log(result.data.Items, '1')

        let lookup = {}
        if (result.code === 200) {
            let filterData = "";
            let nameList = `(appId, appName, criticalIssues, highIssues, mediumIssues, lowIssues, businessImpact, lastUpdated, totalIssues, lastScanDate)`;
            result.data.Items.map(item => filterData += `('${item.Id}', '${item.Name}', ${item.CriticalIssues}, ${item.HighIssues}, ${item.MediumIssues}, ${item.LowIssues}, '${item.BusinessImpact}', ${convertToMySQLDateTime(item.LastUpdated)}, ${item.TotalIssues}, ${convertToMySQLDateTime(item.lastScanDate)} ),`);
            await queries.updateApplicationTable(a, 'ApplicationStatistics', nameList, filterData.slice(0, -1));
            res.send("Application Added");
        }
    } catch (err) {
        // logger.error(`${err}`);
        console.log(err)
        // return res.status(err.response.status).send(err.response.data.Message);
    }
}

methods.issueList = async (req, res) => {
    if (!req.token) {
        console.log('No Token')
    }
    try {
        const appscanToken = req.token;
        let a = await db()
        let createIssueTable = await queries.createIssueTable(a);
        const applicationList = await queries.getAllData('ApplicationStatistics');
        if (applicationList != undefined) {
            applicationList.map(async app => {
                let appId = app.appId;
                const issueResult = await service.getIssueList(appscanToken, appId);
                if (issueResult?.data?.Items != undefined && issueResult?.data.Items.length > 0) {
                    let issueList = [];
                    let filterData = "";
                    issueResult?.data?.Items.map(issue => {
                        issueList.push({ 'issueId': issue.Id, 'appId': issue.ApplicationId, 'severity': issue.Severity, 'status': issue.Status, 'externalId': issue.ExternalId || null, 'dateCreated': issue.DateCreated, 'lastFound': issue.LastFound, 'lastUpdated': issue.LastUpdated, 'discoveryMethod': issue.DiscoveryMethod, 'scanName': issue.ScanName, 'issueType': issue.IssueType })
                    })
                    let nameList = `(issueId, appId, severity, status, externalId, dateCreated, lastFound, lastUpdated, discoveryMethod, scanName, issueType)`;
                    issueList.map(item => filterData += `('${item.issueId}', '${item.appId}', '${item.severity}', '${item.status}', '${item.externalId}', ${convertToMySQLDateTime(item.dateCreated)}, ${convertToMySQLDateTime(item.lastFound)}, ${convertToMySQLDateTime(item.lastUpdated)}, '${item.discoveryMethod}', '${item.scanName}', '${item.issueType}'),`);
                    await queries.updateIssueTable(a, 'IssueStatistics', nameList, filterData.slice(0, -1));
                }
            })
            res.send('Issues Added')
        }
        // const result = await service.getApplicationList(appscanToken);
        // const scanResult = await service.getScanList(appscanToken);

        // // CREATE A MAPPING OF LATEST SCAN DATE
        // let tempScanResult = {};
        // scanResult.data.Items.forEach(item => {
        //     // console.log(item)
        //     if(!tempScanResult[item.AppId] || tempScanResult[item.AppId] < item.CreatedAt){
        //         tempScanResult[item.AppId] = item.CreatedAt;
        //     }
        // })
        // // console.log(tempScanResult)
        // // UPDATE THE RESULT ARRAY WITH LATEST SCAN DATE FROM SCANRESULT
        // await result.data.Items.forEach(item => {
        //     if(tempScanResult[item.Id] != undefined){
        //         item.lastScanDate = tempScanResult[item.Id]
        //     }
        // })
        // // console.log(result.data.Items, '1')

        // let lookup = {}
        // if (result.code === 200) {
        //     let filterData = "";
        //     let nameList = `(appId, appName, criticalIssues, highIssues, mediumIssues, lowIssues, businessImpact, lastUpdated, totalIssues, lastScanDate)`;
        //     result.data.Items.map(item => filterData += `('${item.Id}', '${item.Name}', ${item.CriticalIssues}, ${item.HighIssues}, ${item.MediumIssues}, ${item.LowIssues}, '${item.BusinessImpact}', '${convertToMySQLDateTime(item.LastUpdated)}', ${item.TotalIssues}, '${convertToMySQLDateTime(item.lastScanDate)}' ),`);
        //     await queries.updateApplicationTable('ApplicationStatistics', nameList, filterData.slice(0, -1));
        // }
    } catch (err) {
        // logger.error(`${err}`);
        console.log(err)
        // return res.status(err.response.status).send(err.response.data.Message);
    }
}


module.exports = methods;