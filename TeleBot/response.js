//Response to the /all search. Inefficient AF but ¯\_(ツ)_/¯
const {Composer} = require('telegraf')
module.exports = Composer.action(
    ('2', ctx => {
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
)

