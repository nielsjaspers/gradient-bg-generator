import { Renderer } from './renderer';
import { PRESETS, type Preset } from './presets';
// @ts-ignore
import commonGlsl from './shaders/common.glsl' with { type: 'text' };
// @ts-ignore
import gradientFs from './shaders/gradient.frag' with { type: 'text' };
// @ts-ignore
import grainFs from './shaders/grain.frag' with { type: 'text' };

const VERTEX_SHADER = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
    v_uv = a_position * 0.5 + 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export interface AppState {
    width: number;
    height: number;
    colors: [number, number, number][];
    grainIntensity: number;
    blobSmoothness: number;
    noiseScale: number;
    time: number;
    isPaused: boolean;
    manualTime: number;
}

class App {
    private renderer: Renderer;
    private state: AppState;
    private canvas: HTMLCanvasElement;
    private lastFrameTime: number = 0;

    constructor() {
        this.canvas = document.getElementById('gl-canvas') as HTMLCanvasElement;
        this.renderer = new Renderer(this.canvas);
        
        this.state = {
            width: 1920,
            height: 1080,
            colors: [...PRESETS[0].colors],
            grainIntensity: PRESETS[0].grainIntensity,
            blobSmoothness: PRESETS[0].blobSmoothness,
            noiseScale: PRESETS[0].noiseScale,
            time: 0,
            isPaused: false,
            manualTime: 0
        };

        this.init();
    }

    private async init() {
        const fullGradFs = gradientFs.replace('{{common_glsl}}', commonGlsl);
        this.renderer.setupPrograms(fullGradFs, grainFs, VERTEX_SHADER);
        
        this.setupEventListeners();
        this.renderColors();
        this.renderPresets();
        this.syncInputs();
        this.startLoop();
    }

    private syncInputs() {
        (document.getElementById('grain-intensity') as HTMLInputElement).value = this.state.grainIntensity.toString();
        (document.getElementById('blob-smoothness') as HTMLInputElement).value = this.state.blobSmoothness.toString();
        (document.getElementById('noise-scale') as HTMLInputElement).value = this.state.noiseScale.toString();
        (document.getElementById('canvas-width') as HTMLInputElement).value = this.state.width.toString();
        (document.getElementById('canvas-height') as HTMLInputElement).value = this.state.height.toString();
        (document.getElementById('toggle-pause') as HTMLButtonElement).textContent = this.state.isPaused ? 'Resume' : 'Pause';
    }

    private setupEventListeners() {
        const updateState = (id: string, key: keyof AppState) => {
            const el = document.getElementById(id) as HTMLInputElement;
            el.addEventListener('input', () => {
                (this.state as any)[key] = parseFloat(el.value);
            });
        };

        updateState('grain-intensity', 'grainIntensity');
        updateState('blob-smoothness', 'blobSmoothness');
        updateState('noise-scale', 'noiseScale');

        document.getElementById('add-color')!.addEventListener('click', () => {
            this.state.colors.push([Math.random(), Math.random(), Math.random()]);
            this.renderColors();
        });

        // Pause/Resume
        const pauseBtn = document.getElementById('toggle-pause') as HTMLButtonElement;
        pauseBtn.addEventListener('click', () => {
            this.state.isPaused = !this.state.isPaused;
            pauseBtn.textContent = this.state.isPaused ? 'Resume' : 'Pause';
        });

        // Manual Time Slider
        const timeSlider = document.getElementById('time-slider') as HTMLInputElement;
        timeSlider.addEventListener('input', () => {
            this.state.manualTime = parseFloat(timeSlider.value);
            if (!this.state.isPaused) {
                this.state.isPaused = true;
                this.syncInputs();
            }
        });

        // Canvas dimensions
        const widthInput = document.getElementById('canvas-width') as HTMLInputElement;
        const heightInput = document.getElementById('canvas-height') as HTMLInputElement;
        
        const updateDimensions = () => {
            this.state.width = parseInt(widthInput.value) || 1920;
            this.state.height = parseInt(heightInput.value) || 1080;
            this.canvas.width = this.state.width;
            this.canvas.height = this.state.height;
        };

        widthInput.addEventListener('change', updateDimensions);
        heightInput.addEventListener('change', updateDimensions);
        updateDimensions();

        // Flip dimensions
        document.getElementById('flip-dimensions')!.addEventListener('click', () => {
            const w = widthInput.value;
            widthInput.value = heightInput.value;
            heightInput.value = w;
            updateDimensions();
        });

        // Resolution Presets
        document.querySelectorAll('.res-preset').forEach(btn => {
            btn.addEventListener('click', () => {
                const w = (btn as HTMLElement).dataset.w!;
                const h = (btn as HTMLElement).dataset.h!;
                widthInput.value = w;
                heightInput.value = h;
                updateDimensions();
            });
        });

        document.getElementById('download-png')!.addEventListener('click', () => this.download());
    }

    private renderColors() {
        const container = document.getElementById('color-list')!;
        container.innerHTML = '';

        this.state.colors.forEach((color, i) => {
            const item = document.createElement('div');
            item.className = 'color-item';
            
            const hex = this.rgbToHex(color);
            item.innerHTML = `
                <div class="color-preview" style="background-color: ${hex}"></div>
                <input type="color" value="${hex}">
                <div class="remove-color">×</div>
            `;

            // Color picker trigger
            const input = item.querySelector('input')!;
            const preview = item.querySelector('.color-preview') as HTMLElement;
            
            input.addEventListener('input', (e) => {
                const val = (e.target as HTMLInputElement).value;
                const newColor = this.hexToRgb(val);
                this.state.colors[i] = newColor;
                preview.style.backgroundColor = val;
            });

            // Remove button
            const removeBtn = item.querySelector('.remove-color')!;
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.state.colors.length > 2) {
                    this.state.colors.splice(i, 1);
                    this.renderColors();
                }
            });

            container.appendChild(item);
        });
    }

    private renderPresets() {
        const container = document.getElementById('preset-list')!;
        container.innerHTML = '';

        PRESETS.forEach(preset => {
            const card = document.createElement('div');
            card.className = 'preset-card';
            card.title = preset.name;
            
            const cssGrad = `linear-gradient(135deg, ${preset.colors.map(c => this.rgbToHex(c)).join(', ')})`;
            card.style.background = cssGrad;

            card.addEventListener('click', () => {
                this.state.colors = [...preset.colors];
                this.state.grainIntensity = preset.grainIntensity;
                this.state.blobSmoothness = preset.blobSmoothness;
                this.state.noiseScale = preset.noiseScale;
                this.renderColors();
                this.syncInputs();
            });

            container.appendChild(card);
        });
    }

    private rgbToHex(rgb: [number, number, number]): string {
        const r = Math.round(rgb[0] * 255).toString(16).padStart(2, '0');
        const g = Math.round(rgb[1] * 255).toString(16).padStart(2, '0');
        const b = Math.round(rgb[2] * 255).toString(16).padStart(2, '0');
        return `#${r}${g}${b}`;
    }

    private hexToRgb(hex: string): [number, number, number] {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return [r, g, b];
    }

    private startLoop() {
        const loop = (time: number) => {
            if (!this.state.isPaused) {
                this.state.time = time * 0.001;
                // Sync manual slider when playing
                (document.getElementById('time-slider') as HTMLInputElement).value = (this.state.time % 100).toString();
            } else {
                // Use manual time when paused
                this.state.time = this.state.manualTime;
            }

            this.renderer.render({
                ...this.state,
                width: this.canvas.width,
                height: this.canvas.height
            });
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    private download() {
        const link = document.createElement('a');
        link.download = `gradient-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }
}

new App();
