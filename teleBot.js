const express = require('express');
const app = express();
const axios = require('axios');
const bodyParser = require('body-parser');
const database = require('./databases')
const mysql = require('mysql')
//const telegramBot = require('node-telegram-bot-api')
const {Telegraf} = require('telegraf')
const {message} = require('telegraf/filters');
const { reset } = require('nodemon');
//const { callback } = require('telegraf/typings/button');
//const { callback } = require('telegraf/typings/button');

require('dotenv').config()

const port = 8080;
const url = 'https://api.telegram.org/bot';
const apiToken = process.env.TELEBOT_API_TOKEN ;

//const bot = new telegramBot (apiToken, {polling:true})
const bot = new Telegraf(apiToken)
let reminder;
let registered = 0;

/*
const stage = new Scenes.Stage([start, about, settings, contact, search]); // Register our scenes
bot.use(stage.middleware()); // Stage middleware
bot.hears("settings", Scenes.Stage.enter("settings")); // Entering the settings scene when listener worked
*/

//bot.sendMessage(chat.id, text="Hi there!")
//Event listener for start

bot.start((ctx) => {
    let message = ` Hi there! I am Canvas Helper Bot.
Type /help if you need any help
${ctx.chat.username}`
    ctx.reply(message)
    const sql = `SELECT * FROM orbital.users WHERE tele_username LIKE '${ctx.chat.username}'`;
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            //console.log(results);
                if (results == 0) {
                    ctx.reply("Hey, it looks like you have not registered with us yet. Head over to CanvasHelper.com and register for the best user experience!")
                } else {
                    ctx.reply(`Hi there! Welcome ${ctx.chat.username}`)
                    registered = 1;
                }   
        })
});

bot.hears('hi', (ctx) => ctx.reply('Hey there'))

bot.command('fact', async (ctx) => {
    try {
        ctx.reply('Generating image, Please wait !!!')
        let imagePath = `./temp/${uuidV4()}.jpg`
        await factGenerator.generateImage(imagePath)
        await ctx.replyWithPhoto({ source: imagePath })
        factGenerator.deleteImage(imagePath)
    } catch (error) {
        console.log('error', error)
        ctx.reply('error sending image')
    }
});

bot.command('help', async (ctx) => {
    ctx.reply(`
Sure, No problem!
Type /search (module code) to search for a particular module
Type /all for a pop-up window with all your modules
Type /exams to see all your exam dates`)
});

bot.command('search', async (ctx) => {
    //ctx.reply(`Hello! ${ctx.chat.first_name}, What are you searching for?`)
    if (registered == 1) {
        try {
            const msg = ctx.message.text //here I recieve a message to bot as a string to use in select
            msgAray = msg.split(' ')
            msgAray.shift()
            q = msgAray.join()
            console.log(q)
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
                console.log(results);
                let i = 0
                const module_keyboard = {
                    "reply_markup": {
                        "resize_keyboard": true,
                        "one_time_keyboard": true,
                        "inline_keyboard": results.map(result => ([{text: result.module_code, callback_data: result.ID}])) 
                        //"inline_keyboard": [[{text:"Mod 1", callback_data:'cat'}], [{text:"Mod 2", callback_data:"camp"}]]
                    }   
                }
                //console.log(module_keyboard)
                console.log(allModuleKeyboard)
                bot.telegram.sendMessage(ctx.chat.id, "Click for exam dates", module_keyboard);
            });
        } catch (error) {
            console.log('error', error)
            ctx.reply('error showing all')
        }
        const msg = ctx.message.text
        console.log(msg)
    } else {
        ctx.reply('Hey, PLEASE register first before using (╯°□°)╯︵ ┻━┻')
    }
    
});

const allModuleKeyboard = {
    "reply_markup": {
        "one_time_keyboard": true,
        "keyboard": [
            [{
                text: "My phone number",
                request_contact: true,
                one_time_keyboard: true
            }],
            [{text:"Cancel", callback_data:'cat'}]
        ]
    }
};

//Response to the /all search. Inefficient AF but ¯\_(ツ)_/¯
bot.action('1', ctx => {
    try {
        const sql = `SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '1'`;
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            console.log(results);
            for (const result of results) { // each row
                if (result.exam_date == null) {
                    ctx.reply(`No exams for ${result.module_code}. Yay!`)
                } else {
                ctx.reply(`The exam date for ${result.module_code} is ${result.exam_date}`)
                }
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('error sending image')
    }
})

bot.action('2', ctx => {
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '2'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            console.log(results);
            for (const result of results) { // each row
                if (result.exam_date == null) {
                    ctx.reply(`No exams for ${result.module_code}. Yay!`)
                } else {
                ctx.reply(`The exam date for ${result.module_code} is ${result.exam_date}`)
                }
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('error sending image')
    }
})

bot.action('3', ctx => {
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '3'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            console.log(results);
            for (const result of results) { // each row
                if (result.exam_date == null) {
                    ctx.reply(`No exams for ${result.module_code}. Yay!`)
                } else {
                ctx.reply(`The exam date for ${result.module_code} is ${result.exam_date}`)
                }
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('error sending image')
    }
})

bot.action('4', ctx => {
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '4'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            console.log(results);
            for (const result of results) { // each row
                if (result.exam_date == null) {
                    ctx.reply(`No exams for ${result.module_code}. Yay!`)
                } else {
                ctx.reply(`The exam date for ${result.module_code} is ${result.exam_date}`)
                }
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('error sending image')
    }
})

bot.action('5', ctx => {
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '5'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            console.log(results);
            for (const result of results) { // each row
                if (result.exam_date == null) {
                    ctx.reply(`No exams for ${result.module_code}. Yay!`)
                } else {
                ctx.reply(`The exam date for ${result.module_code} is ${result.exam_date}`)
                }
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('error sending image')
    }
})

bot.action('6', ctx => {
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '6'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            console.log(results);
            for (const result of results) { // each row
                if (result.exam_date == null) {
                    ctx.reply(`No exams for ${result.module_code}. Yay!`)
                } else {
                ctx.reply(`The exam date for ${result.module_code} is ${result.exam_date}`)
                }
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('error sending image')
    }
})

bot.action('7', ctx => {
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '7'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            console.log(results);
            for (const result of results) { // each row
                if (result.exam_date == null) {
                    ctx.reply(`No exams for ${result.module_code}. Yay!`)
                } else {
                ctx.reply(`The exam date for ${result.module_code} is ${result.exam_date}`)
                }
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('error sending image')
    }
})

bot.action('8', ctx => {
    try {
        const sql = "SELECT module_code, exam_date FROM orbital.nusmods WHERE ID LIKE '8'";
        database.query(sql, function(err, results) {
            if(err) console.log(err);
            console.log(results);
            for (const result of results) { // each row
                if (result.exam_date == null) {
                    ctx.reply(`No exams for ${result.module_code}. Yay!`)
                } else {
                ctx.reply(`The exam date for ${result.module_code} is ${result.exam_date}`)
                }
            }
        });
    } catch (error) {
        console.log('error', error)
        ctx.reply('error sending image')
    }
})

//Launch if not bot no work =͟͟͞͞( ✌°∀° )☛
bot.launch();

// Listening
app.listen(port, () => {
     console.log(`TeleBot Listening on port ${port}`);
});