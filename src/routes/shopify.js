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

export default router;