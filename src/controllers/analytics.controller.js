const supabase = require("../config/supabase");

exports.getCouponStats = async (req, res) => {
  try {
    const { shopId } = req.params;

    const { data: feedback, error } = await supabase
      .from("feedback")
      .select("rating, device_id, created_at")
      .eq("shop_id", shopId);

    if (error) throw error;

    const feedbackList = feedback || [];

    const totalFeedback = feedbackList.length;

    // ⭐ 4+ feedback
    const highRating = feedbackList.filter(
      (f) => f.rating >= 4
    );

    // Unique device count
    const uniqueDevices = new Set(
      highRating.map((f) => f.device_id)
    );

    const couponShownCount = uniqueDevices.size;

    const conversionRate =
      totalFeedback > 0
        ? ((couponShownCount / totalFeedback) * 100).toFixed(1)
        : "0.0";

    // ⭐ Rating distribution
    const ratingDistribution = {
      1: 0,
      2: 0,
      3: 0,
      4: 0,
      5: 0,
    };

    // 📈 Daily rating trend
    const dailyMap = {};

    feedbackList.forEach((f) => {
      // Distribution
      if (ratingDistribution[f.rating] !== undefined) {
        ratingDistribution[f.rating]++;
      }

      // Trend
      const date = new Date(f.created_at)
        .toISOString()
        .split("T")[0];

      if (!dailyMap[date]) {
        dailyMap[date] = { total: 0, count: 0 };
      }

      dailyMap[date].total += f.rating;
      dailyMap[date].count += 1;
    });

    const ratingTrend = Object.keys(dailyMap)
      .sort()
      .map((date) => ({
        date,
        avgRating: (
          dailyMap[date].total / dailyMap[date].count
        ).toFixed(2),
      }));

    res.json({
      totalFeedback,
      highRatingCount: highRating.length,
      couponShownCount,
      conversionRate,
      ratingDistribution,
      ratingTrend,
    });
  } catch (err) {
    console.error("Coupon analytics error:", err);
    res.status(500).json({
      message: "Failed to load coupon stats",
    });
  }
};

exports.getGlobalAnalytics = async (req, res) => {
  try {
    const { data } = await supabase
      .from("feedback")
      .select("rating, created_at");

    const ratingDistribution = {1:0,2:0,3:0,4:0,5:0};
    const daily = {};

    data.forEach(f => {
      ratingDistribution[f.rating]++;
      const d = f.created_at.split("T")[0];
      daily[d] ??= { sum: 0, count: 0 };
      daily[d].sum += f.rating;
      daily[d].count++;
    });

    const ratingTrend = Object.entries(daily).map(([date, v]) => ({
      date,
      avgRating: (v.sum / v.count).toFixed(2)
    }));

    res.json({
      totalFeedback: data.length,
      ratingDistribution,
      ratingTrend
    });
  } catch {
    res.status(500).json({ message: "Global analytics failed" });
  }
};