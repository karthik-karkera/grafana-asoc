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
app.get('/application', controller.auth, controller.applicationList, (req, res) => {
  res.send('Test')
})

app.get('/issues', controller.auth, controller.issueList, (req, res) => {
  res.send('Test')
})

app.get('/scans', controller.auth, controller.scanList, (req, res) => {
  res.send('Test')
})

//CRON JOB
const hourlyJob = new CronJob('@hourly', async function () {
  try {
    logger.info('Executing hourly cron job...');
    let application = axios.get('http://localhost:8000/application');
    let issues = axios.get('http://localhost:8000/issues');
    let scans = axios.get('http://localhost:8000/scans');
    logger.info('Hourly cron job executed.');
  } catch (error) {
    logger.error('Error in hourly cron job:', error);
  }
}, null, false, null);

app.listen(process.env.SECURE_PORT, (error) => {
  if (error) throw error;
  logger.info(`Running on ${process.env.SECURE_PORT}`);
  hourlyJob.start();
})

