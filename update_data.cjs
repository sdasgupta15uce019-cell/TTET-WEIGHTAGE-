const fs = require('fs');

const csv = fs.readFileSync('data.csv', 'utf8');
const lines = csv.trim().split('\n');

const data = lines.map(line => {
  const [name, rollNo, category, tetMarks] = line.split(',');
  return `  { name: '${name.replace(/'/g, "\\'")}', rollNo: '${rollNo}', category: '${category}' as const, tetMarks: ${tetMarks} }`;
});

const fileContent = `export interface CandidateData {
  rollNo: string;
  name: string;
  category: 'UR' | 'SC' | 'ST' | 'PH';
  tetMarks: number;
}

export const candidatesData: CandidateData[] = [
${data.join(',\n')}
];
`;

fs.writeFileSync('src/data/candidates.ts', fileContent);
console.log('Successfully updated src/data/candidates.ts');
