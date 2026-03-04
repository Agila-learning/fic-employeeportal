const mongoose = require('mongoose');

const successStorySchema = mongoose.Schema({
    candidate_name: { type: String, required: true },
    package: { type: String },
    location: { type: String },
    domain: { type: String },
    motivation_story: { type: String },
    image_url: { type: String },
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, {
    timestamps: true,
});

const SuccessStory = mongoose.model('SuccessStory', successStorySchema);
module.exports = SuccessStory;