const mongoose = require("mongoose");

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI, {
    dbName: "urlShortener"
  });
  console.log("MongoDB connected");
};

module.exports = connectDB;