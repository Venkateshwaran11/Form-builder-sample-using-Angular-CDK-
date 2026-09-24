const Form = require('../models/Form');
const Response = require('../models/Response');
const FormVersion = require('../models/FormVersion');

// Save or Update a Form Config
exports.saveOrUpdateForm = async (req, res) => {
  try {
    const { name, displayName, config, _id, createdBy } = req.body;
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
          createdAt: Date.now(),
          createdBy
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
    query['createdBy']= req.query.createdBy
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

// 1. Save Working Draft (Canvas edits without publishing)
exports.saveDraft = async (req, res) => {
  try {
    const { name, displayName, config, _id, createdBy } = req.body;
    const filter = _id ? { _id } : { name };
    let form = await Form.findOne(filter);
    const sanitizedConfig = (config || []).map((f, i) => ({
      ...f,
      fieldId: f.fieldId || (f.name ? `fld_${f.name}` : `fld_${i}`)
    }));
    if (!form) {
      form = new Form({
        name,
        displayName,
        draftConfig: sanitizedConfig,
        config: sanitizedConfig,
        createdBy: createdBy || 'anonymous',
        hasDraftChanges: true,
        status: 'draft'
      });
      await form.save();
      return res.status(201).json(form);
    }
    form.displayName = displayName || form.displayName;
    form.draftConfig = sanitizedConfig;
    form.config = sanitizedConfig;
    form.hasDraftChanges = true;
    form.updatedAt = Date.now();
    await form.save();

    res.status(200).json(form);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
// 2. Publish New Form Version (Freezes snapshot in FormVersion and promotes draft)
exports.publishVersion = async (req, res) => {
  try {
    const { id } = req.params;
    const { changelog, publishedBy } = req.body;

    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }
    const nextVersion = (form.latestVersion || 0) + 1;
    const currentConfig = form.draftConfig && form.draftConfig.length > 0 ? form.draftConfig : form.config || [];
     // Ensure all fields have deterministic fieldId
    const finalizedConfig = currentConfig.map((f, i) => ({
      ...f,
      fieldId: f.fieldId || (f.name ? `fld_${f.name}` : `fld_${i}`)
    }));
    // Create immutable version snapshot
    const versionSnapshot = new FormVersion({
      formId: form._id,
      formName: form.name,
      displayName: form.displayName,
      version: nextVersion,
      config: finalizedConfig,
      changelog: changelog || `Published version ${nextVersion}`,
      summary: {
        totalFields: finalizedConfig.length,
        fieldIds: finalizedConfig.map(f => f.fieldId),
        fieldNames: finalizedConfig.map(f => f.name),
      },
      publishedBy: publishedBy || form.createdBy || 'system'
    });
    await versionSnapshot.save();

    // Promote in master Form document
    form.currentPublishedVersion = nextVersion;
    form.latestVersion = nextVersion;
    form.publishedConfig = finalizedConfig;
    form.draftConfig = finalizedConfig;
    form.config = finalizedConfig;
    form.hasDraftChanges = false;
    form.status = 'published';
    form.publishedAt = Date.now();
    form.updatedAt = Date.now();
    await form.save();

    res.status(200).json({
      message: 'Version published successfully',
      form,
      version: nextVersion,
      versionSnapshot
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.publishForm = exports.publishVersion;

// Get version history for a form 
exports.getFormVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }
    const versions = await FormVersion.find({
      formId: id
    })
      .select('version displayName changelog summary publishedBy createdAt')
      .sort({ version: -1 })
      .lean();
    res.json({
      currentPublishedVersion: form.currentPublishedVersion,
      latestVersion: form.latestVersion,
      hasDraftChanges: form.hasDraftChanges,
      versions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Compare two versions vA - vB
exports.compareVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const { vA, vB } = req.query;

    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({ error: "Form not found" });
    }
    let configA = [];
    let configB = [];
    let labelA = `v${vA}`;
    let labelB = `v${vB}`;
    if (vA === 'draft') {
      configA = form.draftConfig || form.config || [];
      labelA = 'Draft';
    } else {
      const snapA = await FormVersion.findOne({ formId: form._id, version: Number(vA) });
      if (!snapA) return res.status(404).json({ error: `Version ${vA} not found` });
      configA = snapA.config;
    }
    if (vB === 'draft') {
      configB = form.draftConfig || form.config || [];
      labelB = 'Draft';
    } else {
      const snapB = await FormVersion.findOne({ formId: form._id, version: Number(vB) });
      if (!snapB) return res.status(404).json({ error: `Version ${vB} not found` });
      configB = snapB.config;
    }
    res.json({
      formId: form._id,
      displayName: form.displayName,
      vA: { version: vA, label: labelA, config: configA },
      vB: { version: vB, label: labelB, config: configB }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Restore a Historical Version into Draft
exports.restoreVersion = async (req, res) => {
  try {
    const { id, version } = req.params;
    const form = await Form.findById(id);
    if (!form) return res.status(404).json({ error: 'Form not found' });

    const snap = await FormVersion.findOne({ formId: form._id, version: Number(version) });
    if (!snap) return res.status(404).json({ error: `Version ${version} not found` });

    form.draftConfig = snap.config;
    form.config = snap.config;
    form.hasDraftChanges = true;
    form.updatedAt = Date.now();
    await form.save();

    res.json({
      message: `Version ${version} restored to draft successfully`,
      form
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};