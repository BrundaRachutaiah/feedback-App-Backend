import express from "express";
import crypto from "crypto";
import querystring from "querystring";

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
  const { shop, hmac, code, state } = req.query;

  if (!shop || !hmac || !code) {
    return res.status(400).send("Required parameters missing");
  }

  // ✅ Verify HMAC (security check)
  const map = { ...req.query };
  delete map["hmac"];

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
    // ✅ Exchange code for access token
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
     * TODO (Next step):
     * Save shop + accessToken in DB
     */

    return res.send(
      "✅ Shopify app installed successfully. You can close this window."
    );
  } catch (err) {
    console.error(err.response?.data || err.message);
    return res.status(500).send("Failed to get access token");
  }
});

export default router;