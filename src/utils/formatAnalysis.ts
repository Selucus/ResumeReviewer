import { ResumeAnalysis } from '../types/ResumeAnalysis';

export function formatAnalysis(analysis: ResumeAnalysis): ResumeAnalysis {
  const suggestions: string[] = [];
  
  // Log the analysis to help debug
  console.log('Raw Analysis:', {
    formatting: analysis.formatting,
    clarity: analysis.clarity,
    grammar: analysis.grammar,
    jobFit: analysis.jobFit
  });

  if (analysis.formatting.length > 0) {
    suggestions.push('Consider fixing formatting issues for better readability');
  }

  if (analysis.clarity.length > 0) {
    suggestions.push('Improve clarity by using more specific and action-oriented language');
  }

  if (analysis.grammar.length > 0) {
    suggestions.push('Fix grammar issues to maintain professionalism');
  }

  if (analysis.jobFit && analysis.jobFit.score < 70) {
    suggestions.push(`Consider adding keywords related to: ${analysis.jobFit.missingKeywords.join(', ')}`);
  }

  // If no issues were found, add a positive message
  if (analysis.formatting.length === 0 && 
      analysis.clarity.length === 0 && 
      analysis.grammar.length === 0 && 
      (!analysis.jobFit || analysis.jobFit.score >= 70)) {
    analysis.formatting.push('✓ Resume formatting is excellent');
    analysis.clarity.push('✓ Content is clear and well-structured');
    analysis.grammar.push('✓ No grammar issues detected');
    suggestions.push('Your resume is well-formatted and professionally written');
  }

  return {
    ...analysis,
    suggestions,
  };
} 