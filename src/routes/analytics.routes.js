const express = require("express");
const router = express.Router();
const { getCouponStats, getGlobalAnalytics } = require("../controllers/analytics.controller");


/* ----------------------------
   GLOBAL ANALYTICS (ADMIN)
---------------------------- */
router.get("/global", getGlobalAnalytics);

router.get("/coupon/:shopId", getCouponStats);

module.exports = router;
