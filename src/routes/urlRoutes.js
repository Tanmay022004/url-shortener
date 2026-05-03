const express = require("express");
const router = express.Router();
const limiter = require("../middleware/rateLimiter");

const {
  createShortUrl,
  redirectUrl,
  getAnalytics
} = require("../controllers/urlController");

router.post("/shorten", limiter, createShortUrl);
router.get("/:code", redirectUrl);
router.get("/analytics/:code", getAnalytics);

module.exports = router;