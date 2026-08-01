const fs = require('fs');
const path = require('path');

const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '../../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

exports.handleUpload = async (req, res) => {
  try {
    const { filename, base64 } = req.body;
    if (!filename || !base64) {
      return res.status(400).json({ error: 'Filename and base64 string are required.' });
    }

    // Remove base64 data URL prefix if present
    const base64Data = base64.replace(/^data:.*;base64,/, "");
    const fileBuffer = Buffer.from(base64Data, 'base64');

    // Create unique filename
    const uniqueFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = path.join(uploadsDir, uniqueFilename);

    fs.writeFileSync(filePath, fileBuffer);

    // Return the relative file path URL
    const fileUrl = `/uploads/${uniqueFilename}`;
    res.json({ fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
