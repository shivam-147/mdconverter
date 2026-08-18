import React, { useState } from 'react';
import LandingPage from './components/LandingPage';
import EditorLayout from './components/EditorLayout';
import './index.css';


function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const savedTabs = localStorage.getItem('md-studio-tabs');
    try {
      if (savedTabs && JSON.parse(savedTabs).length > 0) {
        return 'editor';
      }
    } catch {
      // Ignore parse errors, fall through to migration check
    }

    // Migration: Convert old single-tab cache to new multi-tab format
    const cached = localStorage.getItem('editor-cache-content');
    if (cached) {
      const initialTabs = [{ id: 'tab-1', name: 'untitled', content: cached }];
      localStorage.setItem('md-studio-tabs', JSON.stringify(initialTabs));
      localStorage.setItem('md-studio-active-tab', 'tab-1');
      localStorage.removeItem('editor-cache-content');
      return 'editor';
    }

    return 'landing';
  });
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');

  const handleUpload = (content, name) => {
    setFileContent(content);
    setFileName(name);
    setCurrentPage('editor');
  };

  const handleNew = () => {
    setFileContent('');
    setFileName('untitled.md');
    setCurrentPage('editor');
  };

  const handleBack = () => {
    if (confirm('Are you sure you want to go back? This will clear your current session.')) {
      localStorage.removeItem('md-studio-tabs');
      localStorage.removeItem('md-studio-active-tab');
      setCurrentPage('landing');
      setFileContent('');
      setFileName('');
    }
  };

  return (
    <div className="app-root">
      {currentPage === 'landing' ? (
        <LandingPage onUpload={handleUpload} onNew={handleNew} />
      ) : (
        <EditorLayout
          initialContent={fileContent}
          initialFileName={fileName}
          onBack={handleBack}
        />
      )}
    </div>
  );
}

export default App;
