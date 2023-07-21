const express = require('express')
const router = express()
const database = require('../databases')
/*const checkAuthentication = require('./partials/checkAuthentication') 
const passport = require('passport')
const initializePassport = require('../passport-config')
initializePassport(passport,
    async(email) => await database.query(
        `SELECT *
        FROM users
        WHERE email = ?`,[email]
    ))

router.get('/',checkAuthentication.checkAuthenticated, async (req,res)=>{
    res.render("dashboard")
})
*/

router.get('/', async (req, res) => {
    res.render('dashboard')
})

module.exports = router