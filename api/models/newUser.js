const mongoose = require("mongoose");
const validator = require("validator");
const newUserSchema = new mongoose.Schema({
    userNumber:{
        type : Number
    },
    userImage :{ 
        type :String,
    },
    fname :{ 
        type :String,
        required:true 
    },
    mname : String,
    lname :{ 
        type :String,
        required:true 
    },
    dob:{
        type: Date,
        required:true
    },
    gender: {
        type : String,
        required : true
    },
    email: {
        type : String,
        required: true,
        unique : true,
        validate(value){
            if(!validator.isEmail(value)){
                throw new Error("Invalid Email")
            }
        }
    },
    qualification: String,
    location : String,
    experienceYears : {
        type : Number
    },
    skills: {
        type : String
    },
    userIdentification: {
        type: String,
        // required : true
    },
    userDrivingLicense: {
        type: String
    },
    appliedfor: {
        type : []
    },
    hiredfor: {
        type : []
    }
})

//Create New Collection
const newUser = new mongoose.model('newUser',newUserSchema);

 module.exports = newUser;