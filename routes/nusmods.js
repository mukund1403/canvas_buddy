const express = require('express')
const router = express()
const database = require('../databases')
const axios = require('axios')

const checkAuthentication = require('./partials/checkAuthentication')
const bcrypt = require('bcrypt')
const passport = require('passport')
const initializePassport = require('../passport-config')

initializePassport(passport,
    async (email) => await database.query(
        `SELECT *
        FROM users
        WHERE email = ?`, [email]
    ),
    async (id) => await database.query(
        `SELECT user_id
        FROM users
        WHERE user_id = ?`, [id]
    )
)

if (typeof document !== 'undefined') {
    let modlisttemplate = document.querySelector("[mod-list-template]")
    let modListContainer = document.querySelector("[mod-list-cards-container]")
    console.log('yes')
}

router.get('/', checkAuthentication.checkAuthenticated, async (req, res) => {
    try{
        const user_id = await getUser(req)
        const [data] = await database.query(
            `SELECT module_code 
            FROM subjects 
            WHERE user_id = ?` , [user_id]
        )
        const [examData] = await database.query(
            `SELECT * 
            FROM nusmods 
            WHERE user_id = ?` , [user_id]
        )
        res.render('nusmods/exam_data', {title:'NUSMods', action:'list', examData:examData})
        
    } catch(err) {
        console.log(err)
        res.redirect('/')
    }
})

async function getUser(req){
    const [user] = await req.user
    return user[0].user_id 
};


//UNUSED
function calcExamDays() {
    const currentTime = new Date().getTime()
    const furtureDate = Date.parse(Finals)
    const timeDiff = furtureDate - currentTime
    if (timeDiff <= 0) {
        clearInterval(interval)
        console.log(moduleCode,' Exam Day!')
        return
    }

    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    console.log(`Time remaining: ${days} days, ${hours} hours, ${minutes} minutes, ${seconds} seconds`);
}

module.exports = router