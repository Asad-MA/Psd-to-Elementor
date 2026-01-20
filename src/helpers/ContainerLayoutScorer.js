import { LayoutDistanceHelper } from "./LayoutDistanceHelper.js";

export class ContainerLayoutScorer {

    static scoreRow(children) {
        let overlapScore = 0;
        let comparisons = 0;

        for (let i = 0; i < children.length - 1; i++) {
            for (let j = i + 1; j < children.length; j++) {
                const a = children[i].bounds;
                const b = children[j].bounds;

                const overlapY =
                    Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));

                const minHeight = Math.min(a.height, b.height);

                comparisons++;
                if (overlapY > minHeight * 0.3) overlapScore++;
            }
        }

        return comparisons ? overlapScore / comparisons : 0;
    }

    static scoreColumn(children) {
        let stackScore = 0;
        let comparisons = 0;

        for (let i = 0; i < children.length - 1; i++) {
            const a = children[i].bounds;
            const b = children[i + 1].bounds;

            comparisons++;
            if (a.bottom <= b.top) stackScore++;
        }

        return comparisons ? stackScore / comparisons : 0;
    }

    static scoreWrap(children) {
        if (children.length < 3) return 0;

        const sorted = [...children].sort(
            (a, b) => a.bounds.top - b.bounds.top
        );

        let rows = 1;
        let currentTop = sorted[0].bounds.top;
        let currentBottom = sorted[0].bounds.bottom;

        for (let i = 1; i < sorted.length; i++) {
            const item = sorted[i].bounds;
            const midLine = currentTop + (currentBottom - currentTop) / 2;

            if (item.top > midLine) {
                rows++;
                currentTop = item.top;
                currentBottom = item.bottom;
            } else {
                currentBottom = Math.max(currentBottom, item.bottom);
            }
        }

        return rows > 1 ? Math.min(1, (rows - 1) / (children.length - 1)) : 0;
    }

    static scoreGapConsistency(children, direction) {
        if (children.length < 3) return 0.5;

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

        if (gaps.length < 2) return 0.5;

        const avg = gaps.reduce((s, g) => s + g, 0) / gaps.length;
        const variance =
            gaps.reduce((s, g) => s + Math.pow(g - avg, 2), 0) / gaps.length;

        return Math.max(0, 1 - variance / (avg * avg + 1));
    }
}
