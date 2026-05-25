import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import EditorLayout from './components/EditorLayout';
import './index.css';


function App() {
  const [currentPage, setCurrentPage] = useState('landing');
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
    // Ideally we should warn user about unsaved changes, but for this MVP we just go back
    if (confirm('Are you sure you want to go back? Unsaved changes will be lost.')) {
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
