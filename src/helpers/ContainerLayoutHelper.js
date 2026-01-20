import { LayoutRelationshipHelper } from "./LayoutRelationshipHelper.js";
import { LayoutDistanceHelper } from "./LayoutDistanceHelper.js";

export class ContainerLayoutHelper {

    static getVisibleChildren(children) {
        return children.filter(c =>
            c.visible !== false &&
            c.bounds &&
            c.bounds.width > 0 &&
            c.bounds.height > 0
        );
    }

    static detectFlexDirection(children) {
        console.log("detectFlexDirection: ", children);
        if (children.length < 2) return "column";

        let hasRowStructure = false;

        for (let i = 0; i < children.length - 1; i++) {
            for (let j = i + 1; j < children.length; j++) {
                const a = children[i].bounds;
                const b = children[j].bounds;

                const overlapY =
                    Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

                const minHeight = Math.min(a.height, b.height);

                if (overlapY > minHeight * 0.3) {
                    hasRowStructure = true;
                    break;
                }
            }
            if (hasRowStructure) break;
        }

        return hasRowStructure ? "row" : "column";
    }

    static detectWrap(children) {
        if (children.length < 3) return false;

        const sorted = [...children].sort(
            (a, b) => a.bounds.top - b.bounds.top
        );

        let rows = 1;
        let currentTop = sorted[0].bounds.top;
        let currentBottom = sorted[0].bounds.bottom;

        for (let i = 1; i < sorted.length; i++) {
            const item = sorted[i].bounds;
            const centerLine = currentTop + (currentBottom - currentTop) / 2;

            if (item.top > centerLine) {
                rows++;
                currentTop = item.top;
                currentBottom = item.bottom;
            } else {
                currentBottom = Math.max(currentBottom, item.bottom);
            }
        }

        return rows > 1;
    }

    static calculateGap(children, direction) {
        if (children.length < 2) return 0;

        const sorted = [...children].sort((a, b) =>
            direction === "row"
                ? a.bounds.left - b.bounds.left
                : a.bounds.top - b.bounds.top
        );

        const gaps = [];

        for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i].bounds;
            const b = sorted[i + 1].bounds;

            const gap =
                direction === "row"
                    ? LayoutDistanceHelper.horizontalDistance(a, b)
                    : LayoutDistanceHelper.verticalDistance(a, b);

            if (gap > 0) gaps.push(gap);
        }

        // Use median for stability (better than avg)
        gaps.sort((a, b) => a - b);
        return gaps.length ? gaps[Math.floor(gaps.length / 2)] : 0;
    }

    static calculateLayout(children) {
        console.log("calculateLayout: ", children);
        const visibleChildren = this.getVisibleChildren(children);

        if (visibleChildren.length < 2) {
            return {
                direction: "column",
                wrap: "nowrap",
                gap: 0,
                justifyContent: "flex-start",
                alignItems: "stretch"
            };
        }

        const direction = this.detectFlexDirection(visibleChildren);
        const wrap = direction === "row" && this.detectWrap(visibleChildren)
            ? "wrap"
            : "nowrap";

        const gap = this.calculateGap(visibleChildren, direction);

        return {
            direction,
            wrap,
            gap,
            justifyContent: direction === "row" ? "space-between" : "flex-start",
            alignItems: direction === "row" ? "flex-start" : "stretch"
        };
    }
}

/*
import { ContainerLayoutScorer } from "./ContainerLayoutScorer.js";

export class ContainerLayoutHelper {

    static calculateLayout(children) {
        if (!children || children.length < 2) {
            return this.defaultResult();
        }

        const visible = children.filter(c =>
            c.visible !== false &&
            c.bounds &&
            c.bounds.width > 0 &&
            c.bounds.height > 0
        );

        if (visible.length < 2) {
            return this.defaultResult();
        }

        const rowScore =
            ContainerLayoutScorer.scoreRow(visible) * 0.5 +
            ContainerLayoutScorer.scoreGapConsistency(visible, "row") * 0.3;

        const columnScore =
            ContainerLayoutScorer.scoreColumn(visible) * 0.5 +
            ContainerLayoutScorer.scoreGapConsistency(visible, "column") * 0.3;

        const wrapScore =
            ContainerLayoutScorer.scoreWrap(visible) * 0.4;

        let direction = "column";
        let confidence = columnScore;

        if (rowScore > columnScore) {
            direction = "row";
            confidence = rowScore;
        }

        const wrap =
            direction === "row" && wrapScore > 0.3 ? "wrap" : "nowrap";

        return {
            direction,
            wrap,
            confidence: Number(confidence.toFixed(2)),
            justifyContent: direction === "row" ? "space-between" : "flex-start",
            alignItems: direction === "row" ? "flex-start" : "stretch"
        };
    }

    static defaultResult() {
        return {
            direction: "column",
            wrap: "nowrap",
            confidence: 1,
            justifyContent: "flex-start",
            alignItems: "stretch"
        };
    }
}
*/