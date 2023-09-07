const express = require('express');
require('dotenv').config();
var log4js = require("log4js");
var logger = log4js.getLogger();
var os = require("os");
const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: false}));

const controller = require('./controllers/controllers')

// LOGGER CONFIGURATION
log4js.configure({
    appenders: {
      out: { type: 'stdout' },
      app: { type: 'file', filename: process.env.APP_LOG, "numBackups": process.env.NUMBER_OF_BACKUPS }
    },
    categories: {
      default: { appenders: [ 'out', 'app' ], level: 'all' }
    }
});


// ALL APIs


app.get('/application', controller.auth, controller.applicationList, (req, res) => {
  res.send('Test')
})

app.get('/scans', controller.auth, controller.issueList, (req, res) => {
  res.send('Test')
})

app.listen(process.env.SECURE_PORT, (error) => {
    if(error) throw error;
    console.log(`Running on ${process.env.SECURE_PORT}`);
    logger.info(`Running on ${process.env.SECURE_PORT}`)
})

