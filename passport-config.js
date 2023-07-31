const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt')

function initialize(passport, getUserByEmail,getUserById) {
  const authenticateUser = async (email, password, done) => {
    try{
      const [response] = await getUserByEmail(email)
      const user = response[0]
      console.log(user)
      if (user == null) {
        return done(null, false, { message: 'No user with that email' })
      }
    } catch(e){
      console.log(e)
      return done(null,false,{message: 'Issue with database. Wait for admin to fix. If you know admin call them and tell them to HURRY UP'})
    }
    

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, { message: 'Password incorrect' })
      }
    } catch (e) {
      return done(e)
    }
  }

  passport.use(new LocalStrategy({ usernameField: 'email' }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user.user_id))
  passport.deserializeUser((id, done) => {
    return done(null, getUserById(id))
  })
}

module.exports = initialize

