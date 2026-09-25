# Personal Library

An elegant, offline-first universal book reader and personal bookshelf. Turn ChatGPT conversations, Claude chats, Markdown files, or textbooks into an interactive reading experience with syntax highlighting, automatic table of contents, reading progress tracking, and full book export.

Designed for complete offline independence — clone the repository, run it locally, and start reading without external accounts, tracking, or cloud dependencies.

---

## ✨ Features

- **Universal Book & Topic Support**: Read software engineering curricula, biology, medicine, literature, or notes. Section classification adapts dynamically to any subject.
- **Multi-Provider Shared URL Ingestion**:
  - **ChatGPT**: Paste any public ChatGPT shared conversation link to turn long multi-turn lessons into an organized book.
  - **Claude**: Ingest Claude shared links directly or via simple paste.
  - **Markdown & Web URLs**: Import direct `.md` files, GitHub raw files, or paste raw Markdown.
- **Multilingual & Native Devanagari**: Full font stacks and resilient parser support for English, Hindi, Nepali, and Unicode numerals/scripts (`०-९`, `अध्याय`, `पाठ`).
- **Interactive Reading Experience**:
  - Automatic headings detection with an interactive **On This Page** Table of Contents.
  - Reader toolbar that remains available while scrolling, with the progress line directly below it.
  - Custom font family (`Sans`, `Serif`), font sizing, reading width, and five appearance choices: Dark, Light, Paper, Coded Paper, and Image Paper. The two new paper options place selectable text and syntax-highlighted code over a cool paper surface; Image Paper uses an optimized photograph.
  - Syntax highlighting with one-click code copying for Java, Python, TypeScript, Rust, Go, SQL, and more.
- **Bookshelf Dashboard**:
  - **Spotlight Hero Card**: Seamlessly resume reading your active book with progress stats and quick chapter jump links.
  - Tactile physical book covers with category tags, custom book indicators, and search filter.
- **Book Export**:
  - Export any book with one click as a **single Markdown document (`.md`)** with a complete Table of Contents.
  - Export as structured **JSON (`.json`)** for backup or external tool ingestion.
- **100% Offline & Private**:
  - Client-side **IndexedDB** two-tier storage for instantaneous loading.
  - All reading progress, scroll anchors, and bookmarks stay private on your machine.
- **Keyboard Navigation**:
  - `⌘K` or `Ctrl+K`: Global Command Palette to search books, jump to chapters, toggle themes, or export.
  - `Alt + ←` / `Alt + →`: Jump between previous and next chapters instantly.
  - The reader's **Full screen** button enters app-controlled fullscreen; press `Esc` to exit. Chrome's own `F11` fullscreen is controlled by Chrome (`F11` or hold `Esc` to exit).

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v20.19+ or v22.12+ for Vite 8)
- `npm` or `bun`

### Installation
```bash
# Clone the repository
git clone https://github.com/letapicode/personal-library.git
cd personal-library

# Install dependencies
npm install

# Start the local reader
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

On this Windows checkout, `Win + R` → `Run Das Library` uses `run-library.cmd` in the project folder. It checks whether this checkout is already serving port 3000, starts it only when needed, and opens the browser after Vite is ready. Port 3000 is required; another application on that port produces an error rather than switching to 3001.

The Real Paper texture assets are committed with the app, so the original download is not needed to run it. To regenerate them, install Pillow and NumPy and run `python scripts/prepare-real-paper-assets.py --reference "path/to/blank-paper.png"`. The generated variant is built independently of the supplied image.

When a server is already running, the launcher opens a tab and its brief window closes; the server keeps running. When it starts a new server, the launcher window stays open. Press `Ctrl+C` in that window to stop it. Closing the browser tab does not stop the server. You can also run `stop-library.cmd` from this folder to stop this checkout's server on port 3000. The tab opens in whichever browser Windows has set as its default; choose Chrome in Windows Default apps if you want Chrome every time.

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite local development server on port 3000 |
| `npm run run-library` | Convenience alias to start the library server |
| `npm run build` | Compiles and optimizes assets into `dist/` |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |

---

## 🔒 Security & Privacy

- **Safe Content Rendering**: Markdown is rendered without raw HTML injection (`rehype-raw` is omitted). External links enforce `rel="noopener noreferrer"` and sanitize against `javascript:` URIs.
- **Path Traversal Protection**: Static course serving is restricted to the dedicated `course-data/` root directory.
- **SSRF Defense**: Remote URL fetchers reject local hostnames (`localhost`, `127.0.0.1`, `::1`), RFC 1918 private IPv4 subnets, and cloud metadata services (`169.254.169.254`).
- **Content Security Policy (CSP)**: Pinned CSP in `index.html` blocks unauthorized script domains and frames.

---

## 📁 Repository Structure

```text
├── course-data/              # Seed curriculum (course.json and lesson markdown files)
├── server/
│   └── urlImporter.ts        # Server-side multi-provider URL ingestion (ChatGPT, Claude, raw)
├── src/
│   ├── components/
│   │   ├── Bookshelf/        # Bookshelf dashboard, Spotlight hero, and add modal
│   │   ├── CommandPalette/   # Global ⌘K / Ctrl+K keyboard palette
│   │   ├── ExportBookModal/  # Markdown and JSON book exporter modal
│   │   ├── LessonReader/     # Distraction-free reading environment
│   │   ├── LessonTableOfContents/ # Scrollspy on-page TOC
│   │   └── MarkdownRenderer/ # AST text extractor, syntax highlighter, and sanitized render
│   ├── parser/               # Multi-topic and Devanagari lesson parser
│   ├── storage/              # IndexedDB two-tier client storage and manifest
│   └── types/                # TypeScript interfaces and manifest types
├── vite.config.ts            # Vite build configuration and secure proxy API
└── package.json
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
