const mongoose = require("mongoose");
const jobtypeSchema = new mongoose.Schema({
    jobtype : String
})

//Create New Collection
const jobtype = new mongoose.model('jobtype',jobtypeSchema);

 module.exports = jobtype;