import React, { useState } from 'react';
import { ResumeUploader } from './components/ResumeUploader';
import { JobDescriptionInput } from './components/JobDescriptionInput';
import { AnalysisResults } from './components/AnalysisResults';
import { ResumeAnalysis } from '../types/ResumeAnalysis';
import { parsePdfToText } from '../utils/pdfParser';
import { ResumeAnalyzer } from '../ResumeAnalyzer';
import { ResumeViewer } from './components/ResumeViewer';
import { ParsedPdfContent } from '../utils/pdfParser';

export const App: React.FC = () => {
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUploadedFile, setLastUploadedFile] = useState<File | null>(null);
  const [pdfContent, setPdfContent] = useState<ParsedPdfContent | null>(null);

  const handleFileUpload = async (file: File, jobDescription?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('Processing file:', file.name, 'Size:', file.size);
      const parsedContent = await parsePdfToText(file);
      console.log('PDF parsed successfully');
      setPdfContent(parsedContent);
      
      const analyzer = new ResumeAnalyzer(parsedContent.text);
      const results = await analyzer.analyzeResume(jobDescription);
      console.log('Analysis complete');
      
      setAnalysis(results);
    } catch (err) {
      console.error('Error processing file:', err);
      setError('Error analyzing resume. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobDescription = (jd: string) => {
    if (analysis && lastUploadedFile) {
      handleFileUpload(lastUploadedFile, jd);
    }
  };

  const handleFile = async (file: File) => {
    setLastUploadedFile(file);
    await handleFileUpload(file);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">AI Resume Analyzer</h1>
      
      <div className="grid grid-cols-1 gap-8">
        <ResumeUploader onUpload={handleFile} />
        <JobDescriptionInput onSubmit={handleJobDescription} />
        
        {isLoading && (
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2">Analyzing resume...</p>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        
        {pdfContent && analysis && (
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h2 className="text-lg font-semibold mb-2">Resume Preview</h2>
              <ResumeViewer pdfContent={pdfContent} analysis={analysis} />
            </div>
            <AnalysisResults analysis={analysis} />
          </div>
        )}
      </div>
    </div>
  );
}; 