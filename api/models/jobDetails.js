const mongoose = require("mongoose");
const jobDetailsSchema = new mongoose.Schema({
    userNumber : Number,
    postName : String,
    noOfPersons : Number,
    startDate: Date,
    startTime: String,
    duration : Number,
    reportTime : String,
    requiredExperience : [],
    training : String,
    payment : Number,
    paymentMode: String,
    jobDescription : String,
    perks: String,
    applicants :{
        type : []
    },
    hired :{
        type : []
    }
})

//Create New Collection
const jobDetails = new mongoose.model('Job',jobDetailsSchema);

 module.exports = jobDetails;