const express = require('express');
const app = express();
const port = 80;
const path = require("path");
require("./api/db/conn");

app.use(express.json());
app.use(express.urlencoded({extended:false}));

app.set('views', path.join(__dirname, 'templates'));
app.set('view engine','ejs');
app.use( express.static("public") );
app.engine('html', require('ejs').renderFile);

app.use("/user", require("./api/routes/user"));
app.use("/company", require("./api/routes/company"));

app.listen(port,()=>{
    console.log(`App is running on ${port}`)
})