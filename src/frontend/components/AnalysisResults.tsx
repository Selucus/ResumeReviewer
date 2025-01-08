import React from 'react';
import { ResumeAnalysis } from '../../types/ResumeAnalysis';

interface Props {
  analysis: ResumeAnalysis;
}

export const AnalysisResults: React.FC<Props> = ({ analysis }) => {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Analysis Results</h2>
      
      <div className="space-y-6">
        {analysis.formatting.length > 0 && (
          <section>
            <h3 className="font-medium text-lg">Formatting Issues</h3>
            <ul className="list-disc pl-5 mt-2">
              {analysis.formatting.map((issue, i) => (
                <li key={i} className="text-red-600">{issue}</li>
              ))}
            </ul>
          </section>
        )}

        {analysis.clarity.length > 0 && (
          <section>
            <h3 className="font-medium text-lg">Clarity Issues</h3>
            <ul className="list-disc pl-5 mt-2">
              {analysis.clarity.map((issue, i) => (
                <li key={i} className="text-orange-600">{issue}</li>
              ))}
            </ul>
          </section>
        )}

        {analysis.grammar.length > 0 && (
          <section>
            <h3 className="font-medium text-lg">Grammar Issues</h3>
            <ul className="list-disc pl-5 mt-2">
              {analysis.grammar.map((issue, i) => (
                <li key={i} className="text-red-600">{issue}</li>
              ))}
            </ul>
          </section>
        )}

        {analysis.jobFit && (
          <section>
            <h3 className="font-medium text-lg">Job Fit Analysis</h3>
            <div className="mt-2">
              <p>Match Score: <span className="font-bold">{analysis.jobFit.score}%</span></p>
              {analysis.jobFit.missingKeywords.length > 0 && (
                <div className="mt-2">
                  <p className="font-medium">Missing Keywords:</p>
                  <p className="text-gray-600">{analysis.jobFit.missingKeywords.join(', ')}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {analysis.suggestions.length > 0 && (
          <section>
            <h3 className="font-medium text-lg">Suggestions</h3>
            <ul className="list-disc pl-5 mt-2">
              {analysis.suggestions.map((suggestion, i) => (
                <li key={i} className="text-blue-600">{suggestion}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}; 