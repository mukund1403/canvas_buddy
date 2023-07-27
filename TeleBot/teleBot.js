const express = require('express');
const app = express();
const axios = require('axios');
const bodyParser = require('body-parser');
const database = require('../databases')
const mysql = require('mysql')

const {Telegraf} = require('telegraf')
const allresponse = require('./response')

require('dotenv').config()

const port = 8080;
const url = 'https://api.telegram.org/bot';
const apiToken = process.env.TELEBOT_API_TOKEN ;

const bot = new Telegraf(apiToken)
let reminder;

//Global variable bad, but im lazy
let registered = 0;
let mod = 0;

//Event listener for start
bot.start((ctx) => {
    const sql = `SELECT * FROM orbital.users WHERE tele_username LIKE '${ctx.chat.username}'`;
    database.query(sql, function(err, results) {
        if(err) console.log(err);
        //console.log(results);
        if (results == 0) {
            ctx.reply("Hey, it looks like you have not registered with us yet. Head over to CanvasHelper.com and register for the best user experience!")
            registered = 0;
        } else {
            ctx.reply(`Hi there! Welcome ${ctx.chat.username}`)
            registered = 1;
        }   
    })
});

bot.hears('hi', (ctx) => ctx.reply('Hey there'))

//Event listener for commands
bot.command('help', async (ctx) => {
    ctx.reply(`
Sure, No problem!

Type /all for a pop-up window with all your modules
Type /exams to see all your exam dates`)
});//Type /search (module code) to search for a particular module

bot.command('exams', async (ctx) => {
    //ctx.reply(`Hello! ${ctx.chat.first_name}, What are you searching for?`)
    if (registered == 1) {
        try {
            const msg = ctx.message.text //here I recieve a message to bot as a string to use in select
            msgAray = msg.split(' ')
            msgAray.shift()
            q = msgAray.join()
            //console.log(q)
            const sql = "SELECT exam_date, module_code FROM orbital.nusmods WHERE module_code LIKE '%"+ q +"%'";
            database.query(sql, function(err, results) {
                if(err) console.log(err);
                console.log(results);
                
                for (const result of results) { // each row
                    ctx.reply(`The exam date for ${result.module_code} is ${result.exam_date}`)
                }
            })
        } catch (error) {
            console.log('error', error)
            ctx.reply('error searching module')
        }
    } else {
        ctx.reply('Hey, PLEASE register first before using (╯°□°)╯︵ ┻━┻')
    }
});

bot.command('all', async (ctx) => {
    if (registered == 1) {
        try {
            const sql = "SELECT module_code, ID FROM orbital.nusmods";
            database.query(sql, function(err, results) {
                if(err) console.log(err);
                //console.log(results);
                const module_keyboard = {
                    "reply_markup": {
                        "resize_keyboard": true,
                        "one_time_keyboard": true,
                        "inline_keyboard": results.map(result => ([{text: result.module_code, callback_data: result.ID}])) 
                    }   
                }
                //console.log(module_keyboard)
                //console.log(allModuleKeyboard)
                bot.telegram.sendMessage(ctx.chat.id, "Click for more details", module_keyboard);
            });
        } catch (error) {
            console.log('error', error)
            ctx.reply('error showing all')
        }
        //const msg = ctx.message.text
        //console.log(msg)
    } else {
        ctx.reply('Hey, PLEASE register first before using (╯°□°)╯︵ ┻━┻')
    }
    
});

const assignmentKeyboard = {
    "reply_markup": {
        "one_time_keyboard": true,
        "inline_keyboard": [
            [{text: "Assignments", callback_data:"assignment"}],
            [{text: "Exams", callback_data:"exam"}],
            [{text:"Cancel", callback_data:'cancel'}]
        ]
    }
};

bot.action('exam', ctx => {
    ctx.deleteMessage()
    const sql = "SELECT exam_date, module_code FROM orbital.nusmods WHERE module_code LIKE '%"+ mod +"%'";
    database.query(sql, function(err, results) {
        if(err) console.log(err);
        //console.log(results);
                
        for (const result of results) { // each row
            if (result.exam_date == null) {
                ctx.reply(`No exams for ${result.module_code}. Yay!`)
            } else {
                ctx.reply(`The exam date for ${result.module_code} is ${result.exam_date}`)
            }
        }
    })
})

bot.action('assignment', ctx => {
    /*ctx.deleteMessage()
    const sql = "SELECT due_date, module_code, assignment_id FROM orbital.assignments WHERE module_code LIKE '%"+ mod +"%'";
    database.query(sql, function(err, results) {
        if(err) console.log(err);
        console.log("ASSIGNMENT",results);
                
        for (const result of results) { // each row
            if (result == null) {
                ctx.reply(`No assignments for ${result.module_code}. Yay!`)
            } else {
                ctx.reply(`The assignment due date for ${result.module_code} is ${result.due_date}`)
            }
        }
    })*/
    //PLACEHOLDER SINCE MY ASSIGNMENT DB NOT FILLED
    ctx.deleteMessage()
    const sql = "SELECT exam_date, module_code FROM orbital.nusmods WHERE module_code LIKE '%"+ mod +"%'";
    database.query(sql, function(err, results) {
        if(err) console.log(err);
        //console.log(results);
                
        for (const result of results) { // each row
            if (result.exam_date == null) {
                ctx.reply(`No exams for ${result.module_code}. Yay!`)
            } else {
                ctx.reply(`The exam date for ${result.module_code} is ${result.exam_date}`)
            }
        }
    })
})

bot.action('cancel', (ctx) => {
    ctx.deleteMessage()
    const sql = "SELECT module_code, ID FROM orbital.nusmods";
    database.query(sql, function(err, results) {
        if(err) console.log(err);
        //console.log(results);
        const module_keyboard = {
            "reply_markup": {
                "resize_keyboard": true,
                "one_time_keyboard": true,
                "inline_keyboard": results.map(result => ([{text: result.module_code, callback_data: result.ID}])) 
            }   
        }
        bot.telegram.sendMessage(ctx.chat.id, "Click for exam dates", module_keyboard);
    })
})

//Response to the /all search. Inefficient AF but ¯\_(ツ)_/¯
bot.action('1', ctx => {
    ctx.deleteMessage()
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '1'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            //console.log(results);
            for (const result of results) { // each row
                mod = result.module_code
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('Oops! An error has occured. Try again')
    }
    ctx.reply("Please select: ", assignmentKeyboard)
})

bot.action('2', ctx => {
    ctx.deleteMessage()
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '2'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            //console.log(results);
            for (const result of results) { // each row
                mod = result.module_code
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('Oops! An error has occured. Try again')
    }
    ctx.reply("Please select: ", assignmentKeyboard)
})

bot.action('3', ctx => {
    ctx.deleteMessage()
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '3'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            //console.log(results);
            for (const result of results) { // each row
                mod = result.module_code
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('Oops! An error has occured. Try again')
    }
    ctx.reply("Please select: ", assignmentKeyboard)
})

bot.action('4', ctx => {
    ctx.deleteMessage()
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '4'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            //console.log(results);
            for (const result of results) { // each row
                mod = result.module_code
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('Oops! An error has occured. Try again')
    }
    ctx.reply("Please select: ", assignmentKeyboard)
})

bot.action('5', ctx => {
    ctx.deleteMessage()
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '5'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            //console.log(results);
            for (const result of results) { // each row
                mod = result.module_code
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('Oops! An error has occured. Try again')
    }
    ctx.reply("Please select: ", assignmentKeyboard)
})

bot.action('6', ctx => {
    ctx.deleteMessage()
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '6'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            //console.log(results);
            for (const result of results) { // each row
                mod = result.module_code
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('Oops! An error has occured. Try again')
    }
    ctx.reply("Please select: ", assignmentKeyboard)
})

bot.action('7', ctx => {
    ctx.deleteMessage()
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '7'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            //console.log(results);
            for (const result of results) { // each row
                mod = result.module_code
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('Oops! An error has occured. Try again')
    }
    ctx.reply("Please select: ", assignmentKeyboard)
})

bot.action('8', ctx => {
    ctx.deleteMessage()
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '8'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            //console.log(results);
            for (const result of results) { // each row
                mod = result.module_code
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('Oops! An error has occured. Try again')
    }
    ctx.reply("Please select: ", assignmentKeyboard)
})

//Launch if not bot no work =͟͟͞͞( ✌°∀° )☛
bot.launch();

// Listening
app.listen(port, () => {
     console.log(`TeleBot Listening on port ${port}`);
});