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
//Event listener for start
bot.onText(/\/start/,(msg,match)=>{
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
    var hi = "hello";
    if (msg.text.toString().toLowerCase().indexOf(hi) === 0) {
        bot.sendMessage(
        msg.chat.id,
        `Hello! ${msg.chat.first_name}, What can I do for you today?`
        )
    }
 
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
            const sql = "SELECT examDate, moduleCode FROM userbase.users WHERE moduleCode LIKE '%"+ q +"%'";
            //const sql2 = "SELECT moduleCode FROM userbase.users WHERE moduleCode LIKE '%"+ q +"%'";
            database.query(sql, function(err, results) {
                if(err) console.log(err);
                console.log(results);
                
                for (const result of results) { // each row
                    bot.sendMessage(
                        msg.chat.id,
                        `The exam date for ${result.moduleCode} is ${result.examDate}`
                        )
                }
            });
        })
        }) 
        .catch(e => {
            bot.sendMessage(msg.chat.id,`Oops! An error has occured. Try again`);
        }) 
});

bot.onText(/\/search2/, (msg) => {
    const sql = "SELECT moduleCode FROM userbase.users";
    database.query(sql, function(err, results) {
        if(err) console.log(err);
        console.log(results);
        
        for (const result of results) { // each row
            bot.sendMessage(
                msg.chat.id,
                `The exam date for ${result.moduleCode} is ${result.examDate}`
                )
        }

        results        

        bot.sendMessage(msg.chat.id, "Welcome", {
            "reply_markup": {
                "keyboard": [["Sample text", "Second sample"],   ["Keyboard"], ["I'm robot"]]
                }
            });
    });
    
    
    });

// Listening
app.listen(port, () => {
     console.log(`TeleBot Listening on port ${port}`);
});