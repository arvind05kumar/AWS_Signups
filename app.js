document.addEventListener('DOMContentLoaded', () => {
  // === CONFIGURATION ===
  // Paste your deployed Google Apps Script Web App URL below:
  const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwjzZa5xWJrk4ZXMsIMioH5mVOsUVGbrNonyqL_QRPSTsfv2BZgXqYQhTxwJT6t1Gg7/exec";

  // Elements
  const signupForm = document.getElementById('signup-form');
  const fullNameInput = document.getElementById('full-name');
  const builderAliasInput = document.getElementById('builder-alias');
  const fileInput = document.getElementById('profile-screenshot');
  const dropzone = document.getElementById('dropzone');
  const dropzonePrompt = document.getElementById('dropzone-prompt');
  const dropzonePreview = document.getElementById('dropzone-preview');
  const imagePreview = document.getElementById('image-preview');
  const removeImgBtn = document.getElementById('remove-img-btn');
  const fileNameDisplay = document.getElementById('file-name');
  const fileSizeDisplay = document.getElementById('file-size');
  const submitBtn = document.getElementById('submit-btn');
  const btnSpinner = document.getElementById('btn-spinner');
  const successMessage = document.getElementById('success-message');
  const resetFormBtn = document.getElementById('reset-form-btn');

  let selectedFile = null;

  // --- Drag & Drop file handling ---

  // Trigger file dialog
  dropzone.addEventListener('click', (e) => {
    // Avoid double trigger if clicking elements inside preview or input itself
    if (e.target === removeImgBtn || removeImgBtn.contains(e.target)) {
      return;
    }
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  });

  // Drag styles
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-over');
    }, false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-over');
    }, false);
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  });

  function handleFile(file) {
    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      showError('screenshot', 'Only image files are allowed.');
      return;
    }

    // Validate size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      showError('screenshot', 'File size exceeds 5MB limit.');
      return;
    }

    clearError('screenshot');
    selectedFile = file;

    // Show Preview
    const reader = new FileReader();
    reader.onload = function (e) {
      imagePreview.src = e.target.result;
      fileNameDisplay.textContent = file.name;
      fileSizeDisplay.textContent = formatBytes(file.size);

      dropzonePrompt.classList.add('hidden');
      dropzonePreview.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
  }

  // Remove selected image
  removeImgBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFileInput();
  });

  function resetFileInput() {
    fileInput.value = '';
    selectedFile = null;
    imagePreview.src = '#';
    dropzonePreview.classList.add('hidden');
    dropzonePrompt.classList.remove('hidden');
  }

  // Format bytes helper
  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  // --- Form Validation Helpers ---
  function showError(fieldId, message) {
    const inputGroup = document.getElementById(fieldId + '-error').parentElement;
    inputGroup.classList.add('invalid');
    if (message) {
      document.getElementById(fieldId + '-error').textContent = message;
    }
  }

  // Clear input styling
  function clearError(fieldId) {
    const inputGroup = document.getElementById(fieldId + '-error').parentElement;
    inputGroup.classList.remove('invalid');
  }

  // Input listeners to clear errors on type
  fullNameInput.addEventListener('input', () => {
    if (fullNameInput.value.trim() !== '') {
      clearError('name');
    }
  });

  builderAliasInput.addEventListener('input', () => {
    if (builderAliasInput.value.trim() !== '') {
      clearError('alias');
    }
  });

  // --- Form Submission Logic ---
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check if configuration exists
    if (!WEB_APP_URL || WEB_APP_URL === "YOUR_DEPLOYED_WEB_APP_URL_HERE") {
      alert('Please configure your Google Web App URL inside the app.js file (line 4).');
      return;
    }

    let isValid = true;

    // Validate Name
    const nameVal = fullNameInput.value.trim();
    if (nameVal === '') {
      showError('name', 'Please enter your full name.');
      isValid = false;
    } else {
      clearError('name');
    }

    // Validate Alias
    let aliasVal = builderAliasInput.value.trim();
    if (aliasVal === '') {
      showError('alias', 'Please enter your AWS Builder alias.');
      isValid = false;
    } else {
      // Strip out leading @ symbol if user entered it (UI handles it)
      if (aliasVal.startsWith('@')) {
        aliasVal = aliasVal.slice(1);
      }

      // Basic check for valid AWS alias format (alphanumeric, dots, dashes, underscores)
      const aliasRegex = /^[a-zA-Z0-9._-]+$/;
      if (!aliasRegex.test(aliasVal)) {
        showError('alias', 'Please enter a valid alias (alphanumeric and . - _ only).');
        isValid = false;
      } else {
        clearError('alias');
      }
    }

    // Validate Screenshot
    if (!selectedFile) {
      showError('screenshot', 'Please upload a profile screenshot.');
      isValid = false;
    } else {
      clearError('screenshot');
    }

    if (!isValid) return;

    // Form is valid - Start submission
    setLoadingState(true);

    try {
      // Read file content as base64
      const base64Data = await fileToBase64(selectedFile);

      // Construct payload
      const payload = {
        name: nameVal,
        alias: '@' + aliasVal,
        screenshot: base64Data,
        filename: selectedFile.name,
        mimeType: selectedFile.type
      };

      // Send to Apps Script Web App with no-cors to avoid CORS preflight/redirect issues
      await fetch(WEB_APP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8', // Bypass CORS preflight issues with standard POST
        },
        body: JSON.stringify(payload)
      });

      // In no-cors mode, we cannot read the response, but if fetch does not throw,
      // the request was sent successfully to Google Apps Script.
      showSuccessState(true, nameVal, aliasVal);

    } catch (error) {
      console.error('Submission error:', error);
      alert('Failed to submit details: ' + error.message + '\n\nMake sure the script is deployed correctly as a Web App with access set to "Anyone".');
    } finally {
      setLoadingState(false);
    }
  });

  // Convert File object to Base64 String
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result.split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  }

  // Loading animation state toggler
  function setLoadingState(isLoading) {
    if (isLoading) {
      submitBtn.disabled = true;
      btnSpinner.classList.remove('hidden');
      submitBtn.querySelector('.btn-text').style.opacity = '0';
    } else {
      submitBtn.disabled = false;
      btnSpinner.classList.add('hidden');
      submitBtn.querySelector('.btn-text').style.opacity = '1';
    }
  }

  // Success view toggler
  function showSuccessState(show, nameVal = '', aliasVal = '') {
    if (show) {
      const nameEl = document.getElementById('success-name-val');
      const aliasEl = document.getElementById('success-alias-val');
      const refEl = document.getElementById('success-ref-val');

      if (nameEl) nameEl.textContent = nameVal;
      if (aliasEl) aliasEl.textContent = aliasVal.startsWith('@') ? aliasVal : '@' + aliasVal;

      if (refEl) {
        // Generate a random Reference ID mimicking AWS format
        const randPart1 = Math.floor(1000 + Math.random() * 9000);
        const randPart2 = Math.random().toString(36).substring(2, 6).toUpperCase();
        refEl.textContent = `AWS-BC-${randPart1}-${randPart2}`;
      }

      successMessage.classList.remove('hidden');
    } else {
      successMessage.classList.add('hidden');
    }
  }

  // Reset Form for another entry
  resetFormBtn.addEventListener('click', () => {
    signupForm.reset();
    resetFileInput();
    showSuccessState(false);
  });
});
