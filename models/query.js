const sql = require("msnodesqlv8");
// const sql = require('mssql');
var log4js = require("log4js");
var logger = log4js.getLogger();

const connectionString = "server=LP1-AP-52178079\\SQLEXPRESS01;Database=asoc_grafana;Trusted_Connection=Yes;Driver={ODBC Driver 17 for SQL Server}";

const queries = {
    createApplicationTable: async () => {
        try {
            const checkTable = `SELECT OBJECT_ID('ApplicationStatistics') AS objectId`
            const query = `CREATE TABLE dbo.ApplicationStatistics(appId VARCHAR(100), appName VARCHAR(30), criticalIssues INT, highIssues INT, mediumIssues INT, lowIssues INT, businessImpact VARCHAR(10), lastUpdated DATETIME, lastScanDate DATETIME, totalIssues INT);`
            await sql.query(connectionString, checkTable, async (err, rows) => {
                if (err) console.log(err);
                else {
                    if (rows[0].objectId == null) {
                        await sql.query(connectionString, query, (err, rows) => {
                            if (err) console.log(err)
                            else {
                                logger.info('TABLE CREATED : ApplicationStatistics')     
                            }
                        })
                    } else {
                        logger.info('Table Already Exists ApplicationStatistics')
                    }
                }
            });
        } catch (err) {
            console.log(err)
        }
    },
    createIssueTable: async () => {
        try {
            const checkTable = `SELECT OBJECT_ID('IssueStatistics') AS objectId`
            const query = `CREATE TABLE dbo.IssueStatistics(issueId VARCHAR(50), appId VARCHAR(100), severity VARCHAR(50), status VARCHAR(50), externalId VARCHAR(100), dateCreated DATETIME, lastFound DATETIME, lastUpdated DATETIME, discoveryMethod VARCHAR(1000), scanName VARCHAR(100), issueType VARCHAR(200), statusUpdate DATETIME)`;
            await sql.query(connectionString, checkTable, async (err, rows) => {
                if (err) console.log(err);
                else {
                    if (rows[0].objectId == null) {
                        await sql.query(connectionString, query, (err, rows) => {
                            if (err) console.log(err)
                            else {
                                logger.info('TABLE CREATED : IssueStatistics')     
                            }
                        })
                    } else {
                        logger.info('Table Already Exists : IssueStatistics')
                    }
                }
            });
        } catch (err) {

        }
    },
    updateApplicationTable: async (tableName, NameList, DataList) => {
        try {
            const query = `MERGE INTO ${tableName} AS target
            USING (VALUES ${DataList}) AS source ${NameList}
            ON target.appId = source.appId
            WHEN MATCHED THEN
                UPDATE SET target.appId = source.appId
            WHEN NOT MATCHED THEN
                INSERT (appId, appName, criticalIssues, highIssues, mediumIssues, lowIssues, businessImpact, lastUpdated, totalIssues, lastScanDate)
                VALUES (source.appId, source.appName, source.criticalIssues, source.highIssues, source.mediumIssues, source.lowIssues, source.businessImpact, source.lastUpdated, source.totalIssues, source.lastScanDate);`

            await sql.query(connectionString, query, (err, rows) => {
                if (err) console.log(err, '///')
                else {
                    logger.info("DATA ADDED IN TABLE:" + tableName)
                }
            })


        } catch (err) {
            console.log(err)
        }
    },
    updateIssueTable: async (tableName, NameList, DataList) => {
        try {
            const query = `MERGE INTO ${tableName} AS target
            USING (VALUES ${DataList}) AS source ${NameList}
            ON target.issueId = source.issueId
            WHEN MATCHED THEN
                UPDATE SET target.lastUpdated = source.lastUpdated, target.status = CASE WHEN target.status <> source.status THEN source.status ELSE target.status END, target.statusUpdate = CASE WHEN target.status <> source.status AND source.status = 'Fixed' THEN GETDATE() ELSE target.statusUpdate END, target.severity = CASE WHEN target.severity <> source.severity THEN source.severity ELSE target.severity END 
            WHEN NOT MATCHED THEN
                INSERT (issueId, appId, severity, status, externalId, dateCreated, lastFound, lastUpdated, discoveryMethod, scanName, issueType)
                VALUES (source.issueId, source.appId, source.severity, source.status, source.externalId, source.dateCreated, source.lastFound, source.lastUpdated, source.discoveryMethod, source.scanName, source.issueType);`

            await sql.query(connectionString, query, (err, rows) => {
                if (err) console.log(err, '///')
                else {
                    logger.info("DATA ADDED IN TABLE:" + tableName)
                }
            })


        } catch (err) {
            console.log(err)
        }
    },
    getAllData: async (tableName) => {
        return new Promise((resolve, reject) => {
            const query = `SELECT * FROM ${tableName}`;
            sql.query(connectionString, query, (err, rows) => {
                if (err) {
                    logger.error(err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            })
        })
    }
};

module.exports = queries;