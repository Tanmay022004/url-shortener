require("dotenv").config();
const express = require("express");
const path = require("path");
const connectDB = require("./config/db");

const app = express();

// Connect DB first (important for production stability)
connectDB();

app.set('trust proxy', 1);

// Middleware
app.use(express.json());

// Serve frontend
app.use(express.static(path.join(__dirname, "../public")));

// Routes
app.use("/", require("./routes/urlRoutes"));

// Homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Port (IMPORTANT for deployment)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});