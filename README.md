# Gradient Background Generator

A WebGL2-powered gradient background generator with animated metaball-style blobs, simplex noise distortion, and film grain effects. Create beautiful, organic gradient backgrounds and export them as PNG images.

## Features

- **Animated gradient blobs** using metaball-style blending with simplex noise distortion
- **Multi-pass WebGL2 rendering** with separate gradient and grain shaders
- **Customizable colors** with support for multiple color stops
- **Adjustable effects** including grain intensity, blob smoothness, and noise scale
- **Resolution presets** for common aspect ratios (16:9, 9:16, 4K, square)
- **Custom dimensions** for any resolution
- **Playback controls** with pause/resume and timeline scrubbing
- **Built-in presets** for quick starting points
- **PNG export** at full resolution

## Requirements

- [Bun](https://bun.sh) runtime

## Installation

```bash
bun install
```

## Development

Start the development server with hot reloading:

```bash
bun run dev
```

## Build

Build for production:

```bash
bun run build
```

This creates a `dist/` folder with the bundled application.

## Usage

1. Open the application in a browser
2. Choose a preset or customize colors by clicking the color swatches
3. Add or remove colors using the + button and X buttons
4. Adjust effects using the sliders:
   - **Grain Intensity**: Controls the strength of the film grain overlay
   - **Blob Smoothness**: Adjusts how sharply the color blobs blend together
   - **Noise Scale**: Changes the scale of the organic distortion
5. Use playback controls to pause animation and scrub through the timeline
6. Select a resolution preset or enter custom dimensions
7. Click "Download PNG" to export the current frame

## Project Structure

```
src/
  main.ts          # Application entry point and UI logic
  renderer.ts      # WebGL2 renderer with multi-pass pipeline
  presets.ts       # Color and effect presets
  shaders/
    common.glsl    # Shared simplex noise functions
    gradient.frag  # Main gradient fragment shader
    grain.frag     # Film grain post-processing shader
```

## License

Apache-2.0
