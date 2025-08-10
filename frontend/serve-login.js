const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/standalone-login.html') {
    fs.readFile(path.join(__dirname, 'standalone-login.html'), (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error loading the page');
        return;
      }
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
    });
  } else {
    res.writeHead(404);
    res.end('Page not found');
  }
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
  console.log(`Open your browser and navigate to http://localhost:${PORT}/standalone-login.html`);
});
