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
            const deleteExams = await deleteModules(user_id)
            const updatedAPIDate = await updateAPIDate(user_id,today_date)
            const courses = await fetchCourses(user_id, token, res)
            const exam = await examAPI(data,user_id)
        }   
    }
    res.render("dashboard")
})

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

async function examAPI(data,user_id){      
    data.forEach(subject =>{  
        const module_code = subject.module_code;
        const url = `https://api.nusmods.com/v2/2023-2024/modules/${module_code}.json`;
        axios.get(url)
        .then(response => {
            const data = response.data.semesterData;
            const modTitle = response.data.title;
            
            if (Array.isArray(data) && data.length > 0) {
                //console.log(module_code);
                //console.log(response.data.title)
                var examDate1 = 0;
                var examDate2 = 0;
                var Finals = 0;
                var SU = "Nah, sorry bro";
                var days = "0"

                //SU option
                if (response.data.attributes && response.data.attributes.hasOwnProperty("su")) {
                    SU = "Yessir"
                    //console.log(response.data.attributes.su)
                }

                //ExamDate data
                if (data[0] && data[0].hasOwnProperty("examDate") && data[0].semester == 1) {
                    //console.log('Sem 1 set')
                    examDate1 = data[0].examDate;
                } else if (data[0] && data[0].hasOwnProperty("examDate") && data[0].semester == 2) {
                    //console.log('Dont Have Sem 1')
                    //console.log('Sem 2 set')
                    examDate2 = data[0].examDate;
                } else {
                    //console.log('Dont Have Sem 1')
                }

                if (data[1] && data[1].hasOwnProperty("examDate") && data[1].semester == 2) {
                    //console.log('Sem 2 set')
                    examDate2 = data[1].examDate;
                } else if (data[1] || data[0].semester == 2){
                    //console.log('Dont Have Sem 2')
                }
                
                //Deciding which semester
                const currentDate = new Date();
                const targetDate = new Date('2023-11-25') //NEED TO CHANGE!!!!!!
                
                if (currentDate > targetDate && examDate2 != 0) {
                    //console.log('Exam2 Date: ', examDate2);
                    examday = examDate2.split("T")
                    Finals = examday[0];
                    //console.log('Exam2 Date: ', examday[0], examday[1])
                } else if (currentDate <= targetDate && examDate1 != 0) {
                    //console.log('Exam1 Date: ', examDate1);
                    examdays = examDate1.split("T")
                    Finals = examdays[0];
                    //console.log('Exam1 Date: ', examdays[0], examdays[1]);
                } else {
                    //console.log('Exam Date: No Data Available');
                    Finals = null;
                }
            } else {
                //console.log('No data available.');
            }
            
            //Supposed to be Reminder Function
            /*
            if (Finals != null) {
                const currentTime = new Date().getTime()
                const futureDate = Date.parse(Finals)
                const timeDiff = futureDate - currentTime
                if (timeDiff <= 0) {
                    //console.log(moduleCode,' Exam Day!')
                }
                //console.log(currentTime)
                //console.log(Finals)
                //console.log(futureDate)
                //console.log(timeDiff)
                
                days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
                console.log("!!!!!!!!! ", days)
                //const interval = setInterval(calcExamDays,100000);
            }*/
            const callUpdates = updateCall(Finals, modTitle, SU, days, module_code, user_id)

        })
        .catch(error => {
            console.error('Error:', error);
        });    
    }) 
}

async function updateCall(Finals, modTitle, SU, days, module_code, user_id) {
    try {
        const [data] = await database.query(
            `INSERT INTO nusmods
            VALUES (?,?,?,?,?,?)`
            ,[module_code, modTitle, Finals, days, SU, user_id]
        )
        //console.log(`Data for module code ${module_code} updated successfully`);
    
    } catch(err) {
        //console.log('Failed to update table',err)
        console.log(err)
        
    }
}

async function deleteExams(user_id){
    const response = await database.query(
        `DELETE FROM nusmods
        WHERE user_id = ?`,[user_id]
    )
}

module.exports = router