/**
 * Spatial Clustering Helper
 * Groups layers based on spatial proximity using DBSCAN-like algorithm
 */

export class SpatialClusteringHelper {

    /**
     * Default threshold for considering layers as "nearby" (in pixels)
     */
    static DEFAULT_THRESHOLD = 20;

    /**
     * Cluster layers by spatial proximity
     * Uses a modified DBSCAN approach - layers within threshold distance are grouped
     * @param {Array} layers - Flat array of layer objects with bounds
     * @param {number} threshold - Maximum distance to consider layers as neighbors
     * @returns {Array<Array>} Array of clusters, each cluster is an array of layers
     */
    static clusterByProximity(layers, threshold = this.DEFAULT_THRESHOLD) {
        if (!layers || layers.length === 0) return [];
        if (layers.length === 1) return [layers];

        const visited = new Set();
        const clusters = [];

        for (const layer of layers) {
            if (visited.has(layer.id)) continue;

            const cluster = this.expandCluster(layer, layers, threshold, visited);
            if (cluster.length > 0) {
                clusters.push(cluster);
            }
        }

        return clusters;
    }

    /**
     * Expand a cluster from a seed layer
     * @private
     */
    static expandCluster(seed, allLayers, threshold, visited) {
        const cluster = [seed];
        visited.add(seed.id);

        const queue = [seed];

        while (queue.length > 0) {
            const current = queue.shift();
            const neighbors = this.findNeighbors(current, allLayers, threshold);

            for (const neighbor of neighbors) {
                if (!visited.has(neighbor.id)) {
                    visited.add(neighbor.id);
                    cluster.push(neighbor);
                    queue.push(neighbor);
                }
            }
        }

        return cluster;
    }

    /**
     * Find all layers within threshold distance of a given layer
     * @private
     */
    static findNeighbors(layer, allLayers, threshold) {
        return allLayers.filter(other => {
            if (other.id === layer.id) return false;
            return this.getMinDistance(layer.bounds, other.bounds) <= threshold;
        });
    }

    /**
     * Calculate minimum distance between two bounding boxes
     * Returns 0 if boxes overlap
     */
    static getMinDistance(boundsA, boundsB) {
        // Horizontal gap
        const hGap = Math.max(0,
            Math.max(boundsA.left, boundsB.left) -
            Math.min(boundsA.right, boundsB.right)
        );

        // Vertical gap
        const vGap = Math.max(0,
            Math.max(boundsA.top, boundsB.top) -
            Math.min(boundsA.bottom, boundsB.bottom)
        );

        // Euclidean distance of the gap
        return Math.sqrt(hGap * hGap + vGap * vGap);
    }

    /**
     * Detect container boundaries based on significant gaps
     * Groups clusters into row/column containers based on layout
     * @param {Array<Array>} clusters - Array of layer clusters
     * @param {number} canvasWidth - Width of the PSD canvas
     * @returns {Array} Hierarchical container structure
     */
    static detectContainerBoundaries(clusters, canvasWidth) {
        if (clusters.length === 0) return [];
        if (clusters.length === 1) return clusters;

        // Sort clusters by vertical position (top to bottom)
        const sortedClusters = [...clusters].sort((a, b) => {
            const boundsA = this.calculateClusterBounds(a);
            const boundsB = this.calculateClusterBounds(b);
            return boundsA.top - boundsB.top;
        });

        // Group into rows based on vertical overlap
        const rows = this.groupIntoRows(sortedClusters);

        return rows;
    }

    /**
     * Group clusters into rows based on vertical alignment
     * Clusters with significant Y overlap are considered same row
     * @private
     */
    static groupIntoRows(clusters) {
        const rows = [];
        let currentRow = [];
        let currentRowBounds = null;

        for (const cluster of clusters) {
            const clusterBounds = this.calculateClusterBounds(cluster);

            if (currentRow.length === 0) {
                currentRow.push(cluster);
                currentRowBounds = clusterBounds;
                continue;
            }

            // Check vertical overlap with current row
            const overlapY = this.getVerticalOverlap(currentRowBounds, clusterBounds);
            const minHeight = Math.min(currentRowBounds.height, clusterBounds.height);

            // If significant overlap (>30%), add to same row
            if (overlapY > minHeight * 0.3) {
                currentRow.push(cluster);
                // Expand row bounds
                currentRowBounds = {
                    top: Math.min(currentRowBounds.top, clusterBounds.top),
                    bottom: Math.max(currentRowBounds.bottom, clusterBounds.bottom),
                    left: Math.min(currentRowBounds.left, clusterBounds.left),
                    right: Math.max(currentRowBounds.right, clusterBounds.right),
                    height: Math.max(currentRowBounds.bottom, clusterBounds.bottom) -
                        Math.min(currentRowBounds.top, clusterBounds.top)
                };
            } else {
                // Start new row
                if (currentRow.length > 0) {
                    rows.push(currentRow);
                }
                currentRow = [cluster];
                currentRowBounds = clusterBounds;
            }
        }

        // Don't forget the last row
        if (currentRow.length > 0) {
            rows.push(currentRow);
        }

        return rows;
    }

    /**
     * Calculate vertical overlap between two bounds
     * @private
     */
    static getVerticalOverlap(boundsA, boundsB) {
        return Math.max(0,
            Math.min(boundsA.bottom, boundsB.bottom) -
            Math.max(boundsA.top, boundsB.top)
        );
    }

    /**
     * Calculate bounding box for a cluster of layers
     * @param {Array} cluster - Array of layers
     * @returns {Object} Bounding box {top, left, right, bottom, width, height}
     */
    static calculateClusterBounds(cluster) {
        if (!cluster || cluster.length === 0) {
            return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
        }

        let minTop = Infinity;
        let minLeft = Infinity;
        let maxRight = -Infinity;
        let maxBottom = -Infinity;

        for (const layer of cluster) {
            const bounds = layer.bounds;
            if (!bounds) continue;

            minTop = Math.min(minTop, bounds.top);
            minLeft = Math.min(minLeft, bounds.left);
            maxRight = Math.max(maxRight, bounds.right);
            maxBottom = Math.max(maxBottom, bounds.bottom);
        }

        return {
            top: minTop,
            left: minLeft,
            right: maxRight,
            bottom: maxBottom,
            width: maxRight - minLeft,
            height: maxBottom - minTop
        };
    }

    /**
     * Sort layers by reading order (top-to-bottom, left-to-right)
     * @param {Array} layers - Array of layers
     * @returns {Array} Sorted layers
     */
    static sortByReadingOrder(layers) {
        return [...layers].sort((a, b) => {
            const boundsA = a.bounds;
            const boundsB = b.bounds;

            // First sort by vertical position (with some tolerance)
            const yDiff = boundsA.top - boundsB.top;
            if (Math.abs(yDiff) > 20) {
                return yDiff;
            }

            // If roughly same vertical position, sort by horizontal
            return boundsA.left - boundsB.left;
        });
    }

    /**
     * Detect if clusters form a repeating pattern (like cards)
     * @param {Array<Array>} clusters - Array of clusters
     * @returns {Object} Pattern info {isRepeating, count, avgWidth, avgHeight}
     */
    static detectRepeatingPattern(clusters) {
        if (clusters.length < 2) {
            return { isRepeating: false };
        }

        const bounds = clusters.map(c => this.calculateClusterBounds(c));
        const widths = bounds.map(b => b.width);
        const heights = bounds.map(b => b.height);

        const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
        const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length;

        // Check if sizes are similar (within 20% of average)
        const isRepeating = bounds.every(b =>
            Math.abs(b.width - avgWidth) < avgWidth * 0.2 &&
            Math.abs(b.height - avgHeight) < avgHeight * 0.2
        );

        return {
            isRepeating,
            count: clusters.length,
            avgWidth,
            avgHeight
        };
    }
}
