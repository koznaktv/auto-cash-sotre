const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');

const html = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
</head>
<body style="margin:0; background:#070d1e;">
  <div id="lottie" style="width:256px;height:256px;"></div>
  <script>
    async function run() {
      const resp = await fetch('/data.json');
      const animData = await resp.json();
      const anim = lottie.loadAnimation({
        container: document.getElementById('lottie'),
        renderer: 'svg',
        loop: false,
        autoplay: false,
        animationData: animData
      });
      anim.addEventListener('DOMLoaded', async () => {
        anim.goToAndStop(60, true); // frame 60 where bubble is fully popped out
        const svg = document.getElementById('lottie').innerHTML;
        await fetch('/save-svg', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ svg })
        });
      });
    }
    run();
  </script>
</body>
</html>`;

let chrome;
const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end(html);
  } else if (req.url === '/data.json') {
    res.writeHead(200, {'Content-Type': 'application/json'});
    fs.createReadStream('public/tg_virtual_sms_app_styled.json').pipe(res);
  } else if (req.url === '/save-svg' && req.method === 'POST') {
    let b = '';
    req.on('data', c => b += c);
    req.on('end', () => {
      const { svg } = JSON.parse(b);
      fs.writeFileSync('temp_styled_test.svg', svg);
      res.writeHead(200);
      res.end('OK');
      console.log('Saved temp_styled_test.svg, length:', svg.length);
      chrome.kill();
      server.close();
      process.exit(0);
    });
  }
});

server.listen(39124, () => {
  console.log('Server started on 39124');
  chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', ['--headless=new', '--disable-gpu', 'http://localhost:39124']);
});
