const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const tempDir = path.join(rootDir, 'temp_dollar_frames');
if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

const html = `<!DOCTYPE html>
<html>
<head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js"></script>
</head>
<body style="margin:0; background:transparent;">
  <div id="lottie" style="width:128px;height:128px;"></div>
  <script>
    async function run() {
      try {
        const resp = await fetch('/tg_wallet_dollar.json');
        const animData = await resp.json();
        const anim = lottie.loadAnimation({
          container: document.getElementById('lottie'),
          renderer: 'canvas',
          loop: false,
          autoplay: false,
          animationData: animData
        });
        anim.addEventListener('DOMLoaded', async () => {
          const totalFrames = anim.totalFrames;
          const step = 2; // 60fps -> 30fps (90 frames)
          for (let f = 0; f < totalFrames; f += step) {
            anim.goToAndStop(f, true);
            const canvas = document.querySelector('canvas');
            const dataUrl = canvas.toDataURL('image/png');
            await fetch('/save-frame', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ frame: Math.floor(f / step), data: dataUrl })
            });
          }
          await fetch('/done');
        });
      } catch (err) {
        console.error('Error in runner:', err);
      }
    }
    run();
  </script>
</body>
</html>`;

let server;
let chromeProcess;

server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } else if (req.url === '/tg_wallet_dollar.json') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    fs.createReadStream(path.join(rootDir, 'public/tg_wallet_dollar.json')).pipe(res);
  } else if (req.url === '/save-frame' && req.method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const { frame, data } = JSON.parse(body);
      const base64Data = data.replace(/^data:image\/png;base64,/, '');
      const filename = path.join(tempDir, 'frame_' + String(frame).padStart(3, '0') + '.png');
      fs.writeFileSync(filename, base64Data, 'base64');
      res.writeHead(200);
      res.end('OK');
    });
  } else if (req.url === '/done') {
    res.writeHead(200);
    res.end('DONE');
    console.log('All frames captured! Closing browser and server...');
    if (chromeProcess) chromeProcess.kill();
    server.close(() => {
      console.log('Generating WebP and GIF with ffmpeg...');
      const outWebp = path.join(rootDir, 'public/tg_wallet_dollar_anim.webp');
      const outGif = path.join(rootDir, 'public/tg_wallet_dollar.gif');
      const inputPattern = path.join(tempDir, 'frame_%03d.png');
      
      const cmd1 = `ffmpeg -framerate 30 -i "${inputPattern}" -vcodec libwebp -lossless 0 -compression_level 4 -q:v 85 -loop 0 "${outWebp}" -y`;
      const cmd2 = `ffmpeg -framerate 30 -i "${inputPattern}" -vf "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "${outGif}" -y`;
      
      exec(cmd1, (err1) => {
        if (err1) console.error('cmd1 err:', err1);
        else console.log('tg_wallet_dollar_anim.webp created successfully!');
        exec(cmd2, (err2) => {
          if (err2) console.error('cmd2 err:', err2);
          else console.log('tg_wallet_dollar.gif created successfully!');
          fs.rmSync(tempDir, { recursive: true, force: true });
          console.log('Temp dir cleaned up. Finished!');
          process.exit(0);
        });
      });
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(38291, () => {
  console.log('Server listening on http://localhost:38291, launching Chrome...');
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  chromeProcess = spawn(chromePath, ['--headless=new', '--disable-gpu', 'http://localhost:38291']);
});
