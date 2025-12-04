# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.1] - 2025-12-04

### Added
- **Receipt Management:**
  - Added "Manage Receipt" modal workflow.
  - Implemented Delete Receipt functionality in Frontend and Backend.
  - Replaced direct Delete action with an Edit/Manage menu for future extensibility.

### Changed
- **UI Enhancements:**
  - Updated Receipt Card with "Edit" (pencil) icon.
  - Improved mobile styling for action buttons.
- **Stability:**
  - Temporarily rolled back complex "Swipe to Delete" and "Calendar" features to resolve a blank screen crash on mobile.
  - Focused on stable, button-based interactions.

## [0.2.0] - 2025-12-04

### Added
- **Smart Receipt Scanner (Mode 2):**
  - Mobile-first camera integration (`capture="environment"`).
  - AI-powered extraction of Receipt metadata (Store, Date, Total, Items) using Gemini Vision.
  - Structured JSON storage and persistence for receipts.
  - Image upload handling and gallery view.
- **Mobile Experience:**
  - Relocated Chat History to the bottom of the screen for better accessibility on mobile devices.
  - Responsive layouts for both Strategy and Receipt modes.
- **Backend Enhancements:**
  - Upgraded `AISpecialist` to support multimodal Image inputs (JPEG/PNG).
  - Created `ReceiptProcessor` service for specific JSON extraction tasks.
  - Configured `nodemon` to ignore `uploads/` and `data/` to prevent restart loops.
  - Static file serving for uploaded images.
- **Architecture:**
  - Refactored Frontend to support multiple "Apps" (Strategy vs. Mode 2).
  - Distinct CSS architecture for separate modes.

### Fixed
- Fixed TypeScript syntax errors in `ReceiptProcessor`.
- Resolved `nodemon` crash loop caused by image uploads.
- Fixed `uuid` import compatibility issues.

## [0.1.0] - 2025-12-03

### Added
- Initial project setup.
- Created monorepo structure with npm workspaces.
- Scaffolding frontend and backend packages.
- Installed `concurrently` for running frontend and backend simultaneously.
- Defined core data models (`Solution` and `StrategicInitiative`) in `packages/backend/src/types.ts`.
- Set up Jest testing framework for the backend, including `jest.config.js` and a test script.
- Created a test directory and initial test file (`packages/backend/src/__tests__/types.test.ts`) for data models.
- Implemented `AISpecialist` backend service with Google Gemini integration (and mock fallback).
- Added support for parsing PDF and text files for AI context using `pdf-parse`.
- Created `/api/ai/chat` endpoint handling multipart form data.
- Built Frontend `ChatInterface` with file upload support.
- Implemented `FilePersistenceService` for JSON-based chat history storage.
- Added comprehensive testing for backend services and frontend components.
