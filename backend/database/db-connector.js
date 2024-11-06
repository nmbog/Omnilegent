var mysql = require('mysql');
require("dotenv").config();

var pool = mysql.createPool({
    connectionLimit: 25, 
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
});