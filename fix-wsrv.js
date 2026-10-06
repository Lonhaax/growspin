const fs = require('fs');

const fixFile = (path) => {
  let content = fs.readFileSync(path, 'utf8');
  // 1. Remove referrerPolicy="no-referrer"
  content = content.replace(/referrerPolicy="no-referrer"/g, '');
  // 2. Replace src={...} with wsrv.nl proxy (safely check for item.imageUrl, si.item.imageUrl)
  content = content.replace(/src=\{([^}]+imageUrl)\}/g, (match, p1) => {
    return `src={${p1}?.startsWith('http') ? \`https://wsrv.nl/?url=\${encodeURIComponent(${p1}.replace(/^https?:\\/\\//, ''))}\` : ${p1}}`;
  });
  // 3. Clean up any weird double spaces or empty spaces left by referrerPolicy removal
  content = content.replace(/ + className=/g, ' className=');
  fs.writeFileSync(path, content);
};

fixFile('frontend/src/app/cases/[id]/page.tsx');
fixFile('frontend/src/app/admin/page.tsx');
fixFile('frontend/src/components/admin/AdvancedCaseCreator.tsx');
fixFile('frontend/src/components/admin/ItemManager.tsx');
console.log('Fixed all files');
