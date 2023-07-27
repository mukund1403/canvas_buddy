const express = require('express')
const router = express()
const database = require('../databases')
const mysql = require('mysql')
const axios = require('axios')

//const teleBot = require('../teleBot')

const checkAuthentication = require('./partials/checkAuthentication')
const bcrypt = require('bcrypt')
const passport = require('passport')
const initializePassport = require('../passport-config')

if (typeof document !== 'undefined') {
    let modlisttemplate = document.querySelector("[mod-list-template]")
    let modListContainer = document.querySelector("[mod-list-cards-container]")
    console.log('yes')
}

async function updateCall(Finals, modTitle, SU, days, module_code, user_id) {
    try {
        const [data] = await database.query(
            `UPDATE orbital.nusmods SET exam_date = ?, module_title = ?, SU = ?, exam_days = ? WHERE module_code = ? AND user_id = ?`,[Finals, modTitle, SU, days, module_code, user_id]
        )
        //console.log(`Data for module code ${module_code} updated successfully`);
    
    } catch(err) {
        //console.log('Failed to update table',err)
        
    }
}

async function apiCall(data){      
    for (let i = 0; i < data.length; i++) {   
        const module_code = data[i].module_code;
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

            updateCall(Finals, modTitle, SU, days, module_code, user_id)
        })
        .catch(error => {
            console.error('Error:', error);
        });    
    }
}

/* USE IF THE user_id IS CAUSING PROBLEM
async function updateCall(Finals, modTitle, SU, days, module_code) {
    try {
        const [data] = await database.query(
            `UPDATE orbital.nusmods SET exam_date = ?, module_title = ?, SU = ?, exam_days = ? WHERE module_code = ?`,[Finals, modTitle, SU, days, module_code]
        )
        console.log(`Data for module code ${module_code} updated successfully`);
    
    } catch(err) {
        console.log('Failed to update table',err)
        
    }
}

async function apiCall(data){      
    for (let i = 0; i < data.length; i++) {   
        const module_code = data[i].module_code;
        const url = `https://api.nusmods.com/v2/2023-2024/modules/${module_code}.json`;
        axios.get(url)
        .then(response => {
            const data = response.data.semesterData;
            const modTitle = response.data.title;
            
            if (Array.isArray(data) && data.length > 0) {
                console.log(module_code);
                console.log(response.data.title)
                var examDate1 = 0;
                var examDate2 = 0;
                var Finals = 0;
                var SU = "Nah, sorry bro";
                var days = "0"

                //SU option
                if (response.data.attributes && response.data.attributes.hasOwnProperty("su")) {
                    SU = "Yessir"
                    console.log(response.data.attributes.su)
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
                console.log('No data available.');
            }
            
            //Supposed to be Reminder Function
            

            updateCall(Finals, modTitle, SU, days, module_code)
        })
        .catch(error => {
            console.error('Error:', error);
        });    
    }
}
*/

async function deleteModules(user_id){
    const response = await database.query(
        `DELETE FROM nusmods
        WHERE user_id = ?`,[user_id]
    )
}

router.get('/', async (req, res) => {
    try{
        const [data] = await database.query(
            "SELECT * FROM orbital.nusmods ORDER BY module_code ASC"
        )
        res.render('nusmods/sample_data', {title:'NUSMods', action:'list', sampleData:data})
        apiCall(data)
    } catch(err) {
        console.log(err)
        res.redirect('/')
    }
})

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