const simulatorConfig = require('../models/simulator.config.model');
const { success } = require('../utils/response');
const { validationError } = require('../middleware/validation.middleware');
const { DEFAULT_SCENARIOS } = require('../simulation/defaultScenarios');
const { normalizeScenario, validateTimeline } = require('../simulation/timeline');

async function getConfig(req, res) {
    const config = await simulatorConfig.readConfig();
    // When nothing was saved yet, serve the shared default scenarios
    // (single source of truth in src/simulation/defaultScenarios.js).
    if (!config.products.length) {
        config.products = DEFAULT_SCENARIOS.map(normalizeScenario);
    }
    success(res, { config });
}

async function updateConfig(req, res) {
    const products = (Array.isArray(req.body.products) ? req.body.products : []).map(normalizeScenario);

    for (const product of products) {
        const issues = validateTimeline(product);
        if (issues.length) {
            throw validationError(`Invalid timeline for "${product.name}": ${issues.join(' ')}`);
        }
    }

    const config = await simulatorConfig.writeConfig({
        liveVideoUrl: String(req.body.liveVideoUrl || '').trim().slice(0, 1000),
        products
    });
    success(res, { config });
}

module.exports = { getConfig, updateConfig };

