export class LayoutDistanceHelper {
    /**
     * Vertical distance between two elements
     * Returns 0 if overlapping
     */
    static verticalDistance(a, b) {
        if (a.bottom < b.top) {
            return b.top - a.bottom;
        }

        if (b.bottom < a.top) {
            return a.top - b.bottom;
        }

        return 0;
    }

    /**
     * Horizontal distance between two elements
     * Returns 0 if overlapping
     */
    static horizontalDistance(a, b) {
        if (a.right < b.left) {
            return b.left - a.right;
        }

        if (b.right < a.left) {
            return a.left - b.right;
        }

        return 0;
    }

    /**
     * Smart distance
     * Automatically chooses horizontal or vertical gap
     * based on layout relationship
     */
    static smartDistance(a, b) {
        const vertical = this.verticalDistance(a, b);
        const horizontal = this.horizontalDistance(a, b);

        if (vertical === 0) return horizontal;
        if (horizontal === 0) return vertical;

        return Math.min(vertical, horizontal);
    }
}
