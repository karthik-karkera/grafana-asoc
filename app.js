const express = require('express');
require('dotenv').config();
var log4js = require("log4js");
var logger = log4js.getLogger();
var os = require("os");
const app = express();
const axios = require('axios');
var CronJob = require('cron').CronJob;


app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const controller = require('./controllers/controllers')

// LOGGER CONFIGURATION
log4js.configure({
  appenders: {
    out: { type: 'stdout' },
    app: { type: 'file', filename: process.env.APP_LOG, "numBackups": process.env.NUMBER_OF_BACKUPS }
  },
  categories: {
    default: { appenders: ['out', 'app'], level: 'all' }
  }
});

// ALL APIs
app.get('/application', controller.auth, controller.applicationList)
app.get('/issues', controller.auth, controller.issueList)
app.get('/scans', controller.auth, controller.scanList)
app.get('/subscriptionInfo', controller.auth, controller.subscriptionInfo)
app.get('/appscanIssuesTrend', controller.auth, controller.appscanIssuesTrend)
app.get('/codequalityTrend', controller.auth, controller.codequalityTrend)
app.get('/fixRateTrend', controller.auth, controller.fixRateTrend)
app.get('/codeQuality', controller.auth, controller.codeQuality)
app.get('/day', controller.auth, controller.monthYear)
app.get('/mapIssueId', controller.auth, controller.mapIssueId)

// Function to execute the API calls
const executeApiCalls = async () => {
  try {
    logger.info('Executing hourly cron job...');
    await axios.get('http://localhost:8000/day');
    await axios.get('http://localhost:8000/application');
    await axios.get('http://localhost:8000/issues');
    await axios.get('http://localhost:8000/scans');
    await axios.get('http://localhost:8000/subscriptionInfo');
    await axios.get('http://localhost:8000/appscanIssuesTrend');
    await axios.get('http://localhost:8000/fixRateTrend');
    await axios.get('http://localhost:8000/codeQuality');
    await axios.get('http://localhost:8000/mapIssueId');
    logger.info('Hourly cron job executed.');
  } catch (error) {
    logger.error('Error in hourly cron job:', error.message);
  }
}

const hourlyJob = new CronJob('0 * * * *', executeApiCalls , null, false, null);

executeApiCalls();

app.listen(process.env.SECURE_PORT, (error) => {
  if (error) throw error;
  logger.info(`Running on ${process.env.SECURE_PORT}`);
  hourlyJob.start();
})

