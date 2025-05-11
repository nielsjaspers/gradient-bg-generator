interface GradientColor {
    id: number;
    value: string;
    domElement?: HTMLInputElement;
}

class GradientGenerator {
    private themeToggle: HTMLInputElement | null;
    private colorInputsContainer: HTMLElement | null;
    private addColorPickerButton: HTMLButtonElement | null;
    private removeSelectedColorButton: HTMLButtonElement | null;
    private hexColorInputAdd: HTMLInputElement | null;
    private addHexColorButton: HTMLButtonElement | null;
    private editSelectedColorFieldset: HTMLElement | null;
    private selectedColorHexEditInput: HTMLInputElement | null;
    private updateSelectedColorButton: HTMLButtonElement | null;
    private selectedColorIdDisplay: HTMLElement | null;
    private gradientTypeSelect: HTMLSelectElement | null;
    private linearSettingsDiv: HTMLElement | null;
    private radialSettingsDiv: HTMLElement | null;
    private gradientAngleNumberInput: HTMLInputElement | null;
    private gradientAngleSliderInput: HTMLInputElement | null;
    private radialShapeSelect: HTMLSelectElement | null;
    private blotchySettingsDiv: HTMLElement | null;
    private blotchinessSliderInput: HTMLInputElement | null;
    private grainToggle: HTMLInputElement | null;
    private grainOpacityInput: HTMLInputElement | null;
    private outputWidthInput: HTMLInputElement | null;
    private outputHeightInput: HTMLInputElement | null;
    private outputOrientationSelect: HTMLSelectElement | null;
    private swapDimensionsButton: HTMLButtonElement | null;
    private previewCanvas: HTMLCanvasElement | null;
    private previewCtx: CanvasRenderingContext2D | null;
    private downloadButton: HTMLButtonElement | null;

    private colors: GradientColor[] = [];
    private nextColorId = 0;
    private selectedColorId: number | null = null;
    private readonly MAX_COLORS = 10;
    private readonly MIN_COLORS = 2;
    private isSwappingDimensions = false;
    private draggedColorId: number | null = null;

    constructor() {
        this.themeToggle = document.getElementById('theme-toggle') as HTMLInputElement | null;
        this.previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement | null;
        this.colorInputsContainer = document.getElementById('color-inputs') as HTMLElement | null;
        this.addColorPickerButton = document.getElementById('add-color-picker') as HTMLButtonElement | null;
        this.removeSelectedColorButton = document.getElementById('remove-selected-color') as HTMLButtonElement | null;
        this.hexColorInputAdd = document.getElementById('hex-color-input-add') as HTMLInputElement | null;
        this.addHexColorButton = document.getElementById('add-hex-color-button') as HTMLButtonElement | null;
        this.editSelectedColorFieldset = document.getElementById('edit-selected-color-fieldset') as HTMLElement | null;
        this.selectedColorHexEditInput = document.getElementById('selected-color-hex-edit') as HTMLInputElement | null;
        this.updateSelectedColorButton = document.getElementById('update-selected-color-button') as HTMLButtonElement | null;
        this.selectedColorIdDisplay = document.getElementById('selected-color-id-display') as HTMLElement | null;
        this.gradientTypeSelect = document.getElementById('gradient-type') as HTMLSelectElement | null;
        this.linearSettingsDiv = document.getElementById('linear-settings') as HTMLElement | null;
        this.radialSettingsDiv = document.getElementById('radial-settings') as HTMLElement | null;
        this.gradientAngleNumberInput = document.getElementById('gradient-angle-number') as HTMLInputElement | null;
        this.gradientAngleSliderInput = document.getElementById('gradient-angle-slider') as HTMLInputElement | null;
        this.radialShapeSelect = document.getElementById('radial-shape') as HTMLSelectElement | null;
        this.blotchySettingsDiv = document.getElementById('blotchy-settings') as HTMLElement | null;
        this.blotchinessSliderInput = document.getElementById('blotchiness-slider') as HTMLInputElement | null;
        this.grainToggle = document.getElementById('grain-toggle') as HTMLInputElement | null;
        this.grainOpacityInput = document.getElementById('grain-opacity') as HTMLInputElement | null;
        this.outputWidthInput = document.getElementById('output-width') as HTMLInputElement | null;
        this.outputHeightInput = document.getElementById('output-height') as HTMLInputElement | null;
        this.outputOrientationSelect = document.getElementById('output-orientation') as HTMLSelectElement | null;
        this.swapDimensionsButton = document.getElementById('swap-dimensions') as HTMLButtonElement | null;
        this.downloadButton = document.getElementById('download-btn') as HTMLButtonElement | null;

        if (!this.previewCanvas) {
            console.error("[GradientGenerator] FATAL ERROR: HTMLCanvasElement with ID 'preview-canvas' not found.");
            alert("Critical Error: 'preview-canvas' is missing. App cannot start.");
            this.previewCtx = null; return;
        }
        this.previewCtx = this.previewCanvas.getContext('2d');
        if (!this.previewCtx) {
            console.error("[GradientGenerator] Failed to get 2D context from canvas.");
            alert("Error: Canvas 2D context not supported. Gradient generation will not work.");
        }
        this.init();
    }

    private init() {
        this.setupTheme();
        if (!this.previewCanvas || !this.previewCtx) {
            if (this.downloadButton) this.downloadButton.disabled = true;
            return;
        }
        this.addNewColorPicker('#ff0000');
        this.addNewColorPicker('#0000ff');
        this.attachEventListeners();
        this.handleGradientTypeChange(); // Initial UI setup for gradient type
        if (this.grainOpacityInput && this.grainToggle) this.grainOpacityInput.disabled = !this.grainToggle.checked;
        if (this.gradientAngleNumberInput && this.gradientAngleSliderInput) {
            this.gradientAngleSliderInput.value = this.gradientAngleNumberInput.value;
        }
        this.updateButtonStates();
        this.adjustPreviewCanvasAspectRatio(); // This also calls updatePreview
    }

    private setupTheme() {
        if (!this.themeToggle) return;
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark-mode');
            this.themeToggle.checked = true;
        } else {
            document.body.classList.remove('dark-mode');
            this.themeToggle.checked = false;
        }
        this.themeToggle.addEventListener('change', () => {
            if (this.themeToggle?.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('theme', 'dark');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('theme', 'light');
            }
        });
    }

    private selectColor(colorId: number) {
        if (this.selectedColorId === colorId) {
            this.deselectColor();
            return;
        }
        this.deselectColor();
        this.selectedColorId = colorId;
        const selectedColorObject = this.colors.find(c => c.id === colorId);
        if (selectedColorObject && selectedColorObject.domElement) {
            selectedColorObject.domElement.classList.add('color-picker-selected');
            if (this.selectedColorHexEditInput) {
                this.selectedColorHexEditInput.value = selectedColorObject.value;
            }
            if (this.editSelectedColorFieldset) {
                this.editSelectedColorFieldset.style.display = 'block';
            }
            if (this.selectedColorIdDisplay) {
                this.selectedColorIdDisplay.textContent = `(Editing ID: ${colorId})`;
            }
        }
        this.updateButtonStates();
    }

    private deselectColor() {
        if (this.selectedColorId !== null) {
            const previouslySelectedColor = this.colors.find(c => c.id === this.selectedColorId);
            if (previouslySelectedColor && previouslySelectedColor.domElement) {
                previouslySelectedColor.domElement.classList.remove('color-picker-selected');
            }
        }
        this.selectedColorId = null;
        if (this.selectedColorHexEditInput) this.selectedColorHexEditInput.value = '';
        if (this.editSelectedColorFieldset) this.editSelectedColorFieldset.style.display = 'none';
        if (this.selectedColorIdDisplay) this.selectedColorIdDisplay.textContent = '';
        this.updateButtonStates();
    }

    private addNewColorPicker(defaultValue: string = '#ffffff') {
        if (!this.colorInputsContainer) return;
        if (this.colors.length >= this.MAX_COLORS) {
            alert(`Maximum ${this.MAX_COLORS} colors allowed.`); return;
        }
        const colorId = this.nextColorId++;
        const input = document.createElement('input');
        input.type = 'color';
        input.value = defaultValue;
        input.dataset.colorId = colorId.toString();
        input.draggable = true;
        const newColor: GradientColor = { id: colorId, value: defaultValue, domElement: input };
        this.colors.push(newColor);
        input.addEventListener('input', () => {
            const color = this.colors.find(c => c.id === colorId);
            if (color) {
                color.value = input.value; // Use input.value directly
                if (this.selectedColorId === colorId && this.selectedColorHexEditInput) {
                    this.selectedColorHexEditInput.value = input.value;
                }
                this.updatePreview();
            }
        });
        input.addEventListener('click', () => this.selectColor(colorId));
        input.addEventListener('dragstart', (e) => this.handleDragStart(e, colorId));
        input.addEventListener('dragend', (e) => this.handleDragEnd(e));
        this.colorInputsContainer.appendChild(input);
        this.updateButtonStates();
        this.updatePreview();
        this.selectColor(colorId); // Auto-select newly added color
    }

    private reRenderColorPickers() {
        if (!this.colorInputsContainer) return;
        // Clear existing pickers from DOM
        while (this.colorInputsContainer.firstChild) {
            this.colorInputsContainer.removeChild(this.colorInputsContainer.firstChild);
        }
        // Re-append based on the this.colors array order
        this.colors.forEach(color => {
            if (color.domElement) {
                this.colorInputsContainer!.appendChild(color.domElement);
            }
        });
        // Re-apply selection highlight if a color is selected
        if (this.selectedColorId !== null) {
            const selectedColor = this.colors.find(c => c.id === this.selectedColorId);
            if (selectedColor && selectedColor.domElement) {
                selectedColor.domElement.classList.add('color-picker-selected');
            }
        }
    }

    private handleDragStart(event: DragEvent, colorId: number) {
        this.draggedColorId = colorId;
        if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', colorId.toString()); // Necessary for Firefox
        }
        const target = event.target as HTMLElement;
        target.classList.add('dragging');
    }

    private handleDragOver(event: DragEvent) {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
        this.colorInputsContainer?.classList.add('drag-over');
    }

    private handleDragLeave(event: DragEvent) {
        this.colorInputsContainer?.classList.remove('drag-over');
    }

    private handleDrop(event: DragEvent) {
        event.preventDefault();
        this.colorInputsContainer?.classList.remove('drag-over');
        const targetElement = event.target as HTMLElement;
        if (this.draggedColorId === null) return;

        const draggedColorIndex = this.colors.findIndex(c => c.id === this.draggedColorId);
        if (draggedColorIndex === -1) return;

        const draggedColorData = this.colors[draggedColorIndex];
        let targetIndex = -1;

        // Check if dropping onto another color picker
        const droppedOnPickerElement = targetElement.closest('input[type="color"]') as HTMLInputElement | null;

        if (droppedOnPickerElement && droppedOnPickerElement.dataset.colorId) {
            const targetColorId = parseInt(droppedOnPickerElement.dataset.colorId);
            if (targetColorId !== this.draggedColorId) {
                targetIndex = this.colors.findIndex(c => c.id === targetColorId);
            } else { // Dropped on itself, no change
                return;
            }
        } else if (this.colorInputsContainer && targetElement === this.colorInputsContainer) {
            // Dropped on the empty part of the container, append to the end
            targetIndex = this.colors.length;
        } else {
            // Dropped somewhere else in the container, try to find the closest picker to insert before/after
            const dropX = event.clientX;
            let closestDist = Infinity;
            let insertBeforeIndex = -1;

            this.colors.forEach((color, index) => {
                if (color.id === this.draggedColorId || !color.domElement) return;
                const rect = color.domElement.getBoundingClientRect();
                const midX = rect.left + rect.width / 2;
                if (dropX < midX) { // If drop point is to the left of the middle of this picker
                    const dist = midX - dropX;
                    if (dist < closestDist) {
                        closestDist = dist;
                        insertBeforeIndex = index; // Insert before this one
                    }
                }
            });
            if (insertBeforeIndex !== -1) {
                targetIndex = insertBeforeIndex;
            } else { // If not to the left of any, or container empty, append
                targetIndex = this.colors.length;
            }
        }

        // Perform reorder if a valid, different target index is found
        if (targetIndex !== -1 && targetIndex !== draggedColorIndex && targetIndex !== draggedColorIndex + 1) {
            this.colors.splice(draggedColorIndex, 1); // Remove dragged item
            // Adjust targetIndex if dragged item was before the target spot
            const insertAtIndex = (targetIndex > draggedColorIndex) ? targetIndex - 1 : targetIndex;
            this.colors.splice(insertAtIndex, 0, draggedColorData); // Insert at new position

            this.reRenderColorPickers();
            this.updatePreview();
        }
    }

    private handleDragEnd(event: DragEvent) {
        const target = event.target as HTMLElement;
        target.classList.remove('dragging');
        this.colorInputsContainer?.classList.remove('drag-over');
        this.draggedColorId = null;
    }

    private addColorByHex(hexValue: string | undefined) {
        if (!hexValue) return;
        const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
        if (!hexRegex.test(hexValue)) {
            alert("Invalid Hex Code for new color. Please use format #RGB or #RRGGBB.");
            if (this.hexColorInputAdd) this.hexColorInputAdd.value = ''; return;
        }
        let normalizedHex = hexValue.length === 4 ? `#${hexValue[1]}${hexValue[1]}${hexValue[2]}${hexValue[2]}${hexValue[3]}${hexValue[3]}` : hexValue;
        this.addNewColorPicker(normalizedHex);
        if (this.hexColorInputAdd) this.hexColorInputAdd.value = '';
    }

    private hexToRgba(hex: string, alpha: number): string {
        let r = 0, g = 0, b = 0;
        if (hex.length === 4) { // #RGB
            r = parseInt(hex[1] + hex[1], 16);
            g = parseInt(hex[2] + hex[2], 16);
            b = parseInt(hex[3] + hex[3], 16);
        } else if (hex.length === 7) { // #RRGGBB
            r = parseInt(hex.substring(1, 3), 16);
            g = parseInt(hex.substring(3, 5), 16);
            b = parseInt(hex.substring(5, 7), 16);
        }
        return `rgba(${r},${g},${b},${alpha})`;
    }


    private updateSelectedColorHex() {
        if (this.selectedColorId === null || !this.selectedColorHexEditInput) return;
        const newHexValue = this.selectedColorHexEditInput.value;
        const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
        if (!hexRegex.test(newHexValue)) {
            alert("Invalid Hex Code for selected color. Please use format #RGB or #RRGGBB."); return;
        }
        let normalizedHex = newHexValue.length === 4 ? `#${newHexValue[1]}${newHexValue[1]}${newHexValue[2]}${newHexValue[2]}${newHexValue[3]}${newHexValue[3]}` : newHexValue;
        const colorToUpdate = this.colors.find(c => c.id === this.selectedColorId);
        if (colorToUpdate) {
            colorToUpdate.value = normalizedHex;
            if (colorToUpdate.domElement) colorToUpdate.domElement.value = normalizedHex;
            this.updatePreview();
        }
    }

    private removeSelectedColor() {
        if (this.selectedColorId === null) { alert("No color selected to remove."); return; }
        if (this.colors.length <= this.MIN_COLORS) { alert(`Minimum ${this.MIN_COLORS} colors required.`); return; }
        const indexToRemove = this.colors.findIndex(c => c.id === this.selectedColorId);
        if (indexToRemove > -1) {
            const colorToRemove = this.colors[indexToRemove];
            if (colorToRemove.domElement && colorToRemove.domElement.parentElement) {
                colorToRemove.domElement.parentElement.removeChild(colorToRemove.domElement);
            }
            this.colors.splice(indexToRemove, 1);
            this.deselectColor(); // This also calls updateButtonStates
            this.updatePreview();
        }
    }

    private updateButtonStates() {
        if (this.addColorPickerButton) this.addColorPickerButton.disabled = this.colors.length >= this.MAX_COLORS;
        if (this.removeSelectedColorButton) this.removeSelectedColorButton.disabled = this.selectedColorId === null || this.colors.length <= this.MIN_COLORS;
        if (this.updateSelectedColorButton) this.updateSelectedColorButton.disabled = this.selectedColorId === null;
        if (this.addHexColorButton) this.addHexColorButton.disabled = this.colors.length >= this.MAX_COLORS;
    }

    private attachEventListeners() {
        if (this.addColorPickerButton) this.addColorPickerButton.addEventListener('click', () => this.addNewColorPicker());
        if (this.removeSelectedColorButton) this.removeSelectedColorButton.addEventListener('click', () => this.removeSelectedColor());
        if (this.addHexColorButton && this.hexColorInputAdd) {
            this.addHexColorButton.addEventListener('click', () => {
                if (this.hexColorInputAdd) this.addColorByHex(this.hexColorInputAdd.value);
            });
        }
        if (this.updateSelectedColorButton) {
            this.updateSelectedColorButton.addEventListener('click', () => this.updateSelectedColorHex());
        }
        if (this.gradientAngleNumberInput && this.gradientAngleSliderInput) {
            this.gradientAngleNumberInput.addEventListener('input', () => {
                if (this.gradientAngleSliderInput) this.gradientAngleSliderInput.value = this.gradientAngleNumberInput!.value;
                this.updatePreview();
            });
            this.gradientAngleSliderInput.addEventListener('input', () => {
                if (this.gradientAngleNumberInput) this.gradientAngleNumberInput.value = this.gradientAngleSliderInput!.value;
                this.updatePreview();
            });
        }
        if (this.gradientTypeSelect) this.gradientTypeSelect.addEventListener('change', () => this.handleGradientTypeChange());
        if (this.blotchinessSliderInput) this.blotchinessSliderInput.addEventListener('input', () => this.updatePreview());

        const elementsToAttach = [this.radialShapeSelect, this.grainToggle, this.grainOpacityInput, this.outputWidthInput, this.outputHeightInput, this.outputOrientationSelect];
        elementsToAttach.forEach(el => {
            if (el) {
                const eventType = ((el as HTMLInputElement).tagName === 'SELECT' || (el as HTMLInputElement).type === 'checkbox') ? 'change' : 'input';
                el.addEventListener(eventType, () => this.handleControlChange((el as HTMLElement).id));
            }
        });
        if (this.swapDimensionsButton) this.swapDimensionsButton.addEventListener('click', () => this.swapDimensions());
        if (this.downloadButton) this.downloadButton.addEventListener('click', () => this.downloadImage());
        if (this.colorInputsContainer) {
            this.colorInputsContainer.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.colorInputsContainer.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            this.colorInputsContainer.addEventListener('drop', (e) => this.handleDrop(e));
        }
    }

    private handleGradientTypeChange() {
        if (!this.gradientTypeSelect || !this.linearSettingsDiv || !this.radialSettingsDiv || !this.blotchySettingsDiv) return;
        const type = this.gradientTypeSelect.value;
        this.linearSettingsDiv.style.display = (type === 'linear' || type === 'blotchy') ? 'block' : 'none';
        this.radialSettingsDiv.style.display = type === 'radial' ? 'block' : 'none';
        this.blotchySettingsDiv.style.display = type === 'blotchy' ? 'block' : 'none';
        this.updatePreview();
    }

    private handleControlChange(elementId: string | undefined) {
        if (!elementId) return;
        if (elementId === 'grain-toggle' && this.grainToggle && this.grainOpacityInput) {
            this.grainOpacityInput.disabled = !this.grainToggle.checked;
        }
        if (['output-width', 'output-height', 'output-orientation'].includes(elementId)) {
            if (elementId === 'output-orientation') this.handleOrientationChange();
            else this.adjustPreviewCanvasAspectRatio(); // This will trigger updatePreview
        } else { // For other controls like radial-shape, blotchiness, grain-opacity
            this.updatePreview();
        }
    }

    private swapDimensions() {
        if (this.isSwappingDimensions || !this.outputWidthInput || !this.outputHeightInput || !this.outputOrientationSelect) return;
        this.isSwappingDimensions = true;
        const temp = this.outputWidthInput.value;
        this.outputWidthInput.value = this.outputHeightInput.value;
        this.outputHeightInput.value = temp;
        const widthVal = parseInt(this.outputWidthInput.value);
        const heightVal = parseInt(this.outputHeightInput.value);
        const newOrientation = widthVal >= heightVal ? 'landscape' : 'portrait';
        if (this.outputOrientationSelect.value !== newOrientation) {
            this.outputOrientationSelect.value = newOrientation;
        }
        this.adjustPreviewCanvasAspectRatio();
        this.isSwappingDimensions = false;
    }

    private handleOrientationChange() {
        if (this.isSwappingDimensions || !this.outputWidthInput || !this.outputHeightInput || !this.outputOrientationSelect) return;
        const widthVal = parseInt(this.outputWidthInput.value);
        const heightVal = parseInt(this.outputHeightInput.value);
        const orientation = this.outputOrientationSelect.value;
        if ((orientation === 'landscape' && widthVal < heightVal) || (orientation === 'portrait' && heightVal < widthVal)) {
            this.swapDimensions();
        } else {
            this.adjustPreviewCanvasAspectRatio();
        }
    }

    private adjustPreviewCanvasAspectRatio() {
        if (!this.previewCanvas || !this.previewCtx || !this.outputWidthInput || !this.outputHeightInput) return;
        const previewArea = document.getElementById('preview-area');
        if (!previewArea) return;

        const cssWidth = parseInt(this.outputWidthInput.value) || 1920;
        const cssHeight = parseInt(this.outputHeightInput.value) || 1080;
        previewArea.style.aspectRatio = `${cssWidth} / ${cssHeight}`;

        // Defer canvas buffer resizing to ensure layout is stable
        requestAnimationFrame(() => {
            if (!this.previewCanvas || !this.previewCtx) return;
            const displayWidth = this.previewCanvas.clientWidth;  // Actual display size in CSS pixels
            const displayHeight = this.previewCanvas.clientHeight;
            const dpr = window.devicePixelRatio || 1;

            // Set actual buffer size considering DPR
            if (this.previewCanvas.width !== displayWidth * dpr || this.previewCanvas.height !== displayHeight * dpr) {
                this.previewCanvas.width = displayWidth * dpr;
                this.previewCanvas.height = displayHeight * dpr;
                this.previewCtx.resetTransform(); // Clear previous scales/transforms
                this.previewCtx.scale(dpr, dpr);  // Apply new scale based on DPR
            }
            this.updatePreview();
        });
    }

    private drawGradient(ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number) {
        if (!this.gradientTypeSelect || !this.gradientAngleNumberInput || !this.radialShapeSelect || !this.blotchinessSliderInput) return;
        const gradientType = this.gradientTypeSelect.value;
        const activeColors = this.colors.map(c => c.value);

        if (activeColors.length < 2) {
            ctx.fillStyle = activeColors.length === 1 ? activeColors[0] : (document.body.classList.contains('dark-mode') ? '#383838' : '#f4f4f4');
            ctx.fillRect(0, 0, cssWidth, cssHeight);
            return;
        }

        if (gradientType === 'blotchy') {
            this.drawBlotchyGradient(ctx, cssWidth, cssHeight, activeColors);
        } else if (gradientType === 'linear') {
            const angleDeg = parseFloat(this.gradientAngleNumberInput.value);
            const angleRad = (angleDeg - 90) * (Math.PI / 180);
            // Calculate gradient line endpoints to span the entire canvas based on CSS dimensions
            const L = Math.abs(cssWidth * Math.sin(angleRad)) + Math.abs(cssHeight * Math.cos(angleRad));
            const x0 = (cssWidth - L * Math.cos(angleRad)) / 2;
            const y0 = (cssHeight - L * Math.sin(angleRad)) / 2;
            const x1 = (cssWidth + L * Math.cos(angleRad)) / 2;
            const y1 = (cssHeight + L * Math.sin(angleRad)) / 2;
            const grad = ctx.createLinearGradient(x0, y0, x1, y1);
            const step = 1 / (activeColors.length - 1);
            activeColors.forEach((color, index) => grad.addColorStop(Math.min(index * step, 1.0), color));
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, cssWidth, cssHeight);
        } else { // Radial
            const shape = this.radialShapeSelect.value;
            const centerX = cssWidth / 2; const centerY = cssHeight / 2;
            const r0 = 0;
            const r1 = shape === 'circle' ? Math.min(cssWidth, cssHeight) / 2 : Math.max(cssWidth, cssHeight) / 2; // Use Math.max for ellipse to ensure coverage
            const grad = ctx.createRadialGradient(centerX, centerY, r0, centerX, centerY, r1);
            const step = 1 / (activeColors.length - 1);
            activeColors.forEach((color, index) => grad.addColorStop(Math.min(index * step, 1.0), color));
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, cssWidth, cssHeight);
        }
    }

    private drawBlotchyGradient(ctx: CanvasRenderingContext2D, cssWidth: number, cssHeight: number, activeColors: string[]) {
        if (activeColors.length === 0 || !this.gradientAngleNumberInput || !this.blotchinessSliderInput) return;

        const angleDeg = parseFloat(this.gradientAngleNumberInput.value);
        // Blotchiness: 0 = very diffuse/smooth, 1 = more distinct (but still soft) color regions
        const blotchinessFactor = parseFloat(this.blotchinessSliderInput.value) / 100;

        ctx.save();
        // Fill with the first color as a solid base
        ctx.fillStyle = activeColors[0];
        ctx.fillRect(0, 0, cssWidth, cssHeight);

        if (activeColors.length < 2) {
            ctx.restore();
            return;
        }

        const angleRad = (angleDeg - 90) * Math.PI / 180; // Convert angle for directional calculations
        const dirX = Math.cos(angleRad);
        const dirY = Math.sin(angleRad);

        // Iterate through subsequent colors to layer their "influence"
        for (let i = 1; i < activeColors.length; i++) {
            const currentColor = activeColors[i];

            // Number of "blobs" or soft radial sources for this color
            // Fewer blobs for less blotchiness (more diffusion), more blobs for more defined regions
            const numBlobs = 5 + Math.floor((1 - blotchinessFactor) * 10 + Math.random() * 5);

            // Max radius of these soft blobs. Larger for less blotchiness (more diffusion).
            const maxBlobRadiusBase = Math.max(cssWidth, cssHeight) * 0.6;
            const maxBlobRadius = maxBlobRadiusBase * (0.8 + (1 - blotchinessFactor) * 0.7); // Less blotchy = larger blobs
            const minBlobRadius = maxBlobRadius * (0.3 + blotchinessFactor * 0.2); // More blotchy = potentially smaller distinct blobs too

            // Alpha for the center of the blobs. Lower for more subtle blending.
            // Less blotchy (more diffuse) = lower alpha, allowing more underlying color through.
            const blobCenterAlpha = 0.15 + (1 - blotchinessFactor) * 0.25;


            for (let j = 0; j < numBlobs; j++) {
                // Determine the "ideal" center of this color band based on its order and angle
                // Progress along the main gradient direction for this color band
                const bandProgress = (i - 0.5 + Math.random() * 0.5) / (activeColors.length - 1);

                // Calculate a point along the main gradient axis
                // The term (bandProgress - 0.5) centers the distribution around the middle of the canvas for a 0-1 progress
                const mainAxisDist = Math.max(cssWidth, cssHeight) * 0.6; // How far along the axis to spread
                let blobCX = cssWidth / 2 + dirX * (bandProgress - 0.5) * mainAxisDist;
                let blobCY = cssHeight / 2 + dirY * (bandProgress - 0.5) * mainAxisDist;

                // Add significant random scatter, more contained if blotchinessFactor is high
                const scatterMagnitude = Math.max(cssWidth, cssHeight) * 0.4 * (1 + (1 - blotchinessFactor) * 0.8);
                blobCX += (Math.random() - 0.5) * scatterMagnitude;
                blobCY += (Math.random() - 0.5) * scatterMagnitude;

                const blobRx = minBlobRadius + Math.random() * (maxBlobRadius - minBlobRadius);
                const blobRy = blobRx * (0.7 + Math.random() * 0.6); // Make them somewhat elliptical

                ctx.beginPath();
                ctx.ellipse(blobCX, blobCY, blobRx, blobRy, Math.random() * Math.PI, 0, 2 * Math.PI);

                // Create a very soft radial gradient for each blob
                const blobGradient = ctx.createRadialGradient(blobCX, blobCY, 0, blobCX, blobCY, Math.max(blobRx, blobRy));

                // Center of the blob is the current color with some transparency
                blobGradient.addColorStop(0, this.hexToRgba(currentColor, blobCenterAlpha));
                // Mid-point also with transparency, slightly less
                blobGradient.addColorStop(0.3 + Math.random() * 0.2, this.hexToRgba(currentColor, blobCenterAlpha * 0.5 * (1 - blotchinessFactor + 0.5)));
                // Edge of the blob is fully transparent to blend smoothly
                blobGradient.addColorStop(1, this.hexToRgba(currentColor, 0));

                ctx.fillStyle = blobGradient;
                ctx.fill();
            }
        }
        ctx.restore();
    }

    private drawGrain(ctx: CanvasRenderingContext2D, bufferWidth: number, bufferHeight: number) {
        if (!this.grainToggle || !this.grainOpacityInput || bufferWidth === 0 || bufferHeight === 0) return;
        if (!this.grainToggle.checked) return;
        const opacity = parseFloat(this.grainOpacityInput.value);
        if (opacity === 0) return;

        const imageData = ctx.getImageData(0, 0, bufferWidth, bufferHeight);
        const data = imageData.data;
        const noiseIntensityBase = 30; // Reduced base for potentially denser DPR pixels
        const actualNoiseIntensity = noiseIntensityBase * opacity;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * actualNoiseIntensity;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
            // Alpha data[i+3] remains unchanged
        }
        ctx.putImageData(imageData, 0, 0);
    }

    private updatePreview() {
        if (!this.previewCanvas || !this.previewCtx) return;

        // Use CSS dimensions for drawing operations, DPR scaling handles the rest
        const cssWidth = this.previewCanvas.clientWidth;
        const cssHeight = this.previewCanvas.clientHeight;

        if (cssWidth === 0 || cssHeight === 0) return; // Don't draw if not visible

        // ClearRect uses CSS pixels because context is scaled
        this.previewCtx.clearRect(0, 0, cssWidth, cssHeight);
        this.drawGradient(this.previewCtx, cssWidth, cssHeight);
        // drawGrain needs buffer dimensions
        this.drawGrain(this.previewCtx, this.previewCanvas.width, this.previewCanvas.height);
    }

    private generateRandomSuffix(length: number = 8): string {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return result;
    }

    private downloadImage() {
        if (!this.outputWidthInput || !this.outputHeightInput) {
            alert("Cannot download image: output dimensions missing."); return;
        }
        const finalWidth = parseInt(this.outputWidthInput.value); // User-defined pixel width
        const finalHeight = parseInt(this.outputHeightInput.value); // User-defined pixel height

        if (isNaN(finalWidth) || isNaN(finalHeight) || finalWidth <= 0 || finalHeight <= 0) {
            alert("Please enter valid width and height for the download."); return;
        }
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = finalWidth;
        tempCanvas.height = finalHeight;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
            alert("Failed to create temporary canvas for download."); return;
        }

        // Draw on temp canvas using its specific (final) dimensions. No DPR scaling needed here.
        this.drawGradient(tempCtx, finalWidth, finalHeight);
        this.drawGrain(tempCtx, finalWidth, finalHeight); // drawGrain uses buffer dimensions

        const randomSuffix = this.generateRandomSuffix();
        const filename = `gradient-background-${finalWidth}x${finalHeight}-${randomSuffix}.png`;
        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

} // End of GradientGenerator class

document.addEventListener('DOMContentLoaded', () => {
    new GradientGenerator();
});
