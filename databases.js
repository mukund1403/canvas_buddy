//get environment variables to work before commiting to github
//import mysql from 'mysql2'
const mysql = require('mysql2/promise')
require('dotenv').config()


const pool = mysql.createPool({
    /*host: '127.0.0.1', //process.env.MYSQL_HOST,
    user: 'root', //process.env.MYSQL_USER,
    password: 'doctoraprao14', //process.env.MYSQL_PASSWORD,
    database: 'orbital', //process.env.MYSQL_DATABASE */

    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE 
})

module.exports = pool


  



