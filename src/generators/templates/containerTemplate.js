/**
 * Container Widget Template
 * Flexbox container with responsive settings
 */

import { generateId } from '../../parsers/psdParser.js';

/**
 * Create a container element
 * @param {Object} layer - Layer data
 * @returns {Object} Elementor container element
 */
export function createContainer(layer) {
    // Calculate layout based on children positions
    const layout = calculateLayout(layer.children || []);

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
                top: "0", // Default to 0 and let gap handle spacing
                right: "0",
                bottom: "0",
                left: "0",
                isLinked: true
            },
            padding_tablet: {
                unit: "px",
                top: "0",
                right: "0",
                bottom: "0",
                left: "0",
                isLinked: true
            },
            padding_mobile: {
                unit: "px",
                top: "0",
                right: "0",
                bottom: "0",
                left: "0",
                isLinked: true
            }
        },
        elements: [],
        isInner: layer.depth > 0,
        elType: "container"
    };
}

/**
 * Calculate flex layout settings based on children positions
 * @param {Array} children - Array of child layers
 */
function calculateLayout(children) {
    // Default settings
    const defaultLayout = {
        direction: "column",
        wrap: "nowrap",
        justifyContent: "flex-start",
        alignItems: "stretch" // Default stretch for columns
    };

    if (!children || children.length < 2) {
        return defaultLayout;
    }

    // Filter out invisible layers or layers with no bounds
    const visibleChildren = children.filter(c =>
        (c.visible !== false) && c.bounds && c.bounds.width > 0 && c.bounds.height > 0
    );

    if (visibleChildren.length < 2) {
        return defaultLayout;
    }

    // Sort by top position
    const sortedByTop = [...visibleChildren].sort((a, b) => a.bounds.top - b.bounds.top);

    // Check for row structure (any side-by-side items)
    let hasRowStructure = false;

    // Check every pair for vertical overlap (sharing Y space)
    // If we find any pair that sits side-by-side, we should probably use Row layout
    // Pure Column layout should only be used when everything is stacked
    for (let i = 0; i < visibleChildren.length - 1; i++) {
        const a = visibleChildren[i];
        for (let j = i + 1; j < visibleChildren.length; j++) {
            const b = visibleChildren[j];

            // Calculate vertical overlap amount
            const overlapY = Math.max(0, Math.min(a.bounds.bottom, b.bounds.bottom) - Math.max(a.bounds.top, b.bounds.top));

            // If they overlap significantly in Y (e.g. > 30% of height of smaller item), they are side-by-side
            const minHeight = Math.min(a.bounds.height, b.bounds.height);
            if (overlapY > minHeight * 0.3) {
                hasRowStructure = true;
                break;
            }
        }
        if (hasRowStructure) break;
    }

    const isRow = hasRowStructure;

    // Refinement: Check for Grid (Wrap)
    let isWrap = false;
    if (isRow) {
        // If it's a row, check for multiple lines
        let rowsDetected = 1;

        let currentLineBottom = sortedByTop[0].bounds.bottom;
        let currentLineTop = sortedByTop[0].bounds.top;

        for (let i = 1; i < sortedByTop.length; i++) {
            const item = sortedByTop[i];

            // Check if this item is on a new line
            // It's on a new line if its top is below the "center" of the previous line
            // or significantly below the bottom (with tolerance)

            const lineCenter = currentLineTop + (currentLineBottom - currentLineTop) / 2;

            if (item.bounds.top > lineCenter) {
                // It's likely a new line
                rowsDetected++;
                // Start tracking new line
                currentLineTop = item.bounds.top;
                currentLineBottom = item.bounds.bottom;
            } else {
                // Still on same line, extend bounds
                currentLineBottom = Math.max(currentLineBottom, item.bounds.bottom);
            }
        }

        if (rowsDetected > 1) {
            isWrap = true;
        }
    }

    return {
        direction: isRow ? "row" : "column",
        wrap: isWrap ? "wrap" : "nowrap",
        justifyContent: isRow ? "space-between" : "center",
        alignItems: isRow ? "flex-start" : "stretch" // Change align items for rows to top, feels safer than center for mixed heights
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
