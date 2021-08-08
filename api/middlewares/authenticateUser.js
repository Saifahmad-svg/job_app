
module.exports = (req, res, next) => {
    if (!req.session.User) {
      res.send("You're not allowed to view this content! please log in first!");
      return;
    }
    //else continue
    next();
  };