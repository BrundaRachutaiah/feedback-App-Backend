const supabase = require('../config/supabase');

exports.createShop = async (req, res) => {
  try {
    const {
      name,
      parameters,
      google_review_link,
      max_feedback_per_device_per_day,
      coupon_enabled,
      coupon_code,
      coupon_message,
    } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Shop name is required" });
    }

    // 1️⃣ Create shop
    const { data: shop, error: shopError } = await supabase
      .from("shops")
      .insert([{
        admin_id: req.user.id,
        shop_name: name,
        google_review_url: google_review_link || null,

        max_feedback_per_device_per_day: max_feedback_per_device_per_day || 1,

        coupon_enabled: coupon_enabled || false,
        coupon_code: coupon_enabled ? coupon_code : null,
        coupon_message: coupon_enabled ? coupon_message : null,
      }])
      .select()
      .single();

    if (shopError) {
      return res.status(400).json({ error: shopError.message });
    }

    // 2️⃣ Insert feedback parameters (max 3)
    if (Array.isArray(parameters)) {
      const filteredParams = parameters
        .map((p) => p.trim())
        .filter(Boolean)
        .slice(0, 3);

      if (filteredParams.length > 0) {
        const paramRows = filteredParams.map((label) => ({
          shop_id: shop.id,
          label,
        }));

        await supabase
          .from("feedback_parameters")
          .insert(paramRows);
      }
    }

    res.status(201).json(shop);

  } catch (error) {
    console.error("Create shop error:", error);
    res.status(500).json({ message: "Failed to create shop" });
  }
};

exports.addParameter = async (req, res) => {
  const { label } = req.body;
  const shopId = req.params.shopId;

  const { data: params } = await supabase
    .from('feedback_parameters')
    .select('*')
    .eq('shop_id', shopId);

  if (params.length >= 3) {
    return res.status(400).json({ message: 'Max 3 parameters allowed' });
  }

  await supabase
    .from('feedback_parameters')
    .insert([{ shop_id: shopId, label }]);

  res.json({ message: 'Parameter added' });
};

exports.getShopFeedback = async (req, res) => {
  const supabase = require('../config/supabase');
  const shopId = req.params.shopId;

  const { data, error } = await supabase
    .from('feedback')
    .select('rating, param_scores, comment, created_at')
    .eq('shop_id', shopId)
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.json(data);
};

exports.getMyShops = async (req, res) => {
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("admin_id", req.user.id);

  if (error) return res.status(400).json({ error: error.message });

  res.json(data);
};

exports.updateShopSettings = async (req, res) => {
  try {
    const {
      maxFeedbackPerDevicePerDay,
      coupon_enabled,
      coupon_code,
      coupon_message,
      google_review_url,
    } = req.body;

    const shopId = req.params.shopId;

    const updateData = {};

    if (maxFeedbackPerDevicePerDay) {
      updateData.max_feedback_per_device_per_day =
        maxFeedbackPerDevicePerDay;
    }

    if (typeof coupon_enabled === "boolean") {
      updateData.coupon_enabled = coupon_enabled;
      updateData.coupon_code = coupon_enabled ? coupon_code : null;
      updateData.coupon_message = coupon_enabled ? coupon_message : null;
    }

    if (google_review_url !== undefined) {
      updateData.google_review_url = google_review_url || null;
    }

    const { error } = await supabase
      .from("shops")
      .update(updateData)
      .eq("id", shopId);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};

/* ---------------- DELETE SHOP (DANGER ZONE) ---------------- */
exports.deleteShop = async (req, res) => {
  const shopId = req.params.shopId;

  try {
    await supabase.from("feedback").delete().eq("shop_id", shopId);
    await supabase
      .from("feedback_parameters")
      .delete()
      .eq("admin_id", req.user.id)

    const { error } = await supabase
  .from("shops")
  .update(updateData)
  .eq("id", shopId)
  .eq("admin_id", req.user.id);


    if (error) return res.status(400).json({ error: error.message });

    res.json({ success: true });
  } catch {
    res.status(500).json({ message: "Failed to delete shop" });
  }
};