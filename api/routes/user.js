const express = require("express");
const router = express.Router();
const User = require("../models/userContact");
const newUser = require("../models/newUser");
const mongoose = require('mongoose');
const Speakeasy = require('speakeasy');
const multer = require("multer");
const path = require("path");
const jobDetails = require("../models/jobDetails");
const jobProvider = require("../models/jobProvider");
const cookieSession = require("cookie-session");
const authenticateUser = require("../middlewares/authenticateUser");
const Review = require("../models/review");
mongoose.set('useFindAndModify', false);
router.use(
    cookieSession({
      keys: ["randomStringASyoulikehjudfsajk"],
    })
  );

router.use(express.static(__dirname+"./public/"));

let Storage = multer.diskStorage({
    destination:(req, file, cb) => {
        if (file.fieldname === 'userIdentification[]') {
            cb(null,'public/uploads/userIdentification')
          }
        else if(file.fieldname === 'userDrivingLicense[]'){
              cb(null,'public/uploads/userDrivingLicense')
          }
        else if(file.fieldname === 'userImage'){
            cb(null,'public/uploads/userImage')
        }
    },
    filename:(req,file,cb)=>{
        cb(null,file.fieldname+"_"+Date.now()+path.extname(file.originalname));
    //   cb(null,req.body.nameOfBusiness+" "+file.fieldname+"_"+Date.now()+path.extname(file.originalname));
    // console.log(file.fieldname)
    }
})

let upload = multer({storage : Storage});
//Routing starts here.

router.post('/login',async(req,res)=>{
    let userNumber = req.body.userNumber;
    try {
        let exist = await newUser.findOne({userNumber:userNumber})
        if(exist){
            req.session.User = {
                userNumber,
            }
            res.send("Logged In")
        }
        else{
            res.send("User not found!")
        }
    } catch (error) {
        console.log(error)
    }
})

//OTP - TOKEN STARTS HERE ///////////////////
router.post('/register',async(req,res)=>{
    let userNumber = req.body.userNumber;

    try{
        let existUser = await newUser.find({ userNumber : { $in: userNumber }});
        let existJobProvider = await jobProvider.find({ businessContactNumber : { $in: userNumber }});
        if (existUser.length == 0 && existJobProvider.length ==0){
            let secret = Speakeasy.generateSecret();
            console.log(secret.base32)
            let secretSave = new User({secret : secret.base32})

            req.session.User = {
                userNumber,
            }

            secretSave.save().then(() => {
                res.send("saved");
            }).catch((e) =>{
                res.send(e);
                console.log(e)
            })
            }   
            else{
                if(existUser.length == 0){res.send("This number belongs to Job Provider, please provide other number")}
                else if(existJobProvider.length == 0){res.send("This number belongs to another person, please provide other number")}
            }
        }
        catch(error){
            console.log(error)
        }
})

router.post('/otp',(req,res)=>{
    let secret = User.find({}).select("secret -_id").exec(function(err,data){
        if(err) throw err;
    console.log(data)
    })

    res.send({
        "token": Speakeasy.totp({
            secret: secret ,
            encoding:"base32"
        }),
        "remaining": (30- Math.floor((new Date().getTime()/1000 % 30)))
    })
})

router.post('/validate',(req,res)=>{
    let secret = User.find({}).select("secret -_id").exec(function(err,data){
        if(err) throw err;
    })

    let valid = Speakeasy.totp.verify({
        secret: secret,
        encoding:"base32",
        token: req.body.token
    });

    if (valid == true){
        res.send("OTP matched")
    } else{
        res.send("Wrong OTP")
    }
})
// OTP ENDS HERE /////////////////////////////

//New user will be register to db through this api
router.post('/newuser',upload.any({name :'userIdentification[]', maxcount:3},{name :'userDrivingLicense[]', maxcount:3}),authenticateUser,async(req,res)=>{
    let userNumber = req.session.User.userNumber;
            
    const user = new newUser({
        userNumber : userNumber,
        fname : req.body.fname,
        mname : req.body.mname,
        lname : req.body.lname,
        dob : req.body.dob,
        gender : req.body.gender,
        email : req.body.email,
        qualification : req.body.qualification,
        experienceYears : req.body.experienceYears,
        skills : req.body.skills,
        location: req.body.location
    })

    if(req.files){
    let path =""
    let way =""
    let img =""
    req.files.forEach(function(files,index,arr){
        if(files.fieldname == "userIdentification[]"){
            path = req.body.fname+ " " + path + files.path + ','
    }
    if(files.fieldname == "userDrivingLicense[]"){
        way = req.body.fname + way + files.path + ','
    }
    if(files.fieldname == "userImage"){
        img = req.body.fname + img + files.path
    }
    })
    path = path.substring(0,path.lastIndexOf(","))
    way = way.substring(0,way.lastIndexOf(","))      

    user.userIdentification = path
    user.userDrivingLicense = way
    user.userDrivingLicense = img
}
    user.save().then(() => {
        res.send("saved new profile");
    }).catch((e) =>{
        res.send(e);
        console.log(e)
    })
    
})

// User can get jobs through this Api
router.get('/jobs',authenticateUser,async(req,res)=>{
    let number = req.session.User.userNumber 
    try {
        let user = await newUser.findOne({userNumber : number})
        let userJobIds = user.appliedfor

        let jobs = await jobDetails.find({ _id : { $nin: userJobIds }});
        console.log(jobs)
        res.send(jobs)
        } catch (error) {
            console.log(error)
        }

//     let jobs = newUser.findOne({userNumber : number}).exec(function(err,docs){
//         if(err) throw err;
//         let arr = docs.appliedfor

//         for(var i = 0; i < arr.length; i++) {
//             var x = arr[i];
//             // console.log(x);
//         }
//         console.log(docs.appliedfor[0])
            
// })

// console.log(x)

//         jobDetails.find({}).exec(function(err,data){
//             if(err) throw err;
//             console.log(data)
//             data.forEach(function (files,index,arr){
//                 // console.log("files._id",files._id)
//                 // console.log("x",x)
//                 // if(!files._id.equals(x)){
//                 //     // console.log("hi")
//                 //     // console.log(files._id)
//                 //     return files;
//                 // }
                
//     })
// })
// res.send(jobs)
})

router.post('/apply/:id',authenticateUser,async(req,res)=>{
    // let id = req.params.id;
    // console.log(id)
    let id = mongoose.Types.ObjectId(req.params.id);
    console.log("Applying for",id)

    let number = req.session.User.userNumber

    try{
        let user = await newUser.findOne({userNumber:number});

        jobDetails.findOneAndUpdate(
            {_id:id},
            {"$addToSet": { "applicants": user._id }},
            ).exec(function(err,docs){
                if(err) throw err;
                console.log("Applied Successfully")
            })
    }
    catch(error){
        console.log(error)
    }


    let update =  newUser.findOneAndUpdate(
            {userNumber:number},
            {"$addToSet": { "appliedfor": id }},
            )

    update.exec(function(err,data){
        if(err) throw err;
        res.send("Applied Successfully")
    })
})

 //Filter of data (applied==true) will handle by frontend
router.get('/pastjobs',authenticateUser,(req,res)=>{
    jobDetails.find({}).exec(function(err,data){
        if(err) throw err;
        res.send(data)
    })
})
router.post('/review',authenticateUser,(req,res)=>{
    let number = req.session.User.userNumber
    newUser.findOne({userNumber : number}).exec(function(err,data){
        if(err) throw err;
        
        const review = new Review({
            userName : data.fname,
            review : req.body.review,
            message : req.body.message
        })
        review.save().then(() => {
            res.send("saved review");
        }).catch((e) =>{
            res.send(e);
            console.log(e)
        })
    })
})

router.get('/review',authenticateUser,(req,res)=>{
    Review.find({}).exec(function(err,data){
        if(err) throw err;
        res.send(data)
    })
})

router.post('/filter',authenticateUser,(req,res)=>{
    let from = req.body.from;
    let to = req.body.to;
    let jobOnDate = req.body.jobOnDate;
    let jobNature = req.body.jobNature;
    if (jobOnDate){
        jobDetails.find({"startDate": jobOnDate}).exec(function(err,data){
        if(err) throw err;
        res.send(data)
    });
    }
    else if({from,to}){
        jobDetails.find({"startDate":{"$gte":from, "$lte":to}}).exec(function(err,data){
        if(err) throw err;
        res.send(data)
    })
     }
})

router.post('/edit',authenticateUser,(req,res)=>{
    let number = req.session.User.userNumber
    const update ={
        fname : req.body.fname,
        mname : req.body.mname,
        lname : req.body.lname,
        gender : req.body.gender,
        email : req.body.email,
        qualification : req.body.qualification
    }
    newUser.findOneAndUpdate(number,update).exec(function(err,data){
        if(err) throw err;
        res.send("Updated")
    })
})
module.exports = router;