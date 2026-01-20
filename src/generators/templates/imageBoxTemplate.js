/**
 * Image Box Widget Template
 * Composite widget with image, title, and description
 */

import { generateId } from '../../parsers/psdParser.js';
import ImageBoxContentClassifier from '../../classifiers/classifyImageBoxChildren.js';
import { LayoutRelationshipHelper } from '../../helpers/LayoutRelationshipHelper.js';
import { LayoutDistanceHelper } from '../../helpers/LayoutDistanceHelper.js';



/**
 * Create an image box widget
 * @param {Object} layer - Layer data with compositeData
 * @returns {Object} Elementor image-box widget
 */

const imageBoxClassifier = new ImageBoxContentClassifier({
    headingFontSize: 18
});

export function createImageBoxWidget(layer) {
    const data = layer.compositeData || {};
    const textInfo = layer.textInfo || {};

    //  console.log("Generating Image Box Widget [createImageBoxWidget]:", layer);

    const imageBoxElements = imageBoxClassifier.classify(layer.children || []);

    // Null safety: provide default bounds if elements are missing
    const defaultBounds = { top: 0, left: 0, right: 100, bottom: 100, width: 100, height: 100 };
    const defaultTextInfo = { text: '', fontSize: 16, fontFamily: 'Inter', fontWeight: 'normal', lineHeight: 1.5, alignment: 'left' };

    const imageBounds = imageBoxElements.image?.bounds || defaultBounds;
    const headingBounds = imageBoxElements.heading?.bounds || defaultBounds;
    const descriptionBounds = imageBoxElements.description?.bounds || defaultBounds;

    const headingTextInfo = imageBoxElements.heading?.textInfo || defaultTextInfo;
    const descriptionTextInfo = imageBoxElements.description?.textInfo || defaultTextInfo;

    const position = LayoutRelationshipHelper.getRelativePosition(
        imageBounds,
        headingBounds
    );

    const imageHeadingDistance =
        LayoutDistanceHelper.smartDistance(
            imageBounds,
            headingBounds
        );

    const headingDescriptionDistance =
        LayoutDistanceHelper.verticalDistance(
            headingBounds,
            descriptionBounds
        );



    // console.log("Image Box Children Classification:", imageBoxElements, position);

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
            title_text: headingTextInfo.text || data.title || textInfo.text || layer.name || "Title",
            description_text: descriptionTextInfo.text || data.description || "Description text goes here.",
            text_align: headingTextInfo.alignment || "left",
            position: position,
            position_mobile: "top",
            text_align_mobile: "center",
            image_space: {
                unit: "px",
                size: imageHeadingDistance || 15,
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
            title_typography_font_family: headingTextInfo.fontFamily || "Inter",
            title_typography_font_size: {
                unit: "px",
                size: headingTextInfo.fontSize || 24,
                sizes: []
            },
            title_typography_font_weight: headingTextInfo.fontWeight || "bold",
            title_typography_line_height: {
                unit: "em",
                size: headingTextInfo.lineHeight || 1.5,
                sizes: []
            },
            description_typography_typography: "custom",
            description_typography_font_family: descriptionTextInfo.fontFamily || "Inter",
            description_typography_font_size: {
                unit: "px",
                size: descriptionTextInfo.fontSize || 16,
                sizes: []
            },
            description_typography_font_weight: descriptionTextInfo.fontWeight || "normal",
            description_typography_line_height: {
                unit: "em",
                size: descriptionTextInfo.lineHeight || 1.6,
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

