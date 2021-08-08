const mongoose = require("mongoose");
const reviewSchema = new mongoose.Schema({
    userName : String,
    review : Number,
    message: String
})

//Create New Collection
const Review = new mongoose.model('Review',reviewSchema);

 module.exports = Review;