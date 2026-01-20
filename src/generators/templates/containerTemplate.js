/**
 * Container Widget Template
 * Flexbox container with responsive settings
 */

import { generateId } from '../../parsers/psdParser.js';
import { ContainerLayoutHelper } from '../../helpers/ContainerLayoutHelper.js';

/**
 * Create a container element
 * @param {Object} layer - Layer data
 * @returns {Object} Elementor container element
 */
export function createContainer(layer) {
    // Calculate layout based on children positions
    const layout = ContainerLayoutHelper.calculateLayout(layer.children || []);

    // console.clear();
    console.log("Container Layout:", layout);

    return {
        id: generateId(),
        settings: {
            flex_direction: layout.direction,
            boxed_width: {
                unit: "px",
                size: 1170,
                sizes: []
            },
            flex_direction_mobile: "column",
            flex_justify_content: layout.justifyContent,
            flex_align_items: layout.alignItems,
            flex_align_items_mobile: "center",
            flex_gap: {
                column: "20",
                row: "20",
                isLinked: true,
                unit: "px",
                size: 20
            },
            flex_wrap: layout.wrap,
            flex_align_content: "flex-start",
            padding: {
                unit: "px",
                top: "100", // Default to 0 and let gap handle spacing
                right: "20",
                bottom: "100",
                left: "20",
                isLinked: true
            },
            padding_tablet: {
                unit: "px",
                top: "70",
                right: "20",
                bottom: "70",
                left: "20",
                isLinked: true
            },
            padding_mobile: {
                unit: "px",
                top: "40",
                right: "20",
                bottom: "40",
                left: "20",
                isLinked: true
            }
        },
        elements: [],
        isInner: layer.depth > 0,
        elType: "container"
    };
}

/**
 * Create an empty container (for single layers classified as container)
 */
export function createEmptyContainer(layer) {
    return {
        id: generateId(),
        settings: {
            content_width: "full",
            width: {
                unit: "%",
                size: 100,
                sizes: []
            }
        },
        elements: [],
        isInner: layer.depth > 0,
        elType: "container"
    };
}
