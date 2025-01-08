import { ResumeAnalyzer } from './ResumeAnalyzer';

async function analyzeMyResume() {
  const resumeText = `
    John Doe
    Software Engineer

    EXPERIENCE
    Senior Developer, Tech Corp
    • Led development of cloud-based solutions
    • Managed team of 5 developers
    • Implemented CI/CD pipelines
  `;

  const jobDescription = `
    Looking for a Senior Software Engineer with experience in:
    - Cloud computing
    - Team leadership
    - DevOps practices
    - Machine learning
    - Kotlin development
  `;

  const analyzer = new ResumeAnalyzer(resumeText);
  const analysis = await analyzer.analyzeResume(jobDescription);

  console.log('Analysis Results:', JSON.stringify(analysis, null, 2));
}

analyzeMyResume(); 