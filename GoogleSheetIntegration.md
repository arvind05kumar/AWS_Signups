# Google Sheets API Backend Setup Guide

This guide will show you how to connect your AWS Builder SignUp Node.js application to your Google Sheet using the **Google Sheets API**.

By using a Node.js backend:
* Form submissions are processed securely without exposing credentials.
* Profile screenshots are saved directly on the local server in the `/uploads` directory.
* Entries (Timestamp, Name, Alias, and local Screenshot Link) are appended to your Google Sheet automatically.

---

## Step 1: Enable Google Sheets API & Get Credentials

To allow the Node.js server to edit your sheet, you must create a Service Account in the Google Cloud Console:

1. **Open Google Cloud Console:**
   Go to the [Google Cloud Console](https://console.cloud.google.com/). Sign in with your Google account.

2. **Create a New Project:**
   * Click on the project dropdown in the top-left corner and click **New Project**.
   * Name it (e.g., `AWS-Builder-Collector`) and click **Create**.

3. **Enable Google Sheets API:**
   * In the top search bar, type `Google Sheets API` and click on it.
   * Click the blue **Enable** button.

4. **Create a Service Account:**
   * Go to **IAM & Admin > Service Accounts** in the left sidebar (or search for "Service Accounts" in the top bar).
   * Click **+ Create Service Account** at the top.
   * Enter a name (e.g., `sheets-editor`), and click **Create and Continue**.
   * (Optional) Skip the role settings and click **Done**.

5. **Generate and Download Credentials JSON Key:**
   * Click on the newly created Service Account email in the list.
   * Go to the **Keys** tab.
   * Click **Add Key > Create new key**.
   * Choose **JSON** format and click **Create**.
   * A `.json` file will automatically download to your computer.
   * **Rename this file to `credentials.json`** and move it directly to your project's root folder (`f:\Project 2026\AWS BC\credentials.json`).

6. **Copy the Service Account Email:**
   * In the Service Accounts list, copy the email address associated with your service account. It looks like:
     `sheets-editor@aws-builder-collector.iam.gserviceaccount.com`

---

## Step 2: Share Google Sheet with the Service Account

Because the Service Account is like a virtual user, you must share your Google Sheet with it:

1. Open your Google Sheet in your web browser:
   [AWS Builder Signups](https://docs.google.com/spreadsheets/d/1Gn0steeeuxqiAgKwuXE7d940F_EzUtD6wBGDEZqx36s/edit)
2. Click the **Share** button in the top-right corner.
3. Paste the **Service Account Email** you copied in Step 1.6 into the "Add people and groups" input.
4. Ensure the role is set to **Editor**.
5. Uncheck "Notify people" and click **Share** (or **Send**).

---

## Step 3: Run the Server

1. Open your terminal in the project directory (`f:\Project 2026\AWS BC`).
2. Run the start command:
   ```bash
   npm run dev
   ```
3. Open `http://localhost:3000` in your web browser.
4. Fill in the form, choose a screenshot, and click **Submit Details**.
5. The form will submit successfully, the local screenshot will be stored in `/uploads/`, and the data will be logged instantly on your Google Sheet!
