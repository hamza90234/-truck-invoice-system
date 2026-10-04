const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'frontend', 'src', 'app');

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if ((fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) && !fullPath.replace(/\\/g, '/').includes('/app/login/')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.match(/[^a-zA-Z]fetch\(/) || content.startsWith('fetch(')) {
        
        // Add import if not present
        if (!content.includes('import { apiFetch }')) {
          if (content.includes('import { API_URL }')) {
            content = content.replace('import { API_URL }', 'import { apiFetch } from "@/lib/api";\nimport { API_URL }');
          } else {
            content = 'import { apiFetch } from "@/lib/api";\n' + content;
          }
        }

        // Replace all fetch( with apiFetch( except window.fetch
        content = content.replace(/(?<![a-zA-Z])fetch\(/g, 'apiFetch(');
        
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Updated: ' + fullPath);
      }
    }
  }
}

walk(srcDir);
console.log("All frontend fetches updated to use authenticated apiFetch!");
