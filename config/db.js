const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.MONGO_URI;

const connectDB = async () => {
    try {
        await mongoose.connect(uri, { useNewUrlParser: true });
        console.log(`Mongoose Default Connection Open`);
    } catch (error) {
        console.error(error.message);
    }
};

module.exports = connectDB;
