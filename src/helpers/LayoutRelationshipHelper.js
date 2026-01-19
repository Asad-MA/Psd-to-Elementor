export class LayoutRelationshipHelper {
    /**
     * Merge multiple bounds into a single bounding box
     */
    static mergeBounds(...boundsList) {
        return {
            top: Math.min(...boundsList.map(b => b.top)),
            left: Math.min(...boundsList.map(b => b.left)),
            right: Math.max(...boundsList.map(b => b.right)),
            bottom: Math.max(...boundsList.map(b => b.bottom)),
            width:
                Math.max(...boundsList.map(b => b.right)) -
                Math.min(...boundsList.map(b => b.left)),
            height:
                Math.max(...boundsList.map(b => b.bottom)) -
                Math.min(...boundsList.map(b => b.top))
        };
    }

    /**
     * Get center point of a bounding box
     */
    static getCenter(bounds) {
        return {
            x: bounds.left + bounds.width / 2,
            y: bounds.top + bounds.height / 2
        };
    }

    /**
     * Determine image position relative to a text group
     * Returns: left | right | top | bottom | overlapping
     */
    static getRelativePosition(imageBounds, textBounds) {
        const imageCenter = this.getCenter(imageBounds);

        if (imageCenter.x < textBounds.left) {
            return "left";
        }

        if (imageCenter.x > textBounds.right) {
            return "right";
        }

        if (imageCenter.y < textBounds.top) {
            return "top";
        }

        if (imageCenter.y > textBounds.bottom) {
            return "bottom";
        }

        return "overlapping";
    }

    /**
     * Infer flex-direction based on layout
     * Returns: row | row-reverse | column | column-reverse
     */
    static inferFlexDirection(imageBounds, textBounds) {
        const position = this.getRelativePosition(imageBounds, textBounds);

        switch (position) {
            case "left":
                return "row";
            case "right":
                return "row-reverse";
            case "top":
                return "column";
            case "bottom":
                return "column-reverse";
            default:
                return "row";
        }
    }
}
