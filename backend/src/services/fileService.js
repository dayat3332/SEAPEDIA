const pool = require('../config/database');
const fs = require('fs').promises;

const saveFile = async (filename, filePath, mimeType) => {
  try {
    const data = await fs.readFile(filePath);
    await pool.query(
      `INSERT INTO uploaded_files (filename, mime_type, data) 
       VALUES (?, ?, ?) 
       ON DUPLICATE KEY UPDATE mime_type = VALUES(mime_type), data = VALUES(data)`,
      [filename, mimeType, data]
    );
    console.log(`💾 File saved to DB: ${filename}`);
  } catch (err) {
    console.error(`❌ Failed to save file ${filename} to DB:`, err.message);
    throw err;
  }
};

const getFile = async (filename) => {
  try {
    const [rows] = await pool.query(
      'SELECT mime_type, data FROM uploaded_files WHERE filename = ?',
      [filename]
    );
    if (rows.length === 0) return null;
    return rows[0];
  } catch (err) {
    console.error(`❌ Failed to get file ${filename} from DB:`, err.message);
    throw err;
  }
};

module.exports = {
  saveFile,
  getFile,
};
