var log4js = require("log4js");
var logger = log4js.getLogger();

const queries = {
    createApplicationTable: async (sql) => {
        try {
            const query = `CREATE TABLE IF NOT EXISTS applicationstatistics(appId VARCHAR(100) PRIMARY KEY, appName VARCHAR(200), criticalIssues INT, highIssues INT, mediumIssues INT, lowIssues INT, businessImpact VARCHAR(30), dateCreated DATETIME, lastUpdated DATETIME, lastScanDate DATETIME, lastScanId VARCHAR(50), totalIssues INT, status VARCHAR(10), openIssues INT, overallCompliance VARCHAR(50), informationalIssues INT);`
            const result = await sql.query(query);
            return result;
        } catch (err) {
            throw err
        }
    },
    createIssueTable: async (sql) => {
        try {
            const query = `CREATE TABLE IF NOT EXISTS issuestatistics(issueId VARCHAR(50) PRIMARY KEY, appId VARCHAR(100), scanId VARCHAR(100), appName VARCHAR(200), severity VARCHAR(50), status VARCHAR(50), externalId VARCHAR(100), dateCreated DATETIME, lastFound DATETIME, lastUpdated DATETIME, discoveryMethod VARCHAR(1000), scanName VARCHAR(100), issueType VARCHAR(200), statusUpdate DATETIME)`;
            const result = await sql.query(query);
            return result;
        } catch (err) {
            throw err
        }
    },
    createFixGroupsTable: async (sql) => {
        try {
            const query = `CREATE TABLE IF NOT EXISTS fixgroups(fixGroupId VARCHAR(50) PRIMARY KEY, appId VARCHAR(50), appName VARCHAR(200), fixGroupType VARCHAR(255), fixLocationEnitityType VARCHAR(100), severity VARCHAR(30), severityValue INT, totalIssues INT, activeIssues INT, issueType VARCHAR(255), issueTypeId VARCHAR(100), status VARCHAR(30), file VARCHAR(255), libraryName VARCHAR(15000), dateCreated DATETIME, lastUpdated DATETIME )`;
            const result = await sql.query(query);
            return result;
        } catch (err) {
            throw err
        }
    },
    createScanTable: async (sql) => {
        try {
            const query = `CREATE TABLE IF NOT EXISTS scansstatistics(scanId VARCHAR(50) PRIMARY KEY, appId VARCHAR(100), appName VARCHAR(200), executionId JSON, scanName VARCHAR(100), status VARCHAR(50), totalIssues INT, newIssues INT, criticalCount INT, highCount INT, mediumCount INT, lowCount INT, infoCount INT, newCriticalCount INT, newHighCount INT, newMediumCount INT, newLowCount INT, newInfoCount INT, technology VARCHAR(30), executionProgress VARCHAR(30), dateCreated DATETIME, endDate DATETIME, lastUpdated DATETIME, appCreated DATETIME)`;
            const result = await sql.query(query);
            return result;
        } catch (err) {
            throw err
        }
    },
    createSubscriptionTable: async (sql) => {
        try {
            const query = `CREATE TABLE IF NOT EXISTS subscriptionstatistics(subscriptionId VARCHAR(50) PRIMARY KEY, tenantId VARCHAR(50), offeringType VARCHAR(50), scansCompleted INT, totalScan INT, purchaseSupplier VARCHAR(50), expirationDate DATETIME, purchaseDate DATETIME)`;
            const result = await sql.query(query);
            return result;
        } catch (err) {
            throw err
        }
    },
    createIssuesTrendTable: async (sql) => {
        try {
            const query = `CREATE TABLE IF NOT EXISTS appscanissuetrend(appId VARCHAR(100), appName VARCHAR(200), criticalIssues INT, highIssues INT, mediumIssues INT, lowIssues INT, informationalIssues INT, businessImpact VARCHAR(30), dateCreated DATETIME, lastUpdated DATETIME, dateAdded DATE, fixedIssues INT, openIssues INT, overallCompliance VARCHAR(50), totalIssues INT, PRIMARY KEY(appId, dateAdded))`
            const result = await sql.query(query);
            return result;
        } catch (err) {
            throw err
        }
    },
    createfixRateTrendTable: async (sql) => {
        try {
            const query = `CREATE TABLE IF NOT EXISTS fixRateTrendTable(appId VARCHAR(100), appName VARCHAR(200), openIssues INT, totalIssues INT, numOfDaysToFix FLOAT, fixCount INT, lastUpdated DATETIME, lastScanDate DATETIME, date DATE, PRIMARY KEY(appId, date))`
            const result = await sql.query(query);
            return result;
        } catch (err) {
            throw err
        }
    },
    createcodeQualityTrendTable: async (sql) => {
        try {
            const query = `CREATE TABLE IF NOT EXISTS codeQualityTrend(scanId VARCHAR(100), appName VARCHAR(200), appId VARCHAR(50), issuesCount INT, criticalIssue INT, highIssue INT, mediumIssue INT, lowIssue INT, infoIssue INT, executionCount INT, technology VARCHAR(50), status VARCHAR(30), lastScanDate DATETIME, date DATE, PRIMARY KEY(scanId, date))`
            const result = await sql.query(query);
            return result;
        } catch (err) {
            throw err
        }
    },
    createmonthYearTable: async (sql) => {
        try {
            const query = `CREATE TABLE IF NOT EXISTS monthyear(year INT, month INT, date INT, PRIMARY KEY(year, month))`
            const result = await sql.query(query);
            return result;
        } catch (err) {
            throw err
        }
    },
    createPolicyTrendTable: async (sql) => {
        try {
            const query = `CREATE TABLE IF NOT EXISTS policyTrend(policy VARCHAR(30), dateAdded DATE, PRIMARY KEY(policy, dateAdded))`
            const result = await sql.query(query);
            return result;
        } catch (err) {
            throw err
        }
    },
    createApplicationTrendTable: async (sql) => {
        try {
            const query = `CREATE TABLE IF NOT EXISTS applicationtrend(applicationCount INT, dateAdded VARCHAR(30), PRIMARY KEY(dateAdded))`
            const result = await sql.query(query);
            return result;
        } catch (err) {
            throw err
        }
    },
    updateApplicationTable: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList}
            VALUES ${DataList}
            ON DUPLICATE KEY UPDATE
                informationalIssues = VALUES(informationalIssues),
                appName = VALUES(appName),
                criticalIssues = VALUES(criticalIssues), 
                highIssues = VALUES(highIssues), 
                mediumIssues = VALUES(mediumIssues), 
                lowIssues = VALUES(lowIssues), 
                businessImpact = VALUES(businessImpact), 
                lastUpdated = VALUES(lastUpdated), 
                totalIssues = VALUES(totalIssues), 
                openIssues = VALUES(openIssues),
                overallCompliance = VALUES(overallCompliance),
                lastScanId = VALUES(lastScanId),
                status = VALUES(status),
                lastScanDate = VALUES(lastScanDate)`
            const result = await sql.query(query)
            return result
        } catch (err) {
            throw err
        }
    },
    updateApplicationStatus: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList}
            VALUES ${DataList}
            ON DUPLICATE KEY UPDATE
                status = VALUES(status)`
            const result = await sql.query(query)
            return result
        } catch (err) {
            throw err
        }
    },
    updateApplicationTrendTable: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList}
            VALUES ${DataList}
            ON DUPLICATE KEY UPDATE
                applicationCount = VALUES(applicationCount)`
            const result = await sql.query(query)
            return result
        } catch (err) {
            throw err
        }
    },
    updateIssueTable: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList}
                VALUES ${DataList}
                ON DUPLICATE KEY UPDATE
                externalId = VALUES(externalId), 
                lastUpdated = VALUES(lastUpdated),
                lastFound = VALUES(lastFound),
                dateCreated = VALUES(dateCreated),
                severity = VALUES(severity),
                statusUpdate = CASE WHEN VALUES(status) IN ('Fixed', 'Resolved') AND (status = 'Open' OR status = 'New' OR status = 'Reopened' OR status = 'Noise' OR status = 'InProgress') THEN VALUES(statusUpdate) ELSE statusUpdate END,
                status = VALUES(status)`
            return await sql.query(query);
        } catch (err) {
            throw err
        }
    },
    updateFixGroupTable: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList} VALUES ${DataList} ON DUPLICATE KEY UPDATE lastUpdated = VALUES(lastUpdated), status = VALUES(status), totalIssues = VALUES(totalIssues), activeIssues = VALUES(activeIssues)`
            return await sql.query(query)
        } catch (err) {
            throw err
        }
    },
    updateScanTable: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList}
                VALUES ${DataList}
                ON DUPLICATE KEY UPDATE
                lastUpdated = VALUES(lastUpdated),
                executionId = VALUES(executionId),
                totalIssues = VALUES(totalIssues),
                newIssues = VALUES(newIssues),
                criticalCount = VALUES(criticalCount), 
                highCount = VALUES(highCount), 
                mediumCount = VALUES(mediumCount), 
                lowCount = VALUES(lowCount), 
                infoCount = VALUES(infoCount), 
                newCriticalCount = VALUES(newCriticalCount), 
                newHighCount = VALUES(newHighCount), 
                newMediumCount = VALUES(newMediumCount), 
                newLowCount = VALUES(newLowCount), 
                newInfoCount = VALUES(newInfoCount), 
                technology = VALUES(technology), 
                executionProgress = VALUES(executionProgress),
                status = VALUES(status)`
            await sql.query(query)
        } catch (err) {
            throw err;
        }
    },
    updateScanTableStatus: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList}
                VALUES ${DataList}
                ON DUPLICATE KEY UPDATE
                lastUpdated = VALUES(lastUpdated),
                status = VALUES(status)`
            await sql.query(query)
        } catch (err) {
            throw err;
        }
    },
    updateSubscriptionTable: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList}
            VALUES ${DataList}
            ON DUPLICATE KEY UPDATE
                scansCompleted = VALUES(scansCompleted), 
                totalScan = VALUES(totalScan), 
                expirationDate = VALUES(expirationDate), 
                purchaseDate = VALUES(purchaseDate)`
            await sql.query(query)
            return "DATA ADDED"
        } catch (err) {
            throw err;
        }
    },
    updateIssueTrendTable: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList}
            VALUES ${DataList}
            ON DUPLICATE KEY UPDATE
                lowIssues = VALUES(lowIssues),
                mediumIssues = VALUES(mediumIssues),
                highIssues = VALUES(highIssues),
                dateCreated = VALUES(dateCreated),
                criticalIssues = VALUES(criticalIssues),
                informationalIssues = VALUES(informationalIssues),
                totalIssues = VALUES(totalIssues),
                openIssues = VALUES(openIssues),
                fixedIssues = VALUES(fixedIssues),
                overallCompliance = VALUES(overallCompliance),
                lastUpdated = VALUES(lastUpdated)`
            return sql.query(query)
        } catch (err) {
            throw err;
        }
    },
    updatefixRateTrendTable: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList}
            VALUES ${DataList}
            ON DUPLICATE KEY UPDATE
            openIssues = VALUES(openIssues),
            totalIssues = VALUES(totalIssues),
            lastUpdated = VALUES(lastUpdated),
            lastScanDate = VALUES(lastScanDate),
            fixCount = VALUES(fixCount),
            numOfDaysToFix = VALUES(numOfDaysToFix)`
            return sql.query(query)
        } catch (err) {
            throw err;
        }
    },
    updatecodeQualityTable: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList}
            VALUES ${DataList}
            ON DUPLICATE KEY UPDATE
                executionCount = VALUES(executionCount),
                lastScanDate = VALUES(lastScanDate),
                issuesCount = VALUES(issuesCount),
                lowIssue = VALUES(lowIssue),
                mediumIssue = VALUES(mediumIssue),
                highIssue = VALUES(highIssue),
                criticalIssue = VALUES(criticalIssue)`
            return await sql.query(query)
        } catch (err) {
            throw err;
        }
    },
    updatemonthYearTable: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList}
            VALUES ${DataList}
            ON DUPLICATE KEY UPDATE
                date = VALUES(date)`
            return await sql.query(query)
        } catch (err) {
            throw err;
        }
    },
    getAllData: async (sql, tableName) => {
        try {
            const query = `SELECT * FROM ${tableName}`;
            return sql.query(query)
        }
        catch (err) {
            throw err;
        }
    },
    getApplicationData: async (sql, tableName) => {
        try {
            const query = `SELECT * FROM ${tableName} WHERE status='Open'`;
            return sql.query(query)
        }
        catch (err) {
            throw err;
        }
    },
    getIssueData: async (sql, tableName) => {
        try {
            const query = `SELECT * FROM ${tableName} WHERE status='Fixed'`;
            return sql.query(query)
        }
        catch (err) {
            throw err;
        }
    },
    updateIssueScanId: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList}
            VALUES ${DataList}
            ON DUPLICATE KEY UPDATE
                scanId = VALUES(scanId)`;
            return sql.query(query)
        }
        catch (err) {
            throw err;
        }
    },
    updatePolicyTrendTable: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `INSERT INTO ${tableName} ${NameList}
            VALUES ${DataList}
            ON DUPLICATE KEY UPDATE
                policy = VALUES(policy)`;
            return sql.query(query)
        }
        catch (err) {
            throw err;
        }
    },
    updateDeletedIssue: async (sql, tableName, NameList, DataList) => {
        try {
            const query = `UPDATE ${tableName} SET status = 'Deleted' WHERE scanId IN ${DataList}`;
            return sql.query(query)
        }
        catch (err) {
            throw err;
        }
    },
};

module.exports = queries;