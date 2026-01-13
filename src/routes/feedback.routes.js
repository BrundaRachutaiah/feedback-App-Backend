const router = require('express').Router();
const { submitFeedback,  exportFeedbackCSV  } = require('../controllers/feedback.controller');

router.post('/:shopId', submitFeedback);
router.get("/:shopId/export", exportFeedbackCSV);

module.exports = router;
