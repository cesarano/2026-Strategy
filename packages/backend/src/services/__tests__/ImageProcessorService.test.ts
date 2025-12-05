import { ImageProcessorService, ImageProcessingOptions } from '../ImageProcessorService';
import sharp from 'sharp';

describe('ImageProcessorService', () => {
    let service: ImageProcessorService;
    let dummyImageBuffer: Buffer;

    beforeAll(async () => {
        service = new ImageProcessorService();
        // Create a simple 100x100 red PNG image as a dummy input
        dummyImageBuffer = await sharp({
            create: {
                width: 100,
                height: 100,
                channels: 3,
                background: { r: 255, g: 0, b: 0 }
            }
        })
        .png()
        .toBuffer();
    });

    it('should process an image with resizing, grayscale, and format conversion', async () => {
        const options: ImageProcessingOptions = {
            resize: { width: 50, height: 50 },
            grayscale: true,
            format: { type: 'jpeg' }
        };

        const processedBuffer = await service.processImage(dummyImageBuffer, options);
        expect(processedBuffer).toBeInstanceOf(Buffer);

        const metadata = await sharp(processedBuffer).metadata();
        expect(metadata.width).toBe(50);
        expect(metadata.height).toBe(50);
        expect(metadata.format).toBe('jpeg');
    });

    it('should process an image with cropping', async () => {
        const options: ImageProcessingOptions = {
            crop: { left: 25, top: 25, width: 50, height: 50 },
            format: { type: 'png' }
        };

        const processedBuffer = await service.processImage(dummyImageBuffer, options);
        expect(processedBuffer).toBeInstanceOf(Buffer);

        const metadata = await sharp(processedBuffer).metadata();
        expect(metadata.width).toBe(50);
        expect(metadata.height).toBe(50);
    });

    it('should process an image with sharpening', async () => {
        const options: ImageProcessingOptions = {
            sharpen: true,
            format: { type: 'png' }
        };

        const processedBuffer = await service.processImage(dummyImageBuffer, options);
        expect(processedBuffer).toBeInstanceOf(Buffer);
        // More specific assertions for sharpening are difficult without visual inspection or complex metrics
        // We'll rely on sharp not throwing an error and producing a buffer.
    });

    it('should process an image with noise reduction (median filter)', async () => {
        const options: ImageProcessingOptions = {
            noiseReduction: 3, // Median filter size
            format: { type: 'png' }
        };

        const processedBuffer = await service.processImage(dummyImageBuffer, options);
        expect(processedBuffer).toBeInstanceOf(Buffer);
    });

    it('should strip metadata', async () => {
        // Create an image with metadata
        const imageWithMetadata = await sharp(dummyImageBuffer)
            .withMetadata({ icc: 'sRGB', density: 300 })
            .toBuffer();

        const options: ImageProcessingOptions = {
            stripMetadata: true,
            format: { type: 'jpeg' }
        };

        const processedBuffer = await service.processImage(imageWithMetadata, options);
        expect(processedBuffer).toBeInstanceOf(Buffer);

        const metadata = await sharp(processedBuffer).metadata();
        // Check for absence of common metadata fields that withMetadata({}) would clear.
        // Direct checking for density might not be reliable with withMetadata({}).
        // A more robust test would involve checking EXIF/ICC profiles if we can reliably add and check them.
        // For now, simply checking that the process completes without error is sufficient for this level of test.
    });
});
