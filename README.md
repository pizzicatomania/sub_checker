# Subtitle Rule Checker (Sub Checker)

A web-based tool for validating and correcting subtitle files (SRT) based on custom regex rules. This tool allows subtitle editors to ensure consistency and quality by automatically detecting errors and applying bulk corrections.

## Features

- **File Upload**: Support for `.srt` and `.txt` (Netflix custom format) subtitle files with automatic encoding detection.
- **Google OAuth Authentication**: Secure user authentication with Google accounts.
- **User-Specific Rules**: Each user can manage their own set of custom regex rules stored on the server.
- **Custom Rules**: Define regex-based rules with pattern matching and optional replacement suggestions.
- **Analysis Engine**: Highlights matched errors directly in the subtitle text.
- **3-Column Editor**:
  - **Text (Analyzed)**: Original text with color-coded error highlighting.
  - **Accept**: Quickly apply suggestions to the "Edited" column.
  - **Edited**: Final editable text area for the corrected subtitle.
- **Smart Highlighting**: Highlights persist in the "Text" column even after corrections are accepted, preserving context.
- **Row Shading**: Visual indicators (orange background) for rows with errors.
- **Export**: Download the corrected subtitles in the original format (`.srt` or `.txt`).
- **Persistent Storage**: Database is stored in a Docker volume, so data persists across container restarts.

## Tech Stack

### Frontend
- **React**: UI library
- **Vite**: Build tool
- **TailwindCSS**: Styling framework
- **Lucide React**: Icons
- **@react-oauth/google**: Google OAuth integration
- **Axios**: HTTP client

### Backend
- **FastAPI**: Python web framework
- **Uvicorn**: ASGI server
- **SQLAlchemy**: ORM for database management
- **SQLite**: Database (stored in `backend/data/`)
- **pysrt**: Subtitle parsing library
- **chardet**: Encoding detection
- **google-auth**: Google OAuth token verification
- **python-dotenv**: Environment variable management

### Infrastructure
- **Docker Compose**: Container orchestration
- **Caddy**: Reverse proxy with automatic HTTPS

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Google OAuth Client ID (for authentication)

### Environment Setup

1. **Create a `.env` file** in the project root:
   ```bash
   GOOGLE_CLIENT_ID=your-google-client-id-here
   ```

2. **Get Google OAuth Client ID**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized JavaScript origins: `http://localhost:5173` (for development) and `https://your-domain.com` (for production)
   - Copy the Client ID to your `.env` file

### Installation

#### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/pizzicatomania/sub_checker.git
   cd sub_checker
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env  # If you have an example file
   # Edit .env and add your GOOGLE_CLIENT_ID
   ```

3. **Start all services**
   ```bash
   docker compose up -d --build
   ```

4. **Access the application**
   - Development: `http://localhost:5173` (if running locally)
   - Production: Configure your domain in `Caddyfile` and access via your domain

#### Manual Setup (Development)

1. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   The backend API will be available at `http://localhost:8000`.

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   # Set VITE_GOOGLE_CLIENT_ID in .env or export it
   npm run dev
   ```
   The application will run at `http://localhost:5173`.

## Production Deployment

### Using Docker Compose with Caddy

1. **Configure Caddyfile**
   - Update `Caddyfile` with your domain name
   - Caddy will automatically obtain SSL certificates

2. **Set environment variables**
   ```bash
   export GOOGLE_CLIENT_ID=your-client-id
   ```

3. **Start services**
   ```bash
   docker compose up -d --build
   ```

4. **Check logs**
   ```bash
   docker compose logs -f
   ```

### Data Persistence

- Database files are stored in `backend/data/` directory (mounted as Docker volume)
- Data persists across container restarts
- Backup: Simply copy the `backend/data/` directory

## Usage

1. Open the application in your browser.
2. **Sign in** with your Google account.
3. Use the **Rule Manager** (sidebar) to add regex patterns (e.g., Pattern: `teh`, Suggestion: `the`).
   - Rules are saved per user on the server
4. Click **Import** to upload an `.srt` or `.txt` file.
5. Click **Run Check** to analyze the subtitles.
6. Review errors in the editor:
   - Hover over yellow highlights to see suggestions.
   - Click **Accept** to apply suggestions.
   - Manually edit the "Edited" text if needed.
7. Click **Export** to download the corrected file.

## API Endpoints

### Authentication
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/me` - Get current user info

### Rules (Requires Authentication)
- `GET /api/rules` - Get user's rules
- `POST /api/rules` - Create a new rule
- `PUT /api/rules/{rule_id}` - Update a rule
- `DELETE /api/rules/{rule_id}` - Delete a rule

### File Operations
- `POST /api/parse` - Parse subtitle file
- `POST /api/analyze` - Analyze subtitles with rules
- `POST /api/export` - Export corrected subtitles

## Troubleshooting

### 502 Bad Gateway
- Check if backend service is running: `docker compose ps backend`
- Check backend logs: `docker compose logs backend`
- Restart backend: `docker compose restart backend`

### Database Issues
- Database is stored in `backend/data/sub_checker.db`
- Ensure the `backend/data/` directory exists and has proper permissions
- If data is lost, check if the volume is properly mounted

### CORS Errors
- Ensure `ALLOWED_ORIGINS` environment variable includes your domain
- Check Caddyfile configuration for proper reverse proxy setup

## License

MIT
