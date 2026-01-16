import React, { useRef, useState, useEffect } from 'react';
import { Upload, FilePlus } from 'lucide-react';
import './LandingPage.css';
import logo from '../assets/logo.png';

const LandingPage = ({ onUpload, onNew }) => {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);

    const processFile = (file) => {
        if (file && file.name.endsWith('.md')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                onUpload(event.target.result, file.name);
            };
            reader.readAsText(file);
        } else {
            alert('Please upload a .md file');
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };

    // Global Paste Support
    useEffect(() => {
        const handlePaste = (e) => {
            const items = (e.clipboardData || e.originalEvent.clipboardData).items;
            for (const item of items) {
                if (item.kind === 'file' && item.type.includes('markdown') || item.type === 'text/plain') {
                    const file = item.getAsFile();
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            onUpload(event.target.result, file.name || 'pasted-content.md');
                        };
                        reader.readAsText(file);
                        return;
                    }
                }
                if (item.kind === 'string' && item.type === 'text/plain') {
                    item.getAsString((text) => {
                        onUpload(text, 'pasted-content.md');
                    });
                    return;
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [onUpload]);

    const triggerUpload = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="landing-container">
            <img src={logo} alt="Markdown Studio Logo" className="landing-logo" />
            <h1 className="landing-title">Markdown Studio</h1>
            <p className="landing-subtitle">
                A professional, distraction-free Markdown editor with instant PDF export.
                Everything you need to write and publish.
            </p>

            <div className="landing-actions">
                <div
                    className={`action-card ${isDragging ? 'dragging' : ''}`}
                    onClick={triggerUpload}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <Upload size={48} className="action-icon" />
                    <span className="action-text">Upload .md File</span>
                    <span className="action-sub">Drag & drop or Click to upload</span>
                </div>

                <div className="action-card" onClick={onNew}>
                    <FilePlus size={48} className="action-icon" />
                    <span className="action-text">Open Empty Editor</span>
                    <span className="action-sub">Start writing from scratch</span>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".md"
                className="hidden-input"
            />
        </div>
    );
};

export default LandingPage;
