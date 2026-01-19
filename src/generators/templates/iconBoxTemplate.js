/**
 * Icon Box Widget Template
 * Composite widget with icon, title, and description
 */

import { generateId } from '../../parsers/psdParser.js';

/**
 * Create an icon box widget
 * @param {Object} layer - Layer data with compositeData
 * @returns {Object} Elementor icon-box widget
 */
export function createIconBoxWidget(layer) {
    const data = layer.compositeData || {};
    const textInfo = layer.textInfo || {};

    return {
        id: generateId(),
        settings: {
            title_text: data.title || textInfo.text || layer.name || "Feature Title",
            description_text: data.description || "Feature description text goes here.",
            text_align: "center",
            title_bottom_space: {
                unit: "px",
                size: 15,
                sizes: []
            },
            primary_color: "#6366f1",
            icon_size: {
                unit: "px",
                size: 50,
                sizes: []
            },
            title_typography_typography: "custom",
            title_typography_font_family: "Roboto",
            title_typography_font_size: {
                unit: "px",
                size: 22,
                sizes: []
            },
            title_typography_font_weight: "600",
            title_typography_text_transform: "none",
            description_typography_typography: "custom",
            description_typography_font_family: "Roboto",
            description_typography_font_size: {
                unit: "px",
                size: 16,
                sizes: []
            },
            description_typography_font_weight: "400",
            description_typography_line_height: {
                unit: "em",
                size: 1.7,
                sizes: []
            }
        },
        elements: [],
        isInner: false,
        widgetType: "icon-box",
        elType: "widget"
    };
}
