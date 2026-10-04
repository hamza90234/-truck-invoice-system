const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src', 'app');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('fetch(') && !content.includes('apiFetch(')) {
        // Need to add import
        if (content.includes('import { API_URL } from "@/lib/config";')) {
          content = content.replace('import { API_URL } from "@/lib/config";', 'import { API_URL } from "@/lib/config";\nimport { apiFetch } from "@/lib/api";');
        } else if (content.includes('import { API_URL }')) {
          content = content.replace('import { API_URL }', 'import { apiFetch } from "@/lib/api";\nimport { API_URL }');
        } else {
          content = 'import { apiFetch } from "@/lib/api";\n' + content;
        }

        // Replace all fetch(...) with apiFetch(...)
        content = content.replace(/\bfetch\(/g, 'apiFetch(');
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

walk(srcDir);
console.log("All frontend fetches updated to use authenticated apiFetch!");
