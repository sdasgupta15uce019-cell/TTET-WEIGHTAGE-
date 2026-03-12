const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/data/candidates.ts');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/slNo:\s*(\d+)/g, (match, p1) => {
  const slNo = parseInt(p1, 10);
  if (slNo > 1201) {
    return `slNo: ${slNo - 1}`;
  }
  return match;
});

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
