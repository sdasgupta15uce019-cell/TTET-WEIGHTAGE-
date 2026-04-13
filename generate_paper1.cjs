const fs = require('fs');

const csv = fs.readFileSync('paper1.csv', 'utf-8');
const lines = csv.trim().split('\n');
const headers = lines[0].split(',');

const data = [];
for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  if (parts.length >= 4) {
    data.push({
      slNo: i,
      name: parts[0].trim(),
      rollNo: parts[1].trim(),
      category: parts[2].trim(),
      tetMarks: parseFloat(parts[3].trim())
    });
  }
}

const tsContent = `import { CandidateData } from './candidates';

export const paper1CandidatesData: CandidateData[] = ${JSON.stringify(data, null, 2)};
`;

fs.writeFileSync('src/data/paper1Candidates.ts', tsContent);
console.log('Successfully generated src/data/paper1Candidates.ts');
