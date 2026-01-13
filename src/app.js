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

// ✅ BUSINESS ROUTES
app.use("/api/shops", shopRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);

// ✅ SHOPIFY ROUTES
app.use("/shopify", shopifyRoutes);

module.exports = app;