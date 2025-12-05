// import jscanify from 'jscanify';

// Declare global cv variable for OpenCV.js
declare const cv: any;

// A promise that resolves when OpenCV.js is fully initialized
const cvReadyPromise = new Promise<void>((resolve) => {
  const checkCv = () => {
    // Check if cv is defined
    if (typeof cv !== 'undefined') {
      // If it's already initialized (Mat exists) or onRuntimeInitialized is available
      if (cv.Mat) {
         console.log("OpenCV.js is already ready.");
         resolve();
      } else if (cv.onRuntimeInitialized) {
         // It might have a callback slot, but we need to hook into it if it hasn't fired?
         // Actually, usually you set Module.onRuntimeInitialized BEFORE loading.
         // But since we load it via script tag without Module config, it might just resolve eventually.
         // Let's try to hook it or poll for Mat.
         const originalOnRuntimeInitialized = cv.onRuntimeInitialized;
         cv.onRuntimeInitialized = () => {
             if (originalOnRuntimeInitialized) originalOnRuntimeInitialized();
             console.log("OpenCV.js initialized via callback.");
             resolve();
         };
         // Also keep polling just in case it fired already but Mat isn't ready? Unlikely.
      } else {
         // cv exists but maybe not fully ready, or it's a different version.
         // Let's assume if cv.Mat exists it is ready.
         setTimeout(checkCv, 100);
      }
    } else {
      // cv not defined yet
      setTimeout(checkCv, 100);
    }
  };
  checkCv();
});

/**
 * Processes a receipt image to crop, de-warp, and enhance it for OCR/readability.
 * 
 * @param imageElement The source HTMLImageElement containing the receipt.
 * @returns A HTMLCanvasElement containing the processed image.
 * @throws Error if OpenCV is not loaded or not initialized.
 */
export const processReceipt = async (imageElement: HTMLImageElement): Promise<HTMLCanvasElement> => {
  // Ensure OpenCV.js is loaded and initialized
  await cvReadyPromise; // Wait for OpenCV to signal its readiness

  if (typeof cv === 'undefined') {
    throw new Error("OpenCV.js is not loaded. Ensure the script tag is present and accessible.");
  }

  // const scanner = new jscanify();

  // 1. Identification & Crop
  // extractPaper returns a canvas with the cropped, un-warped image
  // We use the full natural dimensions of the image for best quality
  // const croppedCanvas = scanner.extractPaper(imageElement, imageElement.naturalWidth, imageElement.naturalHeight);

   const croppedCanvas = document.createElement('canvas');  
   croppedCanvas.width = imageElement.naturalWidth;  
   croppedCanvas.height = imageElement.naturalHeight; 
   const ctx = croppedCanvas.getContext('2d');
   ctx?.drawImage(imageElement, 0, 0);   
  // 2. Enhancement (Pre-processing for OCR)
  // We need to convert the canvas back to an OpenCV Matrix to process it
  const srcMat = cv.imread(croppedCanvas);
  const dstMat = new cv.Mat();
  
  // A. Convert to Grayscale (OCR engines prefer 1 channel)
  cv.cvtColor(srcMat, srcMat, cv.COLOR_RGBA2GRAY, 0);

  // B. Adaptive Thresholding
  // This turns the image black and white based on local pixel neighborhoods, 
  // effectively killing shadows and boosting text contrast.
  // Block size (21) and C (10) are tuned for typical receipts based on example.
  cv.adaptiveThreshold(
    srcMat, 
    dstMat, 
    255, 
    cv.ADAPTIVE_THRESH_GAUSSIAN_C, 
    cv.THRESH_BINARY, 
    21, 
    10
  );

  // 3. Render back to canvas
  cv.imshow(croppedCanvas, dstMat);

  // Cleanup OpenCV memory (Crucial!)
  srcMat.delete();
  dstMat.delete();

  return croppedCanvas;
};
