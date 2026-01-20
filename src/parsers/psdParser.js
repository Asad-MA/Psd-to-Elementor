/**
 * PSD Parser Module
 * Parses PSD files and extracts layer information using ag-psd
 */

import { readPsd } from 'ag-psd';
import TextStyleExtractor from '../helpers/TextStyleExtractor';

/**
 * Parse a PSD file and extract layer structure
 * @param {File} file - The PSD file to parse
 * @param {Function} onProgress - Progress callback
 * @returns {Promise<Object>} Parsed layer tree
 */
export async function parsePsdFile(file, onProgress = () => { }) {
    onProgress(10, 'Reading file...');

    const arrayBuffer = await file.arrayBuffer();

    onProgress(30, 'Parsing PSD structure...');

    const psd = readPsd(arrayBuffer, {
        skipLayerImageData: true, // Skip pixel data for performance
        skipThumbnail: true
    });

    onProgress(60, 'Extracting layers...');

    const layers = extractLayers(psd.children || []);

    onProgress(90, 'Processing complete');

    console.log("PSD Data: ", psd);

    return {
        width: psd.width,
        height: psd.height,
        layers: layers,
        fileName: file.name.replace('.psd', '')
    };
}

/**
 * Recursively extract layers from PSD tree
 * @param {Array} children - PSD children array
 * @param {number} depth - Current depth level
 * @returns {Array} Array of layer objects
 */
function extractLayers(children, depth = 0) {
    const layers = [];

    if (!children) return layers;

    for (const child of children) {
        // Skip layers with __ignore in name
        if (child.name && child.name.includes('__ignore')) {
            continue;
        }

        const layer = extractLayerInfo(child, depth);

        if (child.children && child.children.length > 0) {
            layer.children = extractLayers(child.children, depth + 1);

            // Calculate group bounds from children if bounds are empty/zero
            if (layer.type === 'group' && layer.children.length > 0) {
                const calculatedBounds = calculateBoundsFromChildren(layer.children);
                if (calculatedBounds) {
                    layer.bounds = calculatedBounds;
                }
            }
        }

        layers.push(layer);
    }

    return layers;
}

/**
 * Calculate bounding box from children layers
 * @param {Array} children - Array of child layer objects
 * @returns {Object|null} Calculated bounds or null if no valid children
 */
function calculateBoundsFromChildren(children) {
    if (!children || children.length === 0) return null;

    let minTop = Infinity;
    let minLeft = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;
    let hasValidBounds = false;

    for (const child of children) {
        const bounds = child.bounds;

        // Skip children with zero/invalid bounds
        if (!bounds || (bounds.width === 0 && bounds.height === 0)) {
            continue;
        }

        hasValidBounds = true;
        minTop = Math.min(minTop, bounds.top);
        minLeft = Math.min(minLeft, bounds.left);
        maxRight = Math.max(maxRight, bounds.right);
        maxBottom = Math.max(maxBottom, bounds.bottom);
    }

    if (!hasValidBounds) return null;

    return {
        top: minTop,
        left: minLeft,
        right: maxRight,
        bottom: maxBottom,
        width: maxRight - minLeft,
        height: maxBottom - minTop
    };
}

/**
 * Extract information from a single layer
 * @param {Object} layer - PSD layer object
 * @param {number} depth - Current depth level
 * @returns {Object} Layer information object
 */
function extractLayerInfo(layer, depth) {
    const isGroup = layer.children && layer.children.length > 0;
    const isText = layer.text !== undefined;

    const layerInfo = {
        id: generateId(),
        name: layer.name || 'Unnamed Layer',
        type: getLayerType(layer),
        visible: !layer.hidden,
        depth: depth,
        bounds: {
            top: layer.top || 0,
            left: layer.left || 0,
            right: layer.right || 0,
            bottom: layer.bottom || 0,
            width: (layer.right || 0) - (layer.left || 0),
            height: (layer.bottom || 0) - (layer.top || 0)
        },
        children: []
    };

    // Extract text info if it's a text layer
    if (isText && layer.text) {
        layerInfo.textInfo = TextStyleExtractor.extract(layer.text);

        // console.log("Layer Info: ", layerInfo);
    }

    // Check for image content
    if (!isGroup && !isText) {
        layerInfo.hasImage = true;
    }



    return layerInfo;
}

/**
 * Determine layer type based on PSD data
 */
function getLayerType(layer) {
    if (layer.children && layer.children.length > 0) {
        return 'group';
    }

    if (layer.text !== undefined) {
        return 'text';
    }

    if (layer.vectorMask || layer.vectorStroke) {
        return 'shape';
    }

    return 'image';
}

/**
 * Extract text information from text layer
 */




/**
 * Generate unique ID for layers
 */
export function generateId() {
    return Math.random().toString(36).substring(2, 10);
}
