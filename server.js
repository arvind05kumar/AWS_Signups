const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1Gn0steeeuxqiAgKwuXE7d940F_EzUtD6wBGDEZqx36s';
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID;

// Multer memory storage configuration (saves in RAM buffer, perfect for Serverless Functions)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

    // Configure Google Auth (supports Vercel env variable in production and local credentials.json in dev)
    let auth;
    if (process.env.GOOGLE_CREDENTIALS) {
      console.log('Authenticating using GOOGLE_CREDENTIALS environment variable...');
      try {
        const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
        auth = new google.auth.JWT(
          credentials.client_email,
          null,
          credentials.private_key,
          [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.file'
          ]
        );
      } catch (err) {
        console.error('Error parsing GOOGLE_CREDENTIALS env variable:', err);
        return res.status(500).json({
          status: 'error',
          message: 'Failed to parse GOOGLE_CREDENTIALS environment variable. Ensure it is a valid Google Service Account JSON string.'
        });
      }
    } else {
      const credentialsPath = path.join(__dirname, 'credentials.json');
      if (!fs.existsSync(credentialsPath)) {
        console.warn('WARNING: credentials.json is missing in root.');
        return res.status(500).json({
          status: 'error',
          message: 'Google Service Account credentials file (credentials.json) was not found in the project root directory, and no GOOGLE_CREDENTIALS environment variable was configured. Please set up credentials to enable uploads.'
        });
      }
      auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive.file'
        ],
      });
    }

    // Check if DRIVE_FOLDER_ID is set
    if (!DRIVE_FOLDER_ID || DRIVE_FOLDER_ID === 'YOUR_GOOGLE_DRIVE_FOLDER_ID_HERE') {
      return res.status(400).json({
        status: 'error',
        message: 'DRIVE_FOLDER_ID is not configured. Please set it in your env variables to choose where to save screenshots in Google Drive.'
      });
    }

    // 1. Upload screenshot file to Google Drive
    console.log('Uploading screenshot to Google Drive...');
    const drive = google.drive({ version: 'v3', auth });
    
    // Create a readable stream from the multer buffer
    const bufferStream = new Readable();
    bufferStream.push(file.buffer);
    bufferStream.push(null);

    // Sanitize filename
    const ext = path.extname(file.originalname) || '.png';
    const sanitizedName = `${name.trim().replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}${ext}`;

    const fileMetadata = {
      name: sanitizedName,
      parents: [DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: file.mimetype,
      body: bufferStream,
    };

    const driveFile = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    const fileId = driveFile.data.id;
    const fileUrl = driveFile.data.webViewLink;
    console.log(`Uploaded file to Drive. ID: ${fileId}`);

    // 2. Set file permissions so anyone with the link can view it (essential for Sheet links)
    console.log('Sharing Drive file...');
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone',
      },
    });

    // 3. Append metadata to Google Sheet
    console.log(`Appending row to Google Sheets (ID: ${SPREADSHEET_ID})...`);
    const sheets = google.sheets({ version: 'v4', auth });
    const timestamp = new Date().toLocaleString();
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:D',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [timestamp, name, alias, fileUrl]
        ]
      }
    });

    console.log('Submission recorded successfully!');
    return res.json({
      status: 'success',
      message: 'Entry recorded successfully',
      screenshotUrl: fileUrl
    });

  } catch (error) {
    console.error('Error handling submission:', error);
    return res.status(500).json({
      status: 'error',
      message: `Failed to save submission: ${error.message}. Make sure your credentials and folder ID are correct and access is shared.`
    });
  }
});

// Start Server (only if running locally, Vercel will handle hosting directly)
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`🚀 AWS Builder Collector Server is running!`);
    console.log(`💻 Local Address: http://localhost:${PORT}`);
    console.log(`==================================================`);
  });
}

module.exports = app;
