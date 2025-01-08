import { ResumeAnalysis } from './types/ResumeAnalysis';
import { formatAnalysis } from './utils/formatAnalysis';

export class ResumeAnalyzer {
  private readonly resume: string;
  private readonly sections: { [key: string]: string } = {};

  constructor(resumeText: string) {
    this.resume = resumeText;
    this.sections = this.parseResumeSections(resumeText);
  }
// test
  private parseResumeSections(text: string): { [key: string]: string } {
    const sections: { [key: string]: string } = {};
    const lines = text.split('\n');
    let currentSection = '';

    console.log('Starting resume parsing...');
    console.log('Total lines:', lines.length);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Debug each line
      console.log(`Line ${i}:`, JSON.stringify(line));

      // Fixed section header detection with proper grouping of conditions
      if (
        trimmedLine.length > 0 && (
          /^[A-Z][A-Z\s]+$/.test(trimmedLine) || // All caps line
          /^(EDUCATION|EXPERIENCE|WORK|SKILLS?|PROJECTS?|ACHIEVEMENTS?|INTERESTS?|SUMMARY|OBJECTIVE|QUALIFICATIONS)/i.test(trimmedLine)
        ) &&
        !line.startsWith(' ') // Ensure it's not indented
      ) {
        currentSection = trimmedLine.toUpperCase();
        sections[currentSection] = '';
        console.log('Found section:', currentSection);
      } else if (currentSection && trimmedLine.length > 0) {
        // Only add non-empty lines to sections
        sections[currentSection] += line + '\n';
      }
    }

    // Debug output
    console.log('Found sections:', Object.keys(sections));
    Object.entries(sections).forEach(([key, value]) => {
      console.log(`Section ${key} content preview:`, value.substring(0, 100));
      console.log(`Section ${key} line count:`, value.split('\n').length);
    });

    return sections;
  }

  public async analyzeResume(jobDescription?: string): Promise<ResumeAnalysis> {
    const analysis: ResumeAnalysis = {
      formatting: await this.checkFormatting(),
      clarity: await this.analyzeClarity(),
      grammar: await this.checkGrammar(),
      jobFit: jobDescription ? await this.analyzeJobFit(jobDescription) : null,
      suggestions: [],
    };

    return formatAnalysis(analysis);
  }

  private async checkFormatting(): Promise<string[]> {
    const formattingIssues: string[] = [];
    
    // Check line spacing consistency
    const lines = this.resume.split('\n');
    let consecutiveEmptyLines = 0;
    let previousWasEmpty = false;

    lines.forEach((line, index) => {
      const isEmptyLine = line.trim().length === 0;
      
      if (isEmptyLine && previousWasEmpty) {
        consecutiveEmptyLines++;
      }
      
      previousWasEmpty = isEmptyLine;
    });

    if (consecutiveEmptyLines > 0) {
      formattingIssues.push('Inconsistent spacing between sections - use single line breaks for consistency');
    }

    // Get all bullet points across sections
    const bulletLines = Object.values(this.sections)
      .flatMap(section => {
        const lines = section.split('\n');
        console.log('Checking section lines:', lines.length);
        return lines;
      })
      .filter(line => {
        const trimmed = line.trim();
        console.log('Checking line for bullet:', JSON.stringify(line));
        
        // Simpler bullet detection
        const isBulletPoint = 
          /^[•\-\*]/.test(trimmed) ||  // Bullet at start
          /^\s+[•\-\*]/.test(line) ||  // Indented bullet
          /^\s*\d+\./.test(trimmed) || // Numbered
          /^\s{4,}/.test(line);        // Indented text

        if (isBulletPoint) {
          console.log('Found bullet line:', JSON.stringify(line));
        }
        return isBulletPoint;
      });

    console.log('Total bullet lines found:', bulletLines.length);

    if (bulletLines.length > 0) {
      // Check bullet point style consistency
      const bulletStyles = new Set(
        bulletLines.map(line => {
          const match = line.match(/^[\s]*([•\-\*\d][\.:]?\s*)/);
          return match ? match[1] : '';
        })
      );

      if (bulletStyles.size > 1) {
        formattingIssues.push('Inconsistent bullet point formatting - use the same style throughout');
      }

      // Check bullet point alignment
      const indentations = bulletLines.map(line => line.match(/^\s*/)[0].length);
      if (new Set(indentations).size > 2) { // Allow for one level of sub-bullets
        formattingIssues.push('Inconsistent bullet point alignment');
      }

      // Check ending punctuation
      const withPeriods = bulletLines.filter(line => line.trim().endsWith('.'));
      if (withPeriods.length > 0 && withPeriods.length < bulletLines.length) {
        formattingIssues.push(
          withPeriods.length > bulletLines.length / 2
            ? 'Some bullet points are missing ending periods - add periods to all for consistency'
            : 'Inconsistent bullet point endings - remove all ending periods for consistency'
        );
      }
    }

    // Check for consistent spacing
    if (!/^\s*[\w\d]/.test(this.resume)) {
      formattingIssues.push('Inconsistent spacing at the beginning of sections');
    }

    // Check for consistent date formatting
    const dates = this.resume.match(/\b\d{2}\/\d{2}\/\d{4}|\b\d{4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{4}\b/g) || [];
    const dateFormats = new Set(dates.map(date => this.getDateFormat(date)));
    if (dateFormats.size > 1) {
      formattingIssues.push('Inconsistent date formatting across the resume');
    }

    // Check section heading consistency
    const headings = Object.keys(this.sections);
    const headingStyles = new Set(headings.map(h => this.getHeadingStyle(h)));
    if (headingStyles.size > 1) {
      formattingIssues.push('Inconsistent section heading styles');
    }

    return formattingIssues;
  }

  private async analyzeClarity(): Promise<string[]> {
    const clarityIssues: string[] = [];
    
    // Get all bullet points from all relevant sections
    const relevantSections = ['EXPERIENCE', 'WORK EXPERIENCE', 'SELECTED ACHIEVEMENTS', 'PROJECTS'];
    let bullets: string[] = [];
    
    console.log('Starting clarity analysis...');

    relevantSections.forEach(sectionName => {
      // Find matching section (case-insensitive partial match)
      const section = Object.entries(this.sections)
        .find(([key]) => key.includes(sectionName) || sectionName.includes(key))?.[1];
      
      if (section) {
        console.log(`Analyzing section matching "${sectionName}":`);
        console.log(section);

        // More comprehensive bullet point detection
        const sectionLines = section.split('\n');
        const sectionBullets = sectionLines.filter(line => {
          const trimmed = line.trim();
          // Check for various bullet point indicators
          return (
            // Common bullet point characters at start of line
            /^[•\-\*]/.test(trimmed) ||
            // Indented bullet points
            /^\s+[•\-\*]/.test(line) ||
            // Numbered lists
            /^\s*\d+\.?\s+/.test(trimmed) ||
            // Letter lists
            /^\s*[a-z]\.?\s+/i.test(trimmed)
          );
        });

        console.log(`Found ${sectionBullets.length} bullets:`, sectionBullets);
        bullets = [...bullets, ...sectionBullets];
      }
    });

    if (bullets.length === 0) {
      console.log('No bullets found in any section');
      clarityIssues.push('Consider using bullet points to highlight key achievements and responsibilities');
      return clarityIssues;
    }

    bullets.forEach(bullet => {
      // Clean the bullet point text
      const trimmedBullet = bullet
        .replace(/^[\s•\-\*\d]+\.?\s*/, '') // Remove bullet points, numbers, and leading spaces
        .trim();

      console.log('Analyzing bullet:', trimmedBullet);

      // Skip empty or very short bullets
      if (trimmedBullet.length < 5) return;

      // Check for action verbs at start
      const actionVerbs = [
        'Led', 'Developed', 'Created', 'Managed', 'Implemented', 'Designed',
        'Improved', 'Increased', 'Reduced', 'Achieved', 'Built', 'Launched',
        'Coordinated', 'Established', 'Generated', 'Delivered', 'Spearheaded',
        'Orchestrated', 'Streamlined', 'Transformed', 'Collaborated', 'Explored',
        'Rewrote', 'Used', 'Wrote', 'Made', 'Worked'
      ];

      const startsWithActionVerb = actionVerbs.some(verb => 
        trimmedBullet.toLowerCase().startsWith(verb.toLowerCase())
      );

      if (!startsWithActionVerb) {
        clarityIssues.push('Consider starting achievement statements with strong action verbs');
        console.log('No action verb:', trimmedBullet);
      }

      // Check for quantifiable achievements
      const hasMetrics = /\d+%|\d+x|\$\d+|\d+\s*(?:users|customers|people|students|clients|hours|days|weeks|months|years|dollars|pounds|team members)/i.test(trimmedBullet);
      if (!hasMetrics) {
        clarityIssues.push('Add specific metrics or quantifiable achievements to demonstrate impact');
        console.log('No metrics:', trimmedBullet);
      }

      // Check for weak or passive phrases
      const weakPhrases = [
        'helped', 'assisted', 'worked on', 'responsible for', 'duties included',
        'participated in', 'was involved in', 'took part in', 'was responsible',
        'had to', 'needed to', 'tried to'
      ];
      if (weakPhrases.some(phrase => trimmedBullet.toLowerCase().includes(phrase))) {
        clarityIssues.push('Replace passive or weak phrases with strong, active verbs');
        console.log('Weak phrase:', trimmedBullet);
      }
    });

    return [...new Set(clarityIssues)];
  }

  private async checkGrammar(): Promise<string[]> {
    const grammarIssues: string[] = [];
    
    // Get all bullet points and lines from relevant sections
    const relevantSections = ['EXPERIENCE', 'WORK EXPERIENCE', 'SELECTED ACHIEVEMENTS', 'PROJECTS'];
    let contentLines: string[] = [];

    relevantSections.forEach(sectionName => {
      const section = Object.entries(this.sections)
        .find(([key]) => key.includes(sectionName) || sectionName.includes(key))?.[1];
      
      if (section) {
        // Split by newlines and filter out empty lines
        const lines = section.split('\n')
          .map(line => line.trim())
          .filter(line => line.length > 0);
        contentLines.push(...lines);
      }
    });

    // Check sentence endings consistency
    const sentenceLines = contentLines.filter(line => 
      // Exclude headers and short phrases
      line.length > 20 &&
      !line.includes(':') &&
      !/^[A-Z][a-z]+\s+[A-Z]/.test(line) // Exclude titles
    );

    if (sentenceLines.length > 0) {
      const endsWithPeriod = sentenceLines.filter(line => line.endsWith('.'));
      const endsWithOtherPunctuation = sentenceLines.filter(line => 
        /[!?;]$/.test(line)
      );

      if (endsWithPeriod.length > 0 && endsWithPeriod.length < sentenceLines.length) {
        grammarIssues.push('Inconsistent sentence endings - some lines end with periods while others don\'t');
      }

      if (endsWithOtherPunctuation.length > 0) {
        grammarIssues.push('Use consistent punctuation (periods recommended) for sentence endings');
      }
    }

    // Check for proper capitalization
    contentLines.forEach(line => {
      const cleanLine = line.replace(/^[•\-\*\s]+/, '').trim();
      if (cleanLine.length > 0 && 
          /[.!?]$/.test(cleanLine) && 
          !/^[A-Z0-9"]/.test(cleanLine) &&
          !/^(?:iOS|iPhone|iPad|macOS|e-commerce|m-commerce)/.test(cleanLine)) {
        grammarIssues.push('Start sentences with capital letters');
      }
    });

    // Check for common grammar mistakes
    const commonMistakes = [
      { pattern: /\s\s+/g, message: 'Multiple consecutive spaces detected' },
      { pattern: /[,\.]{2,}/g, message: 'Multiple consecutive punctuation marks detected' },
      { pattern: /\b(its|it's|their|there|they're|your|you're|whose|who's)\b/gi, message: 'Review usage of commonly confused words' },
      { pattern: /\b(and|but|or|nor|for|yet|so)\s*[,;]/gi, message: 'Incorrect punctuation with conjunctions' }
    ];

    commonMistakes.forEach(({ pattern, message }) => {
      if (pattern.test(this.resume)) {
        grammarIssues.push(message);
      }
    });

    return [...new Set(grammarIssues)];
  }

  private async analyzeJobFit(jobDescription: string): Promise<{
    score: number;
    missingKeywords: string[];
    recommendations: string[];
  }> {
    const jobKeywords = this.extractKeywords(jobDescription.toLowerCase());
    const resumeKeywords = this.extractKeywords(this.resume.toLowerCase());
    
    const matchingKeywords = jobKeywords.filter(keyword => 
      resumeKeywords.includes(keyword)
    );

    const score = (matchingKeywords.length / jobKeywords.length) * 100;
    const missingKeywords = jobKeywords.filter(keyword => 
      !resumeKeywords.includes(keyword)
    );

    // Generate specific recommendations
    const recommendations = this.generateJobFitRecommendations(
      matchingKeywords,
      missingKeywords,
      jobDescription
    );

    return {
      score: Math.round(score),
      missingKeywords,
      recommendations
    };
  }

  private generateJobFitRecommendations(
    matching: string[],
    missing: string[],
    jobDescription: string
  ): string[] {
    const recommendations: string[] = [];

    // Group missing keywords by category
    const categories = {
      technical: missing.filter(kw => this.isTechnicalTerm(kw)),
      soft: missing.filter(kw => this.isSoftSkill(kw)),
      domain: missing.filter(kw => !this.isTechnicalTerm(kw) && !this.isSoftSkill(kw))
    };

    if (categories.technical.length > 0) {
      recommendations.push(
        `Highlight experience with technical skills: ${categories.technical.join(', ')}`
      );
    }

    if (categories.soft.length > 0) {
      recommendations.push(
        `Emphasize soft skills: ${categories.soft.join(', ')}`
      );
    }

    if (categories.domain.length > 0) {
      recommendations.push(
        `Include domain-specific experience: ${categories.domain.join(', ')}`
      );
    }

    return recommendations;
  }

  private isTechnicalTerm(word: string): boolean {
    const technicalTerms = new Set([
      'python', 'java', 'javascript', 'react', 'angular', 'vue', 'node', 
      'aws', 'azure', 'docker', 'kubernetes', 'sql', 'nosql', 'mongodb',
      'api', 'rest', 'graphql', 'ci/cd', 'git', 'agile', 'scrum'
      // Add more technical terms as needed
    ]);
    return technicalTerms.has(word.toLowerCase());
  }

  private isSoftSkill(word: string): boolean {
    const softSkills = new Set([
      'leadership', 'communication', 'teamwork', 'collaboration', 'problem-solving',
      'analytical', 'creative', 'initiative', 'organized', 'detail-oriented'
      // Add more soft skills as needed
    ]);
    return softSkills.has(word.toLowerCase());
  }

  private getDateFormat(date: string): string {
    if (/\d{2}\/\d{2}\/\d{4}/.test(date)) return 'MM/DD/YYYY';
    if (/\d{4}/.test(date)) return 'YYYY';
    return 'Month YYYY';
  }

  private getHeadingStyle(heading: string): string {
    if (heading === heading.toUpperCase()) return 'ALL_CAPS';
    if (heading === heading.charAt(0).toUpperCase() + heading.slice(1).toLowerCase()) return 'Title_Case';
    return 'Other';
  }

  private isConsistentTechTerms(terms: string[]): boolean {
    const styles = new Set(terms.map(term => 
      term === term.toUpperCase() ? 'UPPER' : 
      term === term.toLowerCase() ? 'lower' : 'Mixed'
    ));
    return styles.size === 1;
  }

  private findRedundantPhrases(text: string): string[] {
    const redundantPatterns = [
      'responsible for',
      'duties included',
      'worked on',
      'helped with',
      'assisted in'
    ];
    return redundantPatterns.filter(pattern => 
      text.toLowerCase().includes(pattern)
    );
  }

  private extractKeywords(text: string): string[] {
    const commonWords = new Set([
      'and', 'the', 'or', 'a', 'an', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'over', 'after'
    ]);
    return text
      .split(/\W+/)
      .filter(word => 
        word.length > 2 && 
        !commonWords.has(word) &&
        !/^\d+$/.test(word) // Exclude pure numbers
      );
  }
} 