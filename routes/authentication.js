const express = require('express')
const router = express()
const database = require('../databases')
const checkAuthentication = require('./partials/checkAuthentication')
const bcrypt = require('bcrypt')
const passport = require('passport')


const initializePassport = require('../passport-config')

initializePassport(passport,
    async(email) =>  await database.query(
        `SELECT *
        FROM users
        WHERE email = ?`,[email]
    ),
    async(id) => await database.query(
        `SELECT user_id
        FROM users
        WHERE user_id = ?`,[id]
    )
    )

router.use((req,res,next)=>{
    req.app.set('layout','layouts/notAuthenticated')
    next()
})

router.use(function(req, res, next) {
    res.set('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0');
    next();
  });

router.get('/',
//checkAuthentication.checkNotAuthenticated,
(req,res)=>{
    res.render('authentication/login') 
})

router.get('/register',
checkAuthentication.checkNotAuthenticated,
(req,res)=>{
    const errorMessage = req.query.errorMessage
    res.render('authentication/register',{errorMessage:errorMessage}) 
})

router.get('/generateToken',checkAuthentication.checkNotAuthenticated,(req,res)=>{
    res.render('authentication/generateToken')
})

router.post('/register', 
//checkAuthentication.checkNotAuthenticated, 
async(req,res)=>{
    let user_id = null;
    try{
        const hashedPassword = await bcrypt.hash(req.body.password,10)
        try{
            const response = await database.query(
                `INSERT INTO users(name,email,password,token)
                VALUES (?,?,?,?)`,[req.body.name,req.body.email,hashedPassword,req.body.token]
            )
            const [id_object] = await database.query(
                `SELECT LAST_INSERT_ID(user_id) AS LI
                FROM users 
                ORDER BY LAST_INSERT_ID(user_id) desc limit 1`
            )
            user_id = id_object[0].LI
            const courses =  await fetchCourses(user_id, req.body.token,res)
        } catch{
            var string = encodeURIComponent('Duplicate token! If already registered then Log in. Otherwise generate your own token.');
            res.redirect('/register?errorMessage=' + string)
        }
        
        

    } catch(err){
        console.log(err)
        res.redirect('/register')
    }
})

router.post('/authentication', 
//checkAuthentication.checkNotAuthenticated, 
passport.authenticate('local',{
    successRedirect: '/index?loggedIn=' + encodeURIComponent('yes'),
    failureRedirect: '/',
    failureFlash: true
}))

router.delete('/logout', async (req, res,next) => {
    req.logOut((err) => {
        if (err) {
            return next(err)
        }
        res.redirect('/')
    })
})

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