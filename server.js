// import packages
const express = require('express');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
// const User = require('./models/User');
const userRoute = require('./routes/api/users');
require('dotenv').config();

// initializations
const app = express();
const port = process.env.PORT || 8080;

// body parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// connect database
connectDB();

app.use('/api/users', userRoute);

//! check connection endpoint
app.get('/', (req, res) => {
    res.send(`test connection`);
});

// server listening
app.listen(port, () => {
    console.log(`server running at ${port}`);
});
