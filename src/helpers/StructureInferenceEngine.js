/**
 * Structure Inference Engine
 * Infers widget types and structure from clustered layers using visual heuristics
 */

import { SpatialClusteringHelper } from './SpatialClusteringHelper.js';
import { generateId } from '../parsers/psdParser.js';

export class StructureInferenceEngine {

    /**
     * Widget detection thresholds
     */
    static THRESHOLDS = {
        HEADING_FONT_SIZE: 24,
        BUTTON_MAX_WIDTH: 300,
        BUTTON_MAX_HEIGHT: 80,
        BUTTON_ASPECT_MIN: 2,
        BUTTON_ASPECT_MAX: 6,
        ICON_MAX_SIZE: 100,
        PROXIMITY_THRESHOLD: 50
    };

    /**
     * Infer widget type for a cluster of layers
     * @param {Array} cluster - Array of layers that form a logical group
     * @returns {Object} {widgetType, confidence, layers}
     */
    static inferWidgetType(cluster) {
        if (!cluster || cluster.length === 0) {
            return { widgetType: 'container', confidence: 0, layers: [] };
        }

        // Single layer - classify directly
        if (cluster.length === 1) {
            return this.classifySingleLayer(cluster[0]);
        }

        // Multiple layers - check for composite widgets
        const composition = this.analyzeComposition(cluster);

        // Check for image-box pattern
        if (composition.hasImage && composition.hasHeading) {
            return {
                widgetType: 'image-box',
                confidence: 0.85,
                layers: cluster,
                compositeData: this.extractImageBoxData(cluster, composition)
            };
        }

        // Check for icon-box pattern (small icon + heading + text)
        if (composition.hasSmallImage && composition.hasHeading && composition.hasText) {
            return {
                widgetType: 'icon-box',
                confidence: 0.8,
                layers: cluster,
                compositeData: this.extractIconBoxData(cluster, composition)
            };
        }

        // Check for button pattern (shape + text nearby)
        if (composition.hasButtonShape && composition.textCount === 1) {
            return {
                widgetType: 'button',
                confidence: 0.75,
                layers: cluster
            };
        }

        // Check for icon-list pattern (multiple text items)
        if (composition.textCount >= 3 && !composition.hasImage) {
            return {
                widgetType: 'icon-list',
                confidence: 0.7,
                layers: cluster,
                compositeData: { listItems: composition.texts }
            };
        }

        // Default to container
        return {
            widgetType: 'container',
            confidence: 0.5,
            layers: cluster
        };
    }

    /**
     * Classify a single layer
     * @private
     */
    static classifySingleLayer(layer) {
        // Text layer
        if (layer.type === 'text' || layer.textInfo) {
            const fontSize = layer.textInfo?.fontSize || 16;
            if (fontSize >= this.THRESHOLDS.HEADING_FONT_SIZE) {
                return { widgetType: 'heading', confidence: 0.9, layers: [layer] };
            }
            return { widgetType: 'text-editor', confidence: 0.9, layers: [layer] };
        }

        // Check for button-like shape
        if (this.isButtonShape(layer)) {
            return { widgetType: 'button', confidence: 0.7, layers: [layer] };
        }

        // Image or shape
        if (layer.type === 'image' || layer.type === 'shape' || layer.hasImage) {
            return { widgetType: 'image', confidence: 0.85, layers: [layer] };
        }

        return { widgetType: 'container', confidence: 0.3, layers: [layer] };
    }

    /**
     * Analyze composition of a cluster
     * @private
     */
    static analyzeComposition(cluster) {
        const composition = {
            hasImage: false,
            hasSmallImage: false,
            hasHeading: false,
            hasText: false,
            hasButtonShape: false,
            textCount: 0,
            imageCount: 0,
            texts: [],
            headings: [],
            images: []
        };

        for (const layer of cluster) {
            // Text analysis
            if (layer.type === 'text' || layer.textInfo) {
                const fontSize = layer.textInfo?.fontSize || 16;
                const text = layer.textInfo?.text || layer.name;

                if (fontSize >= this.THRESHOLDS.HEADING_FONT_SIZE) {
                    composition.hasHeading = true;
                    composition.headings.push(layer);
                } else {
                    composition.hasText = true;
                    composition.texts.push(text);
                }
                composition.textCount++;
                continue;
            }

            // Image/shape analysis
            if (layer.type === 'image' || layer.type === 'shape' || layer.hasImage) {
                composition.imageCount++;
                composition.images.push(layer);

                const { width, height } = layer.bounds;

                // Check if small (icon-like)
                if (width <= this.THRESHOLDS.ICON_MAX_SIZE &&
                    height <= this.THRESHOLDS.ICON_MAX_SIZE) {
                    composition.hasSmallImage = true;
                } else {
                    composition.hasImage = true;
                }

                // Check if button-shaped
                if (this.isButtonShape(layer)) {
                    composition.hasButtonShape = true;
                }
            }
        }

        return composition;
    }

    /**
     * Check if a layer looks like a button
     * @private
     */
    static isButtonShape(layer) {
        const { width, height } = layer.bounds;
        if (!width || !height) return false;

        const ratio = width / height;

        return (
            width <= this.THRESHOLDS.BUTTON_MAX_WIDTH &&
            height <= this.THRESHOLDS.BUTTON_MAX_HEIGHT &&
            ratio >= this.THRESHOLDS.BUTTON_ASPECT_MIN &&
            ratio <= this.THRESHOLDS.BUTTON_ASPECT_MAX
        );
    }

    /**
     * Extract data for image-box widget
     * @private
     */
    static extractImageBoxData(cluster, composition) {
        const data = {
            title: '',
            description: '',
            imageUrl: ''
        };

        // Get heading
        if (composition.headings.length > 0) {
            const heading = composition.headings[0];
            data.title = heading.textInfo?.text || heading.name;
        }

        // Get description (first non-heading text)
        if (composition.texts.length > 0) {
            data.description = composition.texts[0];
        }

        return data;
    }

    /**
     * Extract data for icon-box widget
     * @private
     */
    static extractIconBoxData(cluster, composition) {
        const data = {
            title: '',
            description: '',
            iconUrl: ''
        };

        if (composition.headings.length > 0) {
            const heading = composition.headings[0];
            data.title = heading.textInfo?.text || heading.name;
        }

        if (composition.texts.length > 0) {
            data.description = composition.texts[0];
        }

        return data;
    }

    /**
     * Detect repeating patterns in clusters (cards, list items, etc.)
     * @param {Array<Array>} clusters - Array of layer clusters
     * @returns {Object} Pattern detection result
     */
    static detectRepeatingPatterns(clusters) {
        const pattern = SpatialClusteringHelper.detectRepeatingPattern(clusters);

        if (!pattern.isRepeating) {
            return { isRepeating: false, clusters };
        }

        // Infer type for one cluster as representative
        const sampleType = this.inferWidgetType(clusters[0]);

        return {
            isRepeating: true,
            count: pattern.count,
            widgetType: sampleType.widgetType,
            avgWidth: pattern.avgWidth,
            avgHeight: pattern.avgHeight,
            clusters
        };
    }

    /**
     * Score how well a cluster matches a widget type
     * @param {Array} cluster - Layer cluster
     * @param {string} widgetType - Widget type to check
     * @returns {number} Confidence score 0-1
     */
    static scoreCompositeMatch(cluster, widgetType) {
        const inferred = this.inferWidgetType(cluster);

        if (inferred.widgetType === widgetType) {
            return inferred.confidence;
        }

        return 0;
    }

    /**
     * Build a classified layer object from inference result
     * @param {Object} inference - Result from inferWidgetType
     * @param {Object} bounds - Cluster bounds
     * @returns {Object} Classified layer object
     */
    static buildClassifiedLayer(inference, bounds) {
        const layer = {
            id: generateId(),
            name: `Smart ${inference.widgetType}`,
            type: inference.widgetType === 'container' ? 'group' : inference.layers[0]?.type || 'group',
            widgetType: inference.widgetType,
            visible: true,
            bounds: bounds,
            children: [],
            isSmartDetected: true,
            confidence: inference.confidence
        };

        // Add composite data if available
        if (inference.compositeData) {
            layer.compositeData = inference.compositeData;
            layer.isComposite = true;

            // CRITICAL: Set children to the original layers for composite widgets
            // This is required by templates like imageBoxTemplate.js which classify children
            if (inference.layers && inference.layers.length > 0) {
                layer.children = inference.layers.map(l => ({
                    ...l,
                    widgetType: this.classifySingleLayer(l).widgetType,
                    badgeClass: l.type === 'text' ?
                        (l.textInfo?.fontSize >= 24 ? 'heading' : 'text') :
                        (l.hasImage || l.type === 'image' ? 'image' : 'container')
                }));
            }
        }

        // For non-composite containers, children should be set by caller
        if (inference.widgetType === 'container' && inference.layers) {
            layer.sourceLayerCount = inference.layers.length;
        }

        // Copy text info for text widgets
        if (['heading', 'text-editor'].includes(inference.widgetType) &&
            inference.layers[0]?.textInfo) {
            layer.textInfo = inference.layers[0].textInfo;
        }

        return layer;
    }
}
