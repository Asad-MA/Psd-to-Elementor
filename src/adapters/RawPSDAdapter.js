/**
 * RawPSD Adapter
 * Intelligently infers structure from ungrouped/unnamed PSD layers
 * using spatial analysis and visual heuristics
 */

import { SpatialClusteringHelper } from '../helpers/SpatialClusteringHelper.js';
import { StructureInferenceEngine } from '../helpers/StructureInferenceEngine.js';
import { generateId } from '../parsers/psdParser.js';

export class RawPSDAdapter {

    /**
     * Configuration for the adapter
     */
    static CONFIG = {
        PROXIMITY_THRESHOLD: 50,    // px - distance to consider layers as grouped
        MIN_CLUSTER_GAP: 80,        // px - min gap to create separate containers
        ROW_OVERLAP_RATIO: 0.3      // ratio of vertical overlap to consider same row
    };

    /**
     * Entry point: Convert flat/ungrouped layers to a classified tree structure
     * @param {Array} layers - Array of layers from PSD parser
     * @param {number} canvasWidth - Width of the PSD canvas
     * @returns {Array} Classified layer tree compatible with elementorGenerator
     */
    static processLayers(layers, canvasWidth) {
        // Step 1: Flatten all layers (ignore existing grouping)
        const flatLayers = this.flattenLayers(layers);

        if (flatLayers.length === 0) {
            return [];
        }

        // Step 2: Filter out invisible/invalid layers
        const validLayers = this.filterValidLayers(flatLayers);

        if (validLayers.length === 0) {
            return [];
        }

        // Step 3: Cluster by spatial proximity
        const clusters = SpatialClusteringHelper.clusterByProximity(
            validLayers,
            this.CONFIG.PROXIMITY_THRESHOLD
        );

        // Step 4: Detect container boundaries (rows/columns)
        const rows = SpatialClusteringHelper.detectContainerBoundaries(clusters, canvasWidth);

        // Step 5: Build classified tree
        const classifiedTree = this.buildTree(rows, canvasWidth);

        return classifiedTree;
    }

    /**
     * Flatten all nested layers into a single array
     * Ignores existing group structure
     * @param {Array} layers - Nested layer tree
     * @returns {Array} Flat array of leaf layers
     */
    static flattenLayers(layers) {
        const flat = [];

        const flatten = (layerList) => {
            for (const layer of layerList) {
                if (layer.children && layer.children.length > 0) {
                    // Recurse into children, ignoring the group itself
                    flatten(layer.children);
                } else {
                    // Leaf layer - add to flat list
                    flat.push(layer);
                }
            }
        };

        flatten(layers);
        return flat;
    }

    /**
     * Filter out invisible and invalid layers
     * @private
     */
    static filterValidLayers(layers) {
        return layers.filter(layer =>
            layer.visible !== false &&
            layer.bounds &&
            layer.bounds.width > 0 &&
            layer.bounds.height > 0
        );
    }

    /**
     * Build classified tree from row structure
     * @param {Array} rows - Array of rows, each row contains clusters
     * @param {number} canvasWidth - Canvas width for layout calculations
     * @returns {Array} Classified layer tree
     */
    static buildTree(rows, canvasWidth) {
        const result = [];

        for (const row of rows) {
            if (row.length === 0) continue;

            // Single cluster in row - might be a widget or container
            if (row.length === 1) {
                const cluster = row[0];
                const element = this.processCluster(cluster);
                result.push(element);
                continue;
            }

            // Multiple clusters in row - create a row container
            const rowContainer = this.createRowContainer(row);
            result.push(rowContainer);
        }

        // If there's only one top-level element and it's a container, return its contents
        // Otherwise, wrap everything in a root container
        if (result.length === 0) {
            return [];
        }

        if (result.length === 1) {
            return result;
        }

        // Multiple top-level elements - wrap in a column container
        return [this.createColumnContainer(result)];
    }

    /**
     * Process a single cluster into a classified element
     * @private
     */
    static processCluster(cluster) {
        // Use inference engine to determine widget type
        const inference = StructureInferenceEngine.inferWidgetType(cluster);
        const bounds = SpatialClusteringHelper.calculateClusterBounds(cluster);

        // Build the classified layer
        const element = StructureInferenceEngine.buildClassifiedLayer(inference, bounds);

        // For containers, recursively process children
        if (inference.widgetType === 'container' && cluster.length > 1) {
            // Sub-cluster the layers if needed
            const subClusters = this.subClusterLayers(cluster);

            if (subClusters.length > 1) {
                element.children = subClusters.map(sub => this.processCluster(sub));
            } else {
                // Convert each layer to a widget
                element.children = cluster.map(layer => {
                    const singleInference = StructureInferenceEngine.inferWidgetType([layer]);
                    return this.buildWidgetFromLayer(layer, singleInference);
                });
            }
        }

        // Add badge class for UI
        element.badgeClass = this.getBadgeClass(element.widgetType);

        return element;
    }

    /**
     * Sub-cluster layers within a container
     * @private
     */
    static subClusterLayers(layers) {
        // Use a smaller threshold for sub-clustering
        const subThreshold = this.CONFIG.PROXIMITY_THRESHOLD * 0.6;
        return SpatialClusteringHelper.clusterByProximity(layers, subThreshold);
    }

    /**
     * Build a widget from a single layer
     * @private
     */
    static buildWidgetFromLayer(layer, inference) {
        const widget = {
            id: layer.id || generateId(),
            name: layer.name,
            type: layer.type,
            widgetType: inference.widgetType,
            visible: layer.visible !== false,
            bounds: layer.bounds,
            children: [],
            isSmartDetected: true,
            confidence: inference.confidence,
            badgeClass: this.getBadgeClass(inference.widgetType)
        };

        // Copy text info if available
        if (layer.textInfo) {
            widget.textInfo = layer.textInfo;
        }

        // Copy image flag
        if (layer.hasImage) {
            widget.hasImage = true;
        }

        return widget;
    }

    /**
     * Create a row container (horizontal flex)
     * @private
     */
    static createRowContainer(clusters) {
        const allLayers = clusters.flat();
        const bounds = SpatialClusteringHelper.calculateClusterBounds(allLayers);

        // Check for repeating pattern (cards)
        const pattern = StructureInferenceEngine.detectRepeatingPatterns(clusters);

        const container = {
            id: generateId(),
            name: pattern.isRepeating ? 'Card Row' : 'Row Container',
            type: 'group',
            widgetType: 'container',
            visible: true,
            bounds: bounds,
            children: clusters.map(cluster => this.processCluster(cluster)),
            isSmartDetected: true,
            badgeClass: 'container',
            layout: {
                direction: 'row',
                wrap: 'nowrap',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }
        };

        if (pattern.isRepeating) {
            container.isRepeatingPattern = true;
            container.patternCount = pattern.count;
        }

        return container;
    }

    /**
     * Create a column container (vertical flex)
     * @private
     */
    static createColumnContainer(elements) {
        // Calculate bounds from all elements
        const allBounds = elements.map(e => e.bounds);
        const bounds = {
            top: Math.min(...allBounds.map(b => b.top)),
            left: Math.min(...allBounds.map(b => b.left)),
            right: Math.max(...allBounds.map(b => b.right)),
            bottom: Math.max(...allBounds.map(b => b.bottom)),
        };
        bounds.width = bounds.right - bounds.left;
        bounds.height = bounds.bottom - bounds.top;

        return {
            id: generateId(),
            name: 'Root Container',
            type: 'group',
            widgetType: 'container',
            visible: true,
            bounds: bounds,
            children: elements,
            isSmartDetected: true,
            badgeClass: 'container',
            layout: {
                direction: 'column',
                wrap: 'nowrap',
                justifyContent: 'flex-start',
                alignItems: 'stretch'
            }
        };
    }

    /**
     * Get badge class for UI display
     * @private
     */
    static getBadgeClass(widgetType) {
        const classes = {
            'container': 'container',
            'heading': 'heading',
            'text-editor': 'text',
            'button': 'button',
            'image': 'image',
            'image-box': 'image-box',
            'icon-box': 'icon-box',
            'icon-list': 'icon-list'
        };
        return classes[widgetType] || 'container';
    }
}
