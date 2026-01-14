const express = require("express");
const crypto = require("crypto");
const querystring = require("querystring");
const axios = require("axios");

const router = express.Router();

/**
 * STEP 1: Redirect merchant to Shopify OAuth
 */
router.get("/install", (req, res) => {
  const { shop } = req.query;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  const redirectUri = `${process.env.SHOPIFY_APP_URL}/shopify/callback`;

  const installUrl =
    `https://${shop}/admin/oauth/authorize?` +
    querystring.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      scope: process.env.SHOPIFY_SCOPES,
      redirect_uri: redirectUri,
      state: crypto.randomBytes(16).toString("hex"),
    });

  return res.redirect(installUrl);
});

/**
 * STEP 2: Shopify OAuth callback
 */
router.get("/callback", async (req, res) => {
  const { shop, hmac, code, host } = req.query;

  if (!shop || !hmac || !code || !host) {
    return res.status(400).send("Required parameters missing");
  }

  // 🔐 Verify HMAC
  const map = { ...req.query };
  delete map.hmac;

  const message = Object.keys(map)
    .sort()
    .map((key) => `${key}=${map[key]}`)
    .join("&");

  const generatedHmac = crypto
    .createHmac("sha256", process.env.SHOPIFY_CLIENT_SECRET)
    .update(message)
    .digest("hex");

  if (generatedHmac !== hmac) {
    return res.status(401).send("HMAC validation failed");
  }

  try {
    // 🔁 Exchange code for access token
    await axios.post(`https://${shop}/admin/oauth/access_token`, {
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      code,
    });

    /**
     * TODO:
     * Save shop + accessToken in DB
     */

    // ✅ IMPORTANT:
    // Redirect BACK to App URL (NOT frontend)
    return res.redirect(`/?shop=${shop}&host=${host}`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).send("Failed to get access token");
  }
});

module.exports = router;
