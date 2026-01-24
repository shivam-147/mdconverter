import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    suppressErrorRendering: true,
    themeVariables: {
        darkMode: false,
        background: '#ffffff', // To match BC of pdf I put it white, will be change to dynamic in future
    },
});

const MermaidDiagram = ({ data }) => {
    const [svg, setSvg] = useState('');
    const [error, setError] = useState(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const renderDiagram = async () => {
            if (!data || data === 'undefined' || data === 'null') return;

            try {
                // Try to parse first to catch syntax errors without rendering diagram
                await mermaid.parse(data);

                // Generate a unique ID for each diagram to prevent DOM conflicts during rendering
                const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;

                // The first argument is the ID of the element 
                // The second argument is the mermaid syntax code
                const { svg } = await mermaid.render(id, data);

                setSvg(svg);
                setError(null);
            } catch (err) {
                console.error('Mermaid rendering error:', err);
                setError('Failed to render diagram. Please check your syntax.');
                setSvg('');
            }
        };

        renderDiagram();
    }, [data]);

    return (
        <div className="mermaid-container my-4 overflow-x-auto text-center" ref={containerRef}>
            {error ? (
                <div className="text-left border border-red-200 rounded p-4 bg-red-50">
                    <p className="text-red-600 font-semibold mb-2">{error}</p>
                    <pre className="font-mono text-xs bg-white p-2 rounded border border-gray-200 overflow-x-auto text-gray-700">
                        {data}
                    </pre>
                </div>
            ) : (
                <div dangerouslySetInnerHTML={{ __html: svg }} />
            )}
        </div>
    );
};

export default MermaidDiagram;
