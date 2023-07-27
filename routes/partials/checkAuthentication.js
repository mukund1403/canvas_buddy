
function checkAuthenticated(req, res, next) {
  /*  
  if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/')*/
    next()
  }
  
  function checkNotAuthenticated(req, res, next) {
    /*if (req.isAuthenticated()) {
      return res.redirect('/index')
    }*/
    next()
  }



module.exports = {checkAuthenticated , checkNotAuthenticated}