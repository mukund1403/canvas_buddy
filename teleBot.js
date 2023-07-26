const express = require('express');
const app = express();
const axios = require('axios');
const bodyParser = require('body-parser');
const database = require('./databases')
const mysql = require('mysql')
const telegramBot = require('node-telegram-bot-api')
require('dotenv').config()

const port = 8080;
const url = 'https://api.telegram.org/bot';
const apiToken = process.env.TELEBOT_API_TOKEN ;

const bot = new telegramBot (apiToken, {polling:true})
let reminder;

//bot.sendMessage(chat.id, text="Hi there!")
//Event listener for start

bot.onText(/\/start/, (msg) => {
    bot.sendMessage(msg.chat.id, 
`Hi there! I am Canvas Helper Bot.
Type /help if you need any help

${msg.chat.username}`)
});

bot.onText(/\/remind/,(msg,match)=>{
    bot.sendMessage(
       msg.chat.id,
       `Hello! ${msg.chat.first_name}, What do you want to be reminded of? [Start next message with /save]`
        )
        .then(res => {
           //For save
           bot.onText(/\/save (.+)/, (message, match)=>{
             reminder = match[1];
             if(reminder){
               bot.sendMessage(
                 message.chat.id, `Got it! What time? [example: /time (HH:MM:SS:AM|PM)]`
                 )
                 .then(() => {
                   bot
                     .onText(/\/time ([01]\d|2[0-3]):([0-5]\d:[0-5]\d):(AM|PM)/,(message,match)=>{
                          const time = match[0].split(' ')[1];
                          bot.sendMessage(
                              message.chat.id,
                              `Thank you ${message.chat.first_name}, your reminder for time ${time} has been saved.`
                          );
                      }) 
                              
                   })
                   .catch(() =>{
                       bot.sendMessage(msg.chat.id,`Oops! An error has occured. Try again`);
                    })
              }
          });
        }) 
        .catch(e => {
            bot.sendMessage(msg.chat.id,`Oops! An error has occured. Try again`);
        }) 
});


bot.on('message',(msg)=>{
    var hello = "hello";
    var hi
    if (msg.text.toString().toLowerCase().indexOf(hi) === 0) {
        bot.sendMessage(msg.chat.id, `Hello ${msg.chat.first_name}, What can I do for you today?`)
    }
    var bye = "bye";
    if (msg.text.toString().toLowerCase().includes(bye)) {
        bot.sendMessage(msg.chat.id, "Hope to see you around again , Bye");
    }
});

bot.onText(/\/help/, (msg) => {
    bot.sendMessage(msg.chat.id, `Sure, No problem!
Type /search to search for a particular module
Type /search2 for a pop-up window with all your modules
Type /exams to see all your exam dates`)
});

bot.onText(/\/search/,(msg,match)=>{
    bot.sendMessage(
      msg.chat.id,
      `Hello! ${msg.chat.first_name}, What are you searching for?`
    )
    .then(res => {
        //for save
        bot.on('message', (msg) => {
            const q = msg.text //here I recieve a message to bot as a string to use in select
            //const sql = "SELECT examDate, moduleCode FROM userbase.users WHERE moduleCode LIKE '%"+ q +"%'";
            const sql = "SELECT exam_date, module_code FROM orbital.nusmods WHERE module_code LIKE '%"+ q +"%'";
            //const sql2 = "SELECT moduleCode FROM userbase.users WHERE moduleCode LIKE '%"+ q +"%'";
            database.query(sql, function(err, results) {
                if(err) console.log(err);
                console.log(results);
                
                for (const result of results) { // each row
                    bot.sendMessage(
                        msg.chat.id,
                        //`The exam date for ${result.moduleCode} is ${result.examDate}`
                        `The exam date for ${result.module_code} is ${result.exam_date}`
                        )
                }
            });
        })
    }) 
    .catch(e => {
        bot.sendMessage(msg.chat.id,`Oops! An error has occured. Try again`);
    }) 
});

bot.onText(/\/exams/, (msg) => {
    //const sql = "SELECT moduleCode, examDate FROM userbase.users";
    const sql = "SELECT module_code, exam_date FROM orbital.nusmods";
    database.query(sql, function(err, results) {
        if(err) console.log(err);
        console.log(results);
        let i = 0
        for (const result of results) { // each row
            bot.sendMessage(
                msg.chat.id,
                //`The exam date for ${result.moduleCode} is ${result.examDate}`
                `The exam date for ${result.module_code} is ${result.exam_date}`
                )
        }
    });
});

bot.onText(/\/search2/, (msg) => {
    //const sql = "SELECT moduleCode, examDate FROM userbase.users";
    const sql = "SELECT module_code, exam_date FROM orbital.nusmods";
    database.query(sql, function(err, results) {
        if(err) console.log(err);
        console.log(results);
        let i = 0
        //bot.sendMessage(msg.chat.id,`${results[1].moduleCode}`)
        /*
        for (const result of results) { // each row
            bot.sendMessage(
                msg.chat.id,
                `The exam date for ${result.moduleCode} is ${result.examDate}`
                )
        }       
        */

        bot.sendMessage(msg.chat.id, "Click for exam dates", {
            "reply_markup": {
                //"inline_keyboard": [[{text:"Exam Dates" , callback_data:"www.google.com"}], [{text:"Assignments", url:"www.youtube.com"}]]
                "resize_keyboard": true,
                "one_time_keyboard": true,
                //"keyboard": [[`${results[0].moduleCode}`, `${results[1].moduleCode}`],   [`${results[2].moduleCode}`], [`${results[3].moduleCode}`], [`${results[4].moduleCode}`]]
                //"keyboard": [[`${results[0].module_code}`, `${results[1].module_code}`],   [`${results[2].module_code}`], [`${results[3].module_code}`], [`${results[4].module_code}`]]
                "keyboard": [[`${results[0].module_code}`]]
            }
        });
        
        /*
        bot.editMessageReplyMarkup(msg.chat.id, "Exam Dates", {
            "reply_markup": {
                "keyboard": [[`${results[0].moduleCode}`, `${results[1].moduleCode}`],   [`${results[2].moduleCode}`], [`${results[3].moduleCode}`], [`${results[4].moduleCode}`]]
            }
        })*/
    });
});
/*
bot.on('callback_query', (msg) => {
    bot.editMessageReplyMarkup({
        reply_markup:{
            inline_keyboard: [
                [{text:"Exam Dates" , callback_data:"www.google.com"}]
            ]
        }
    })
})
*/
/*
$keyboard1 = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
         ['0']
];

$reply_markup = $telegram->replyKeyboardMarkup([
    'keyboard' => $keyboard1, 
    'resize_keyboard' => true, 
    'one_time_keyboard' => true
]);

$response = $telegram->sendMessage([
    'chat_id' => 'CHAT_ID', 
    'text' => 'Hello World', 
    'reply_markup' => $reply_markup
]);

$messageId = $response->getMessageId();
var option = {
    "parse_mode": "Markdown",
    "reply_markup": {  "keyboard": [["Yes"],["No"]]  }
};
bot.sendMessage(msg.chat.id, "*Some* message here.", option);
*/
// Listening
app.listen(port, () => {
     console.log(`TeleBot Listening on port ${port}`);
});