import TextStyleExtractor from '../helpers/TextStyleExtractor';

export default class ImageBoxContentClassifier {
    static NAME_PATTERNS = {
        heading: /^(heading|title|h1|h2|h3|h4|h5|h6|headline|header|name)[-_]?/i,
        description: /^(desc|description|text|paragraph|body|content|subtitle|sub[-_]?title|info)[-_]?/i,
        image: /^(img|image|photo|picture|pic|icon|logo|thumb|thumbnail)[-_]?/i
    };

    constructor(options = {}) {
        this.thresholds = {
            headingFontSize: options.headingFontSize ?? 18
        };
    }

    classify(children = []) {
        const result = { image: null, heading: null, description: null };

        const imageLayers = [];
        const textLayers = [];

        for (const child of children) {
            if (child.type === 'image' || child.hasImage) {
                imageLayers.push(child);
            }

            if (child.type === 'text') {
                child.textInfo ??= TextStyleExtractor.extract(child.textData);
                textLayers.push(child);
            }
        }

        result.image = this.#pickImage(imageLayers);

        if (textLayers.length === 1) {
            this.#assignSingleText(textLayers[0], result);
        } else if (textLayers.length > 1) {
            Object.assign(result, this.#classifyTextLayers(textLayers));
        }

        return result;
    }

    /* ==========================
       Private methods
       ========================== */

    #pickImage(imageLayers) {
        if (!imageLayers.length) return null;

        return (
            imageLayers.find(l =>
                ImageBoxContentClassifier.NAME_PATTERNS.image.test(l.name)
            ) || imageLayers[0]
        );
    }

    #assignSingleText(layer, result) {
        const { fontSize } = layer.textInfo;

        if (
            fontSize >= this.thresholds.headingFontSize ||
            ImageBoxContentClassifier.NAME_PATTERNS.heading.test(layer.name)
        ) {
            result.heading = layer;
        } else {
            result.description = layer;
        }
    }

    #classifyTextLayers(textLayers) {
        const scored = textLayers.map(layer => this.#scoreLayer(layer));

        scored.sort((a, b) => b.score - a.score);

        let heading = scored[0]?.layer || null;
        let description = scored[scored.length - 1]?.layer || null;

        if (scored.length > 1 && scored[0].score === scored[1].score) {
            const byTop = [...scored].sort((a, b) => a.top - b.top);
            heading = byTop[0].layer;
            description = byTop[byTop.length - 1].layer;
        }

        return { heading, description };
    }

    #scoreLayer(layer) {
        const { text, fontSize, fontWeight } = layer.textInfo;
        const name = layer.name || '';

        let score = 0;

        if (ImageBoxContentClassifier.NAME_PATTERNS.heading.test(name)) score += 50;
        if (ImageBoxContentClassifier.NAME_PATTERNS.description.test(name)) score -= 50;

        if (fontSize >= 24) score += 30;
        else if (fontSize >= 20) score += 20;
        else if (fontSize >= 18) score += 10;
        else if (fontSize <= 14) score -= 20;

        if (fontWeight === 'bold') score += 15;

        if (text.length <= 50) score += 10;
        else if (text.length > 100) score -= 15;

        const lines = text.split('\n').length;
        if (lines === 1) score += 10;
        else if (lines > 2) score -= 10;

        return {
            layer,
            score,
            top: layer.bounds?.top ?? 0
        };
    }
}
