import fs from 'fs';
import path from 'path';

const walkSync = (dir: string, filelist: string[] = []) => {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      filelist = walkSync(filepath, filelist);
    } else if (filepath.endsWith('.tsx') || filepath.endsWith('.ts')) {
      filelist.push(filepath);
    }
  }
  return filelist;
};

const files = walkSync('./src');
let changedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  
  content = content.replace(/orange-500/g, 'red-600');
  content = content.replace(/orange-400/g, 'red-500');
  content = content.replace(/orange-600/g, 'red-700');
  
  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    changedFiles++;
  }
}

console.log(`Updated ${changedFiles} files.`);
