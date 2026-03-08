import fs from 'fs';

const filePath = './src/data/candidates.ts';
let content = fs.readFileSync(filePath, 'utf-8');

// We need to add slNo: number to CandidateData interface
content = content.replace(/export interface CandidateData \{/, 'export interface CandidateData {\n  slNo?: number;');

// Now we need to add slNo to each candidate
let slNo = 1;
content = content.replace(/\{ name: '([^']+)', rollNo: '([^']+)', category: '([^']+)' as const, tetMarks: (\d+) \}/g, (match, name, rollNo, category, tetMarks) => {
  if (name.startsWith('Test')) {
    return `{ name: '${name}', rollNo: '${rollNo}', category: '${category}' as const, tetMarks: ${tetMarks} }`;
  }
  const replacement = `{ slNo: ${slNo}, name: '${name}', rollNo: '${rollNo}', category: '${category}' as const, tetMarks: ${tetMarks} }`;
  slNo++;
  return replacement;
});

fs.writeFileSync(filePath, content);
console.log('Done. Last slNo:', slNo - 1);
