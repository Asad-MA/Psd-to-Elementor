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

    const imageBoxElements = imageBoxClassifier.classify(layer.children);



    const position = LayoutRelationshipHelper.getRelativePosition(
        imageBoxElements.image.bounds,
        imageBoxElements.heading.bounds
    );

    const imageHeadingDistance =
        LayoutDistanceHelper.smartDistance(
            imageBoxElements.image.bounds,
            imageBoxElements.heading.bounds
        );

    const headingDescriptionDistance =
        LayoutDistanceHelper.verticalDistance(
            imageBoxElements.heading.bounds,
            imageBoxElements.description.bounds
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
            title_text: imageBoxElements.heading.textInfo.text || textInfo.text || layer.name || "Title",
            description_text: imageBoxElements.description.textInfo.text || "Description text goes here.",
            text_align: imageBoxElements.heading.textInfo.alignment,
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
            title_typography_font_family: imageBoxElements.heading.textInfo.fontFamily,
            title_typography_font_size: {
                unit: "px",
                size: imageBoxElements.heading.textInfo.fontSize,
                sizes: []
            },
            title_typography_font_weight: imageBoxElements.heading.textInfo.fontWeight,
            title_typography_line_height: {
                unit: "em",
                size: imageBoxElements.heading.textInfo.lineHeight,
                sizes: []
            },
            description_typography_typography: "custom",
            description_typography_font_family: imageBoxElements.description.textInfo.fontFamily,
            description_typography_font_size: {
                unit: "px",
                size: imageBoxElements.description.textInfo.fontSize,
                sizes: []
            },
            description_typography_font_weight: imageBoxElements.description.textInfo.fontWeight,
            description_typography_line_height: {
                unit: "em",
                size: imageBoxElements.description.textInfo.lineHeight,
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
