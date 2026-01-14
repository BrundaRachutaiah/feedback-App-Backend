const express = require("express");
const crypto = require("crypto");
const querystring = require("querystring");
const axios = require("axios");

const router = express.Router();

/**
 * STEP 1: Redirect merchant to Shopify OAuth screen
 */
router.get("/install", (req, res) => {
  const shop = req.query.shop;

  if (!shop) {
    return res.status(400).send("Missing shop parameter");
  }

  const nonce = crypto.randomBytes(16).toString("hex");

  const redirectUri = `${process.env.SHOPIFY_APP_URL}/shopify/callback`;

  const installUrl =
    `https://${shop}/admin/oauth/authorize?` +
    querystring.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      scope: process.env.SHOPIFY_SCOPES,
      redirect_uri: redirectUri,
      state: nonce,
    });

  return res.redirect(installUrl);
});

/**
 * STEP 2: Shopify redirects here after authorization
 */
router.get("/callback", async (req, res) => {
  const { shop, hmac, code } = req.query;

  if (!shop || !hmac || !code) {
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
    const tokenResponse = await axios.post(
      `https://${shop}/admin/oauth/access_token`,
      {
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        code,
      }
    );

    const accessToken = tokenResponse.data.access_token;

    /**
     * TODO (later):
     * Save shop + accessToken in DB
     */

    // ✅ Redirect to embedded app entry
    return res.redirect(`/shopify/app?shop=${shop}`);
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).send("Failed to get access token");
  }
});

/**
 * STEP 3: EMBEDDED APP ENTRY POINT
 */
router.get("/app", (req, res) => {
  const shop = req.query.shop;
  // 👇 ADD THIS: Capture the host parameter
  const host = req.query.host; 

  // 👇 UPDATE THIS: Pass the host to your frontend
  return res.redirect(
    `https://feedback-app-frontend-beta.vercel.app?shop=${shop}&host=${host}`
  );
});

module.exports = router;