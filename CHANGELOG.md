# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
