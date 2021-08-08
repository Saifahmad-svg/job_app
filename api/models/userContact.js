const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    userNumber : Number,
    secret : String
})

//Create New Collection
const User = new mongoose.model('User',userSchema);

 module.exports = User;