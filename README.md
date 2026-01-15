# Markdown Studio

A free, modern, and privacy-focused Markdown editor with professional PDF export capabilities. Built with React and Vite.

## Features

- **Landing Page**: Clean, glassmorphic interface to start your session.
- **Dual Pane Editor**:
  - **Left**: Distraction-free Markdown editor with syntax highlighting support.
  - **Right**: Real-time GitHub-flavored Markdown preview.
- **Resizable Layout**: Drag to adjust the workspace to your preference.
- **PDF Export**: One-click professional A4 PDF export with clean margins and no watermarks.
- **File Management**: `Upload` existing .md files and `Download` your work locally.
- **Privacy First**: All processing happens 100% in your browser. No data is sent to any server.
- **Mobile Friendly**: Responsive design with toggleable editor/preview modes.

## Tech Stack

- **Framework**: React + Vite
- **Styling**: Vanilla CSS (CSS Modules approach) + Glassmorphism
- **Icons**: Lucide React
- **Markdown Engine**: React Markdown + Remark GFM
- **Syntax Highlighting**: React Syntax Highlighter (Prism)

## Getting Started

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Start Development Server**:
    ```bash
    npm run dev
    ```

3.  **Build for Production**:
    ```bash
    npm run build
    ```

## Usage

- **Upload**: Click "Upload .md File" to edit an existing document.
- **New**: Click "Open Empty Editor" to start from scratch.
- **Print/PDF**: Click the "Print / PDF" button in the toolbar. This uses your browser's native print engine. Select "Save as PDF" in the print dialog.
  - *Note*: The print layout is optimized for A4 paper size.
- **Download**: Save your work as a `.md` file.

## License

MIT
