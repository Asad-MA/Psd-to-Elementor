# PSD Structure Guide for Elementor Conversion

This guide explains how to structure your PSD file to get the best Elementor JSON output.

## Hierarchy Rules

**IMPORTANT**: In Elementor, widgets can ONLY exist inside containers. The converter follows this rule:

```
content: [
  container { widgets... },
  container { container { widgets... }, widgets... }
]
```

## PSD Layer Structure → Elementor Output

```
📁 PSD File
├── 📁 section_hero              → Container (root level = container)
│   ├── heading_title            → Heading widget (inside container)
│   ├── text_description         → Text widget (inside container)
│   └── btn_cta                  → Button widget (inside container)
│
├── 📁 section_features          → Container
│   ├── 📁 card_feature1         → Image-Box widget (group with img + text)
│   │   ├── img_icon
│   │   ├── heading_title
│   │   └── text_desc
│   ├── 📁 card_feature2         → Image-Box widget
│   └── 📁 card_feature3         → Image-Box widget
│
├── 📁 section_about             → Container
│   ├── 📁 col_left              → Nested Container
│   │   └── img_photo            → Image widget
│   └── 📁 col_right             → Nested Container
│       ├── heading_about
│       └── text_story
│
└── background__ignore           → IGNORED (contains __ignore)
```

## Layer Naming Conventions

| Prefix | Widget Type | Example |
|--------|-------------|---------|
| `heading_` or `title_` | Heading | `heading_main`, `title_section` |
| `text_` or `desc_` | Text Editor | `text_intro`, `desc_feature` |
| `btn_` or `button_` | Button | `btn_submit`, `button_learn_more` |
| `img_` or `image_` | Image | `img_hero`, `image_product` |
| `card_` or `item_` | Image Box | `card_service`, `item_blog` |
| `feature_` or `service_` | Icon Box | `feature_speed`, `service_support` |
| `list_` | Icon List | `list_benefits` |
| `section_` or `container_` | Container | `section_hero`, `container_header` |

## Special Keywords

### `__ignore` - Skip Layer

Add `__ignore` anywhere in the layer name to exclude it from conversion:

```
background__ignore       ← Skipped
helper_guides__ignore    ← Skipped
notes__ignore            ← Skipped
```

### Group Detection

When layers are grouped together, the converter detects composite widgets:

| Group Contents | Detected Widget |
|----------------|-----------------|
| Image + Heading + Text | Image Box |
| Heading + Text (no image) | Icon Box |
| 3+ text items | Icon List |

## Best Practices

1. **Use folders for sections** - Each major section should be a folder (becomes a container)

2. **Name layers semantically** - Use prefixes like `heading_`, `btn_`, `img_`

3. **Group related elements** - Put image + title + description in a folder for Image Box

4. **Mark non-content layers** - Use `__ignore` for guides, backgrounds, annotations

5. **Nested containers** - Use nested folders for column layouts

## Example Mapping

### Simple Hero Section
```
📁 section_hero
├── heading_welcome        → Heading: "Welcome"
├── text_intro             → Text: intro paragraph
└── btn_get_started        → Button: "Get Started"
```

**Output:**
```json
{
  "elType": "container",
  "elements": [
    { "widgetType": "heading", ... },
    { "widgetType": "text-editor", ... },
    { "widgetType": "button", ... }
  ]
}
```

### Two-Column Layout
```
📁 section_split
├── 📁 col_left
│   └── img_photo
└── 📁 col_right
    ├── heading_title
    └── text_content
```

**Output:**
```json
{
  "elType": "container",
  "elements": [
    {
      "elType": "container",
      "elements": [{ "widgetType": "image" }]
    },
    {
      "elType": "container", 
      "elements": [
        { "widgetType": "heading" },
        { "widgetType": "text-editor" }
      ]
    }
  ]
}
```
