const mongoose = require("mongoose");
const jobProviderSchema = new mongoose.Schema({
    jobType: String,
    businessPhoto :{
        type: String
    },
    nameOfBusiness :{ 
        type :String,
        required:true 
    },
    address:{
        addressLine : String,
        streetName : String,
        city : String,
        state : String,
        pincode : Number
    },
    businessContactNumber:{
        type : Number,
        required : true
    },
    businessIncorporationCertificate: {
        type :String
    },
    businessNature :{
        type : String
    }
})

//Create New Collection
const jobProvider = new mongoose.model('jobProvider',jobProviderSchema);

 module.exports = jobProvider;