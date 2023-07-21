const express = require('express')

const app = express()
const expressLayouts = require('express-ejs-layouts')
const bodyParser = require('body-parser')
const flash = require('express-flash')
const session = require('express-session')
const passport = require('passport')

//TeleBot
const TeleBot = require('./teleBot')

const authenticationRouter = require('./routes/authentication')
const indexRouter = require('./routes/index')
const nusmodsRouter = require('./routes/nusmods')
//const subjectRouter = require('./routes/subjects')
//const assignmentsRouter = require('./routes/assignments') 
const methodOverride = require('method-override')
require('dotenv').config()

app.set('view engine','ejs');
app.set('views',__dirname+"/views")
app.set('layout','layouts/layout')
app.use(expressLayouts)
app.use(express.static('public'))
app.use(bodyParser.urlencoded({limit:'10mb' , extended : false}))
//app.use(methodOverride('_method'))
app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}))
app.use(passport.initialize())
app.use(passport.session())
app.use(methodOverride('_method'))

app.use('/',authenticationRouter)
app.use('/',indexRouter)
app.use('/nusmods',nusmodsRouter)
//app.use('/subjects',subjectRouter)
//app.use('/assignments',assignmentsRouter)

app.listen(process.env.PORT || 3000, ()=>{
    console.log("Listening on 3000")
})
