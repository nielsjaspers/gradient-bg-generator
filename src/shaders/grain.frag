#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_image;
uniform float u_grainIntensity;
uniform float u_time;

float random(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
    vec4 color = texture(u_image, v_uv);
    
    // High quality film grain
    float noise = random(v_uv + fract(u_time));
    float grain = (noise - 0.5) * u_grainIntensity;
    
    // Apply grain with soft light/overlay feel
    vec3 grainedColor = color.rgb + grain;
    
    // Keep it within bounds
    grainedColor = clamp(grainedColor, 0.0, 1.0);
    
    outColor = vec4(grainedColor, 1.0);
}

