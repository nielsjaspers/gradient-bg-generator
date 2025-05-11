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

    constructor() {
        console.log('[GradientGenerator] Constructor called.');

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

        this.grainToggle = document.getElementById('grain-toggle') as HTMLInputElement | null;
        this.grainOpacityInput = document.getElementById('grain-opacity') as HTMLInputElement | null;

        this.outputWidthInput = document.getElementById('output-width') as HTMLInputElement | null;
        this.outputHeightInput = document.getElementById('output-height') as HTMLInputElement | null;
        this.outputOrientationSelect = document.getElementById('output-orientation') as HTMLSelectElement | null;
        this.swapDimensionsButton = document.getElementById('swap-dimensions') as HTMLButtonElement | null;
        this.downloadButton = document.getElementById('download-btn') as HTMLButtonElement | null;

        console.log('[GradientGenerator] Tried to get "preview-canvas":', this.previewCanvas);
        if (!this.previewCanvas) {
            console.error("[GradientGenerator] FATAL ERROR: HTMLCanvasElement with ID 'preview-canvas' not found.");
            alert("Critical Error: 'preview-canvas' is missing. App cannot start.");
            this.previewCtx = null;
            return;
        }

        this.previewCtx = this.previewCanvas.getContext('2d');
        console.log('[GradientGenerator] Tried to get 2D context:', this.previewCtx);
        if (!this.previewCtx) {
            console.error("[GradientGenerator] Failed to get 2D context from canvas.");
            alert("Error: Canvas 2D context not supported. Gradient generation will not work.");
        }

        this.init();
    }

    private init() {
        console.log('[GradientGenerator] init() called.');
        this.setupTheme();

        if (!this.previewCanvas || !this.previewCtx) {
            console.warn("[GradientGenerator] Initialization incomplete due to missing canvas/context.");
            if (this.downloadButton) this.downloadButton.disabled = true;
            return;
        }

        this.addNewColorPicker('#ff0000');
        this.addNewColorPicker('#0000ff');

        this.attachEventListeners();

        if (this.linearSettingsDiv) this.linearSettingsDiv.style.display = 'block';
        if (this.radialSettingsDiv) this.radialSettingsDiv.style.display = 'none';
        if (this.grainOpacityInput && this.grainToggle) this.grainOpacityInput.disabled = !this.grainToggle.checked;
        if (this.gradientAngleNumberInput && this.gradientAngleSliderInput) {
            this.gradientAngleSliderInput.value = this.gradientAngleNumberInput.value;
        }

        this.updateButtonStates();
        this.adjustPreviewCanvasAspectRatio(); // This should trigger the first updatePreview

        console.log('[GradientGenerator] Initialization complete.');
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
        if (!this.colorInputsContainer) {
            console.warn("[GradientGenerator] Cannot add color: colorInputsContainer is null.");
            return;
        }
        if (this.colors.length >= this.MAX_COLORS) {
            alert(`Maximum ${this.MAX_COLORS} colors allowed.`);
            return;
        }

        const colorId = this.nextColorId++;
        const input = document.createElement('input');
        input.type = 'color';
        input.value = defaultValue;
        input.dataset.colorId = colorId.toString();

        const newColor: GradientColor = { id: colorId, value: defaultValue, domElement: input };
        this.colors.push(newColor);

        input.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            // const id = parseInt(target.dataset.colorId!); // id is colorId from closure
            const color = this.colors.find(c => c.id === colorId);
            if (color) {
                color.value = target.value;
                if (this.selectedColorId === colorId && this.selectedColorHexEditInput) {
                    this.selectedColorHexEditInput.value = target.value;
                }
                this.updatePreview();
            }
        });

        input.addEventListener('click', () => {
            this.selectColor(colorId);
        });

        this.colorInputsContainer.appendChild(input);
        this.updateButtonStates();
        this.updatePreview();
        this.selectColor(colorId); // Auto-select newly added color
    }

    private addColorByHex(hexValue: string | undefined) {
        if (!hexValue) return; // Should be caught by button listener check
        const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
        if (!hexRegex.test(hexValue)) {
            alert("Invalid Hex Code for new color. Please use format #RGB or #RRGGBB.");
            if (this.hexColorInputAdd) this.hexColorInputAdd.value = '';
            return;
        }
        let normalizedHex = hexValue;
        if (hexValue.length === 4) { // #RGB
            normalizedHex = `#${hexValue[1]}${hexValue[1]}${hexValue[2]}${hexValue[2]}${hexValue[3]}${hexValue[3]}`;
        }

        this.addNewColorPicker(normalizedHex);
        if (this.hexColorInputAdd) this.hexColorInputAdd.value = ''; // Clear after adding
    }

    private updateSelectedColorHex() {
        if (this.selectedColorId === null || !this.selectedColorHexEditInput) return;

        const newHexValue = this.selectedColorHexEditInput.value;
        const hexRegex = /^#([0-9A-Fa-f]{3}){1,2}$/;
        if (!hexRegex.test(newHexValue)) {
            alert("Invalid Hex Code for selected color. Please use format #RGB or #RRGGBB.");
            return;
        }
        let normalizedHex = newHexValue;
        if (newHexValue.length === 4) { // #RGB
            normalizedHex = `#${newHexValue[1]}${newHexValue[1]}${newHexValue[2]}${newHexValue[2]}${newHexValue[3]}${newHexValue[3]}`;
        }

        const colorToUpdate = this.colors.find(c => c.id === this.selectedColorId);
        if (colorToUpdate) {
            colorToUpdate.value = normalizedHex;
            if (colorToUpdate.domElement) {
                colorToUpdate.domElement.value = normalizedHex;
            }
            this.updatePreview();
        }
    }

    private removeSelectedColor() {
        if (this.selectedColorId === null) {
            alert("No color selected to remove.");
            return;
        }
        if (this.colors.length <= this.MIN_COLORS) {
            alert(`Minimum ${this.MIN_COLORS} colors required.`);
            return;
        }

        const indexToRemove = this.colors.findIndex(c => c.id === this.selectedColorId);
        if (indexToRemove > -1) {
            const colorToRemove = this.colors[indexToRemove];
            if (colorToRemove.domElement && colorToRemove.domElement.parentElement) {
                colorToRemove.domElement.parentElement.removeChild(colorToRemove.domElement);
            }
            this.colors.splice(indexToRemove, 1);
            this.deselectColor();
            this.updatePreview();
        }
    }

    private updateButtonStates() {
        if (this.addColorPickerButton) {
            this.addColorPickerButton.disabled = this.colors.length >= this.MAX_COLORS;
        }
        if (this.removeSelectedColorButton) {
            this.removeSelectedColorButton.disabled = this.selectedColorId === null || this.colors.length <= this.MIN_COLORS;
        }
        if (this.updateSelectedColorButton) {
            this.updateSelectedColorButton.disabled = this.selectedColorId === null;
        }
        // Add hex button for new colors doesn't depend on selection state
        if (this.addHexColorButton) {
            this.addHexColorButton.disabled = this.colors.length >= this.MAX_COLORS;
        }
    }

    private attachEventListeners() {
        console.log('[GradientGenerator] Attaching event listeners...');
        if (this.addColorPickerButton) this.addColorPickerButton.addEventListener('click', () => this.addNewColorPicker());
        if (this.removeSelectedColorButton) this.removeSelectedColorButton.addEventListener('click', () => this.removeSelectedColor());

        if (this.addHexColorButton && this.hexColorInputAdd) {
            this.addHexColorButton.addEventListener('click', () => {
                if (this.hexColorInputAdd) this.addColorByHex(this.hexColorInputAdd.value);
            });
        }
        if (this.updateSelectedColorButton) { // No need to check selectedColorHexEditInput here, method does
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

        const elementsToAttachListeners: Array<HTMLElement | null> = [
            this.gradientTypeSelect,
            // Angle inputs handled above
            this.radialShapeSelect,
            this.grainToggle,
            this.grainOpacityInput,
            this.outputWidthInput,
            this.outputHeightInput,
            this.outputOrientationSelect
        ];

        elementsToAttachListeners.forEach(el => {
            if (el) {
                const eventType = ((el as HTMLInputElement).tagName === 'SELECT' || (el as HTMLInputElement).type === 'checkbox') ? 'change' : 'input';
                el.addEventListener(eventType, () => this.handleControlChange((el as HTMLElement).id));
            }
        });

        if (this.swapDimensionsButton) this.swapDimensionsButton.addEventListener('click', () => this.swapDimensions());
        if (this.downloadButton) this.downloadButton.addEventListener('click', () => this.downloadImage());
        console.log('[GradientGenerator] Event listeners attached.');
    }

    private handleControlChange(elementId: string | undefined) {
        if (!elementId) return;

        if (elementId === 'grain-toggle' && this.grainToggle && this.grainOpacityInput) {
            this.grainOpacityInput.disabled = !this.grainToggle.checked;
        }
        if (elementId === 'gradient-type' && this.gradientTypeSelect && this.linearSettingsDiv && this.radialSettingsDiv) {
            const type = this.gradientTypeSelect.value;
            this.linearSettingsDiv.style.display = type === 'linear' ? 'block' : 'none';
            this.radialSettingsDiv.style.display = type === 'radial' ? 'block' : 'none';
        }

        if (['output-width', 'output-height', 'output-orientation'].includes(elementId)) {
            if (elementId === 'output-orientation') {
                this.handleOrientationChange();
            } else {
                this.adjustPreviewCanvasAspectRatio();
            }
        } else {
            this.updatePreview();
        }
    }

    private swapDimensions() {
        if (this.isSwappingDimensions || !this.outputWidthInput || !this.outputHeightInput || !this.outputOrientationSelect) return;
        this.isSwappingDimensions = true;
        const temp = this.outputWidthInput.value;
        this.outputWidthInput.value = this.outputHeightInput.value;
        this.outputHeightInput.value = temp;

        const width = parseInt(this.outputWidthInput.value);
        const height = parseInt(this.outputHeightInput.value);
        const newOrientation = width >= height ? 'landscape' : 'portrait';

        if (this.outputOrientationSelect.value !== newOrientation) {
            this.outputOrientationSelect.value = newOrientation;
        }
        this.adjustPreviewCanvasAspectRatio();
        this.isSwappingDimensions = false;
    }

    private handleOrientationChange() {
        if (this.isSwappingDimensions || !this.outputWidthInput || !this.outputHeightInput || !this.outputOrientationSelect) return;
        const width = parseInt(this.outputWidthInput.value);
        const height = parseInt(this.outputHeightInput.value);
        const orientation = this.outputOrientationSelect.value;

        if ((orientation === 'landscape' && width < height) || (orientation === 'portrait' && height < width)) {
            this.swapDimensions();
        } else {
            this.adjustPreviewCanvasAspectRatio();
        }
    }

    private adjustPreviewCanvasAspectRatio() {
        if (!this.previewCanvas || !this.outputWidthInput || !this.outputHeightInput) return;
        const previewArea = document.getElementById('preview-area');
        if (!previewArea) {
            console.warn("[GradientGenerator] 'preview-area' element not found for aspect ratio adjustment.");
            return;
        }

        const widthInput = parseInt(this.outputWidthInput.value) || 1920;
        const heightInput = parseInt(this.outputHeightInput.value) || 1080;
        previewArea.style.aspectRatio = `${widthInput} / ${heightInput}`;

        requestAnimationFrame(() => {
            if (!this.previewCanvas) return;
            const currentDisplayWidth = this.previewCanvas.clientWidth;
            const currentDisplayHeight = this.previewCanvas.clientHeight;
            if (this.previewCanvas.width !== currentDisplayWidth) {
                this.previewCanvas.width = currentDisplayWidth;
            }
            if (this.previewCanvas.height !== currentDisplayHeight) {
                this.previewCanvas.height = currentDisplayHeight;
            }
            this.updatePreview();
        });
    }

    private drawGradient(ctx: CanvasRenderingContext2D, width: number, height: number) {
        if (!this.gradientTypeSelect || !this.gradientAngleNumberInput || !this.radialShapeSelect) return;
        const gradientType = this.gradientTypeSelect.value;
        const activeColors = this.colors.map(c => c.value);
        if (activeColors.length < 2) return;

        let gradient: CanvasGradient;
        if (gradientType === 'linear') {
            const angleDeg = parseFloat(this.gradientAngleNumberInput.value);
            const angleRad = (angleDeg - 90) * (Math.PI / 180);
            const L = Math.abs(width * Math.sin(angleRad)) + Math.abs(height * Math.cos(angleRad));
            const x0 = (width - L * Math.cos(angleRad)) / 2;
            const y0 = (height - L * Math.sin(angleRad)) / 2;
            const x1 = (width + L * Math.cos(angleRad)) / 2;
            const y1 = (height + L * Math.sin(angleRad)) / 2;
            gradient = ctx.createLinearGradient(x0, y0, x1, y1);
        } else {
            const shape = this.radialShapeSelect.value;
            const centerX = width / 2;
            const centerY = height / 2;
            let r0 = 0;
            let r1 = shape === 'circle' ? Math.min(width, height) / 2 : Math.max(width, height) / 2;
            gradient = ctx.createRadialGradient(centerX, centerY, r0, centerX, centerY, r1);
        }

        const step = activeColors.length > 1 ? 1 / (activeColors.length - 1) : 1;
        activeColors.forEach((color, index) => {
            gradient.addColorStop(Math.min(index * step, 1.0), color);
        });
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    private drawGrain(ctx: CanvasRenderingContext2D, width: number, height: number) {
        if (!this.grainToggle || !this.grainOpacityInput || width === 0 || height === 0) return;
        if (!this.grainToggle.checked) return;
        const opacity = parseFloat(this.grainOpacityInput.value);
        if (opacity === 0) return;

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const noiseIntensityBase = 50;
        const actualNoiseIntensity = noiseIntensityBase * opacity;
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * actualNoiseIntensity;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        ctx.putImageData(imageData, 0, 0);
    }

    private updatePreview() {
        if (!this.previewCanvas || !this.previewCtx) {
            return;
        }

        const currentDisplayWidth = this.previewCanvas.clientWidth;
        const currentDisplayHeight = this.previewCanvas.clientHeight;

        if (this.previewCanvas.width !== currentDisplayWidth || this.previewCanvas.height !== currentDisplayHeight) {
            this.previewCanvas.width = currentDisplayWidth;
            this.previewCanvas.height = currentDisplayHeight;
        }
        if (this.previewCanvas.width === 0 || this.previewCanvas.height === 0) return;

        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        this.drawGradient(this.previewCtx, this.previewCanvas.width, this.previewCanvas.height);
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
        if (!this.previewCtx || !this.outputWidthInput || !this.outputHeightInput) {
            alert("Cannot download image: essential components missing or not initialized.");
            return;
        }
        const width = parseInt(this.outputWidthInput.value);
        const height = parseInt(this.outputHeightInput.value);
        if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
            alert("Please enter valid width and height for the download.");
            return;
        }
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
            alert("Failed to create temporary canvas for download.");
            return;
        }
        this.drawGradient(tempCtx, width, height);
        this.drawGrain(tempCtx, width, height);

        const randomSuffix = this.generateRandomSuffix();
        const filename = `gradient-background-${width}x${height}-${randomSuffix}.png`;

        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('[DOMContentLoaded] DOM fully loaded and parsed. Initializing GradientGenerator...');
    new GradientGenerator();
});

console.log('[Script] script.ts (soon to be script.js) has been parsed by the browser.');
