/**
 * Image Widget Template
 */

import { generateId } from '../../parsers/psdParser.js';

/**
 * Create an image widget
 * @param {Object} layer - Layer data with bounds
 * @returns {Object} Elementor image widget
 */
export function createImageWidget(layer) {
    const bounds = layer.bounds || {};

    return {
        id: generateId(),
        settings: {
            image: {
                url: "https://placehold.co/600x400",
                id: "",
                size: "",
                alt: layer.name || "Image",
                source: "library"
            },
            align: "center",
            width: {
                unit: "px",
                size: bounds.width || 300,
                sizes: []
            },
            height: {
                unit: "px",
                size: bounds.height || 300,
                sizes: []
            },
            "object-fit": "cover",
            image_border_radius: {
                unit: "px",
                top: "8",
                right: "8",
                bottom: "8",
                left: "8",
                isLinked: true
            }
        },
        elements: [],
        isInner: false,
        widgetType: "image",
        elType: "widget"
    };
}
