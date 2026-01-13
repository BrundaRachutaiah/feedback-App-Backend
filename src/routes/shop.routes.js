const router = require("express").Router();
const auth = require("../middleware/auth.middleware");

const {
  createShop,
  addParameter,
  getShopFeedback,
  getMyShops,
  updateShopSettings,
  deleteShop,
} = require("../controllers/shop.controller");

router.get("/", auth, getMyShops);          // 🔴 REQUIRED
router.post("/", auth, createShop);
router.post("/:shopId/parameters", auth, addParameter);
router.get("/:shopId/feedback", auth, getShopFeedback);
router.put('/:shopId/settings', auth, updateShopSettings);
router.delete("/:shopId", auth, deleteShop);

module.exports = router;
