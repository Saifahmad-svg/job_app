const mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/yuung",{
    useCreateIndex : true,
    useNewUrlParser : true,
    useUnifiedTopology : true
}).then(()=>{
    console.log("Connection Established");
}).catch((e) => {
    console.log("No connection");
    console.log(e)
})

