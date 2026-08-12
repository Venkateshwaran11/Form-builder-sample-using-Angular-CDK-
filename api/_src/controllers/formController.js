const Form = require('../models/Form');
const Response = require('../models/Response');

// Save or Update a Form Config
exports.saveOrUpdateForm = async (req, res) => {
  try {
    const { name, displayName, config, _id } = req.body;
    const filter = _id ? { _id } : { name };
    const isExistingForm = await Form.find({ name: name });
    if (isExistingForm.length > 0 && !_id) {
      return res.status(400).json({ error: 'Form already exists' });
    }
    let form = await Form.findOneAndUpdate(
      filter,
      {
        $set: {
          name,
          displayName,
          config,
          updatedAt: Date.now()
        },
        $setOnInsert: {
          createdAt: Date.now()
        }
      },
      { new: true, upsert: true }
    );
    res.status(201).json(form);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get All Form Definitions
exports.getAllForms = async (req, res) => {
  try {
    let query = {};
    if (req.query && req.query.name) {
      query = {
        $or: [
          { name: { $regex: req.query.name, $options: 'i' } },
          { displayName: { $regex: req.query.name, $options: 'i' } }
        ]
      };
    }
    const forms = await Form.find(query).sort({ updatedAt: -1 }).lean();

    const counts = await Response.aggregate([
      {
        $group: {
          _id: "$formId",
          responseCount: { $sum: 1 }
        }
      }
    ]);

    const countMap = new Map(
      counts.map(c => [c._id.toString(), c.responseCount])
    );

    const formsWithCounts = forms.map(form => ({
      ...form,
      responseCount: countMap.get(form._id.toString()) || 0
    }));
    res.json(formsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get form by id
exports.getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    res.json(form);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a Form Definition
exports.deleteForm = async (req, res) => {
  try {
    const result = await Form.findOneAndDelete({ name: req.params.name });
    if (!result) return res.status(404).json({ error: 'Form not found' });
    await Response.deleteMany({ formId: req.params.name });
    res.json({ message: 'Form and associated responses deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
