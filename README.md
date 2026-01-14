# Subtitle Rule Checker (Sub Checker)

A web-based tool for validating and correcting subtitle files (SRT) based on custom regex rules. This tool allows subtitle editors to ensure consistency and quality by automatically detecting errors and applying bulk corrections.

## Features

- **File Upload**: Support for `.srt` subtitle files (with automatic encoding detection).
- **Custom Rules**: Define regex-based rules with pattern matching and optional replacement suggestions.
- **Analysis Engine**: highlights matched errors directly in the subtitle text.
- **3-Column Editor**:
  - **Text (Analyzed)**: Original text with color-coded error highlighting.
  - **Accept**: Quickly apply suggestions to the "Edited" column.
  - **Edited**: Final editable text area for the corrected subtitle.
- **Smart Highlighting**: Highlights persist in the "Text" column even after corrections are accepted, preserving context.
- **Row Shading**: Visual indicators (orange background) for rows with errors.
- **Browser Persistence**: Rules are saved locally in the browser.
- **Export**: Download the corrected subtitles as a valid `.srt` file.

## Tech Stack

### Frontend
- **React**: UI library
- **Vite**: Build tool
- **TailwindCSS**: Styling framework
- **Lucide React**: Icons

### Backend
- **FastAPI**: Python web framework
- **Uvicorn**: ASGI server
- **pysrt**: Subtitle parsing library
- **chardet**: Encoding detection

## Getting Started

### Prerequisites
- Node.js (v20+)
- Python (v3.8+)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/pizzicatomania/sub_checker.git
   cd sub_checker
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   The backend API will be available at `http://localhost:8000`.

3. **Frontend Setup**
      (Open a new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   The application will run at `http://localhost:5173`.

## Usage

1. Open `http://localhost:5173` in your browser.
2. Use the **Rule Manager** (sidebar) to add regex patterns (e.g., Pattern: `teh`, Suggestion: `the`).
3. Click **Import** to upload an `.srt` file.
4. Click **Run Check** to analyze the subtitles.
5. Review errors in the editor:
   - Hover over yellow highlights to see suggestions.
   - Click **Accept** to apply suggestions.
   - Manually edit the "Edited" text if needed.
6. Click **Export** to download the corrected file.

## License

MIT
