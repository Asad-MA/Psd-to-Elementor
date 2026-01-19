/**
 * Heading Widget Template
 */

import { generateId } from '../../parsers/psdParser.js';

/**
 * Create a heading widget
 * @param {Object} layer - Layer data with textInfo
 * @returns {Object} Elementor heading widget
 */
export function createHeadingWidget(layer) {
    const textInfo = layer.textInfo || {};

    return {
        id: generateId(),
        settings: {
            title: textInfo.text || layer.name || "Heading",
            align: textInfo.alignment || "center",
            typography_typography: "custom",
            typography_font_family: textInfo.fontFamily || "Poppins",
            typography_font_size: {
                unit: "px",
                size: textInfo.fontSize || 35,
                sizes: []
            },
            typography_font_weight: getFontWeight(textInfo.fontWeight) || "700",
            typography_text_transform: "none",
            typography_font_style: "normal",
            typography_text_decoration: "none",
            typography_line_height: {
                unit: "em",
                size: 1.2,
                sizes: []
            },
            typography_letter_spacing: {
                unit: "px",
                size: 0,
                sizes: []
            },
            title_color: textInfo.color || "#333333"
        },
        elements: [],
        isInner: false,
        widgetType: "heading",
        elType: "widget"
    };
}

/**
 * Convert font weight string to Elementor weight value
 */
function getFontWeight(weight) {
    const weights = {
        'thin': '100',
        'light': '300',
        'normal': '400',
        'medium': '500',
        'semibold': '600',
        'bold': '700',
        'extrabold': '800',
        'black': '900'
    };
    return weights[weight?.toLowerCase()] || weight || '700';
}
