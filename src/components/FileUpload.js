/**
 * File Upload Component
 * Handles drag-and-drop file upload
 */

/**
 * Initialize file upload handlers
 * @param {HTMLElement} dropzone - Dropzone element
 * @param {HTMLInputElement} fileInput - File input element
 * @param {Function} onFile - Callback when file is selected
 */
export function initFileUpload(dropzone, fileInput, onFile) {
    // Click to browse
    dropzone.addEventListener('click', () => {
        fileInput.click();
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && validateFile(file)) {
            onFile(file);
        }
    });

    // Drag and drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');

        const file = e.dataTransfer.files[0];
        if (file && validateFile(file)) {
            onFile(file);
        }
    });
}

/**
 * Validate that the file is a PSD
 */
function validateFile(file) {
    if (!file.name.toLowerCase().endsWith('.psd')) {
        showToast('Please upload a PSD file');
        return false;
    }
    return true;
}

/**
 * Show upload progress
 */
export function showProgress(dropzone, percent, status) {
    const content = dropzone.querySelector('.dropzone__content');
    const progress = dropzone.querySelector('.dropzone__progress');
    const circle = dropzone.querySelector('#progressCircle');
    const text = dropzone.querySelector('#progressText');
    const statusEl = dropzone.querySelector('#uploadStatus');

    content.hidden = true;
    progress.hidden = false;

    // Calculate stroke dash offset (circumference = 2 * PI * r = 283)
    const offset = 283 - (283 * percent / 100);
    circle.style.strokeDashoffset = offset;

    text.textContent = `${Math.round(percent)}%`;
    statusEl.textContent = status;
}

/**
 * Reset upload UI
 */
export function resetUpload(dropzone) {
    const content = dropzone.querySelector('.dropzone__content');
    const progress = dropzone.querySelector('.dropzone__progress');

    content.hidden = false;
    progress.hidden = true;
}

/**
 * Show toast notification
 */
export function showToast(message, duration = 3000) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.hidden = false;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.hidden = true;
        }, 300);
    }, duration);
}
