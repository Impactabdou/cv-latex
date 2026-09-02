# LaTeX CV Studio — Real-Time Web-Based CV Editor & Generator

A full-stack, real-time LaTeX CV editor and generator inspired by Overleaf. Features split-pane live preview, cascading directory navigation, structured form variable editing, LaTeX compilation engine (`pdflatex`), and full CRUD/cloning file management.

---

## 🚀 Key Features

1. **Cascading Hierarchical Navigation**:
   - Seamlessly navigate: `Domain` ➔ `Subdomain` ➔ `Company` ➔ `Reference Code`.
   - Dynamic tree scanning supporting arbitrary nesting depths.

2. **Split-Pane Real-Time Editor**:
   - **Left Pane**: Live compiled PDF viewer with zoom controls (50% to 250%), Fit Page, Fit Width, New Tab viewer, Download, and LaTeX compilation error overlay.
   - **Right Pane**: Structured accordion variable form with formatting shortcuts (`\textbf{}`, `\emph{}`, `\\[0.15em]`), custom variable generator, **YAML Export/Import tab**, raw `.tex` source editor, and build diagnostics/logs.

3. **YAML Export & Bi-directional Synchronization**:
   - Export any CV's form variables into clean, human-readable `.yaml` files with 1 click.
   - Live editable YAML viewer with syntax formatting, Copy to Clipboard, Download, and "Apply YAML" to push changes directly back into LaTeX and the live PDF preview!

3. **Instant On-The-Fly Compilation**:
   - Changes are auto-saved to backend `.tex` files with intelligent debouncing (380ms) and compiled natively with `pdflatex` in sub-second speed.
   - Built-in MD5 compilation cache to serve unchanged PDFs in < 5ms.

4. **100% Self-Contained Reference Files**:
   - Every `.tex` file in `public/data/latex/domains/...` is self-contained and declares ALL variables required by `main.tex`.
   - Automatic escaping of unescaped special characters (such as `&` ➔ `\&`) to ensure LaTeX compilation robustness.

5. **Reference Cloning & Hierarchy Management**:
   - **New Reference Modal**: Create new references with "Copy from existing reference" feature to duplicate all variables, jobs, and education in one click.
   - **Category Creator**: Create new Domains, Subdomains, or Company folders directly from the UI.
   - **Directory Manager**: Browse, rename, and delete references/folders from the UI.

---

## 📁 File & Directory Architecture

```
├── public/data/latex/
│   ├── main.tex                                    # Core LaTeX template with dynamic \input
│   ├── photos/                                     # Profile photos (photo.jpg)
│   └── domains/                                    # Hierarchical domain storage
│       ├── banks/
│       │   └── corporate/
│       │       └── BNP Paribas/
│       │           └── BNP-9821.tex
│       ├── consulting/
│       │   ├── big4/
│       │   │   ├── Deloitte/
│       │   │   │   ├── R-1099.tex
│       │   │   │   ├── R-7243.tex
│       │   │   │   ├── R-8145.tex
│       │   │   │   └── R-9092.tex
│       │   │   ├── EY/
│       │   │   │   └── 1673731.tex
│       │   │   └── KPMG/
│       │   │       └── ADV02644.tex
│       │   └── specialized/
│       │       └── Wavestone/
│       │           ├── 744000145455239.tex
│       │           ├── 744000145455288.tex
│       │           ├── 744000146454140.tex
│       │           └── 744000146454499.tex
│       └── generic/
│           └── loick.tex
├── server/
│   ├── index.js                                    # Express server & static asset host
│   ├── routes/
│   │   └── api.js                                  # REST endpoints for tree, files, compilation
│   └── services/
│       ├── compilerService.js                      # pdflatex process executor & log parser
│       ├── fileService.js                          # Tree scanner & CRUD operations
│       └── texParser.js                            # LaTeX variable tokenizer & serializer
├── src/
│   ├── App.jsx                                     # Root split-pane workspace
│   ├── components/
│   │   ├── Header.jsx                              # Cascading dropdowns & status toolbar
│   │   ├── PdfViewer.jsx                           # Left pane PDF canvas & zoom toolbar
│   │   ├── FormEditor.jsx                          # Structured variable form with accordions
│   │   ├── RawEditor.jsx                           # Direct LaTeX source code editor
│   │   ├── LogViewer.jsx                           # pdflatex diagnostics & error inspector
│   │   └── Modals/                                 # New reference, clone, and folder dialogs
│   ├── index.css                                   # Custom scrollbars & Tailwind styling
│   └── main.jsx                                    # React entry point
├── package.json
└── vite.config.js
```

---

## 🛠️ Quick Start

### 1. Start in Development Mode (Vite + Express Backend)
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3001`

### 2. Run in Production Mode
```bash
npm run build
npm start
```
App will be served on `http://localhost:3001`.

### 3. Run Automated E2E Tests
```bash
node scripts/test_e2e.js
```

---

## ⚡ Technical Highlights

- **Native Compiler Isolation**: Runs `pdflatex` using isolated job workspaces in `build/latex_cache/` to ensure zero file locks or concurrency conflicts.
- **Log Parsing**: Automatically extracts exact line numbers and context snippets when LaTeX compilation errors occur.
- **Debounced Save & Compile**: React frontend debounces user keystrokes by 380ms before triggering compilation, delivering a smooth Overleaf-like feel.
- **Zero-Flicker PDF Refresh**: Seamless timestamp caching enables real-time visual updates without reloading the whole page.
