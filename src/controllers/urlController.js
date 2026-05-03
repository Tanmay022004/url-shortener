const Url = require("../models/url");
const generateCode = require("../utils/generateCode");
const QRCode = require("qrcode");

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

    // Check duplicate URL
    const existing = await Url.findOne({ originalUrl }).lean();
    if (existing) {
      const shortUrl = `${BASE_URL}/${existing.shortCode}`;
      const qrCode = await QRCode.toDataURL(shortUrl);

      return res.json({ shortUrl, qrCode });
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

    // Expiry (7 days)
    const expiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    await Url.create({
      originalUrl,
      shortCode,
      expiresAt
    });

    const shortUrl = `${BASE_URL}/${shortCode}`;
    const qrCode = await QRCode.toDataURL(shortUrl);

    // cache it
    cache[shortCode] = originalUrl;

    return res.json({
      shortUrl,
      qrCode
    });

  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};

// Redirect
exports.redirectUrl = async (req, res) => {
  try {
    const { code } = req.params;

    // 1. Cache check
    if (cache[code]) {
      Url.updateOne(
        { shortCode: code },
        { $inc: { clicks: 1 } }
      ).catch(() => {});

      return res.redirect(cache[code]);
    }

    // 2. DB fetch
    const url = await Url.findOne({ shortCode: code }).lean();

    if (!url) {
      return res.status(404).json({ error: "Not found" });
    }

    // 3. Expiry check
    if (url.expiresAt && url.expiresAt < new Date()) {
      return res.status(410).json({ error: "Link expired" });
    }

    // 4. cache store
    cache[code] = url.originalUrl;

    // 5. async click tracking
    Url.updateOne(
      { shortCode: code },
      { $inc: { clicks: 1 } }
    ).catch(() => {});

    // 6. redirect
    return res.redirect(url.originalUrl);

  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
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

    return res.json({
      originalUrl: url.originalUrl,
      clicks: url.clicks,
      createdAt: url.createdAt,
      expiresAt: url.expiresAt
    });

  } catch (err) {
    return res.status(500).json({ error: "Internal server error" });
  }
};