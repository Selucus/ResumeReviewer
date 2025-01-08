import React, { useEffect, useRef, useState } from 'react';
import { ParsedPdfContent } from '../../utils/pdfParser';
import { ResumeAnalysis } from '../../types/ResumeAnalysis';
import * as pdfjsLib from 'pdfjs-dist';

interface Props {
  pdfContent: ParsedPdfContent;
  analysis: ResumeAnalysis;
}

export const ResumeViewer: React.FC<Props> = ({ pdfContent, analysis }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [scale] = useState(1.5);
  const [viewport, setViewport] = useState<{ width: number; height: number; }>({ width: 0, height: 0 });

  useEffect(() => {
    console.log('PDF Items:', pdfContent.items);
    console.log('Analysis:', analysis);
  }, [pdfContent, analysis]);

  useEffect(() => {
    const renderPdf = async () => {
      if (!canvasRef.current || !overlayRef.current) return;

      try {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const binaryData = atob(pdfContent.rawPdfData);
        const length = binaryData.length;
        const bytes = new Uint8Array(length);
        for (let i = 0; i < length; i++) {
          bytes[i] = binaryData.charCodeAt(i);
        }

        const loadingTask = pdfjsLib.getDocument(bytes);
        const pdfDoc = await loadingTask.promise;
        const page = await pdfDoc.getPage(1);
        
        const pdfViewport = page.getViewport({ scale });
        setViewport(pdfViewport);
        
        canvas.width = pdfViewport.width;
        canvas.height = pdfViewport.height;

        await page.render({
          canvasContext: ctx,
          viewport: pdfViewport,
        }).promise;

        overlayRef.current.style.width = `${pdfViewport.width}px`;
        overlayRef.current.style.height = `${pdfViewport.height}px`;
      } catch (error) {
        console.error('Error rendering PDF:', error);
      }
    };

    renderPdf();
  }, [pdfContent, scale]);

  const getIssuesForText = (text: string) => {
    const issues: { type: 'formatting' | 'clarity' | 'grammar'; message: string; }[] = [];
    
    const checkIssues = (issueList: string[], type: 'formatting' | 'clarity' | 'grammar') => {
      // Special handling for formatting issues
      if (type === 'formatting') {
        // Check for bullet point formatting
        if (text.trim().startsWith('•') || text.trim().startsWith('-')) {
          const relevantIssue = issueList.find(issue => 
            issue.toLowerCase().includes('bullet point'));
          if (relevantIssue) {
            issues.push({ type, message: relevantIssue });
            return;
          }
        }
      }

      // Regular issue checking
      const relevantIssue = issueList.find(issue => {
        const textWords = text.toLowerCase().trim().split(/\s+/);
        const issueWords = issue.toLowerCase().trim().split(/\s+/);
        
        return textWords.some(textWord => 
          issueWords.some(issueWord => 
            textWord === issueWord || 
            (textWord.length > 4 && (textWord.includes(issueWord) || issueWord.includes(textWord)))
          )
        );
      });

      if (relevantIssue) {
        issues.push({ type, message: relevantIssue });
      }
    };

    checkIssues(analysis.formatting, 'formatting');
    checkIssues(analysis.clarity, 'clarity');
    checkIssues(analysis.grammar, 'grammar');

    return issues.length > 0 ? [issues[0]] : [];
  };

  return (
    <div className="relative border rounded-lg shadow-lg overflow-auto bg-white p-4">
      <div className="relative">
        <canvas ref={canvasRef} className="bg-white" />
        <div
          ref={overlayRef}
          className="absolute top-0 left-0"
          style={{ 
            position: 'absolute',
            width: viewport.width,
            height: viewport.height,
            pointerEvents: 'none'
          }}
        >
          {pdfContent.items.map((item, index) => {
            const issues = getIssuesForText(item.str);
            if (issues.length === 0) return null;

            return (
              <div
                key={index}
                className="absolute group"
                style={{
                  position: 'absolute',
                  left: `${item.x * scale}px`,
                  top: `${(item.y - item.height) * scale}px`,
                  width: `${item.width * scale}px`,
                  height: `${item.height * scale}px`,
                  pointerEvents: 'auto',
                  background: getHighlightColor(issues[0].type),
                  borderRadius: '2px',
                  cursor: 'help',
                  zIndex: 10
                }}
              >
                <div className="invisible group-hover:visible absolute z-20 w-64 p-2 
                  text-sm bg-white border rounded-lg shadow-lg text-gray-800 
                  transform -translate-x-1/2 left-1/2 bottom-full mb-1"
                >
                  <div className="mb-2">
                    <span className={`font-semibold ${getTextColor(issues[0].type)}`}>
                      {capitalizeFirst(issues[0].type)} Issue:
                    </span>
                    <p className="mt-1">{issues[0].message}</p>
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
                    <div className="border-8 border-transparent border-t-white"></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function getHighlightColor(type: 'formatting' | 'clarity' | 'grammar'): string {
  switch (type) {
    case 'formatting':
      return 'rgba(252, 165, 165, 0.3)'; // red-300 with opacity
    case 'clarity':
      return 'rgba(251, 191, 36, 0.3)'; // amber-400 with opacity
    case 'grammar':
      return 'rgba(147, 197, 253, 0.3)'; // blue-300 with opacity
    default:
      return 'transparent';
  }
}

function getTextColor(type: 'formatting' | 'clarity' | 'grammar'): string {
  switch (type) {
    case 'formatting':
      return 'text-red-600';
    case 'clarity':
      return 'text-amber-600';
    case 'grammar':
      return 'text-blue-600';
    default:
      return 'text-gray-900';
  }
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
} 