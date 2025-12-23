#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;
uniform vec3 u_colors[10];
uniform int u_colorCount;
uniform float u_blobSmoothness;
uniform float u_noiseScale;

// Include noise functions (will be prepended by renderer)
{{common_glsl}}

void main() {
    vec2 uv = v_uv;
    float aspect = u_resolution.x / u_resolution.y;
    vec2 p = uv;
    p.x *= aspect;

    // Distort UVs with noise for organic flow
    float n = snoise(p * u_noiseScale + u_time * 0.1);
    float n2 = snoise(p * u_noiseScale * 0.5 - u_time * 0.05);
    
    vec2 distortedP = p + vec2(n, n2) * 0.1;

    vec3 finalColor = vec3(0.0);
    float totalWeight = 0.0;

    for (int i = 0; i < u_colorCount; i++) {
        // Create organic moving centers for blobs
        float t = u_time * 0.2 + float(i) * 1.5;
        vec2 center = vec2(
            0.5 * aspect + 0.4 * aspect * sin(t * 0.7 + n * 0.2),
            0.5 + 0.4 * cos(t * 0.8 + n2 * 0.2)
        );

        float d = distance(distortedP, center);
        
        // Metaball-style weight calculation
        float weight = 1.0 / pow(max(d, 0.01), u_blobSmoothness * 2.0);
        
        finalColor += u_colors[i] * weight;
        totalWeight += weight;
    }

    finalColor /= totalWeight;

    // Subtle vignette
    float vignette = 1.0 - smoothstep(0.5, 1.5, length(v_uv - 0.5));
    finalColor *= mix(0.8, 1.0, vignette);

    outColor = vec4(finalColor, 1.0);
}

