export class Renderer {
    private gl: WebGL2RenderingContext;
    private vertexBuffer: WebGLBuffer | null = null;
    
    // Multi-pass support
    private gradientProgram: WebGLProgram | null = null;
    private grainProgram: WebGLProgram | null = null;
    private fb: WebGLFramebuffer | null = null;
    private fbTexture: WebGLTexture | null = null;

    constructor(canvas: HTMLCanvasElement) {
        const gl = canvas.getContext('webgl2', {
            preserveDrawingBuffer: true,
            alpha: true,
            antialias: true
        });

        if (!gl) {
            throw new Error('WebGL2 not supported');
        }

        this.gl = gl;
        this.init();
    }

    private init() {
        const gl = this.gl;
        const vertices = new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]);
        this.vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        this.fb = gl.createFramebuffer();
        this.fbTexture = gl.createTexture();
    }

    private compileShader(type: number, source: string): WebGLShader {
        const gl = this.gl;
        const shader = gl.createShader(type);
        if (!shader) throw new Error('Failed to create shader');
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            const error = gl.getShaderInfoLog(shader);
            gl.deleteShader(shader);
            throw new Error(`Failed to compile shader: ${error}`);
        }
        return shader;
    }

    public createProgram(vsSource: string, fsSource: string): WebGLProgram {
        const gl = this.gl;
        const vs = this.compileShader(gl.VERTEX_SHADER, vsSource);
        const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSource);
        const program = gl.createProgram()!;
        gl.attachShader(program, vs);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Link error: ${gl.getProgramInfoLog(program)}`);
        }
        return program;
    }

    public setupPrograms(gradFs: string, grainFs: string, vs: string) {
        this.gradientProgram = this.createProgram(vs, gradFs);
        this.grainProgram = this.createProgram(vs, grainFs);
    }

    private updateFramebuffer(width: number, height: number) {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.fbTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fbTexture, 0);
    }

    public render(params: any) {
        const gl = this.gl;
        const { width, height, time, colors, blobSmoothness, noiseScale, grainIntensity } = params;

        this.updateFramebuffer(width, height);

        // Pass 1: Gradient
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb);
        gl.viewport(0, 0, width, height);
        gl.useProgram(this.gradientProgram!);

        this.setUniforms(this.gradientProgram!, {
            u_time: time,
            u_resolution: [width, height],
            u_colors: colors.flat(),
            u_colorCount: colors.length,
            u_blobSmoothness: blobSmoothness,
            u_noiseScale: noiseScale
        });

        this.drawQuad(this.gradientProgram!);

        // Pass 2: Grain (to screen)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, width, height);
        gl.useProgram(this.grainProgram!);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.fbTexture);

        this.setUniforms(this.grainProgram!, {
            u_image: 0,
            u_grainIntensity: grainIntensity,
            u_time: time
        });

        this.drawQuad(this.grainProgram!);
    }

    private setUniforms(program: WebGLProgram, uniforms: any) {
        const gl = this.gl;
        for (const [name, value] of Object.entries(uniforms)) {
            const loc = gl.getUniformLocation(program, name);
            if (!loc) continue;

            if (typeof value === 'number') {
                // Samplers (u_image) and counters (u_colorCount) must use uniform1i
                if (name === 'u_image' || name === 'u_colorCount') {
                    gl.uniform1i(loc, Math.floor(value));
                } else {
                    gl.uniform1f(loc, value);
                }
            } else if (Array.isArray(value)) {
                // u_colors is an array in the shader, so it MUST use the 'v' (vector) variant
                if (name === 'u_colors') {
                    gl.uniform3fv(loc, new Float32Array(value));
                } else if (value.length === 2) {
                    gl.uniform2f(loc, value[0], value[1]);
                } else if (value.length === 3) {
                    gl.uniform3f(loc, value[0], value[1], value[2]);
                } else if (value.length === 4) {
                    gl.uniform4f(loc, value[0], value[1], value[2], value[3]);
                }
            }
        }
    }

    private drawQuad(program: WebGLProgram) {
        const gl = this.gl;
        const posLoc = gl.getAttribLocation(program, 'a_position');
        gl.enableVertexAttribArray(posLoc);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
}
