/**
 * Image Box Widget Template
 * Composite widget with image, title, and description
 */

import { generateId } from '../../parsers/psdParser.js';

/**
 * Create an image box widget
 * @param {Object} layer - Layer data with compositeData
 * @returns {Object} Elementor image-box widget
 */
export function createImageBoxWidget(layer) {
    const data = layer.compositeData || {};
    const textInfo = layer.textInfo || {};

    return {
        id: generateId(),
        settings: {
            image: {
                url: data.imageUrl || "",
                id: "",
                size: "",
                alt: "",
                source: "library"
            },
            title_text: data.title || textInfo.text || layer.name || "Title",
            description_text: data.description || "Description text goes here.",
            text_align: "center",
            image_space: {
                unit: "px",
                size: 15,
                sizes: []
            },
            title_bottom_space: {
                unit: "px",
                size: 10,
                sizes: []
            },
            image_size: {
                unit: "%",
                size: 50,
                sizes: []
            },
            title_typography_typography: "custom",
            title_typography_font_family: "Roboto",
            title_typography_font_size: {
                unit: "px",
                size: 24,
                sizes: []
            },
            title_typography_font_weight: "600",
            title_typography_line_height: {
                unit: "em",
                size: 1.3,
                sizes: []
            },
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
            },
            _padding: {
                unit: "px",
                top: "20",
                right: "20",
                bottom: "20",
                left: "20",
                isLinked: true
            },
            _border_border: "solid",
            _border_width: {
                unit: "px",
                top: "1",
                right: "1",
                bottom: "1",
                left: "1",
                isLinked: true
            },
            _border_color: "#E5E5E5",
            _border_radius: {
                unit: "px",
                top: "12",
                right: "12",
                bottom: "12",
                left: "12",
                isLinked: true
            }
        },
        elements: [],
        isInner: false,
        widgetType: "image-box",
        elType: "widget"
    };
}
