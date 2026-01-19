/**
 * Button Widget Template
 */

import { generateId } from '../../parsers/psdParser.js';

/**
 * Create a button widget
 * @param {Object} layer - Layer data
 * @returns {Object} Elementor button widget
 */
export function createButtonWidget(layer) {
    const textInfo = layer.textInfo || {};

    // Try to extract button text from layer name or text
    let buttonText = textInfo.text || layer.name || "Click Here";
    // Clean up common prefixes
    buttonText = buttonText.replace(/^(btn[-_]?|button[-_]?)/i, '').trim() || "Click Here";

    return {
        id: generateId(),
        settings: {
            text: buttonText,
            align: "center",
            typography_typography: "custom",
            typography_font_family: textInfo.fontFamily || "Roboto",
            typography_font_size: {
                unit: "px",
                size: textInfo.fontSize || 16,
                sizes: []
            },
            typography_font_weight: "500",
            typography_text_transform: "uppercase",
            typography_line_height: {
                unit: "em",
                size: 1.5,
                sizes: []
            },
            border_radius: {
                unit: "px",
                top: "8",
                right: "8",
                bottom: "8",
                left: "8",
                isLinked: true
            },
            text_padding: {
                unit: "px",
                top: "14",
                right: "32",
                bottom: "14",
                left: "32",
                isLinked: false
            }
        },
        elements: [],
        isInner: false,
        widgetType: "button",
        elType: "widget"
    };
}
