const express = require('express');
const router = express.Router();
const { getHolidays, createHoliday, getSuccessStories, createSuccessStory } = require('../controllers/utilityController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/holidays')
    .get(protect, getHolidays)
    .post(protect, admin, createHoliday);

router.route('/success-stories')
    .get(protect, getSuccessStories)
    .post(protect, admin, createSuccessStory);

module.exports = router;