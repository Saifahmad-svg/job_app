/** @format */

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jobProvider = require("../models/jobProvider");
const newUser = require("../models/newUser");
const jobDetails = require("../models/jobDetails");
const jobtype = require("../models/jobType");
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
  if (!userNumber) {
    res.send("Please enter all the fields");
    return;
  }
  try {
    let existUser = await newUser.find({ userNumber: { $in: userNumber } });
    let existJobProvider = await jobProvider.find({
      businessContactNumber: { $in: userNumber },
    });
    if (existUser.length == 0 && existJobProvider.length == 0) {
      req.session.User = {
        userNumber,
      };
      res.redirect('/company/smsAuthentication');
    } else {
      if (existUser.length !== 0) {
        res.send(
          "This number belongs to a Job Seeker, please provide other number"
        );
      } else {
        req.session.User = {
          userNumber,
        };
        res.send("Logged In");
      }
    }
  } catch (error) {
    res.send("Please provide a number");
    console.log(error);
  }
});

router.get("/proftype", (req, res) => {
  res.render("proftype.html");
});

router.get("/jobposting", (req, res) => {
  res.render("jobposting.html");
});


router.get("/authentication", (req, res) => {
  res.render("auth.html");
});
router.get("/smsVerification", (req, res) => {
  res.render("sms.html");
});
router.post("/smsVerification", (req, res) => {
  res.render("proftype.html");
});

router.post("/proftype", (req, res) => {
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

router.get("/profinfo", (req, res) => {
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

router.post("/jobdetails", (req, res) => {
  const jobdetails = new jobDetails({
    userNumber: req.session.User.userNumber,
    postName: req.body.postName,
    noOfPersons: req.body.noOfPersons,
    jobDays: req.body.jobDays,
    startDate: req.body.startDate,
    startTime: req.body.startTime,
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

router.get("/livejobs", (req, res) => {
  let userNumber = req.session.User.userNumber;
  jobDetails.find({userNumber}).exec(function (err, data) {
    if (err) throw err;
    res.render('livejobs',{records:data})
  });
});

// here id should be of jobdetails
router.get("/delete/:id", (req, res) => {
  let id = mongoose.Types.ObjectId(req.params.id);
  jobDetails.findByIdAndDelete(id).exec(function (err, data) {
    if (err) throw err;
    res.redirect('/company/livejobs');
  });
});

router.get("/applications", (req, res) => {
  let userNumber = req.session.User.userNumber;
  jobDetails.find({userNumber}).exec(function (err, data) {
    if (err) throw err;
    res.render('applications',{records:data})
  });
});

router.get("/applicants/:id", async(req, res) => {
  let userNumber = req.session.User.userNumber;
  let id = mongoose.Types.ObjectId(req.params.id);

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
router.get("/application/:id", async (req, res) => {
  let id = mongoose.Types.ObjectId(req.params.id);

  try {
    let applicants = await jobDetails.findOne({ _id: id });
    let data = applicants.applicants;
    let applicantData = await newUser.find({ _id: { $in: data } });
    res.send(applicantData);
  } catch (error) {
    console.log(error);
  }
});

// here :id should be of jobdetails id and jobseekers id will be fetch from body
router.get("/hire/:id", (req, res) => {
  let id = mongoose.Types.ObjectId(req.params.id);
  let userId = req.body.userId;
  jobDetails
    .findOneAndUpdate({ _id: id }, { $addToSet: { hired: userId } })
    .exec(function (err, docs) {
      if (err) throw err;
      res.send("Hired successfully");
    });
  newUser
    .findOneAndUpdate({ _id: userId }, { $addToSet: { hiredfor: id } })
    .exec(function (err, docs) {
      if (err) throw err;
    });
    console.log("Hire")
});
module.exports = router;
