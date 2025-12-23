export interface Preset {
    name: string;
    colors: [number, number, number][];
    grainIntensity: number;
    blobSmoothness: number;
    noiseScale: number;
}

export const PRESETS: Preset[] = [
    {
        name: "Oceanic Flow",
        colors: [
            [0.1, 0.4, 0.8],
            [0.2, 0.8, 0.6],
            [0.05, 0.2, 0.4]
        ],
        grainIntensity: 0.15,
        blobSmoothness: 1.2,
        noiseScale: 1.5
    },
    {
        name: "Sunset Blobs",
        colors: [
            [0.9, 0.3, 0.4],
            [1.0, 0.6, 0.2],
            [0.4, 0.1, 0.5]
        ],
        grainIntensity: 0.1,
        blobSmoothness: 0.8,
        noiseScale: 2.0
    },
    {
        name: "Cotton Candy",
        colors: [
            [1.0, 0.8, 0.9],
            [0.8, 0.9, 1.0],
            [0.9, 1.0, 0.8]
        ],
        grainIntensity: 0.2,
        blobSmoothness: 1.5,
        noiseScale: 1.0
    },
    {
        name: "Deep Space",
        colors: [
            [0.05, 0.05, 0.2],
            [0.1, 0.0, 0.15],
            [0.0, 0.1, 0.1]
        ],
        grainIntensity: 0.25,
        blobSmoothness: 1.0,
        noiseScale: 3.0
    },
    {
        name: "Tropical Dream",
        colors: [
            [1.0, 0.4, 0.0],
            [0.0, 0.8, 0.8],
            [0.8, 0.0, 0.4]
        ],
        grainIntensity: 0.12,
        blobSmoothness: 0.9,
        noiseScale: 1.8
    }
];

