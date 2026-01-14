const express = require("express");
const cors = require("cors");

const shopRoutes = require("./routes/shop.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const shopifyRoutes = require("./routes/shopify");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  const shop = req.query.shop;
  const host = req.query.host;

  if (!shop || !host) {
    return res.send("Feedback App backend running");
  }

  return res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta
          http-equiv="Content-Security-Policy"
          content="frame-ancestors https://admin.shopify.com https://*.myshopify.com"
        />
        <title>Feedback App</title>
        <style>
          html, body {
            margin: 0;
            padding: 0;
            height: 100%;
          }
          iframe {
            width: 100%;
            height: 100vh;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe
          src="https://feedback-app-frontend-beta.vercel.app?shop=${shop}&host=${host}"
        ></iframe>
      </body>
    </html>
  `);
});

// ✅ BUSINESS ROUTES
app.use("/api/shops", shopRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);

// ✅ SHOPIFY ROUTES
app.use("/shopify", shopifyRoutes);

module.exports = app;