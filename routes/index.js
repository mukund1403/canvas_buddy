const express = require('express')
const router = express()
const database = require('../databases')

const checkAuthentication = require('./partials/checkAuthentication')  

const passport = require('passport')
const initializePassport = require('../passport-config')
initializePassport(passport,
    async(email) => await database.query(
        `SELECT *
        FROM users
        WHERE email = ?`,[email]
    ))

router.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
  });

router.get('/',checkAuthentication.checkAuthenticated, async (req,res)=>{
    var loggedIn = null
    loggedIn = req.query.loggedIn
    if(typeof loggedIn !== 'undefined'){
        const user_id = await getUser(req)
        let today_date = new Date()
        if(await updateRequired(user_id,today_date)){
            const token = await getToken(user_id)
            const deletedSubjects = await deleteSubjects(user_id)
            const deletedAssignments = await deleteAssignments(user_id)
            const updatedAPIDate = await updateAPIDate(user_id,today_date)
            const courses = await fetchCourses(user_id, token, res)
        }   
    }
    res.render("dashboard")
})
*/

async function updateRequired(user_id, today_date){
    let [last_login] = await database.query(
        `SELECT login_date
        FROM users
        WHERE user_id = ?`,[user_id]
    )

    let today_year = today_date.getFullYear()
    let today_month= today_date.getMonth() + 1
    let today_day = today_date.getDate()
    date_arr = last_login[0].login_date.split("-")
    let login_year = parseInt(date_arr[0])
    let login_month = parseInt(date_arr[1])
    let login_day = parseInt(date_arr[2])

    if(((today_year - login_year) > 0) 
    || ((today_month - login_month) > 0) 
    || ((today_day - login_day) > 0)){
        return true
    }
    
    return false   
}

async function updateAPIDate(user_id,today_date){
    const updated_date = today_date.toISOString().split("T")[0]
    const response = await database.query(
        `UPDATE users
        SET login_date = ?
        WHERE user_id = ?`,[updated_date,user_id]
    )
}

async function deleteSubjects(user_id){
    const response = await database.query(
        `DELETE FROM subjects
        WHERE user_id = ?`,[user_id]
    )
}

async function deleteAssignments(user_id){
    const response = await database.query(
        `DELETE FROM assignments
        WHERE user_id = ?`,[user_id]
    )
}


async function getUser(req){
    const [user] = await req.user
    return user[0].user_id 
}

async function getToken(user_id){
    const [token] = await database.query(
        `SELECT token
        FROM users
        WHERE user_id = ?`,[user_id]
    )
    return token[0].token
}

async function fetchCourses(user_id, access_token,res) {
    let url = `https://canvas.nus.edu.sg/api/v1/courses?access_token=${access_token}`
    fetch(url)
        .then(res => res.json())
        .then(data => {
            let subjects = data
            try {
                subjects.forEach(subject => {
                    if (subject.course_code && subject.name) {

                        addSubjectToDb(subject.id, subject.name, subject.course_code, user_id)
                        url = `https://canvas.nus.edu.sg/api/v1/courses/${subject.id}/assignments?access_token=${access_token}`
                        fetch(url)
                            .then(res => res.json())
                            .then(data => {
                                const assignments = data
                                assignments.forEach(assignment => {
                                    if (assignment.name && assignment.due_at) {
                                        database.query(
                                            `SELECT module_code
                                            FROM subjects
                                            WHERE id = ?`, [assignment.course_id])
                                            .then(res => res)
                                            .then(data => {
                                                const module_code = data[0][0].module_code
                                                const due_date = convertDateFormat(assignment.due_at)
                                                addAssignmentToDb(assignment.id, module_code, assignment.name, due_date, assignment.has_submitted_submissions, user_id)
                                                console.log('assignment added')
                                            })

                                    }
                                })

                            })
                    }

                })


            } catch (err) {
                const response = deleteFromDb()
                console.log('Incorrect token')
                var string = encodeURIComponent('Incorrect token');
                res.redirect('/register?errorMessage=' + string)
            }
        })
    
    
    async function addSubjectToDb(id,name,module_code,user_id){
            const response = await database.query(
                `INSERT INTO subjects(id,module_code,name,user_id)
                VALUES(?,?,?,?)`,[id,module_code,name,user_id]
            )
        
    }
    async function addAssignmentToDb(id,module_code,assignment_name,due_date,completed,user_id){
        const response = await database.query(
            `INSERT INTO assignments
            VALUES(?,?,?,?,?,?)`,[id,module_code,assignment_name,due_date,completed,user_id]
        )
    }

    function convertDateFormat(date){
        let date_arr = date.split("T")
        return date_arr[0]
    }
    async function deleteFromDb(){
        const response = await database.query(
            `DELETE FROM users
            WHERE user_id = ?`,[user_id]
        )
    }
}


module.exports = router