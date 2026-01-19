/**
 * Elementor JSON Generator
 * Generates Elementor-compatible JSON from classified layers
 * 
 * HIERARCHY RULES:
 * - Widgets can ONLY be placed inside containers
 * - The content array only contains containers
 * - Containers can contain widgets or other containers
 */

import { generateId } from '../parsers/psdParser.js';
import * as templates from './templates/index.js';

/**
 * Generate Elementor JSON from classified layers
 * @param {Array} layers - Classified layer tree
 * @param {Object} metadata - PSD metadata (width, height, fileName)
 * @returns {Object} Elementor JSON template
 */
export function generateElementorJson(layers, metadata) {
    // Ensure all root-level elements are containers
    // If there are widgets at root level, wrap them in a container
    const content = wrapInContainers(layers);

    return {
        content: content,
        page_settings: [],
        version: "0.4",
        title: metadata.fileName || "PSD Template",
        type: "page"
    };
}

/**
 * Ensure root-level elements are all containers
 * Widgets at root level are wrapped in an auto-generated container
 */
function wrapInContainers(layers) {
    const result = [];
    let widgetBuffer = [];

    for (const layer of layers) {
        if (layer.widgetType === 'container' || layer.isComposite ||
            (layer.children && layer.children.length > 0 && !layer.isComposite)) {
            // First, flush any buffered widgets into a container
            if (widgetBuffer.length > 0) {
                result.push(createWrapperContainer(widgetBuffer));
                widgetBuffer = [];
            }
            // Add the container element
            result.push(generateElement(layer));
        } else {
            // Buffer widget to be wrapped
            widgetBuffer.push(layer);
        }
    }

    // Flush remaining widgets
    if (widgetBuffer.length > 0) {
        result.push(createWrapperContainer(widgetBuffer));
    }

    return result;
}

/**
 * Create a wrapper container for orphan widgets
 */
function createWrapperContainer(widgets) {
    const container = templates.createContainer({
        id: generateId(),
        name: 'Auto Container',
        depth: 0
    });
    container.elements = widgets.map(widget => generateWidget(widget));
    return container;
}

/**
 * Generate an Elementor element from a layer
 * @param {Object} layer - Classified layer
 * @returns {Object} Elementor element
 */
function generateElement(layer) {
    const widgetType = layer.widgetType;

    // Handle composite widgets (image-box, icon-box, icon-list)
    if (layer.isComposite) {
        return generateCompositeWidget(layer);
    }

    // Handle containers with children
    if (widgetType === 'container' || (layer.children && layer.children.length > 0)) {
        return generateContainer(layer);
    }

    // Generate widget (should not reach here for root level due to wrapInContainers)
    return generateWidget(layer);
}

/**
 * Generate a widget element
 */
function generateWidget(layer) {
    const widgetType = layer.widgetType;

    switch (widgetType) {
        case 'heading':
            return templates.createHeadingWidget(layer);
        case 'text-editor':
            return templates.createTextWidget(layer);
        case 'button':
            return templates.createButtonWidget(layer);
        case 'image':
            return templates.createImageWidget(layer);
        case 'image-box':
            return templates.createImageBoxWidget(layer);
        case 'icon-box':
            return templates.createIconBoxWidget(layer);
        case 'icon-list':
            return templates.createIconListWidget(layer);
        case 'container':
        default:
            return templates.createEmptyContainer(layer);
    }
}

/**
 * Generate a container with nested elements
 * Ensures children are properly handled based on type
 */
function generateContainer(layer) {
    const container = templates.createContainer(layer);

    if (layer.children && layer.children.length > 0) {
        container.elements = layer.children.map(child => {
            // If child is a container, recurse
            if (child.widgetType === 'container' ||
                (child.children && child.children.length > 0 && !child.isComposite)) {
                return generateElement(child);
            }
            // Otherwise generate as widget
            return generateWidget(child);
        });
    }

    return container;
}

/**
 * Generate composite widgets (image-box, icon-box from grouped layers)
 * These are single widgets that combine multiple layer data
 */
function generateCompositeWidget(layer) {
    const widgetType = layer.widgetType;

    // Extract child data for composite widget
    const childData = extractCompositeData(layer.children || []);

    switch (widgetType) {
        case 'image-box':
            return templates.createImageBoxWidget({
                ...layer,
                compositeData: childData
            });
        case 'icon-box':
            return templates.createIconBoxWidget({
                ...layer,
                compositeData: childData
            });
        case 'icon-list':
            return templates.createIconListWidget({
                ...layer,
                compositeData: childData
            });
        default:
            return generateContainer(layer);
    }
}

/**
 * Extract data from children for composite widgets
 */
function extractCompositeData(children) {
    const data = {
        title: '',
        description: '',
        imageUrl: '',
        listItems: []
    };

    for (const child of children) {
        if (child.widgetType === 'heading') {
            data.title = child.textInfo?.text || child.name;
        } else if (child.widgetType === 'text-editor') {
            if (!data.description) {
                data.description = child.textInfo?.text || child.name;
            } else {
                data.listItems.push(child.textInfo?.text || child.name);
            }
        } else if (child.widgetType === 'image') {
            data.imageUrl = ''; // Placeholder - actual URL would come from exported assets
        }
    }

    return data;
}

/**
 * Format JSON with syntax highlighting for preview
 * @param {Object} json - JSON object to format
 * @returns {string} HTML string with syntax highlighting
 */
export function formatJsonWithHighlighting(json) {
    const jsonString = JSON.stringify(json, null, 2);

    return jsonString
        .replace(/(".*?"):/g, '<span class="json-key">$1</span>:')
        .replace(/: (".*?")/g, ': <span class="json-string">$1</span>')
        .replace(/: (\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
        .replace(/: (true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/: (null)/g, ': <span class="json-null">$1</span>');
}

/**
 * Download JSON as file
 * @param {Object} json - JSON object to download
 * @param {string} filename - Filename without extension
 */
export function downloadJson(json, filename) {
    const jsonString = JSON.stringify(json, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}
