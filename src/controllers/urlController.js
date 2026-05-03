const Url = require("../models/url");
const generateCode = require("../utils/generateCode");

const BASE_URL = process.env.BASE_URL;

// simple in-memory cache (since no Redis)
const cache = {};

// Create Short URL
exports.createShortUrl = async (req, res) => {
  try {
    const { originalUrl, customCode } = req.body;

    // Validate URL
    try {
      new URL(originalUrl);
    } catch {
      return res.status(400).json({ error: "Invalid URL" });
    }

    // Check duplicate
    const existing = await Url.findOne({ originalUrl }).lean();
    if (existing) {
      return res.json({
        shortUrl: `${BASE_URL}/${existing.shortCode}`
      });
    }

    let shortCode = customCode;

    // Handle custom code
    if (shortCode) {
      const exists = await Url.findOne({ shortCode }).lean();
      if (exists) {
        return res.status(400).json({ error: "Custom code already taken" });
      }
    } else {
      let exists = true;
      while (exists) {
        shortCode = generateCode();
        exists = await Url.findOne({ shortCode }).lean();
      }
    }

    // Expiry
    const expiresInDays = 7;
    const expiresAt = new Date(
      Date.now() + expiresInDays * 24 * 60 * 60 * 1000
    );

    await Url.create({
      originalUrl,
      shortCode,
      expiresAt
    });

    // store in cache
    cache[shortCode] = originalUrl;

    res.json({
      shortUrl: `${BASE_URL}/${shortCode}`
    });

  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Redirect
exports.redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;

    // 🚀 1. Check cache first (FAST)
    if (cache[code]) {
      Url.updateOne(
        { shortCode: code },
        { $inc: { clicks: 1 } }
      ).catch(() => {});

      return res.redirect(cache[code]);
    }

    // 🚀 2. Fetch from DB (use lean for speed)
    const url = await Url.findOne({ shortCode: code }).lean();

    if (!url) {
      return res.status(404).json({ error: "Not found" });
    }

    // Expiry check
    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).json({ error: "Link expired" });
    }

    // store in cache
    cache[code] = url.originalUrl;

    // 🚀 3. Non-blocking update (NO await)
    Url.updateOne(
      { shortCode: code },
      { $inc: { clicks: 1 } }
    ).catch(() => {});

    // 🚀 4. Redirect immediately
    return res.redirect(url.originalUrl);

  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

// Analytics
exports.getAnalytics = async (req, res) => {
  try {
    const { code } = req.params;

    const url = await Url.findOne({ shortCode: code }).lean();

    if (!url) {
      return res.status(404).json({ error: "Not found" });
    }

    res.json({
      originalUrl: url.originalUrl,
      clicks: url.clicks,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt
    });

  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};