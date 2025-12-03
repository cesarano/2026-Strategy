import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import './Mermaid.css';

interface MermaidProps {
  chart: string;
}

mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
  suppressErrorRendering: true, // Prevent mermaid from inserting its own error element
});

export const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const renderChart = async () => {
      if (!containerRef.current) return;

      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
        setError(null);
      } catch (err) {
        console.error('Mermaid rendering error:', err);
        setError('Failed to render diagram. Syntax might be incorrect.');
      }
    };

    if (chart) {
      renderChart();
    }
  }, [chart]);

  const handleDownload = () => {
    if (!containerRef.current) return;
    
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Add a white background to the SVG for better visibility in PNG
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      // Set canvas dimensions based on SVG
      const bbox = svgElement.getBoundingClientRect();
      const scale = 4; // Increase scale for higher resolution (4x)
      canvas.width = bbox.width * scale;
      canvas.height = bbox.height * scale;

      if (ctx) {
        ctx.scale(scale, scale);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width / scale, canvas.height / scale); // Fill rect uses unscaled coords if transform is applied, but here we need to fill the whole canvas.
        // Actually, fillRect is affected by scale. 
        // If we scale(4,4), drawing at 0,0, width, height means logical coords.
        // So we should draw rect at 0,0, bbox.width, bbox.height
        
        // Resetting transform for clear fill logic is safer or just use logic:
        // ctx.fillRect(0, 0, bbox.width, bbox.height);
        
        // Let's check the previous logic: ctx.scale(2, 2); ctx.fillRect(0, 0, canvas.width, canvas.height);
        // canvas.width was 2*w. 
        // If scale is 2, drawing to 2*w is actually drawing to 4*w in physical pixels? No.
        // Canvas API: fillRect(x,y,w,h) uses current transform.
        // If we want to fill the whole canvas (which is 4*w wide):
        // We should draw a rect of width (4*w) / 4 = w.
        
        // Let's simplify: Don't rely on context scale for the background fill to avoid confusion, or just use the logical size.
        
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, bbox.width, bbox.height); 
        
        ctx.drawImage(img, 0, 0);
        
        const pngUrl = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.href = pngUrl;
        downloadLink.download = `strategy-diagram-${Date.now()}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
      }
      URL.revokeObjectURL(url);
    };

    img.src = url;
  };

  if (error) {
    return (
      <div className="mermaid-error">
        <p>{error}</p>
        <pre>{chart}</pre>
      </div>
    );
  }

  return (
    <div className="mermaid-wrapper">
      <div
        ref={containerRef}
        className="mermaid-chart"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {svg && (
        <div className="mermaid-actions">
          <button onClick={handleDownload} className="download-btn" title="Download as PNG">
            ⬇️ Download PNG
          </button>
        </div>
      )}
    </div>
  );
};
