interface GradientColor {
    id: number;
    value: string;
}

class GradientGenerator {
    private colorInputsContainer: HTMLElement | null;
    private addColorButton: HTMLButtonElement | null;
    private removeColorButton: HTMLButtonElement | null;
    private gradientTypeSelect: HTMLSelectElement | null;
    private linearSettingsDiv: HTMLElement | null;
    private radialSettingsDiv: HTMLElement | null;
    private gradientAngleInput: HTMLInputElement | null;
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
    private readonly MAX_COLORS = 10;
    private isSwappingDimensions = false;

    constructor() {
        this.previewCanvas = document.getElementById('preview-canvas') as HTMLCanvasElement | null;

        if (!this.previewCanvas) {
            console.error("FATAL ERROR: HTMLCanvasElement with ID 'preview-canvas' not found in the DOM.");
            alert("Critical Error: The preview canvas element is missing. The application cannot start. Please check the index.html file.");

            // Initialize all DOM-bound properties to null if the critical canvas is missing
            this.previewCtx = null;
            this.colorInputsContainer = null;
            this.addColorButton = null;
            this.removeColorButton = null;
            this.gradientTypeSelect = null;
            this.linearSettingsDiv = null;
            this.radialSettingsDiv = null;
            this.gradientAngleInput = null;
            this.radialShapeSelect = null;
            this.grainToggle = null;
            this.grainOpacityInput = null;
            this.outputWidthInput = null;
            this.outputHeightInput = null;
            this.outputOrientationSelect = null;
            this.swapDimensionsButton = null;
            this.downloadButton = null;
            return; // Stop initialization
        }

        this.previewCtx = this.previewCanvas.getContext('2d');

        if (!this.previewCtx) {
            console.error("Failed to get 2D context from canvas. The canvas element was found, but context creation failed.");
            alert("Error: Canvas 2D context not supported or failed to initialize. Gradient generation will not work.");
            // Even if context fails, other elements might be useful for a degraded experience,
            // or we might want to disable drawing features. For now, we'll get them.
            // But drawing functions will be guarded by previewCtx check.
        }

        // Initialize other DOM elements normally
        this.colorInputsContainer = document.getElementById('color-inputs')!;
        this.addColorButton = document.getElementById('add-color') as HTMLButtonElement;
        this.removeColorButton = document.getElementById('remove-color') as HTMLButtonElement;
        this.gradientTypeSelect = document.getElementById('gradient-type') as HTMLSelectElement;
        this.linearSettingsDiv = document.getElementById('linear-settings')!;
        this.radialSettingsDiv = document.getElementById('radial-settings')!;
        this.gradientAngleInput = document.getElementById('gradient-angle') as HTMLInputElement;
        this.radialShapeSelect = document.getElementById('radial-shape') as HTMLSelectElement;
        this.grainToggle = document.getElementById('grain-toggle') as HTMLInputElement;
        this.grainOpacityInput = document.getElementById('grain-opacity') as HTMLInputElement;
        this.outputWidthInput = document.getElementById('output-width') as HTMLInputElement;
        this.outputHeightInput = document.getElementById('output-height') as HTMLInputElement;
        this.outputOrientationSelect = document.getElementById('output-orientation') as HTMLSelectElement;
        this.swapDimensionsButton = document.getElementById('swap-dimensions') as HTMLButtonElement;
        this.downloadButton = document.getElementById('download-btn') as HTMLButtonElement;

        // Optional: A quick check to see if all other elements were found.
        const essentialElements = [
            this.colorInputsContainer, this.addColorButton, this.removeColorButton, this.gradientTypeSelect,
            this.linearSettingsDiv, this.radialSettingsDiv, this.gradientAngleInput, this.radialShapeSelect,
            this.grainToggle, this.grainOpacityInput, this.outputWidthInput, this.outputHeightInput,
            this.outputOrientationSelect, this.swapDimensionsButton, this.downloadButton
        ];

        if (essentialElements.some(el => el === null)) {
            console.warn("Warning: One or more non-critical UI elements were not found. Some functionality may be impaired.");
        }

        this.init();
    }
    private init() {
        if (!this.previewCanvas || !this.previewCtx) {
            console.warn("Initialization skipped or limited due to missing canvas or context.");
            // Disable UI elements that depend on the canvas
            if (this.downloadButton) this.downloadButton.disabled = true;
            return;
        }
        // console.log('Initializing GradientGenerator...');
        this.addNewColor('#ff0000');
        this.addNewColor('#0000ff');

        this.attachEventListeners();

        this.linearSettingsDiv!.style.display = 'block';
        this.radialSettingsDiv!.style.display = 'none';
        this.grainOpacityInput!.disabled = !this.grainToggle!.checked;

        this.updateRemoveColorButtonState();
        this.adjustPreviewCanvasAspectRatio();
        // console.log('Initialization complete.');
    }

    private addNewColor(defaultValue: string = '#ffffff') {
        if (!this.colorInputsContainer) return; // Guard against missing element
        // console.log('Adding new color:', defaultValue);
        if (this.colors.length >= this.MAX_COLORS) {
            alert(`Maximum ${this.MAX_COLORS} colors allowed.`);
            return;
        }

        const colorId = this.nextColorId++;
        const newColor: GradientColor = { id: colorId, value: defaultValue };
        this.colors.push(newColor);

        const input = document.createElement('input');
        input.type = 'color';
        input.value = defaultValue;
        input.dataset.colorId = colorId.toString();
        input.addEventListener('input', (e) => {
            const target = e.target as HTMLInputElement;
            const id = parseInt(target.dataset.colorId!);
            const color = this.colors.find(c => c.id === id);
            if (color) {
                color.value = target.value;
                this.updatePreview();
            }
        });
        this.colorInputsContainer.appendChild(input);
        this.updateRemoveColorButtonState();
        this.updatePreview();
    }

    private removeLastColor() {
        if (!this.colorInputsContainer) return; // Guard
        // console.log('Attempting to remove last color.');
        if (this.colors.length > 2) {
            this.colors.pop();
            if (this.colorInputsContainer.lastChild) {
                this.colorInputsContainer.removeChild(this.colorInputsContainer.lastChild);
            }
            this.updateRemoveColorButtonState();
            this.updatePreview();
        } else {
            // console.log('Cannot remove color, minimum 2 colors required.');
        }
    }

    private updateRemoveColorButtonState() {
        if (!this.removeColorButton || !this.addColorButton) return; // Guard
        this.removeColorButton.disabled = this.colors.length <= 2;
        this.addColorButton.disabled = this.colors.length >= this.MAX_COLORS;
        // console.log('Remove color button disabled state:', this.removeColorButton.disabled);
    }

    private attachEventListeners() {
        // Add guards for each element before adding event listener
        if (this.addColorButton) this.addColorButton.addEventListener('click', () => this.addNewColor());
        if (this.removeColorButton) this.removeColorButton.addEventListener('click', () => this.removeLastColor());

        const elementsToAttachListeners = [
            this.gradientTypeSelect, this.gradientAngleInput, this.radialShapeSelect,
            this.grainToggle, this.grainOpacityInput,
            this.outputWidthInput, this.outputHeightInput, this.outputOrientationSelect
        ];

        elementsToAttachListeners.forEach(el => {
            if (el) { // Check if element exists
                const eventType = (el.tagName === 'SELECT' || el.type === 'checkbox') ? 'change' : 'input';
                el.addEventListener(eventType, () => this.handleControlChange(el.id));
            }
        });

        if (this.swapDimensionsButton) this.swapDimensionsButton.addEventListener('click', () => this.swapDimensions());
        if (this.downloadButton) this.downloadButton.addEventListener('click', () => this.downloadImage());
    }

    private handleControlChange(elementId: string) {
        // console.log(`Control changed: ${elementId}`);
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
        if (this.isSwappingDimensions || !this.outputWidthInput || !this.outputHeightInput || !this.outputOrientationSelect) return; // Guard
        this.isSwappingDimensions = true;
        // console.log('Swapping dimensions...');

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
        // console.log('Dimensions swapped.');
    }

    private handleOrientationChange() {
        if (this.isSwappingDimensions || !this.outputWidthInput || !this.outputHeightInput || !this.outputOrientationSelect) return; // Guard
        // console.log('Handling orientation change...');

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
        if (!this.previewCanvas || !this.outputWidthInput || !this.outputHeightInput) return; // Guard
        // console.log('Adjusting preview canvas aspect ratio...');
        const previewArea = document.getElementById('preview-area')!; // Assuming preview-area will always exist if canvas does
        if (!previewArea) return;

        const widthInput = parseInt(this.outputWidthInput.value) || 1920;
        const heightInput = parseInt(this.outputHeightInput.value) || 1080;

        previewArea.style.aspectRatio = `${widthInput} / ${heightInput}`;

        requestAnimationFrame(() => {
            if (!this.previewCanvas) return; // Re-check in RAF
            if (this.previewCanvas.width !== this.previewCanvas.clientWidth) {
                this.previewCanvas.width = this.previewCanvas.clientWidth;
            }
            if (this.previewCanvas.height !== this.previewCanvas.clientHeight) {
                this.previewCanvas.height = this.previewCanvas.clientHeight;
            }
            // console.log('Preview canvas resized via RAF to:', this.previewCanvas.width, this.previewCanvas.height);
            this.updatePreview();
        });
    }

    private drawGradient(ctx: CanvasRenderingContext2D, width: number, height: number) {
        if (!this.gradientTypeSelect || !this.gradientAngleInput || !this.radialShapeSelect) return; // Guard
        const gradientType = this.gradientTypeSelect.value;
        const activeColors = this.colors.map(c => c.value);

        if (activeColors.length < 2) {
            return;
        }

        let gradient: CanvasGradient;

        if (gradientType === 'linear') {
            const angleDeg = parseFloat(this.gradientAngleInput.value);
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
        if (!this.grainToggle || !this.grainOpacityInput || width === 0 || height === 0) return; // Guard
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
        if (!this.previewCanvas || !this.previewCtx) { // Critical guard
            // console.warn("Preview update skipped: canvas or context not available.");
            return;
        }
        // console.log('Attempting to update preview...');

        if (this.previewCanvas.width !== this.previewCanvas.clientWidth ||
            this.previewCanvas.height !== this.previewCanvas.clientHeight) {
            this.previewCanvas.width = this.previewCanvas.clientWidth;
            this.previewCanvas.height = this.previewCanvas.clientHeight;
        }

        if (this.previewCanvas.width === 0 || this.previewCanvas.height === 0) {
            // console.warn("Preview canvas has zero dimension. Aborting draw in updatePreview.");
            return;
        }

        this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
        this.drawGradient(this.previewCtx, this.previewCanvas.width, this.previewCanvas.height);
        this.drawGrain(this.previewCtx, this.previewCanvas.width, this.previewCanvas.height);
        // console.log('Preview updated.');
    }

    private downloadImage() {
        if (!this.previewCtx || !this.outputWidthInput || !this.outputHeightInput) { // Guard
            alert("Cannot download image: essential components missing or not initialized.");
            return;
        }
        // console.log('Preparing download...');
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

        const dataURL = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = `gradient-background-${width}x${height}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new GradientGenerator();
});
