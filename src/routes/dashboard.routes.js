const express = require("express");
const router = express.Router();
const supabase = require("../config/supabase");
const auth = require("../middleware/auth.middleware");
const { getShopStats } = require("../controllers/dashboard.controller");

router.use(auth);

/* ---------- SINGLE SHOP ---------- */
router.get("/shop/:shopId", getShopStats);

/* ---------- BATCH STATS ---------- */
router.post("/batch", async (req, res) => {
  try {
    const { shopIds } = req.body;

    if (!Array.isArray(shopIds) || shopIds.length === 0) {
      return res.json({});
    }

    // 🔐 GET ONLY OWNED SHOPS
    const { data: ownedShops } = await supabase
      .from("shops")
      .select("id")
      .eq("admin_id", req.user.id)
      .in("id", shopIds);

    const allowedIds = ownedShops.map(s => s.id);

    if (allowedIds.length === 0) {
      return res.json({});
    }

    const { data, error } = await supabase
      .from("feedback")
      .select("shop_id, rating")
      .in("shop_id", allowedIds);

    if (error) throw error;

    const stats = {};
    data.forEach(f => {
      stats[f.shop_id] ??= { totalFeedback: 0, sum: 0 };
      stats[f.shop_id].totalFeedback++;
      stats[f.shop_id].sum += f.rating;
    });

    Object.keys(stats).forEach(id => {
      stats[id].avgRating = (
        stats[id].sum / stats[id].totalFeedback
      ).toFixed(1);
    });

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Batch failed" });
  }
});

module.exports = router;