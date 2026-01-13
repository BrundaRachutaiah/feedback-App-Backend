const supabase = require('../config/supabase');

exports.submitFeedback = async (req, res) => {
  try {
    const {
      rating,
      param_scores,
      comment,
      deviceId,
      service,
      quality,
      cleanliness,
    } = req.body;

    const device_id = deviceId;
    const shopId = req.params.shopId;

    /* 1️⃣ Fetch shop config */
    const { data: shop, error: shopError } = await supabase
      .from('shops')
      .select(`
        max_feedback_per_device_per_day,
        google_review_url,
        coupon_enabled,
        coupon_code,
        coupon_message
      `)
      .eq('id', shopId)
      .single();

    if (shopError) {
      return res.status(400).json({ message: 'Invalid shop' });
    }

    const maxLimit = shop.max_feedback_per_device_per_day || 1;

    /* 2️⃣ Count today’s feedback */
    const today = new Date().toISOString().slice(0, 10);

    const { count } = await supabase
      .from('feedback')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('device_id', device_id)
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`);

    if (count >= maxLimit) {
      return res.status(429).json({
        message: 'You already submitted feedback today. Please try again tomorrow.',
      });
    }

    /* 3️⃣ Insert feedback */
    await supabase.from('feedback').insert([{
      shop_id: shopId,
      rating,
      comment,
      device_id,
      param_scores: param_scores || {
        Service: service || null,
        Quality: quality || null,
        Cleanliness: cleanliness || null,
      },
    }]);

    /* 4️⃣ Google review */
    const showGoogleReview = rating >= 4;

    /* 5️⃣ Coupon abuse-safe logic */
    const { count: totalCount } = await supabase
      .from('feedback')
      .select('id', { count: 'exact', head: true })
      .eq('shop_id', shopId)
      .eq('device_id', device_id);

    const alreadyClaimedCoupon = totalCount > 1;

    const showCoupon =
      rating >= 4 &&
      shop.coupon_enabled &&
      shop.coupon_code &&
      !alreadyClaimedCoupon;

    res.json({
      showGoogleReview,
      googleReviewUrl: showGoogleReview ? shop.google_review_url : null,

      showCoupon,
      couponCode: showCoupon ? shop.coupon_code : null,
      couponMessage: showCoupon
        ? shop.coupon_message || 'Use this coupon on your next purchase'
        : null,
    });

  } catch (error) {
    console.error('Feedback submit error:', error);
    res.status(500).json({ message: 'Failed to submit feedback' });
  }
};

exports.exportFeedbackCSV = async (req, res) => {
  try {
    const shopId = req.params.shopId;

    const { data, error } = await supabase
      .from("feedback")
      .select(`
        rating,
        param_scores,
        comment,
        device_id,
        created_at
      `)
      .eq("shop_id", shopId)
      .order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({ message: error.message });
    }

    // 1️⃣ CSV header
    let csv =
      "Rating,Service,Quality,Cleanliness,Comment,Device ID,Date\n";

    // 2️⃣ Rows
    data.forEach((f) => {
      const params = f.param_scores || {};

      csv += [
        f.rating,
        params.Service || "",
        params.Quality || "",
        params.Cleanliness || "",
        `"${(f.comment || "").replace(/"/g, '""')}"`,
        f.device_id,
        new Date(f.created_at).toLocaleString(),
      ].join(",") + "\n";
    });

    // 3️⃣ Response headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=feedback-${shopId}.csv`
    );
    res.setHeader("Content-Type", "text/csv");

    res.send(csv);
  } catch (err) {
    console.error("CSV export error:", err);
    res.status(500).json({ message: "Failed to export CSV" });
  }
};
