const Response = require('../models/Response');

// Save a Dynamic Form Submission
exports.saveResponse = async (req, res) => {
  try {
    const { formId, data } = req.body;
    const submission = new Response({ formId, data });
    await submission.save();
    res.status(201).json(submission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Responses for a specific form
exports.getResponsesByFormId = async (req, res) => {
  try {
    const responses = await Response.find({ formId: req.params.formId }).sort({ submittedAt: -1 });
    res.json(responses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a specific response by ID
exports.deleteResponseById = async (req, res) => {
  try {
    const result = await Response.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ error: 'Response not found' });
    res.json({ message: 'Response deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete all responses for a form
exports.deleteAllResponsesForForm = async (req, res) => {
  try {
    const result = await Response.deleteMany({ formId: req.params.formId });
    res.json({ message: `Deleted ${result.deletedCount} response(s)` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
