const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1Gn0steeeuxqiAgKwuXE7d940F_EzUtD6wBGDEZqx36s';

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Sanitize filename to avoid weird character issues
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.png';
    const base = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${base}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(uploadsDir));

// Route to handle signup submission
app.post('/submit', upload.single('screenshot'), async (req, res) => {
  try {
    const { name, alias } = req.body;
    const file = req.file;

    if (!name || !alias) {
      return res.status(400).json({ status: 'error', message: 'Name and Alias are required.' });
    }
    if (!file) {
      return res.status(400).json({ status: 'error', message: 'Screenshot file is required.' });
    }

    // Check if Google credentials.json exists
    const credentialsPath = path.join(__dirname, 'credentials.json');
    if (!fs.existsSync(credentialsPath)) {
      console.warn('WARNING: credentials.json is missing in root.');
      return res.status(500).json({
        status: 'error',
        message: 'Google Service Account credentials file (credentials.json) was not found in the project root directory. Please upload this file to enable saving data to Google Sheets.'
      });
    }

    // Determine the host URL of the uploaded image
    const hostUrl = `${req.protocol}://${req.get('host')}`;
    const screenshotUrl = `${hostUrl}/uploads/${file.filename}`;

    // Connect to Google Sheets API
    const auth = new google.auth.GoogleAuth({
      keyFile: credentialsPath,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // Append the row to Google Sheets
    const timestamp = new Date().toLocaleString();
    
    console.log(`Appending row to Google Sheets (ID: ${SPREADSHEET_ID})...`);
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:D',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [timestamp, name, alias, screenshotUrl]
        ]
      }
    });

    console.log('Submission recorded successfully!');
    return res.json({
      status: 'success',
      message: 'Entry recorded successfully',
      screenshotUrl: screenshotUrl
    });

  } catch (error) {
    console.error('Error handling submission:', error);
    return res.status(500).json({
      status: 'error',
      message: `Failed to save submission: ${error.message}. Make sure your spreadsheet ID is correct and the Service Account email is added to your Sheet's Editor permissions.`
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 AWS Builder Collector Server is running!`);
  console.log(`💻 Local Address: http://localhost:${PORT}`);
  console.log(`📁 Uploads Directory: ${uploadsDir}`);
  console.log(`==================================================`);
});
