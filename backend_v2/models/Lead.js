const mongoose = require('mongoose');

const leadSchema = mongoose.Schema({
    full_name: { type: String, required: true },
    email: { type: String },
    phone: { type: String },
    college: { type: String },
    address: { type: String },
    status: {
        type: String,
        enum: ['new', 'contacted', 'shortlisted', 'not_interested', 'enrolled'],
        default: 'new'
    },
    source: { type: String },
    course_interest: { type: String },
    assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true,
});

const Lead = mongoose.model('Lead', leadSchema);
module.exports = Lead;