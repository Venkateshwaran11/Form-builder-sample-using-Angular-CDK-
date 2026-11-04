const { formVisibility } = require("../controllers/formController");

function userAssignmentValidation(req, res, next) {
    const { email, role, formId } = req.body;
    const requiredFields = { email, role, formId };
    const validParams = vaildateClientInput(requiredFields, res);
    if (!validParams) {
        return;
    }
    next();
}
function formVisibilityApiValidation(req, res, next) {
    const { formId, visibility } = req.body;
    const requiredFields = {
        formId,
        visibility
    }
    const validParams = vaildateClientInput(requiredFields, res);
    if (!validParams) {
        return;
    }
    next()
}

function vaildateClientInput(requiredFields, res) {
    for (const [key, value] of Object.entries(requiredFields)) {
        if (!value || String(value).trim() === "") {
            const fieldName = key.charAt(0).toUpperCase() + key.slice(1);
            res.status(400).json({
                error: `${fieldName} is required.`
            });
            return false;
        }
    }
    return true
}
module.exports = {
    userAssignmentValidation,
    formVisibilityApiValidation
};