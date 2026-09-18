const AIservice = require('../services/aiService')


module.exports.callAIservice = async (req, res) => {
    try {
    const { prompt, currentForm } = req.body;

        if (!prompt || prompt.trim() == '') {
            return res.status(400).json({
                message: 'Prompt is required'
            })
        }
        const form = await AIservice.generateForm(prompt,currentForm);
        res.json(form)
    } catch (error) {
        console.error("AI Service Error:", error);
        res.status(500).json({
            message: "Failed to generate form",
            error: error?.error?.message || error?.message || "Unknown error"
        });
    }

}