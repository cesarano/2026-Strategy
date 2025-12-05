### Implementing Image Enhancement Features (Crop & Enhance, Canify Enhance)

**Reason:**
To refactor the existing generic image optimization functionality into a more specific, extensible "Crop & Enhance" feature, and to introduce a placeholder for a future "Canify Enhance" feature. This involves centralizing image processing using the `sharp` library.

**Steps Performed:**

1.  **Installed `sharp` in Backend:**
    *   **Command:** `npm install sharp --prefix packages/backend && npm install @types/sharp --save-dev --prefix packages/backend`
    *   **Reason:** To enable high-performance image processing capabilities in the Node.js backend.

2.  **Created `ImageProcessorService`:**
    *   **File:** `packages/backend/src/services/ImageProcessorService.ts`
    *   **Reason:** To encapsulate `sharp`-based image processing logic, including resizing, cropping, format conversion, grayscale, sharpening, noise reduction, and metadata stripping, into a reusable service.

3.  **Created `ImageProcessorService` Test File:**
    *   **File:** `packages/backend/src/services/__tests__/ImageProcessorService.test.ts`
    *   **Reason:** To ensure the `ImageProcessorService` functions correctly and to prevent regressions.

4.  **Modified `ReceiptProcessor` (Backend):**
    *   **File:** `packages/backend/src/services/ai/ReceiptProcessor.ts`
    *   **Changes:**
        *   Imported `ImageProcessorService` and `ImageProcessingOptions`.
        *   Instantiated `ImageProcessorService` and `ReceiptPersistenceService` within its constructor.
        *   Added a new asynchronous method `cropEnhanceReceiptImage` to handle the image processing workflow using `ImageProcessorService`, including saving the processed image and updating receipt data.
    *   **Reason:** To integrate the new image processing capabilities into the receipt handling logic and provide a dedicated method for the "Crop & Enhance" feature.

5.  **Modified `receiptRoutes` (Backend):**
    *   **File:** `packages/backend/src/routes/receiptRoutes.ts`
    *   **Changes:**
        *   Renamed the route `POST /api/receipts/:id/optimize-image` to `POST /api/receipts/:id/crop-enhance`.
        *   Removed the direct `sharp` implementation from the route handler.
        *   Updated the route handler to call `receiptProcessor.cropEnhanceReceiptImage` and pass `ImageProcessingOptions` from the request body.
        *   Removed the direct `sharp` import.
    *   **Reason:** To update the API endpoint name, delegate image processing to the `ReceiptProcessor` service, and enable configurable enhancement options via the request body.

6.  **Modified `receiptService` (Frontend):**
    *   **File:** `packages/frontend/src/services/receiptService.ts`
    *   **Changes:**
        *   Added `ImageProcessingOptions` interface for type safety.
        *   Renamed `optimizeReceiptImage` to `cropEnhanceReceiptImage`.
        *   Updated the API endpoint it calls from `optimize-image` to `crop-enhance`.
        *   Modified its signature to accept `options: ImageProcessingOptions` and pass them in the `POST` request body.
    *   **Reason:** To align the frontend service with the renamed backend API and allow the frontend to specify image processing options.

7.  **Modified `Mode2App` (Frontend):**
    *   **File:** `packages/frontend/src/apps/mode2/Mode2App.tsx`
    *   **Changes:**
        *   Updated the import statement to use `cropEnhanceReceiptImage` and `ImageProcessingOptions`.
        *   Modified the `handleOptimizeImage` function to call `cropEnhanceReceiptImage` with a default set of `ImageProcessingOptions`.
        *   Added a disabled "Canify Enhance (Coming Soon)" button as a placeholder in the UI.
    *   **Reason:** To integrate the new "Crop & Enhance" functionality into the UI and provide a placeholder for future enhancement features.

**Troubleshooting & Fixes:**

*   **TSError: Multiple Default Exports (`receiptRoutes.ts`)**:
    *   **Issue:** Previous `replace` operations inadvertently duplicated route definitions and `export default router;` statements in `receiptRoutes.ts`.
    *   **Resolution:** Performed a targeted `replace` operation to remove all duplicate routes and ensure only one `export default router;` statement remained at the end of the file.

*   **Frontend `Unexpected token` Error (`Mode2App.tsx`)**:
    *   **Issue:** A previous `replace` operation incorrectly placed function definitions (like `handleOptimizeImage`) inside the JSX return block of the `Mode2App` component, creating a syntax error and duplicating component JSX.
    *   **Resolution:** Overwrote the entire `packages/frontend/src/apps/mode2/Mode2App.tsx` file with a completely regenerated, corrected version, ensuring all functions are defined at the top level of the component and the JSX structure is valid.