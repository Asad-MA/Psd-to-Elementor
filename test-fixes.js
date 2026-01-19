
// Mock layer data for testing
const mockHeading = { widgetType: 'heading', name: 'Header' };
const mockText = { widgetType: 'text-editor', name: 'Description' };
const mockImage = { widgetType: 'image', name: 'Img' };
// Image Box is a complex widget
const mockImageBox = { widgetType: 'image-box', name: 'Feature' };

function detectCompositeWidget(children) {
    if (!children || children.length === 0) return null;

    const types = children.map(c => c.widgetType);
    const hasImage = types.includes('image');
    const hasHeading = types.includes('heading');
    const hasText = types.includes('text-editor');

    // The fixed logic
    const hasComplexWidgets = types.some(t =>
        ['image-box', 'icon-box', 'icon-list', 'container', 'button'].includes(t)
    );

    if (hasComplexWidgets) {
        return null;
    }

    // Image + Heading + optional Text = Image Box
    if (hasImage && hasHeading) {
        return 'image-box';
    }

    const textCount = types.filter(t => t === 'text-editor' || t === 'heading').length;
    if (textCount >= 3 && !hasImage) {
        return 'icon-list';
    }

    if (hasHeading && hasText && !hasImage) {
        return 'icon-box';
    }

    return null;
}

function convertFontSize(pt) {
    return Math.round(pt * 1.33333);
}

function runTests() {
    console.log("Running Enhancement Tests...\n");

    // Test 1: Composite Detection (User Scenario)
    // Structure: Heading + Text + ImageBox + ImageBox
    // Previously: Classified as Icon Box (Heading + Text triggered it, ignoring the Image Boxes)
    // Expected: Null (Container)
    const containerChildren = [mockHeading, mockText, mockImageBox, mockImageBox];
    const result1 = detectCompositeWidget(containerChildren);

    console.log("Test 1 (Complex Group Detection):");
    console.log("Scenario: Heading + Text + 2xImageBox");
    console.log(`Expected: null (Container)`);
    console.log(`Actual:   ${result1}`);
    console.log(result1 === null ? "PASS" : "FAIL");
    console.log("--------------------------------");

    // Test 2: Standard Icon Box (Should still work)
    // Structure: Heading + Text
    const iconBoxChildren = [mockHeading, mockText];
    const result2 = detectCompositeWidget(iconBoxChildren);

    console.log("Test 2 (Standard Icon Box):");
    console.log("Scenario: Heading + Text");
    console.log(`Expected: icon-box`);
    console.log(`Actual:   ${result2}`);
    console.log(result2 === 'icon-box' ? "PASS" : "FAIL");
    console.log("--------------------------------");

    // Test 3: Font Size Conversion
    // 12pt -> ~16px
    // 24pt -> ~32px
    console.log("Test 3 (Font Size Conversion):");
    const pt12 = convertFontSize(12);
    const pt24 = convertFontSize(24);

    console.log(`12pt -> ${pt12}px (Expected 16): ${pt12 === 16 ? "PASS" : "FAIL"}`);
    console.log(`24pt -> ${pt24}px (Expected 32): ${pt24 === 32 ? "PASS" : "FAIL"}`);
    console.log("--------------------------------");

}

runTests();
