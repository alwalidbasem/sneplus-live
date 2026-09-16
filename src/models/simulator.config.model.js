const fs = require('fs/promises');
const path = require('path');

const CONFIG_DIR = path.join(__dirname, '..', '..', 'storage');
const CONFIG_PATH = path.join(CONFIG_DIR, 'simulator-config.json');

const DEFAULT_CONFIG = {
    liveVideoUrl: '',
    products: []
};

async function readConfig() {
    try {
        const raw = await fs.readFile(CONFIG_PATH, 'utf8');
        const parsed = JSON.parse(raw);
        return {
            liveVideoUrl: typeof parsed.liveVideoUrl === 'string' ? parsed.liveVideoUrl : '',
            products: Array.isArray(parsed.products) ? parsed.products : []
        };
    } catch (err) {
        if (err.code === 'ENOENT') return DEFAULT_CONFIG;
        throw err;
    }
}

async function writeConfig(config) {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
    const payload = {
        liveVideoUrl: typeof config.liveVideoUrl === 'string' ? config.liveVideoUrl : '',
        products: Array.isArray(config.products) ? config.products : []
    };
    await fs.writeFile(CONFIG_PATH, JSON.stringify(payload, null, 2), 'utf8');
    return payload;
}

module.exports = { readConfig, writeConfig };
