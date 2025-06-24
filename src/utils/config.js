const fs = require('fs').promises

const parseConfig = async (configPath) => {
    try {
        const data = await fs.readFile(configPath, 'utf-8');
        const config = JSON.parse(data);
        return config;
      } catch (err) {
        console.error('Error reading or parsing file:', err.message);
        return null;
      }
    }

module.exports = parseConfig