import React, { useRef } from 'react';
import { Upload, FilePlus } from 'lucide-react';
import './LandingPage.css';

const LandingPage = ({ onUpload, onNew }) => {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (!file.name.endsWith('.md')) {
                alert('Please upload a .md file');
                return;
            }
            const reader = new FileReader();
            reader.onload = (event) => {
                onUpload(event.target.result, file.name);
            };
            reader.readAsText(file);
        }
    };

    const triggerUpload = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="landing-container">
            <h1 className="landing-title">Markdown Studio</h1>
            <p className="landing-subtitle">
                A professional, distraction-free Markdown editor with instant PDF export.
                Everything you need to write and publish.
            </p>

            <div className="landing-actions">
                <div className="action-card" onClick={triggerUpload}>
                    <Upload size={48} className="action-icon" />
                    <span className="action-text">Upload .md File</span>
                    <span className="action-sub">Load from your computer</span>
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
