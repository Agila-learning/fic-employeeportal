const Holiday = require('../models/Holiday');
const SuccessStory = require('../models/SuccessStory');

const getHolidays = async (req, res) => {
    try {
        const holidays = await Holiday.find({});
        res.json(holidays);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createHoliday = async (req, res) => {
    try {
        const holiday = await Holiday.create({ ...req.body, created_by: req.user._id });
        res.status(201).json(holiday);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

const getSuccessStories = async (req, res) => {
    try {
        const stories = await SuccessStory.find({});
        res.json(stories);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const createSuccessStory = async (req, res) => {
    try {
        const story = await SuccessStory.create({ ...req.body, created_by: req.user._id });
        res.status(201).json(story);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = { getHolidays, createHoliday, getSuccessStories, createSuccessStory };