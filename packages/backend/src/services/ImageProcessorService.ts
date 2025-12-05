import sharp from 'sharp';

export interface ImageProcessingOptions {
    resize?: {
        width?: number;
        height?: number;
        fit?: keyof sharp.FitEnum;
    };
    crop?: {
        left: number;
        top: number;
        width: number;
        height: number;
    };
    format?: {
        type: keyof sharp.FormatEnum;
        options?: sharp.JpegOptions | sharp.PngOptions | sharp.WebpOptions;
    };
    grayscale?: boolean;
    sharpen?: sharp.SharpenOptions | true;
    noiseReduction?: number; // Placeholder for median filter, will use median for now
    stripMetadata?: boolean;
}

export class ImageProcessorService {
    /**
     * Processes an image buffer using sharp, applying various transformations.
     * @param inputBuffer The image buffer to process.
     * @param options The image processing options.
     * @returns A promise that resolves with the processed image buffer.
     */
    public async processImage(inputBuffer: Buffer, options: ImageProcessingOptions): Promise<Buffer> {
        let image = sharp(inputBuffer);

        if (options.stripMetadata) {
            // Calling withMetadata({}) effectively replaces existing metadata with an empty set.
            image = image.withMetadata({});
        }

        if (options.resize) {
            image = image.resize(options.resize.width, options.resize.height, {
                fit: options.resize.fit
            });
        }

        if (options.crop) {
            image = image.extract({
                left: options.crop.left,
                top: options.crop.top,
                width: options.crop.width,
                height: options.crop.height
            });
        }

        if (options.grayscale) {
            image = image.grayscale();
        }

        if (options.sharpen) {
            if (options.sharpen === true) {
                image = image.sharpen(); // Use default sharpening if true
            } else {
                image = image.sharpen(options.sharpen); // Use provided SharpenOptions
            }
        }

        if (options.noiseReduction && options.noiseReduction > 0) {
            // sharp's median filter is good for noise reduction
            image = image.median(options.noiseReduction);
        }

        if (options.format) {
            image = image.toFormat(options.format.type, options.format.options);
        }

        return image.toBuffer();
    }
}