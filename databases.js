//get environment variables to work before commiting to github
//import mysql from 'mysql2'
const mysql = require('mysql2/promise')
//const {Pool} = require('pg')
if(process.env !== 'production'){
    require('dotenv').config()
}


const pool = mysql.createPool({
  

    /*host: process.env.host,
    username: process.env.username,
    password: process.env.password,
    database: process.env.database 
    */
    connectionLimit : 5,
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE 
    
})


/*const pool = new Pool({
    host: process.env.host,
    username: process.env.username,
    password: process.env.password,
    database: process.env.database 
})*/

module.exports = pool


  



