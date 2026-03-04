const mongoose = require('mongoose');

const holidaySchema = mongoose.Schema({
    date: { type: Date, required: true, unique: true },
    name: { type: String, required: true },
    type: { type: String, enum: ['public', 'optional'], default: 'public' },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true,
});

const Holiday = mongoose.model('Holiday', holidaySchema);
module.exports = Holiday;