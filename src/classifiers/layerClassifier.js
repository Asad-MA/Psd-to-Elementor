/**
 * Layer Classifier Module
 * Classifies PSD layers into Elementor widget types
 */

const COMPOSITE_WIDGETS = ['image-box', 'icon-box', 'icon-list'];

// Widget type patterns based on layer naming conventions
const PATTERNS = {
    heading: /^(heading|title|h1|h2|h3|h4|h5|h6|headline|header)[-_]?/i,
    button: /^(btn|button|cta|action)[-_]?/i,
    image: /^(img|image|photo|picture|pic|banner|hero)[-_]?/i,
    text: /^(text|paragraph|desc|description|body|content|p)[-_]?/i,
    iconBox: /^(icon[-_]?box|feature[-_]?box|service)[-_]?/i,
    imageBox: /^(image[-_]?box|card|product|item|blog[-_]?post)[-_]?/i,
    iconList: /^(icon[-_]?list|list|menu|nav|features|bullets)[-_]?/i,
    container: /^(container|section|row|wrapper|box|group|block)[-_]?/i
};

// Badge class mapping for UI
const BADGE_CLASSES = {
    container: 'container',
    heading: 'heading',
    'text-editor': 'text',
    button: 'button',
    image: 'image',
    'image-box': 'image-box',
    'icon-box': 'icon-box',
    'icon-list': 'icon-list'
};

/**
 * Classify a layer tree into Elementor widget types
 * @param {Array} layers - Array of layer objects from PSD parser
 * @returns {Array} Classified layers with widget types
 */
export function classifyLayers(layers) {
    return layers.map(layer => classifyLayer(layer));
}

/**
 * Classify a single layer
 * @param {Object} layer - Layer object
 * @returns {Object} Layer with widget type assigned
 */
function classifyLayer(layer) {
    const classified = { ...layer };

    // Classify based on layer type and name
    classified.widgetType = determineWidgetType(layer);

    console.table([
        {
            label: 'Layer',
            value: layer
        },
        {
            label: 'Classified',
            value: classified
        },
        {
            label: 'Widget Type',
            value: classified?.widgetType
        }
    ]);


    classified.badgeClass = BADGE_CLASSES[classified.widgetType] || 'container';

    // Recursively classify children
    if (layer.children && layer.children.length > 0 && !COMPOSITE_WIDGETS.includes(classified.widgetType)) {
        console.log("Moving to the children", classified.widgetType);
        classified.children = layer.children.map(child => classifyLayer(child));

        // Check if this group should be a composite widget
        const compositeType = detectCompositeWidget(classified.children);
        if (compositeType && classified.widgetType === 'container') {
            classified.widgetType = compositeType;
            classified.badgeClass = BADGE_CLASSES[compositeType];
            classified.isComposite = true;
        }
    }

    return classified;
}

/**
 * Determine widget type for a layer
 */
function determineWidgetType(layer) {
    const name = layer.name.toLowerCase();

    // Check name patterns first (explicit naming)
    if (PATTERNS.button.test(name)) return 'button';
    if (PATTERNS.heading.test(name)) return 'heading';
    if (PATTERNS.iconBox.test(name)) return 'icon-box';
    if (PATTERNS.imageBox.test(name)) return 'image-box';
    if (PATTERNS.iconList.test(name)) return 'icon-list';
    if (PATTERNS.text.test(name)) return 'text-editor';
    if (PATTERNS.image.test(name)) return 'image';
    if (PATTERNS.container.test(name)) return 'container';

    // Infer from layer type
    if (layer.type === 'group') {
        return 'container';
    }

    if (layer.type === 'text') {
        // Determine if heading or text based on font size
        const fontSize = layer.textInfo?.fontSize || 16;
        if (fontSize >= 24 || isHeadingName(name)) {
            return 'heading';
        }
        return 'text-editor';
    }

    if (layer.type === 'image' || layer.type === 'shape') {
        // Check if it looks like a button
        if (isButtonShape(layer, name)) {
            return 'button';
        }
        return 'image';
    }

    return 'container';
}

/**
 * Check if name suggests a heading
 */
function isHeadingName(name) {
    const headingKeywords = ['title', 'heading', 'header', 'headline', 'name'];
    return headingKeywords.some(keyword => name.includes(keyword));
}

/**
 * Check if layer looks like a button
 */
function isButtonShape(layer, name) {
    const buttonKeywords = ['btn', 'button', 'cta', 'click', 'submit', 'action'];
    if (buttonKeywords.some(keyword => name.includes(keyword))) {
        return true;
    }

    // Check aspect ratio - buttons are typically wide and short
    const { width, height } = layer.bounds;
    if (width && height) {
        const ratio = width / height;
        // Button-like ratio: 2:1 to 6:1
        if (ratio >= 2 && ratio <= 6 && height <= 80) {
            return true;
        }
    }

    return false;
}

/**
 * Detect if children form a composite widget
 */
function detectCompositeWidget(children) {
    if (!children || children.length === 0) return null;

    console.log("Composite Widget [detectCompositeWidget]:", children);

    const types = children.map(c => c.widgetType);
    const hasImage = types.includes('image');
    const hasHeading = types.includes('heading');
    const hasText = types.includes('text-editor');

    // Check for complex widgets that should prevent composite classification
    // If a group contains other composite widgets (like image-box) or nested containers,
    // it should remain a container itself to preserve structure
    const hasComplexWidgets = types.some(t =>
        ['image-box', 'icon-box', 'icon-list', 'container', 'button'].includes(t)
    );

    if (hasComplexWidgets) {
        return null; // Force it to be a container
    }

    // Image + Heading + optional Text = Image Box
    if (hasImage && hasHeading) {
        return 'image-box';
    }

    // Multiple text items = Icon List
    const textCount = types.filter(t => t === 'text-editor' || t === 'heading').length;
    if (textCount >= 3 && !hasImage) {
        return 'icon-list';
    }

    // Heading + Text without Image = Icon Box (often has icon placeholder)
    if (hasHeading && hasText && !hasImage) {
        return 'icon-box';
    }

    return null;
}

/**
 * Get display name for widget type
 */
export function getWidgetDisplayName(widgetType) {
    const names = {
        'container': 'Container',
        'heading': 'Heading',
        'text-editor': 'Text',
        'button': 'Button',
        'image': 'Image',
        'image-box': 'Image Box',
        'icon-box': 'Icon Box',
        'icon-list': 'Icon List'
    };
    return names[widgetType] || widgetType;
}

/**
 * Get icon SVG for widget type
 */
export function getWidgetIcon(widgetType) {
    const icons = {
        'container': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>',
        'heading': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17 10v8"/><path d="M21 10v8"/><path d="M17 10h4"/></svg>',
        'text-editor': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h10"/></svg>',
        'button': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="8" width="18" height="8" rx="2"/><path d="M12 12h.01"/></svg>',
        'image': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>',
        'image-box': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><rect x="6" y="6" width="6" height="5" rx="1"/><path d="M6 14h12"/><path d="M6 17h8"/></svg>',
        'icon-box': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="8" r="2"/><path d="M8 14h8"/><path d="M8 17h8"/></svg>',
        'icon-list': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="6" cy="6" r="2"/><path d="M10 6h10"/><circle cx="6" cy="12" r="2"/><path d="M10 12h10"/><circle cx="6" cy="18" r="2"/><path d="M10 18h10"/></svg>'
    };
    return icons[widgetType] || icons['container'];
}
