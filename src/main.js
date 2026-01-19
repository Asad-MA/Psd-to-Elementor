/**
 * PSD to Elementor Converter
 * Main Application Entry Point
 */

import { parsePsdFile } from './parsers/psdParser.js';
import { classifyLayers } from './classifiers/layerClassifier.js';
import { generateElementorJson, formatJsonWithHighlighting, downloadJson } from './generators/elementorGenerator.js';
import { initFileUpload, showProgress, resetUpload, showToast } from './components/FileUpload.js';
import { initLayerPreview, getLayers } from './components/LayerPreview.js';

// App State
let appState = {
    psdData: null,
    classifiedLayers: null,
    elementorJson: null,
    fileName: ''
};

// DOM Elements
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const uploadSection = document.getElementById('uploadSection');
const previewSection = document.getElementById('previewSection');
const layerTree = document.getElementById('layerTree');
const jsonPreview = document.getElementById('jsonPreview');
const downloadBtn = document.getElementById('downloadBtn');
const resetBtn = document.getElementById('resetBtn');
const copyBtn = document.getElementById('copyBtn');

/**
 * Initialize the application
 */
function init() {
    // Add SVG gradient definition for progress ring
    addProgressGradient();

    // Initialize file upload
    initFileUpload(dropzone, fileInput, handleFileSelected);

    // Button handlers
    downloadBtn.addEventListener('click', handleDownload);
    resetBtn.addEventListener('click', handleReset);
    copyBtn.addEventListener('click', handleCopy);
}

/**
 * Add SVG gradient for progress ring
 */
function addProgressGradient() {
    const svg = document.querySelector('.progress-ring svg');
    if (svg) {
        const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
        defs.innerHTML = `
      <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#6366f1"/>
        <stop offset="50%" stop-color="#8b5cf6"/>
        <stop offset="100%" stop-color="#a855f7"/>
      </linearGradient>
    `;
        svg.insertBefore(defs, svg.firstChild);
    }
}

/**
 * Handle file selection
 */
async function handleFileSelected(file) {
    try {
        appState.fileName = file.name.replace('.psd', '');

        // Parse PSD
        const psdData = await parsePsdFile(file, (percent, status) => {
            showProgress(dropzone, percent, status);
        });

        appState.psdData = psdData;

        // Classify layers
        showProgress(dropzone, 95, 'Classifying layers...');
        appState.classifiedLayers = classifyLayers(psdData.layers);

        // Generate initial JSON
        updateElementorJson();

        showProgress(dropzone, 100, 'Complete!');

        // Show preview after slight delay
        setTimeout(() => {
            showPreview();
        }, 500);

    } catch (error) {
        console.error('Error processing PSD:', error);
        showToast('Error processing PSD file: ' + error.message);
        resetUpload(dropzone);
    }
}

/**
 * Update Elementor JSON from current layer state
 */
function updateElementorJson() {
    appState.elementorJson = generateElementorJson(appState.classifiedLayers, {
        fileName: appState.fileName,
        width: appState.psdData?.width,
        height: appState.psdData?.height
    });

    // Update JSON preview
    updateJsonPreview();
}

/**
 * Update JSON preview display
 */
function updateJsonPreview() {
    if (appState.elementorJson) {
        jsonPreview.innerHTML = formatJsonWithHighlighting(appState.elementorJson);
    }
}

/**
 * Show preview section
 */
function showPreview() {
    uploadSection.hidden = true;
    previewSection.hidden = false;

    // Initialize layer preview with drag-and-drop
    initLayerPreview(layerTree, appState.classifiedLayers, handleLayersChange);
}

/**
 * Handle layer reordering/nesting changes
 */
function handleLayersChange(newLayers) {
    appState.classifiedLayers = newLayers;
    updateElementorJson();
}

/**
 * Handle download button click
 */
function handleDownload() {
    if (appState.elementorJson) {
        downloadJson(appState.elementorJson, appState.fileName + '_elementor');
        showToast('JSON template downloaded!');
    }
}

/**
 * Handle reset button click
 */
function handleReset() {
    appState = {
        psdData: null,
        classifiedLayers: null,
        elementorJson: null,
        fileName: ''
    };

    uploadSection.hidden = false;
    previewSection.hidden = true;
    resetUpload(dropzone);
    fileInput.value = '';
}

/**
 * Handle copy button click
 */
function handleCopy() {
    if (appState.elementorJson) {
        const jsonString = JSON.stringify(appState.elementorJson, null, 2);
        navigator.clipboard.writeText(jsonString).then(() => {
            showToast('JSON copied to clipboard!');
        }).catch(() => {
            showToast('Failed to copy to clipboard');
        });
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', init);
