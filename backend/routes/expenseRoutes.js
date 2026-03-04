const express = require('express');
const router = express.Router();
const { createExpense, getExpenses } = require('../controllers/expenseController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createExpense)
    .get(protect, getExpenses);

module.exports = router;