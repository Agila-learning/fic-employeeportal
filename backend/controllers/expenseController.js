const Expense = require('../models/Expense');

const createExpense = async (req, res) => {
    const { description, amount, category, date } = req.body;
    try {
        const expense = await Expense.create({
            description,
            amount,
            category,
            date,
            user_id: req.user._id,
        });
        res.status(201).json(expense);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getExpenses = async (req, res) => {
    try {
        const filter = req.user.role === 'admin' ? {} : { user_id: req.user._id };
        const expenses = await Expense.find(filter).populate('user_id', 'name email');
        res.json(expenses);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { createExpense, getExpenses };
