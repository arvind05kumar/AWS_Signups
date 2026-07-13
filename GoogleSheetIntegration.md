# Google Sheets & Google Drive API Backend Setup Guide

This guide will show you how to connect your AWS Builder SignUp Node.js application to your Google Sheet and Google Drive using the official Google APIs.

By using a Node.js backend:
* Form submissions are processed securely without exposing credentials.
* Profile screenshots are uploaded directly to a Google Drive folder.
* Entries (Timestamp, Name, Alias, and Google Drive Screenshot Link) are appended to your Google Sheet automatically.

---

## Step 1: Enable Google Sheets & Drive APIs & Get Credentials

To allow the Node.js server to edit your sheet and upload files to your drive, you must create a Service Account in the Google Cloud Console:

1. **Open Google Cloud Console:**
   Go to the [Google Cloud Console](https://console.cloud.google.com/). Sign in with your Google account.

2. **Create a New Project:**
   * Click on the project dropdown in the top-left corner and click **New Project**.
   * Name it (e.g., `AWS-Builder-Collector`) and click **Create**.

3. **Enable the APIs:**
   * In the top search bar, search for `Google Sheets API` and click on it, then click **Enable**.
   * Go back to search, search for `Google Drive API` and click on it, then click **Enable**.

4. **Create a Service Account:**
   * Go to **IAM & Admin > Service Accounts** in the left sidebar.
   * Click **+ Create Service Account** at the top.
   * Enter a name (e.g., `sheets-drive-editor`), and click **Create and Continue**.
   * Click **Done** at the bottom.

5. **Generate and Download Credentials JSON Key:**
   * Click on the newly created Service Account email in the list.
   * Go to the **Keys** tab.
   * Click **Add Key > Create new key**.
   * Choose **JSON** format and click **Create**.
   * A `.json` file will automatically download to your computer.
   * **Rename this file to `credentials.json`** and move it directly to your project's root folder (`f:\Project 2026\AWS BC\credentials.json`).
   * **CRITICAL SECURITY NOTE:** This file is listed in `.gitignore` so it will never be pushed to GitHub. Do NOT remove it from `.gitignore`.

6. **Copy the Service Account Email:**
   * In the Service Accounts list, copy the email address associated with your service account. It looks like:
     `sheets-drive-editor@aws-builder-collector-12345.iam.gserviceaccount.com`

---

## Step 2: Share Google Sheet and Google Drive Folder

Because the Service Account is a virtual user, you must share your assets with it:

### 1. Share the Google Sheet
* Open your Google Sheet in your web browser.
* Click the **Share** button in the top-right corner.
* Paste the **Service Account Email** you copied in Step 1.6.
* Ensure the role is set to **Editor**, uncheck "Notify people", and click **Share**.

### 2. Share the Google Drive Folder
* Open Google Drive, create a folder named `AWS Screenshots` (or use an existing one).
* Right-click the folder and choose **Share > Share**.
* Paste the **Service Account Email**.
* Ensure the role is set to **Editor**, and click **Share**.
* **Get the Folder ID:** Look at the browser URL bar while inside this folder. The long string of characters at the very end of the URL (after `/folders/`) is your **Drive Folder ID**. Copy it.

---

## Step 3: Local Configuration (.env)

Open the **`.env`** file in your project root and configure it:

```env
PORT=3000
SPREADSHEET_ID=1Gn0steeeuxqiAgKwuXE7d940F_EzUtD6wBGDEZqx36s
DRIVE_FOLDER_ID=YOUR_DRIVE_FOLDER_ID_HERE
```
* Replace `YOUR_DRIVE_FOLDER_ID_HERE` with the Folder ID you copied in Step 2.2.

---

## Step 4: Vercel Deployment Setup (Production)

Since `credentials.json` and `.env` are gitignored and not pushed to GitHub, Vercel needs Environment Variables configured to run:

1. Import your repository to **Vercel** and go to your project dashboard.
2. Go to **Settings > Environment Variables**.
3. Add the following variables:
   * **`SPREADSHEET_ID`**: `1Gn0steeeuxqiAgKwuXE7d940F_EzUtD6wBGDEZqx36s`
   * **`DRIVE_FOLDER_ID`**: Your Google Drive Folder ID.
   * **`NODE_ENV`**: `production`
   * **`GOOGLE_CREDENTIALS`**: Open your local `credentials.json` file, copy the entire text contents, and paste it directly as the value for this variable.
4. Click **Deploy**. Vercel will build the serverless functions and connect to your Google Drive/Sheets securely!
