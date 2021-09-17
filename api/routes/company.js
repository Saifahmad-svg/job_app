/** @format */

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jobProvider = require("../models/jobProvider");
const newUser = require("../models/newUser");
const jobDetails = require("../models/jobDetails");
const jobtype = require("../models/jobType");
const Speakeasy = require('speakeasy');
const multer = require("multer");
const cookieSession = require("cookie-session");
const path = require("path");
const authenticateUser = require("../middlewares/authenticateUser");

router.use(
  cookieSession({
    keys: ["randomStringASyoulikehjudfssduig"],
  })
);

router.post("/register", async (req, res) => {
  let userNumber = req.body.userNumber;
  if (userNumber.length!==10) {
    res.send("Please enter valid number");
    return;
  }
  let secret = Speakeasy.generateSecret();
      console.log({
      "token": Speakeasy.totp({
        secret: secret.base32,
        encoding:"base32"
    }),
    "remaining": (30- Math.floor((new Date().getTime()/1000 % 30)))
    })

  try {
    let existUser = await newUser.find({ userNumber: { $in: userNumber } });
    let existJobProvider = await jobProvider.find({
      businessContactNumber: { $in: userNumber },
    });
    if (existUser.length == 0 && existJobProvider.length == 0) {
      req.session.User = {
        userNumber,
        secret
      };
      res.redirect('smsVerification');
    } else {
      if (existUser.length !== 0) {
        res.send(
          "This number belongs to a Job Seeker, please provide other number"
        );
        // res.render('auth', { errormessage: 'This number belongs to a Job Seeker, please provide other number' });
      } else {
        req.session.User = {
          userNumber,
          secret
        };
        res.redirect('smsVerification');
      }
    }
  } catch (error) {
    res.send("Please provide a number");
    console.log(error);
  }
});

router.get("/proftype", authenticateUser,(req, res) => {
  res.render("proftype.html");
});

router.get("/jobposting", authenticateUser,(req, res) => {
  res.render("jobposting.html");
});


router.get("/authentication", (req, res) => {
  res.render("auth",{errormessage:''});
});
router.get("/smsVerification", (req, res) => {
  res.render("sms.html");
});
router.post("/smsVerification", (req, res) => {
  let digits = req.body.digit1 + req.body.digit2 + req.body.digit3 + req.body.digit4 + req.body.digit5 + req.body.digit6;
  console.log(digits)
  let secret = req.session.User.secret
  let valid = Speakeasy.totp.verify({
    secret: secret.base32,
    encoding:"base32",
    token: parseInt(digits)
    });

    if (valid == true){
        console.log("OTP matched")
        res.render("proftype.html");
    } else{
        console.log("Wrong OTP")
        res.send("Wrong Otp, Please Enter valid Otp")
    }
    });

router.post("/proftype",authenticateUser,(req, res) => {
  let userNumber = req.session.User.userNumber;
  const jobType = req.body.jobType;
  req.session.User = {
    userNumber,
    jobType,
  };
  res.redirect('/company/profinfo');
});

router.use(express.static(__dirname + "./public/"));

let Storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "businessPhoto[]") {
      cb(null, "public/uploads/businessPhoto");
    } else if (file.fieldname === "businessIncorporationCertificate[]") {
      cb(null, "public/uploads/businessincorporationcertificate");
    }
  },
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "_" + Date.now() + path.extname(file.originalname)
    );
    //   cb(null,req.body.nameOfBusiness+" "+file.fieldname+"_"+Date.now()+path.extname(file.originalname));
    // console.log(file.fieldname)
  },
});

let upload = multer({ storage: Storage });

// let multipleUpload = upload.fields([{name:'file1', maxcount:3},{name:'file2',maxcount:3}])

router.get("/profinfo",authenticateUser,(req, res) => {
  let userNumber = req.session.User.userNumber;
  res.render("profinfo",{number: userNumber});
});

//NEW USER WILL BE REGISTER TO DB THROUGH THIS API
router.post("/profinfo",upload.any(
    { name: "businessPhoto[]", maxcount: 3 },
    { name: "businessIncorporationCertificate[]", maxcount: 3 }
  ),authenticateUser,(req, res) => {
    let userNumber = req.session.User.userNumber;

    const user = new jobProvider({
      jobType: req.session.User.jobType,
      nameOfBusiness: req.body.nameOfBusiness,
      address: {
        addressLine: req.body.addressLine,
        streetName: req.body.streetName,
        city: req.body.city,
        state: req.body.state,
        pincode: req.body.pincode,
      },
      businessContactNumber: userNumber,
      businessNature: req.body.businessNature,
    });

    if (req.files){
    let path = "";
    let way = "";
    req.files.forEach(function (files, index, arr) {
      if (files.fieldname == "businessPhoto[]") {
        path = req.body.nameOfBusiness + path + files.path + ",";
        // console.log(path)
      }
      if (files.fieldname == "businessIncorporationCertificate[]") {
        way = way + files.path + ",";
        // console.log(path)
      }
    });
    path = path.substring(0, path.lastIndexOf(","));
    way = way.substring(0, way.lastIndexOf(","));
    user.businessPhoto = path;
    user.businessIncorporationCertificate = way;
  }

    user
      .save()
      .then(() => {
        res.render('jobposting.html', {number : userNumber});
      })
      .catch((e) => {
        res.send(e);
      });
    
  });

router.post("/jobdetails",(req, res) => {
  const jobdetails = new jobDetails({
    userNumber: req.session.User.userNumber,
    postName: req.body.postName,
    noOfPersons: req.body.noOfPersons,
    jobDays: req.body.jobDays,
    startDate: req.body.startDate,
    startTime: req.body.startTime,
    meridiem: req.body.meridiem,
    duration: req.body.duration,
    reportTime: req.body.reportTime,
    requiredExperience: req.body.requiredExperience,
    training: req.body.training,
    payment: req.body.payment,
    paymentMode: req.body.paymentMode,
    jobDescription: req.body.jobDescription,
    perks: req.body.perks,
  });
  jobdetails
    .save()
    .then(() => {
      res.redirect('livejobs');
    })
    .catch((e) => {
      res.send(e);
      console.log(e);
    });
});

router.get("/livejobs",authenticateUser,(req, res) => {
  let userNumber = req.session.User.userNumber;
  jobDetails.find({userNumber}).exec(function (err, data) {
    if (err) throw err;
    res.render('livejobs',{records:data})
  });
});

// here id should be of jobdetails
router.get("/delete/:id",authenticateUser,(req, res) => {
  let id = mongoose.Types.ObjectId(req.params.id);
  jobDetails.findByIdAndDelete(id).exec(function (err, data) {
    if (err) throw err;
    res.redirect('/company/livejobs');
  });
});

router.get("/applications",authenticateUser,(req, res) => {
  let userNumber = req.session.User.userNumber;
  jobDetails.find({userNumber}).exec(function (err, data) {
    if (err) throw err;
    res.render('applications',{records:data})
  });
});

router.post("/applicants",async(req, res) => {
  
  let userNumber = req.session.User.userNumber;
  let id = mongoose.Types.ObjectId(req.body.id);
  req.session.User = {
    userNumber,
    id,
  };

    let applicant =await jobDetails.find(id);
    // console.log(applicant)

   let appData =await applicant.forEach(async function(docs){
      applicants=await docs.applicants;

      let applicantData =await newUser.find({ _id: { $in: applicants } });
      // console.log(applicantData)
      res.render('applicants',{records:applicant,record:applicantData});
    })
  });

  router.get("/applicants",authenticateUser,async(req, res) => {
  
    let userNumber = req.session.User.userNumber;
    let id = mongoose.Types.ObjectId(req.session.User.id);
  
      let applicant =await jobDetails.find(id);
      // console.log(applicant)
  
     let appData =await applicant.forEach(async function(docs){
        applicants=await docs.applicants;
  
        let applicantData =await newUser.find({ _id: { $in: applicants } });
        // console.log(applicantData)
        res.render('applicants',{records:applicant,record:applicantData});
      })
    });
// here :id should be of jobdetails id
// router.get("/application/:id", async (req, res) => {
//   let id = mongoose.Types.ObjectId(req.params.id);

//   try {
//     let applicants = await jobDetails.findOne({ _id: id });
//     let data = applicants.applicants;
//     let applicantData = await newUser.find({ _id: { $in: data } });
//     res.send(applicantData);
//   } catch (error) {
//     console.log(error);
//   }
// });

// here :id should be of jobdetails id and jobseekers id will be fetch from body
router.post("/hire",(req, res) => {
  let mid = req.session.User.id;
  let id =mongoose.Types.ObjectId(mid);
  // let userId = mongoose.Types.ObjectId(req.params.id);
  let jobId = mongoose.Types.ObjectId( req.body.jobId);
  let applicantId =mongoose.Types.ObjectId( req.body.applicantId);
  // console.log(userId)
  jobDetails
    .findOneAndUpdate({ _id: jobId }, { $addToSet: { hired: applicantId } })
    .findOneAndUpdate({ _id: jobId }, { $pull: { applicants: applicantId } })
    .exec(async function (err, docs) {
      if (err) throw err;
      
      let applicant =await jobDetails.find(id);
      // console.log(applicant)
  
     let appData =await applicant.forEach(async function(docs){
        applicants=await docs.applicants;
  
        let applicantData =await newUser.find({ _id: { $in: applicants } });
        // console.log(applicantData)
        res.render('applicants',{records:applicant,record:applicantData});
      })

    });
  newUser
    .findOneAndUpdate({ _id: applicantId }, { $addToSet: { hiredfor: jobId } })
    .exec(function (err, docs) {
      if (err) throw err;
    });
    // console.log("Hire")
});

router.post("/reject",async(req, res) => {
  let mid = req.session.User.id;
  let id =mongoose.Types.ObjectId(mid);

  let jobId =mongoose.Types.ObjectId(req.body.jobId);
  let applicantId =mongoose.Types.ObjectId(req.body.applicantId);

  console.log("Rejected Applicant of Job",jobId)
  console.log("Rejected Applicant Id",applicantId)

  jobDetails
    .findOneAndUpdate({ _id: jobId }, { $pull: { applicants: applicantId } })
    .exec(async function (err, docs) {
      if (err) throw err;
      
      let applicant =await jobDetails.find(id);
      // console.log(applicant)
  
     let appData =await applicant.forEach(async function(docs){
        applicants=await docs.applicants;
  
        let applicantData =await newUser.find({ _id: { $in: applicants } });
        // console.log(applicantData)
        res.render('applicants',{records:applicant,record:applicantData});
      })

    });
  newUser
    .findOneAndUpdate({ _id: applicantId }, { $addToSet: { hiredfor: jobId } })
    .exec(function (err, docs) {
      if (err) throw err;
    });
});

router.get("/logout", authenticateUser, (req, res) => {
  req.session.User = null;
  res.render("auth.html");
});
module.exports = router;
