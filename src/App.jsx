import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import EditorLayout from './components/EditorLayout';
import './index.css';


function App() {
  const [currentPage, setCurrentPage] = useState(() => {
    const savedTabs = localStorage.getItem('md-studio-tabs');
    try {
      return (savedTabs && JSON.parse(savedTabs).length > 0) ? 'editor' : 'landing';
    } catch {
      return 'landing';
    }
  });
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');

    useEffect(() => {
            const cached = localStorage.getItem(`editor-cache-content`);
            if (cached) {
                setFileContent(cached);
                setFileName("Download.md");
                setCurrentPage('editor');
            }
    }, []);

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
