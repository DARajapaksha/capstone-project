const fs = require('fs');
const path = require('path');

const files = [
  '../frontend/src/pages/student/Dashboard.jsx',
  '../frontend/src/pages/Home.jsx',
  '../frontend/src/pages/auth/Register.jsx',
  '../frontend/src/pages/auth/Login.jsx',
  '../frontend/src/contexts/ProfileContext.jsx',
  '../../university-blockchain-admin-dashboard/src/main.jsx'
];

files.forEach(f => {
  const p = path.resolve(__dirname, f);
  if (!fs.existsSync(p)) return;
  let c = fs.readFileSync(p, 'utf8');
  
  // Replace the broken http://:5000 and any remaining http://localhost:5000
  // Note: Since these URLs are used inside fetch('...'), we need to replace the static string 
  // with a dynamic template literal.
  // We want: fetch(`http://${window.location.hostname}:5000/api/...`)
  
  c = c.replace(/['"]http:\/\/:5000(.*?)['"]/g, "`http://${window.location.hostname}:5000$1`");
  c = c.replace(/['"]http:\/\/localhost:5000(.*?)['"]/g, "`http://${window.location.hostname}:5000$1`");
  
  fs.writeFileSync(p, c);
  console.log('Fixed:', f);
});
