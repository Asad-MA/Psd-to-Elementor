/**
 * Layer Preview Component
 * Renders layer tree with drag-and-drop reordering
 */

import { getWidgetDisplayName, getWidgetIcon } from '../classifiers/layerClassifier.js';

let draggedItem = null;
let draggedData = null;
let layers = [];
let onLayersChange = null;

/**
 * Initialize the layer preview component
 * @param {HTMLElement} container - Container element
 * @param {Array} initialLayers - Initial layer data
 * @param {Function} onChange - Callback when layers change
 */
export function initLayerPreview(container, initialLayers, onChange) {
    layers = JSON.parse(JSON.stringify(initialLayers)); // Deep clone
    onLayersChange = onChange;
    render(container);
}

/**
 * Get current layers state
 */
export function getLayers() {
    return layers;
}

/**
 * Render the layer tree
 */
function render(container) {
    container.innerHTML = '';
    layers.forEach((layer, index) => {
        container.appendChild(createLayerItem(layer, index, layers, null));
    });
}

/**
 * Create a layer item element
 */
function createLayerItem(layer, index, siblings, parent) {
    const item = document.createElement('div');
    item.className = 'layer-item';
    item.dataset.id = layer.id;

    const hasChildren = layer.children && layer.children.length > 0;
    const isContainer = layer.widgetType === 'container' || hasChildren;

    // Create row
    const row = document.createElement('div');
    row.className = 'layer-item__row';
    row.draggable = true;
    row.dataset.id = layer.id;

    // Toggle button for containers
    if (hasChildren) {
        const toggle = document.createElement('span');
        toggle.className = 'layer-item__toggle expanded';
        toggle.innerHTML = '›';
        toggle.addEventListener('click', (e) => {
            e.stopPropagation();
            toggle.classList.toggle('expanded');
            const children = item.querySelector('.layer-item__children');
            if (children) {
                children.classList.toggle('collapsed');
            }
        });
        row.appendChild(toggle);
    } else {
        const spacer = document.createElement('span');
        spacer.style.width = '20px';
        row.appendChild(spacer);
    }

    // Icon
    const icon = document.createElement('span');
    icon.className = 'layer-item__icon';
    icon.innerHTML = getWidgetIcon(layer.widgetType);
    row.appendChild(icon);

    // Name
    const name = document.createElement('span');
    name.className = 'layer-item__name';
    name.textContent = layer.name;
    name.title = layer.name;
    row.appendChild(name);

    // Badge
    const badge = document.createElement('span');
    badge.className = `layer-item__badge layer-item__badge--${layer.badgeClass || 'container'}`;
    badge.textContent = getWidgetDisplayName(layer.widgetType);
    row.appendChild(badge);

    // Drag events
    row.addEventListener('dragstart', handleDragStart);
    row.addEventListener('dragend', handleDragEnd);
    row.addEventListener('dragover', handleDragOver);
    row.addEventListener('dragleave', handleDragLeave);
    row.addEventListener('drop', handleDrop);

    item.appendChild(row);

    // Children
    if (hasChildren) {
        const childrenContainer = document.createElement('div');
        childrenContainer.className = 'layer-item__children';
        layer.children.forEach((child, childIndex) => {
            childrenContainer.appendChild(createLayerItem(child, childIndex, layer.children, layer));
        });
        item.appendChild(childrenContainer);
    }

    // Make containers droppable for nesting
    if (isContainer) {
        row.addEventListener('dragover', handleContainerDragOver);
        row.addEventListener('drop', handleContainerDrop);
    }

    return item;
}

/**
 * Drag start handler
 */
function handleDragStart(e) {
    draggedItem = e.target;
    draggedData = findLayerById(draggedItem.dataset.id);

    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedItem.dataset.id);

    // Add slight delay to allow for visual feedback
    setTimeout(() => {
        if (draggedItem) draggedItem.style.opacity = '0.5';
    }, 0);
}

/**
 * Drag end handler
 */
function handleDragEnd(e) {
    e.target.classList.remove('dragging');
    e.target.style.opacity = '';

    // Remove all drop indicators
    document.querySelectorAll('.drag-over, .drop-above, .drop-below').forEach(el => {
        el.classList.remove('drag-over', 'drop-above', 'drop-below');
    });

    draggedItem = null;
    draggedData = null;
}

/**
 * Drag over handler for reordering
 */
function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const target = e.target.closest('.layer-item__row');
    if (!target || target === draggedItem) return;

    // Determine drop position (above or below)
    const rect = target.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;

    target.classList.remove('drop-above', 'drop-below');
    if (e.clientY < midY) {
        target.classList.add('drop-above');
    } else {
        target.classList.add('drop-below');
    }
}

/**
 * Drag leave handler
 */
function handleDragLeave(e) {
    const target = e.target.closest('.layer-item__row');
    if (target) {
        target.classList.remove('drag-over', 'drop-above', 'drop-below');
    }
}

/**
 * Drop handler for reordering
 */
function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target.closest('.layer-item__row');
    if (!target || target === draggedItem) return;

    const draggedId = e.dataTransfer.getData('text/plain');
    const targetId = target.dataset.id;

    // Determine drop position
    const rect = target.getBoundingClientRect();
    const dropBefore = e.clientY < rect.top + rect.height / 2;

    // Move the layer
    moveLayer(draggedId, targetId, dropBefore);

    // Re-render
    const container = document.getElementById('layerTree');
    render(container);

    // Notify of change
    if (onLayersChange) {
        onLayersChange(layers);
    }
}

/**
 * Handle drag over for container nesting
 */
function handleContainerDragOver(e) {
    e.preventDefault();
    e.stopPropagation();

    const target = e.target.closest('.layer-item__row');
    if (!target || target === draggedItem) return;

    // Check if this is a container
    const targetId = target.dataset.id;
    const targetLayer = findLayerById(targetId);

    if (targetLayer && (targetLayer.widgetType === 'container' || targetLayer.children)) {
        target.classList.add('drag-over');
    }
}

/**
 * Handle drop into container for nesting
 */
function handleContainerDrop(e) {
    const target = e.target.closest('.layer-item__row');
    if (!target || target === draggedItem) return;

    const targetId = target.dataset.id;
    const targetLayer = findLayerById(targetId);

    // Only proceed if dropping into a non-standard reorder zone (center of container)
    const rect = target.getBoundingClientRect();
    const centerZone = rect.height * 0.3;
    const inCenterZone = e.clientY > rect.top + centerZone && e.clientY < rect.bottom - centerZone;

    if (targetLayer && (targetLayer.widgetType === 'container' || targetLayer.children) && inCenterZone) {
        e.preventDefault();
        e.stopPropagation();

        const draggedId = e.dataTransfer.getData('text/plain');

        // Nest the layer inside the container
        nestLayer(draggedId, targetId);

        // Re-render
        const container = document.getElementById('layerTree');
        render(container);

        if (onLayersChange) {
            onLayersChange(layers);
        }
    }
}

/**
 * Find a layer by ID in the tree
 */
function findLayerById(id, searchLayers = layers) {
    for (const layer of searchLayers) {
        if (layer.id === id) return layer;
        if (layer.children) {
            const found = findLayerById(id, layer.children);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Find parent of a layer
 */
function findParentOf(id, searchLayers = layers, parent = null) {
    for (const layer of searchLayers) {
        if (layer.id === id) return { parent, siblings: searchLayers };
        if (layer.children) {
            const found = findParentOf(id, layer.children, layer);
            if (found) return found;
        }
    }
    return null;
}

/**
 * Remove a layer from the tree
 */
function removeLayer(id) {
    const result = findParentOf(id);
    if (!result) return null;

    const { siblings } = result;
    const index = siblings.findIndex(l => l.id === id);
    if (index > -1) {
        return siblings.splice(index, 1)[0];
    }
    return null;
}

/**
 * Move a layer relative to another
 */
function moveLayer(draggedId, targetId, before) {
    // Don't allow moving to itself or its children
    if (draggedId === targetId) return;

    const draggedLayer = findLayerById(draggedId);
    if (isDescendantOf(targetId, draggedLayer)) return;

    // Remove from current position
    const removed = removeLayer(draggedId);
    if (!removed) return;

    // Find target and insert
    const targetResult = findParentOf(targetId);
    if (!targetResult) {
        // Target might have been removed, add back to root
        layers.push(removed);
        return;
    }

    const { siblings } = targetResult;
    const targetIndex = siblings.findIndex(l => l.id === targetId);

    if (targetIndex > -1) {
        siblings.splice(before ? targetIndex : targetIndex + 1, 0, removed);
    }
}

/**
 * Nest a layer inside a container
 */
function nestLayer(draggedId, containerId) {
    if (draggedId === containerId) return;

    const draggedLayer = findLayerById(draggedId);
    const containerLayer = findLayerById(containerId);

    if (!draggedLayer || !containerLayer) return;
    if (isDescendantOf(containerId, draggedLayer)) return;

    // Remove from current position
    const removed = removeLayer(draggedId);
    if (!removed) return;

    // Add to container
    if (!containerLayer.children) {
        containerLayer.children = [];
    }
    containerLayer.children.push(removed);
}

/**
 * Check if a layer is a descendant of another
 */
function isDescendantOf(id, layer) {
    if (!layer.children) return false;
    for (const child of layer.children) {
        if (child.id === id) return true;
        if (isDescendantOf(id, child)) return true;
    }
    return false;
}
