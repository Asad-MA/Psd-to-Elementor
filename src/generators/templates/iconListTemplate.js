/**
 * Icon List Widget Template
 * List of items with icons
 */

import { generateId } from '../../parsers/psdParser.js';

/**
 * Create an icon list widget
 * @param {Object} layer - Layer data with compositeData
 * @returns {Object} Elementor icon-list widget
 */
export function createIconListWidget(layer) {
    const data = layer.compositeData || {};

    // Build list items from composite data or defaults
    const items = data.listItems && data.listItems.length > 0
        ? data.listItems.map(text => ({
            text: text,
            _id: generateId().substring(0, 7)
        }))
        : [
            { text: "List Item #1", _id: generateId().substring(0, 7) },
            { text: "List Item #2", _id: generateId().substring(0, 7) },
            { text: "List Item #3", _id: generateId().substring(0, 7) }
        ];

    return {
        id: generateId(),
        settings: {
            icon_list: items,
            space_between: {
                unit: "px",
                size: 10,
                sizes: []
            },
            icon_color: "#6366f1",
            icon_size: {
                unit: "px",
                size: 18,
                sizes: []
            },
            icon_self_align: "left",
            icon_self_vertical_align: "flex-start",
            icon_vertical_offset: {
                unit: "px",
                size: 6,
                sizes: []
            },
            icon_typography_typography: "custom",
            icon_typography_font_family: "Roboto",
            icon_typography_font_size: {
                unit: "px",
                size: 16,
                sizes: []
            },
            icon_typography_font_weight: "400",
            icon_typography_line_height: {
                unit: "em",
                size: 1.6,
                sizes: []
            },
            _padding: {
                unit: "px",
                top: "10",
                right: "10",
                bottom: "10",
                left: "10",
                isLinked: true
            }
        },
        elements: [],
        isInner: false,
        widgetType: "icon-list",
        elType: "widget"
    };
}
