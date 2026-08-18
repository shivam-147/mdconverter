import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Download, Printer, ArrowLeft, Eye, Edit2, Plus, X, Upload } from 'lucide-react';
import Editor from '@monaco-editor/react';
import Select, { components } from 'react-select';
import logo from '../assets/logo.png';
import 'github-markdown-css/github-markdown-light.css';
import './EditorLayout.css';
import MermaidDiagram from './MermaidDiagram';

const { Option } = components;

const CustomOption = (props) => {
    const { label, value } = props.data;
    
    useEffect(() => {
        if (label && !['Inter', 'Roboto', 'Open Sans', 'Georgia', 'Fira Code', 'System Mono'].includes(label)) {
            const fontId = `font-preview-${label.replace(/\s+/g, '-')}`;
            if (!document.getElementById(fontId)) {
                const link = document.createElement('link');
                link.id = fontId;
                link.rel = 'stylesheet';
                link.href = `https://fonts.googleapis.com/css2?family=${label.replace(/\s+/g, '+')}&text=${encodeURIComponent(label)}&display=swap`;
                document.head.appendChild(link);
            }
        }
    }, [label]);

    return (
        <Option {...props}>
            <span style={{ fontFamily: value }}>{label}</span>
        </Option>
    );
};

const EditorLayout = ({ initialContent, initialFileName, onBack }) => {
    const [tabs, setTabs] = useState(() => {
        const saved = localStorage.getItem('md-studio-tabs');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && parsed.length > 0) {
                    // Strip .md from saved tab names if any exist
                    return parsed.map(tab => ({
                        ...tab,
                        name: tab.name.replace(/\.md$/, '')
                    }));
                }
            } catch (e) {
                console.error("Failed to parse saved tabs", e);
            }
        }
        return [
            {
                id: 'tab-1',
                name: (initialFileName || 'untitled.md').replace(/\.md$/, ''),
                content: initialContent || ''
            }
        ];
    });

    const [activeTabId, setActiveTabId] = useState(() => {
        const savedActive = localStorage.getItem('md-studio-active-tab');
        if (savedActive && tabs.some(tab => tab.id === savedActive)) {
            return savedActive;
        }
        return tabs[0]?.id || 'tab-1';
    });

    const [editingTabId, setEditingTabId] = useState(null);

    // Save tabs to localStorage on change
    useEffect(() => {
        localStorage.setItem('md-studio-tabs', JSON.stringify(tabs));
    }, [tabs]);

    // Save active tab ID to localStorage on change
    useEffect(() => {
        localStorage.setItem('md-studio-active-tab', activeTabId);
    }, [activeTabId]);
    
    const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];

    const fileInputRef = useRef(null);
    const [editorWidth, setEditorWidth] = useState(50); // percentage
    const [isResizing, setIsResizing] = useState(false);
    const [mobileView, setMobileView] = useState('editor'); // 'editor' | 'preview'
    const [editorFontSize, setEditorFontSize] = useState(14);
    const [selectedFont, setSelectedFont] = useState({ label: 'Inter', value: 'Inter, sans-serif' });
    const [fontOptions, setFontOptions] = useState([]);

    // Fetch Google Fonts
    useEffect(() => {
        const fetchFonts = async () => {
            try {
                const response = await fetch('https://raw.githubusercontent.com/jonathantneal/google-fonts-complete/master/google-fonts.json');
                const data = await response.json();

                // Curated list of popular, high-quality Google Fonts to avoid locking the UI thread
                const popularFonts = [
                    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald', 
                    'Source Sans Pro', 'Playfair Display', 'Merriweather', 'Noto Sans', 
                    'Poppins', 'Lora', 'Quicksand', 'Nunito', 'Pacifico', 'Caveat', 
                    'Abril Fatface', 'Crimson Text', 'Fira Sans', 'Work Sans', 'Ubuntu', 
                    'PT Sans', 'PT Serif', 'Raleway', 'Dancing Script', 'Josefin Sans', 
                    'Arvo', 'Bree Serif', 'Comfortaa', 'Questrial', 'Archivo', 'Asap', 
                    'Exo 2', 'Inconsolata', 'Maven Pro', 'Cabin', 'Bitter', 'Dosis', 
                    'Fjalla One', 'Libre Baskerville', 'Libre Franklin', 'Rubik', 'Teko'
                ];

                const googleFonts = Object.keys(data)
                    .filter(fontName => popularFonts.includes(fontName))
                    .map(fontName => ({
                        label: fontName,
                        value: `"${fontName}", sans-serif`
                    }));

                const combined = [...fontOptions];
                googleFonts.forEach(gf => {
                    if (!combined.find(f => f.label === gf.label)) {
                        combined.push(gf);
                    }
                });
                setFontOptions(combined);
            } catch (error) {
                console.error('Failed to fetch Google Fonts:', error);
            }
        };
        fetchFonts();
    }, []);

    // Load Font Dynamically
    useEffect(() => {
        if (selectedFont.label && !['Inter', 'Roboto', 'Open Sans', 'Georgia', 'Fira Code', 'System Mono'].includes(selectedFont.label)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = `https://fonts.googleapis.com/css2?family=${selectedFont.label.replace(/\s+/g, '+')}&display=swap`;
            document.head.appendChild(link);
            return () => {
                // We keep it loaded for simplicity and to avoid flickering if reselected
            };
        }
    }, [selectedFont]);

    // Load cached content if no initial content is provided
    useEffect(() => {
        if (!initialContent) {
            const cached = localStorage.getItem(`editor-cache-content`);
            if (cached) {
                setMarkdown(cached);
            }
        }
    }, [initialContent]);

    // Cache content on change
    useEffect(() => {
        const timeout = setTimeout(() => {
            localStorage.setItem('editor-cache-content', markdown);
        }, 500);

        return () => clearTimeout(timeout);
    }, [markdown]);

    const containerRef = useRef(null);

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

    // Creating editor reference and idb to handle paste events
    const editorRef = useRef(null);

    const handleImgPaste = async (event) => {
        if (!editorRef.current || !editorRef.current.hasTextFocus()) return;
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find((item) => item.type.startsWith('image/'));
        if (!imageItem) return;
        event.preventDefault();
        const file = imageItem.getAsFile();
        if (!file) return;
        const id = `img-${Date.now()}`;
        const url = `${IMAGE_URL_PREFIX}${id}`;

        // Store image in IndexedDB
        const db = await imageDbPromise;
        await db.put(IMAGE_STORE_NAME, { id, file });

        // Insert markdown image syntax at cursor position
        const editor = editorRef.current;
        const position = editor.getPosition();
        const markdownImageSyntax = `![${file.name}](${url})`;
        editor.executeEdits(null, [
            {
                range: {
                    startLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endLineNumber: position.lineNumber,
                    endColumn: position.column,
                },
                text: markdownImageSyntax,
                forceMoveMarkers: true,
            },
        ]);
    };

    useEffect(() => {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        window.addEventListener('paste', handleImgPaste, true);
        return () => {
            window.removeEventListener('mousemove', resize);
            window.removeEventListener('mouseup', stopResizing);
            window.removeEventListener('paste', handleImgPaste, true);
        };
    }, [resize, stopResizing]);

    // Handle Download
    const handleDownload = () => {
        if (!activeTab) return;
        const element = document.createElement('a');
        const file = new Blob([activeTab.content], { type: 'text/markdown' });
        element.href = URL.createObjectURL(file);
        element.download = activeTab.name.endsWith('.md') ? activeTab.name : `${activeTab.name}.md`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };
    const increaseFontSize = () => {
        setEditorFontSize((size) => Math.min(size + 1, 48));
    };

    const decreaseFontSize = () => {
        setEditorFontSize((size) => Math.max(size - 1, 8));
    };


    // Handle Print
    const handlePrint = () => {
        const printContent = document.querySelector('.preview-content');
        if (!printContent) return;

        // Create a hidden iframe for printing
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentWindow.document;

        // Copy all stylesheets from the main document to preserve formatting
        const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
            .map((style) => style.outerHTML)
            .join('');

        iframeDoc.open();
        iframeDoc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>${activeTab.name.replace(/\.md$/, '')}</title>
                    ${styles}
                    <style>
                        @page {
                            size: A4;
                            margin: 20mm 15mm;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            background: white;
                        }
                        .markdown-body {
                            background-color: white !important;
                            color: black !important;
                            width: 100%;
                            padding: 0 10px; /* Slight padding to prevent edge glue */
                            font-family: ${selectedFont.value} !important;
                        }
                    </style>
                </head>
                <body>
                    <div class="markdown-body">
                        ${printContent.innerHTML}
                    </div>
                </body>
            </html>
        `);
        iframeDoc.close();

        // Allow styles to load before printing
        setTimeout(() => {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
            // Clean up the iframe after printing is initiated
            setTimeout(() => {
                document.body.removeChild(iframe);
            }, 1000);
        }, 500);
    };

    const CodeBlock = {
        img: MarkdownImage,
        code({ inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isMermaid = match && match[1] === 'mermaid';

            if (!inline && isMermaid) {
                const content = String(children || '').replace(/\n$/, '');
                return <MermaidDiagram data={content} />;
            }

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

    // Tab Management Functions
    const handleTabContentChange = (value) => {
        setTabs(tabs.map(tab => 
            tab.id === activeTabId ? { ...tab, content: value || '' } : tab
        ));
    };

    const handleTabNameChange = (id, newName) => {
        setTabs(tabs.map(tab => 
            tab.id === id ? { ...tab, name: newName } : tab
        ));
    };

    const addNewTab = () => {
        const newTab = {
            id: Date.now().toString(),
            name: 'untitled',
            content: ''
        };
        setTabs([...tabs, newTab]);
        setActiveTabId(newTab.id);
    };

    const closeTab = (idToClose, e) => {
        if (e) e.stopPropagation(); // Prevent tab selection when clicking X
        
        if (tabs.length === 1) {
            onBack();
            return;
        }

        const newTabs = tabs.filter(tab => tab.id !== idToClose);
        setTabs(newTabs);

        // If active tab is closed, switch to the last remaining tab
        if (activeTabId === idToClose) {
            setActiveTabId(newTabs[newTabs.length - 1].id);
        }
    };

    const handleCloseOrCancel = (tabId, e) => {
        e.stopPropagation();
        if (editingTabId === tabId) {
            // If editing, close/cancel the edit mode instead of closing the tab
            setEditingTabId(null);
        } else {
            closeTab(tabId, e);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.md')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const newTab = {
                    id: Date.now().toString(),
                    name: file.name.replace(/\.md$/, ''),
                    content: event.target.result
                };
                setTabs([...tabs, newTab]);
                setActiveTabId(newTab.id);
                // Reset input so the same file can be uploaded again if needed
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            };
            reader.readAsText(file);
        } else if (file) {
            alert('Please upload a .md file');
        }
    };

    return (
        <div className="app-container">
            {/* Toolbar */}
            <div className="toolbar">
                <div className="file-info">
                    <button className="btn" onClick={onBack} title="Back to Home">
                        <ArrowLeft size={20} />
                    </button>
                    <img src={logo} alt="Logo" className="toolbar-logo" />
                    <input
                        type="text"
                        className="file-name-input"
                        value={activeTab?.name || ''}
                        onChange={(e) => handleTabNameChange(activeTabId, e.target.value)}
                        placeholder="Filename"
                    />
                </div>

                <div className="toolbar-actions">
                    <div className="font-selector">
                        <Select
                            components={{ Option: CustomOption }}
                            className="font-select-container"
                            classNamePrefix="font-select"
                            value={selectedFont}
                            onChange={setSelectedFont}
                            options={fontOptions}
                            isSearchable={true}
                            placeholder="Search fonts..."
                        />
                    </div>
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

            {/* Tab Bar */}
            <div className="tab-bar">
                {tabs.map((tab) => (
                    <div
                        key={tab.id}
                        className={`tab ${activeTabId === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTabId(tab.id)}
                        onDoubleClick={() => setEditingTabId(tab.id)}
                        title={tab.name}
                    >
                        {editingTabId === tab.id ? (
                            <input
                                autoFocus
                                className="tab-name-input"
                                value={tab.name}
                                onChange={(e) => handleTabNameChange(tab.id, e.target.value)}
                                onBlur={() => setEditingTabId(null)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') setEditingTabId(null);
                                }}
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="tab-name">{tab.name}</span>
                        )}
                        <button 
                            className="tab-close" 
                            onClick={(e) => handleCloseOrCancel(tab.id, e)}
                            title={editingTabId === tab.id ? "Cancel edit" : "Close tab"}
                        >
                            <X size={14} />
                        </button>
                    </div>
                ))}
                <button className="btn tab-add-btn" onClick={addNewTab} title="New File">
                    <Plus size={18} />
                </button>
                <button className="btn tab-add-btn" onClick={handleUploadClick} title="Upload File">
                    <Upload size={18} />
                </button>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".md"
                    style={{ display: 'none' }}
                />
            </div>

            {/* Editor & Preview Area */}
            <div className="editor-body" ref={containerRef}>
                {/* Editor Pane */}
                <div
                    className={`editor-pane ${mobileView === 'preview' ? 'hidden-on-mobile' : ''}`}
                    style={{ width: `${editorWidth}%` }}
                >
                    <div className="flex items-center justify-between mb-2">
                        <div className='flex items-center gap-4'>
                            <button className="btn" onClick={decreaseFontSize} title="Decrease editor text size">
                                A-
                            </button>
                            <div className="text-white">{editorFontSize}px</div>
                            <button className="btn" onClick={increaseFontSize} title="Increase editor text size">
                                A+
                            </button>
                        </div>
                        <div className='flex items-center gap-4'>
                            <button className="btn" onClick={() => setMarkdown('')} title="Clear editor content">
                                <span>Clear all</span>
                                <Delete color="red" />
                            </button>
                        </div>
                    </div>
                    <Editor
                        height="100%"
                        defaultLanguage="markdown"
                        value={activeTab?.content || ''}
                        theme="vs-dark"
                        onChange={handleTabContentChange}
                        loading="Loading Editor..."
                        options={{
                            minimap: { enabled: false },
                            fontSize: editorFontSize,
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
                    <div className="preview-content markdown-body" style={{ fontFamily: selectedFont.value }}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={CodeBlock}
                            urlTransform={(url) => (
                                url.startsWith(IMAGE_URL_PREFIX) ? url : defaultUrlTransform(url)
                            )}
                        >
                            {activeTab?.content || ''}
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
