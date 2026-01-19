/**
 * Image Box Widget Template
 * Composite widget with image, title, and description
 */

import { generateId } from '../../parsers/psdParser.js';

// Name patterns for classification
const NAME_PATTERNS = {
    heading: /^(heading|title|h1|h2|h3|h4|h5|h6|headline|header|name)[-_]?/i,
    description: /^(desc|description|text|paragraph|body|content|subtitle|sub[-_]?title|info)[-_]?/i,
    image: /^(img|image|photo|picture|pic|icon|logo|thumb|thumbnail)[-_]?/i
};

/**
 * Classify image-box children into image, heading, and description
 * @param {Array} children - Array of child layer objects
 * @returns {Object} Classified elements { image, heading, description }
 */
export function classifyImageBoxChildren(children) {
    if (!children || children.length === 0) {
        return { image: null, heading: null, description: null };
    }

    const result = {
        image: null,
        heading: null,
        description: null
    };

    // Separate layers by type
    const imageLayers = [];
    const textLayers = [];

    children.forEach(child => {
        if (child.type === 'image' || child.hasImage) {
            imageLayers.push(child);
        } else if (child.type === 'text' && child.textInfo) {
            textLayers.push(child);
        }
    });

    // 1. Find the image - prioritize by type, then by name pattern
    if (imageLayers.length > 0) {
        // Prefer image with matching name pattern
        result.image = imageLayers.find(layer =>
            NAME_PATTERNS.image.test(layer.name)
        ) || imageLayers[0];
    }

    // 2. Classify text layers into heading and description
    if (textLayers.length === 1) {
        // Single text layer - determine if heading or description by font size
        const layer = textLayers[0];
        const fontSize = layer.textInfo?.fontSize || 16;
        if (fontSize >= 18 || NAME_PATTERNS.heading.test(layer.name)) {
            result.heading = layer;
        } else {
            result.description = layer;
        }
    } else if (textLayers.length >= 2) {
        // Multiple text layers - classify each
        const classified = classifyTextLayers(textLayers);
        result.heading = classified.heading;
        result.description = classified.description;
    }

    console.log("Image Box Children Classification:", {
        image: result.image?.name || null,
        heading: result.heading?.name || null,
        description: result.description?.name || null
    });

    return result;
}

/**
 * Classify text layers into heading and description
 * Uses multiple heuristics: name patterns, font size, position, and text length
 * @param {Array} textLayers - Array of text layer objects
 * @returns {Object} { heading, description }
 */
function classifyTextLayers(textLayers) {
    let heading = null;
    let description = null;

    // Score each text layer for "heading-ness"
    const scoredLayers = textLayers.map(layer => {
        let headingScore = 0;
        const textInfo = layer.textInfo || {};
        const name = layer.name || '';

        // Name pattern matching (strong signal)
        if (NAME_PATTERNS.heading.test(name)) {
            headingScore += 50;
        } else if (NAME_PATTERNS.description.test(name)) {
            headingScore -= 50;
        }

        // Font size (larger = more likely heading)
        const fontSize = textInfo.fontSize || 16;
        if (fontSize >= 24) headingScore += 30;
        else if (fontSize >= 20) headingScore += 20;
        else if (fontSize >= 18) headingScore += 10;
        else if (fontSize <= 14) headingScore -= 20;

        // Font weight (bold = more likely heading)
        const fontWeight = textInfo.fontWeight || 'normal';
        if (fontWeight === 'bold' || fontWeight === '600' || fontWeight === '700') {
            headingScore += 15;
        }

        // Text length (shorter = more likely heading)
        const textLength = (textInfo.text || '').length;
        if (textLength <= 50) headingScore += 10;
        else if (textLength > 100) headingScore -= 15;

        // Line count (single line more likely heading)
        const lineCount = (textInfo.text || '').split('\n').length;
        if (lineCount === 1) headingScore += 10;
        else if (lineCount > 2) headingScore -= 10;

        // Position (higher on page = more likely heading)
        const top = layer.bounds?.top || 0;

        return {
            layer,
            headingScore,
            top,
            fontSize
        };
    });

    // Sort by heading score descending
    scoredLayers.sort((a, b) => b.headingScore - a.headingScore);

    // The highest scored is the heading
    if (scoredLayers.length > 0) {
        heading = scoredLayers[0].layer;
    }

    // Find description - lowest heading score, or second text layer
    if (scoredLayers.length > 1) {
        // Get the layer with lowest heading score as description
        description = scoredLayers[scoredLayers.length - 1].layer;
    }

    // If only heading was found by score but both have similar scores,
    // use vertical position as tiebreaker (higher = heading)
    if (heading && description && scoredLayers[0].headingScore === scoredLayers[1].headingScore) {
        const sortedByPosition = [...scoredLayers].sort((a, b) => a.top - b.top);
        heading = sortedByPosition[0].layer;
        description = sortedByPosition[sortedByPosition.length - 1].layer;
    }

    return { heading, description };
}

/**
 * Create an image box widget
 * @param {Object} layer - Layer data with compositeData
 * @returns {Object} Elementor image-box widget
 */
export function createImageBoxWidget(layer) {
    const data = layer.compositeData || {};
    const textInfo = layer.textInfo || {};

    console.log("Generating Image Box Widget [createImageBoxWidget]:", layer);

    const imageBoxElements = classifyImageBoxChildren(layer.children);

    console.log("Image Box Children Classification:", imageBoxElements);

    return {
        id: generateId(),
        settings: {
            image: {
                url: data.imageUrl || "https://placehold.co/600x400",
                id: "",
                size: "",
                alt: "",
                source: "library"
            },
            title_text: imageBoxElements.heading.textInfo.text || textInfo.text || layer.name || "Title",
            description_text: imageBoxElements.description.textInfo.text || "Description text goes here.",
            text_align: imageBoxElements.heading.textInfo.alignment,
            position: "left",
            position_mobile: "top",
            text_align_mobile: "center",
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
                size: imageBoxElements.heading.textInfo.fontSize,
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
                size: imageBoxElements.description.textInfo.fontSize,
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
                top: "0",
                right: "0",
                bottom: "0",
                left: "0",
                isLinked: true
            },
            _border_border: "solid",
            _border_width: {
                unit: "px",
                top: "0",
                right: "0",
                bottom: "0",
                left: "0",
                isLinked: true
            },
            _border_radius: {
                unit: "px",
                top: "0",
                right: "0",
                bottom: "0",
                left: "0",
                isLinked: true
            }
        },
        elements: [],
        isInner: false,
        widgetType: "image-box",
        elType: "widget"
    };
}
