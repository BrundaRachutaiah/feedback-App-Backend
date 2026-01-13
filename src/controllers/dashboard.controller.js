const supabase = require("../config/supabase");

exports.getShopStats = async (req, res) => {
  try {
    const { shopId } = req.params;

    // 🔐 OWNERSHIP CHECK
    const { data: shop } = await supabase
      .from("shops")
      .select("id")
      .eq("id", shopId)
      .eq("admin_id", req.user.id)
      .single();

    if (!shop) {
      return res.status(403).json({ message: "Access denied" });
    }

    // ✅ SAFE QUERY
    const { data, error } = await supabase
      .from("feedback")
      .select("rating, created_at")
      .eq("shop_id", shopId);

    if (error) throw error;

    const total = data.length;
    const avgRating =
      total > 0
        ? (
            data.reduce((sum, f) => sum + f.rating, 0) / total
          ).toFixed(1)
        : "0.0";

    res.json({ totalFeedback: total, avgRating });
  } catch (err) {
    console.error("Dashboard stats error:", err);
    res.status(500).json({ message: "Failed to load stats" });
  }
};