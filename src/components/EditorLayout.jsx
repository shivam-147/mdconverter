import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Download, Printer, ArrowLeft, Eye, Edit2, Sun, Moon } from 'lucide-react';
import Editor from '@monaco-editor/react';
import 'github-markdown-css/github-markdown.css';
import './EditorLayout.css';

const EditorLayout = ({ initialContent, initialFileName, onBack }) => {
    const [markdown, setMarkdown] = useState(initialContent || '');
    const [fileName, setFileName] = useState(initialFileName || 'untitled.md');
    const [editorWidth, setEditorWidth] = useState(50); // percentage
    const [isResizing, setIsResizing] = useState(false);
    const [mobileView, setMobileView] = useState('editor'); // 'editor' | 'preview'
    const [theme, setTheme] = useState('vs-dark'); // Monaco theme: 'vs-dark' | 'light'

    const containerRef = useRef(null);

    // Initialize theme based on current session state
    useEffect(() => {
        const currentThemeAttr = document.documentElement.getAttribute('data-theme') || 'dark';
        const monacoTheme = currentThemeAttr === 'light' ? 'light' : 'vs-dark';
        setTheme(monacoTheme);
        // Ensure consistency
        document.documentElement.setAttribute('data-theme', currentThemeAttr);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'vs-dark' ? 'light' : 'vs-dark';
        setTheme(newTheme);
        const cssTheme = newTheme === 'light' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', cssTheme);
    };

    // Handle Resize
    const startResizing = React.useCallback(() => {
        setIsResizing(true);
    }, []);

    const stopResizing = React.useCallback(() => {
        setIsResizing(false);
    }, []);

    const resize = React.useCallback(
        (mouseMoveEvent) => {
            if (isResizing && containerRef.current) {
                const containerRect = containerRef.current.getBoundingClientRect();
                const newWidth = ((mouseMoveEvent.clientX - containerRect.left) / containerRect.width) * 100;
                if (newWidth > 20 && newWidth < 80) {
                    setEditorWidth(newWidth);
                }
            }
        },
        [isResizing]
    );

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
        };
    }, [resize, stopResizing]);

    // Handle Download
    const handleDownload = () => {
        const element = document.createElement('a');
        const file = new Blob([markdown], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = fileName.endsWith('.md') ? fileName : `${fileName}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    // Handle Print
    const handlePrint = () => {
        window.print();
    };

    const CodeBlock = {
        code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
                <SyntaxHighlighter
                    style={tomorrow}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                >
                    {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
            ) : (
                <code className={className} {...props}>
                    {children}
                </code>
            );
        },
    };

    return (
        <div className="app-container">
            {/* Toolbar */}
            <div className="toolbar">
                <div className="file-info">
                    <button className="btn" onClick={onBack} title="Back to Home">
                        <ArrowLeft size={20} />
                    </button>
                    <input
                        type="text"
                        className="file-name-input"
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        placeholder="Filename"
                    />
                </div>

                <div className="toolbar-actions">
                    <button className="btn" onClick={toggleTheme} title="Toggle Theme">
                        {theme === 'vs-dark' ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                    <button className="btn" onClick={handleDownload}>
                        <Download size={20} />
                        <span>Download</span>
                    </button>
                    <button className="btn btn-primary" onClick={handlePrint}>
                        <Printer size={20} />
                        <span>Print / PDF</span>
                    </button>
                </div>
            </div>

            {/* Editor & Preview Area */}
            <div className="editor-body" ref={containerRef}>
                {/* Editor Pane */}
                <div
                    className={`editor-pane ${mobileView === 'preview' ? 'hidden-on-mobile' : ''}`}
                    style={{ width: `${editorWidth}%` }}
                >
                    <Editor
                        height="100%"
                        defaultLanguage="markdown"
                        value={markdown}
                        theme={theme}
                        onChange={(value) => setMarkdown(value || '')}
                        loading="Loading Editor..."
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            wordWrap: 'on',
                            lineNumbers: 'on',
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            padding: { top: 16, bottom: 16 },
                            fontFamily: 'Fira Code, monospace',
                        }}
                    />
                </div>

                {/* Resizer */}
                <div
                    className={`resizer ${isResizing ? 'resizing' : ''}`}
                    onMouseDown={startResizing}
                >
                    <div className="resizer-handle" />
                </div>

                {/* Preview Pane */}
                <div
                    className={`preview-pane preview-pane-print ${mobileView === 'editor' ? 'hidden-on-mobile' : ''}`}
                    style={{ width: `${100 - editorWidth}%` }}
                >
                    <div className="preview-content markdown-body">
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={CodeBlock}
                        >
                            {markdown}
                        </ReactMarkdown>
                    </div>
                </div>
            </div>

            {/* Mobile Toggle */}
            <div className="mobile-nav">
                <button
                    className={`btn ${mobileView === 'editor' ? 'btn-primary' : ''}`}
                    onClick={() => setMobileView('editor')}
                >
                    <Edit2 size={18} /> Editor
                </button>
                <button
                    className={`btn ${mobileView === 'preview' ? 'btn-primary' : ''}`}
                    onClick={() => setMobileView('preview')}
                >
                    <Eye size={18} /> Preview
                </button>
            </div>
        </div>
    );
};

export default EditorLayout;
