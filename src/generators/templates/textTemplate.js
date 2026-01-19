/**
 * Text Editor Widget Template
 */

import { generateId } from '../../parsers/psdParser.js';

/**
 * Create a text editor widget
 * @param {Object} layer - Layer data with textInfo
 * @returns {Object} Elementor text-editor widget
 */
export function createTextWidget(layer) {
    const textInfo = layer.textInfo || {};

    return {
        id: generateId(),
        settings: {
            editor: `<p>${textInfo.text || layer.name || "Add your text here"}</p>`,
            align: textInfo.alignment || "left",
            typography_typography: "custom",
            typography_font_family: textInfo.fontFamily || "Roboto",
            typography_font_size: {
                unit: "px",
                size: textInfo.fontSize || 16,
                sizes: []
            },
            typography_font_weight: textInfo.fontWeight === 'bold' ? '700' : '400',
            typography_text_transform: "none",
            typography_font_style: "normal",
            typography_text_decoration: "none",
            typography_line_height: {
                unit: "em",
                size: 1.7,
                sizes: []
            },
            text_color: textInfo.color || "#666666"
        },
        elements: [],
        isInner: false,
        widgetType: "text-editor",
        elType: "widget"
    };
}
