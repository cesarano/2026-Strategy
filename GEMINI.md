# GEMINI Project Guide: 2026 Strategy

This document provides a comprehensive overview of the `2026-Strategy` project, its structure, and how to run it. It is intended to be a living document that provides context for future development and interaction.

## 1. Project Overview

This project is a web application designed to define, organize, and visualize a client's strategy for a set of strategic initiatives (SIs). It aims to create an easy-to-use strategic roadmap that can be executed by multiple team members.

### Architecture

The project is a **monorepo** managed by `npm workspaces`. This structure contains the frontend and backend code in separate packages, allowing for independent development while sharing a single `node_modules` directory and lockfile at the root.

*   **Frontend (`packages/frontend`):** A [React](https://react.dev/) application built with [Vite](https://vitejs.dev/) and written in [TypeScript](https://www.typescriptlang.org/). It provides the user interface for interacting with the strategic initiatives.

*   **Backend (`packages/backend`):** A [Node.js](https://nodejs.org/) server using the [Express](https://expressjs.com/) framework, also written in [TypeScript](https://www.typescriptlang.org/). It will handle the business logic, data storage, and AI integrations.

## 2. Building and Running

The project is configured to be run with a single command from the root directory.

### Prerequisites

*   [Node.js](https://nodejs.org/) (LTS version recommended)
*   [npm](https://www.npmjs.com/) (comes with Node.js)

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

This command uses `concurrently` to execute the `dev` scripts in both the `packages/frontend` and `packages/backend` directories.

*   The **frontend** will be available at **http://localhost:5173** (or the next available port).
*   The **backend** will be available at **http://localhost:3001**.

## 3. Development Conventions

*   **Monorepo:** All packages are located in the `packages` directory. Use `npm workspaces` for managing dependencies and running scripts.
*   **TypeScript:** The entire codebase, both frontend and backend, is written in TypeScript, promoting type safety and code quality.
*   **Development Servers:**
    *   The frontend uses **Vite** for a fast development experience with Hot Module Replacement (HMR).
    *   The backend uses **nodemon** and **ts-node** to automatically restart the server on file changes.
*   **Audit & Command Tracking:**
    *   `CHANGELOG.md`: Documents high-level changes and project milestones.
    *   `commands.md`: Provides a log of shell commands and file modifications performed during the project setup, along with the reasoning for each action. This serves as a detailed audit trail.
*   **Git:** The project uses Git for version control. All significant changes should be committed with clear, descriptive messages.
