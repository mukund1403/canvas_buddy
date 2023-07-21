const express = require('express')
const router = express()
const database = require('../databases')
const checkAuthentication = require('./partials/checkAuthentication') 

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

router.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
  });

router.get('/',checkAuthentication.checkAuthenticated, async (req,res)=>{
    try{
        const [user] = await req.user
        const user_id = user[0].user_id
        const [subjects] = await database.query(
            `SELECT *
            FROM subjects
            WHERE user_id = ?`,[user_id]
        )
        res.render("subjects/index",{subjects:subjects})
    } catch{
        res.redirect('/')
    }
    
})


router.get('/:id',checkAuthentication.checkAuthenticated, async (req,res)=>{
    try{
        const module_code = req.params.id
        res.render("subjects/show",{module_code:module_code})
    }catch{
        res.redirect('/subjects')
    }
    
})

router.get('/:id/assignments',checkAuthentication.checkAuthenticated, async (req,res)=>{
    try{
        const [user] = await req.user
        const user_id = user[0].user_id
        const module_code = req.params.id
        let [assignments] = await database.query(
            `SELECT assignment_name, DATE_FORMAT(due_date,'%d/%m/%Y') AS formatted_date 
            FROM assignments
            WHERE user_id = ? AND module_code = ? AND completed = ?
            ORDER BY due_date`,[user_id,module_code,0]
        )
        findDaysLeft(assignments)
        res.render("subjects/assignments",{
            assignments:assignments,
            module_code:module_code,
        })
    }catch(err){
        res.redirect('/subjects')
        console.log(err)
    }
    
})

function findDaysLeft(assignments){
    assignments.forEach(assignment =>{
        let today_date = new Date()
        let year = today_date.getFullYear()
        let month= today_date.getMonth() + 1
        let day = today_date.getDate()
        
        let date_arr = assignment.formatted_date.split("/")
        let days_to_current = numberOfDays(year,month,day)
        let days_to_due = numberOfDays(parseInt(date_arr[2]),parseInt(date_arr[1]),parseInt(date_arr[0]))
        let days_left = (days_to_due - days_to_current)
        assignment['days_left'] = days_left

        if (days_left === 0) assignment['days_left_tag'] = 'Due today!'
        else if(year - parseInt(date_arr[2])> 0){
            assignment['days_left'] = -365
            assignment['days_left_tag'] = 'Past Deadline!'
        }
        else if(days_left < 0) assignment['days_left_tag'] = 'Past Deadline!'
        else assignment['days_left_tag'] = days_left
        return assignments
    })
}

function numberOfDays(year,month,day){
    
    let month_arr = [31,28,31,30,31,30,31,31,30,31,30,31]
    if (leapyear(year)) month_arr[1] = 29
    let sum = 0
    for(let i = 0; i < month-1; i++){
        sum += month_arr[i]
    }
    sum += day 
    return sum
}

function leapyear(year)
{
return (year % 100 === 0) ? (year % 400 === 0) : (year % 4 === 0);
}

module.exports = router