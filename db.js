const mysql = require('mysql2/promise');
var log4js = require("log4js");
var logger = log4js.getLogger();

const connectDB = async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_DATABASE,
            timezone: '+00:00'
        });
        return connection;
    } catch (error) {
        logger.error('Error connecting to the database:', error);
    }
}

module.exports = connectDB;