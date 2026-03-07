const fs = require('fs');

const csv = fs.readFileSync('data3.csv', 'utf8');
const lines = csv.trim().split('\n');

const newData = lines.map(line => {
  const [name, rollNo, category, tetMarks] = line.split(',');
  return `  { name: '${name.replace(/'/g, "\\'")}', rollNo: '${rollNo}', category: '${category}' as const, tetMarks: ${tetMarks} }`;
});

const existingFile = fs.readFileSync('src/data/candidates.ts', 'utf8');
const insertIndex = existingFile.lastIndexOf('];');

const updatedFile = existingFile.slice(0, insertIndex) + ',\n' + newData.join(',\n') + '\n' + existingFile.slice(insertIndex);

fs.writeFileSync('src/data/candidates.ts', updatedFile);
console.log('Successfully appended data3.csv to src/data/candidates.ts');
