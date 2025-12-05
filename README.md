# 2026 Strategy - AI-Powered Strategic Planning & Smart Receipt Scanner

## Table of Contents
1. [Introduction](#1-introduction)
2. [Features](#2-features)
3. [Architecture](#3-architecture)
4. [Getting Started](#4-getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
   - [Running the Application](#running-the-application)
5. [Development](#5-development)
   - [Monorepo Structure](#monorepo-structure)
   - [Scripts](#scripts)
6. [Cleaning the Project](#6-cleaning-the-project)
7. [Contributing](#7-contributing)
8. [License](#8-license)

## 1. Introduction
This project is an AI-powered web application designed to help define, organize, and visualize a client's strategic initiatives, along with a smart receipt scanning and management system. It aims to create an easy-to-use strategic roadmap and a robust tool for managing financial records.

## 2. Features
- **Strategic Planning (AI-Assisted):**
  - AI-powered chat interface for defining and refining strategic initiatives.
  - Visualization of strategies using Mermaid.js diagrams.
  - Save and load chat sessions.
- **Smart Receipt Scanner (AI-Powered):**
  - Mobile-first design with camera integration for instant scanning.
  - AI-powered extraction of receipt metadata (Store, Date, Total, Items).
  - Persistence for receipt data and images.
  - "Crop & Enhance" feature to optimize receipt images.
  - Ability to toggle between original and optimized image versions.
  - Download functionality for receipt images.
  - Categorization and searching of receipts.

## 3. Architecture
This project is a **monorepo** managed by `npm workspaces`, containing two main packages:

- **Frontend (`packages/frontend`):** A React application built with Vite and written in TypeScript. It provides the user interface for both the strategic planning and receipt management modules.
- **Backend (`packages/backend`):** A Node.js server using the Express framework, written in TypeScript. It handles business logic, data persistence, AI integrations (Google Gemini), and image processing.

## 4. Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (LTS version recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

### Installation
To install all dependencies for both the frontend and backend packages, run the following command from the root of the project:
```bash
npm install
```

### Running the Application
To start both the frontend and backend development servers simultaneously, run the following command from the root of the project:
```bash
npm run dev
```
- The **frontend** will be available at [http://localhost:5173](http://localhost:5173) (or the next available port).
- The **backend** API will be available at [http://localhost:3001](http://localhost:3001).

## 5. Development

### Monorepo Structure
- All packages are located in the `packages/` directory.
- `npm workspaces` is used for managing dependencies and running scripts across packages.

### Scripts
The root `package.json` contains several utility scripts:
- `npm install`: Installs dependencies for all packages.
- `npm run dev`: Starts both frontend and backend development servers concurrently.
- `npm run dev:frontend`: Starts only the frontend development server.
- `npm run dev:backend`: Starts only the backend development server.
- `npm run shutdown`: Stops any running processes on ports 3001 and 5173 (useful for development cleanup).

Individual packages (`packages/frontend`, `packages/backend`) also contain their own scripts (e.g., `test`, `build`, `lint`).

## 6. Cleaning the Project
To clean the project by removing generated files and `node_modules`:
```bash
# From the project root:
# Remove node_modules directories
rm -rf node_modules packages/*/node_modules

# Remove build artifacts
rm -rf packages/*/dist packages/*/uploads packages/*/data

# Optionally remove log files and temporary backup files
rm -f nohup.out
rm -f packages/backend/src/routes/__tests__/*.bak
rm -f packages/backend/src/services/ai/__tests__/*.bak
```

## 7. Contributing
Details on how to contribute to this project. (Placeholder - to be filled in later)

## 8. License
(Details about the project's license)
