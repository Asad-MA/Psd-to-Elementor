/**
 * PSD Parser Module
 * Parses PSD files and extracts layer information using ag-psd
 */

import { readPsd } from 'ag-psd';

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
        }

        layers.push(layer);
    }

    return layers;
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
        layerInfo.textInfo = extractTextInfo(layer.text);

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
function extractTextInfo(textData) {
    //console.log("Text Data: ", textData);
    try {
        const style = textData.style || {};
        const paragraphStyle = textData.paragraphStyle || {};
        const transform = textData.transform || {};

        const fontSize = textData.style.fontSize;
        const scaleX = transform?.[0] ?? 1;
        const scaleY = transform?.[3] ?? 1;
        const scale = (scaleX + scaleY) / 2;

        const finalFontSize = Math.round(fontSize * scale);


        return {
            text: textData.text || '',
            // Convert PT to PX (1pt = 1.333px at 96dpi)
            fontSize: finalFontSize,
            fontFamily: getFontFamily(style.font?.name),
            color: extractColor(style.fillColor) || '#000000',
            alignment: getAlignment(paragraphStyle.justification),
            fontWeight: style.fauxBold || (style.font?.name && style.font.name.toLowerCase().includes('bold')) ? 'bold' : 'normal',
            lineHeight: style.leading ? `${Math.round(style.leading)}px` : 'normal',
            textTransform: getTextTransform(style.fontCaps),
            letterSpacing: style.tracking ? `${style.tracking / 1000}em` : 'normal'
        };
    } catch (e) {
        console.warn('Error extracting text info:', e);
        return {
            text: textData.text || '',
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#000000',
            alignment: 'left',
            fontWeight: 'normal',
            lineHeight: 'normal',
            textTransform: 'none',
            letterSpacing: 'normal'
        };
    }
}



/**
 * Extract color from fill color object
 */
function extractColor(fillColor) {
    if (!fillColor) return '#000000';

    // Handle RGB color
    if (fillColor.r !== undefined) {
        const r = Math.round(fillColor.r);
        const g = Math.round(fillColor.g);
        const b = Math.round(fillColor.b);
        return rgbToHex(r, g, b);
    }

    return '#000000';
}

/**
 * Get alignment string from justification value
 */
function getAlignment(justification) {
    const alignments = {
        'left': 'left',
        'right': 'right',
        'center': 'center',
        'justifyAll': 'justify',
        'justifyLeft': 'left',
        'justifyCenter': 'center',
        'justifyRight': 'right'
    };
    return alignments[justification] || 'left';
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r, g, b) {
    return '#' + [r, g, b].map(x => {
        const hex = Math.max(0, Math.min(255, x)).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

/**
 * Get intelligent font family name from PSD font name
 * Maps PostScript names to Web Font Families
 */
function getFontFamily(psdFontName) {
    if (!psdFontName) return 'Arial';

    // Common mappings
    const fontMappings = {
        'ArialMT': 'Arial',
        'Arial-BoldMT': 'Arial',
        'Helvetica': 'Helvetica',
        'HelveticaNeue': 'Helvetica Neue',
        'TimesNewRomanPSMT': 'Times New Roman',
        'TimesNewRomanPS-BoldMT': 'Times New Roman',
        'Verdana': 'Verdana',
        'Georgia': 'Georgia',
        'CourierNewPSMT': 'Courier New',
        'Roboto-Regular': 'Roboto',
        'Roboto-Bold': 'Roboto',
        'OpenSans-Regular': 'Open Sans',
        'OpenSans-Bold': 'Open Sans',
        'Lato-Regular': 'Lato',
        'Montserrat-Regular': 'Montserrat',
        'Poppins-Regular': 'Poppins'
    };

    if (fontMappings[psdFontName]) {
        return fontMappings[psdFontName];
    }

    // Intelligent guessing: Remove common suffixes
    return psdFontName
        .replace(/-?Bold.*/i, '')
        .replace(/-?Italic.*/i, '')
        .replace(/-?Regular.*/i, '')
        .replace(/-?Light.*/i, '')
        .replace(/-?Medium.*/i, '')
        .replace(/-?Black.*/i, '')
        .replace(/MT$/, '')
        .replace(/PS$/, '')
        .replace(/PSMT$/, '')
        .replace(/([a-z])([A-Z])/g, '$1 $2') // Insert space between camelCase
        .trim();
}

/**
 * Get CSS text-transform from fontCaps
 */
function getTextTransform(fontCaps) {
    switch (fontCaps) {
        case 1: return 'uppercase'; // All Caps
        case 2: return 'uppercase'; // Small Caps (approximation)
        default: return 'none';
    }
}

/**
 * Generate unique ID for layers
 */
export function generateId() {
    return Math.random().toString(36).substring(2, 10);
}
