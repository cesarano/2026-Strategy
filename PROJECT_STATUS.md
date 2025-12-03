# 2026-Strategy Project: Development Status & Roadmap

**Date:** Wednesday, 3 December 2025
**Status:** Active Development

## 🚀 Accomplishments to Date

We have successfully initialized and built a functional **AI-powered Strategic Assistant**. The application is a full-stack web app (Monorepo) running locally.

### 1. **Core Infrastructure**
*   **Monorepo Setup:** Configured using `npm workspaces` with separate `frontend` (React/Vite) and `backend` (Express/Node.js) packages.
*   **Network Access:** Configured to listen on `0.0.0.0`, allowing access from any device on the local network (e.g., testing on mobile via `http://<IP>:5173`).
*   **Environment Security:** Implemented `.env` file handling for sensitive keys (`GEMINI_API_KEY`) and excluded it from Git.

### 2. **AI Capabilities**
*   **Integration:** Integrated Google's **Gemini 2.0 Flash** model via the `google-generative-ai` SDK.
*   **Multimodal Support:** Implemented file upload handling. The AI can read and analyze **PDF text content** uploaded by the user to answer context-aware questions.
*   **Visual Strategy Maps:** Enabled the AI to generate **Mermaid.js** code. The frontend automatically renders these as interactive diagrams (flowcharts, mind maps, etc.) within the chat.
    *   *Feature:* Users can **download** these diagrams as high-resolution PNGs.

### 3. **Frontend Experience (UI/UX)**
*   **Chat Interface:** Built a clean, responsive chat UI with:
    *   **Rich Text Support:** Markdown rendering for headers, lists, code blocks, and tables.
    *   **Diagram Rendering:** Embedded Mermaid charts.
*   **Chat History:** Implemented a sidebar (desktop) / bottom panel (mobile) to browse past conversations.
*   **Layout:** Optimized layout with a flexible chat area and a persistent history pane.

### 4. **Backend Services**
*   **Persistence:** Created a file-based persistence service (`FilePersistenceService`) that saves chat sessions to local JSON files (`packages/backend/data/`).
*   **API Endpoints:**
    *   `POST /chat`: Handles text/file inputs and returns AI responses.
    *   `GET /sessions`: Lists all chat history.
    *   `GET /sessions/:id`: Retrieves full message history for a specific session.

---

## 📝 Known Issues

*   **Vite Proxy Error:** Occasional `ECONNREFUSED` or "http proxy error" logs in the terminal when the frontend tries to reach the backend via the Vite proxy (`/api/...`).
    *   *Status:* Frontend config updated to use `127.0.0.1` to mitigate IPv6 issues. Backend confirmed running.
    *   *Workaround:* Restarting `npm run dev` usually resolves this.
    *   *Future Fix:* Switch to direct CORS connection to bypass Vite proxy.

---

## 🔮 Recommended Next Actions

### Immediate Improvements
1.  **Fix Proxy/CORS:** Permanently resolve the "http proxy error" by installing `cors` on the backend and pointing the frontend directly to the backend port (3001).
2.  **Smart Session Titles:** Implement a background AI task to auto-summarize the first few exchanges of a conversation into a short, meaningful title (e.g., "Q3 Marketing Plan") instead of truncating the first message.

### Feature Roadmap
3.  **Streaming Responses:** Refactor the API to support streaming (Server-Sent Events or Chunked Transfer) so AI responses appear character-by-character, improving perceived performance.
4.  **Enhanced Persistence:** Migrate from JSON files to a lightweight database (SQLite) for better scalability and querying capabilities as history grows.
5.  **Visual Editing:** Allow users to *edit* the generated Mermaid diagrams (text-based) directly in the UI to refine the strategy maps.

---

## 🛠️ How to Run

1.  **Start:** Run `npm run dev` from the project root.
2.  **Access:** Open `http://localhost:5173` (or your network IP).
3.  **Test:**
    *   Chat: "Create a flowchart for a coffee shop business."
    *   Download: Click "Download PNG" on the result.
    *   History: Check the bottom panel for the session log.
