### Fixing OpenCV.js Initialization Issue

**Reason:**
The frontend encountered a runtime error "Enhancement Failed: Can't find variable cvReadyPromise", indicating that `cvReadyPromise` was being used in `DocumentScanner.ts` without being properly defined or initialized, leading to OpenCV.js related functions failing. Additionally, a minor TypeScript error (`TS6133`) was present in `AIReceiptsApp.tsx`.

**Steps Performed:**

1.  **Investigated `cvReadyPromise` Usage:**
    *   **Command:** `search_file_content cvReadyPromise`
    *   **Reason:** To locate where `cvReadyPromise` was being referenced and to identify its missing definition.

2.  **Reviewed `DocumentScanner.ts` and `DocumentScanner.ts.backup`:**
    *   **Command:** `read_file packages/frontend/src/services/DocumentScanner.ts` and `read_file packages/frontend/src/services/DocumentScanner.ts.backup`
    *   **Reason:** To compare the current (broken) implementation with a previous backup that contained the `cvReadyPromise` definition.

3.  **Restored `cvReadyPromise` Definition in `DocumentScanner.ts`:**
    *   **Command:** `replace` (as executed by the agent)
    *   **Reason:** To re-introduce the `cvReadyPromise` Promise, which waits for `cv` (OpenCV.js) to be fully loaded and initialized, into the `DocumentScanner.ts` file. This resolves the `ReferenceError`.

4.  **Fixed Unused Variable Error in `AIReceiptsApp.tsx`:**
    *   **Command:** `replace` (as executed by the agent)
    *   **Reason:** To resolve a `TS6133` TypeScript error by removing the unused `e` parameter from the `onerror` callback function in `AIReceiptsApp.tsx`.

5.  **Corrected Race Condition in `processReceipt`:**
    *   **Command:** `replace` (as executed by the agent)
    *   **Reason:** Moved the `if (typeof cv === 'undefined')` check in `processReceipt` to *after* `await cvReadyPromise`. This ensures that the function reliably waits for OpenCV.js to be ready before attempting to use the `cv` object, preventing potential race conditions where `processReceipt` might be called before `cv` is fully loaded.

6.  **Verified Frontend Build:**
    *   **Command:** `npx tsc -b packages/frontend`
    *   **Reason:** To confirm that all TypeScript errors, including the newly introduced definition and the `TS6133` error, were resolved and the frontend project compiles successfully.
