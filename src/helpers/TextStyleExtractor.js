export default class TextStyleExtractor {
    /**
     * Main entry point
     * @param {Object} textData - PSD text layer data
     * @returns {Object} normalized text style object
     */
    static extract(textData = {}) {
        // console.log("TextStyleExtractor: ", textData);
        try {
            const style = textData.style || {};
            const paragraphStyle = textData.paragraphStyle || {};
            const transform = textData.transform || [];

            const fontSize = style.fontSize || 16;
            const scale = this.#getAverageScale(transform);
            const finalFontSize = Math.round(fontSize * scale);

            return {
                text: textData.text || '',
                fontSize: finalFontSize,
                fontFamily: this.#getFontFamily(style.font?.name),
                color: this.#extractColor(style.fillColor),
                alignment: this.#getAlignment(paragraphStyle.justification),
                fontWeight: this.#getFontWeight(style),
                lineHeight: this.#getLineHeight(style),
                textTransform: this.#getTextTransform(style.fontCaps),
                letterSpacing: this.#getLetterSpacing(style.tracking)
            };
        } catch (error) {
            console.warn('TextStyleExtractor failed:', error);
            return this.#getFallback(textData);
        }
    }

    /* ============================
       Internal helpers
       ============================ */

    static #getAverageScale(transform) {
        const scaleX = transform?.[0] ?? 1;
        const scaleY = transform?.[3] ?? 1;
        return (scaleX + scaleY) / 2;
    }

    static #getFontWeight(style) {
        if (style.fauxBold) return 'bold';

        const name = style.font?.name?.toLowerCase() || '';
        return name.includes('bold') ? 'bold' : 'normal';
    }

    static #getLineHeight(style) {
        if (!style.leading) return 1;
        return `${Math.round(style.leading) / 16}`;
    }

    static #getLetterSpacing(tracking) {
        if (!tracking) return 'normal';
        return `${tracking / 1000}`;
    }

    static #extractColor(fillColor) {
        if (!fillColor || fillColor.r === undefined) return '#000000';

        const r = Math.round(fillColor.r);
        const g = Math.round(fillColor.g);
        const b = Math.round(fillColor.b);

        return this.#rgbToHex(r, g, b);
    }

    static #getAlignment(justification) {
        const map = {
            left: 'left',
            right: 'right',
            center: 'center',
            justifyAll: 'justify',
            justifyLeft: 'left',
            justifyCenter: 'center',
            justifyRight: 'right'
        };
        return map[justification] || 'left';
    }

    static #rgbToHex(r, g, b) {
        return (
            '#' +
            [r, g, b]
                .map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0'))
                .join('')
        );
    }

    static #getFontFamily(psdFontName) {
        if (!psdFontName) return 'Arial';

        const map = {
            'ArialMT': 'Arial',
            'Arial-BoldMT': 'Arial',
            'Helvetica': 'Helvetica',
            'HelveticaNeue': 'Helvetica Neue',
            'TimesNewRomanPSMT': 'Times New Roman',
            'TimesNewRomanPS-BoldMT': 'Times New Roman',
            'Verdana': 'Verdana',
            'Georgia': 'Georgia',
            'CourierNewPSMT': 'Courier New',
            'Roboto-Regular': 'Roboto',
            'Roboto-Bold': 'Roboto',
            'OpenSans-Regular': 'Open Sans',
            'OpenSans-Bold': 'Open Sans',
            'Lato-Regular': 'Lato',
            'Montserrat-Regular': 'Montserrat',
            'Poppins-Regular': 'Poppins'
        };

        if (map[psdFontName]) return map[psdFontName];

        return psdFontName
            .replace(/-?(Bold|Italic|Regular|Light|Medium|Black).*/i, '')
            .replace(/(MT|PS|PSMT)$/i, '')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .trim();
    }

    static #getTextTransform(fontCaps) {
        if (fontCaps === 1 || fontCaps === 2) return 'uppercase';
        return 'none';
    }

    static #getFallback(textData) {
        return {
            text: textData?.text || '',
            fontSize: 16,
            fontFamily: 'Arial',
            color: '#000000',
            alignment: 'left',
            fontWeight: 'normal',
            lineHeight: 'normal',
            textTransform: 'none',
            letterSpacing: 'normal'
        };
    }
}
