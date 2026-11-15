const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec, spawn } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const targets = ['tg_coin_balance', 'tg_virtual_sms_app'];
let currentTargetIndex = 0;

function runTarget(targetName, doneCallback) {
  console.log(`\n--- Starting ${targetName} ---`);
  const tempDir = path.join(rootDir, 'temp_' + targetName + '_frames');
  if (fs.existsSync(tempDir)) fs.rmSync(tempDir, { recursive: true, force: true });
  fs.mkdirSync(tempDir, { recursive: true });

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
        const resp = await fetch('/data.json');
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
          const step = (anim.frameRate && anim.frameRate >= 50) ? 2 : 1;
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
    } else if (req.url === '/data.json') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      fs.createReadStream(path.join(rootDir, 'public', targetName + '.json')).pipe(res);
    } else if (req.url === '/save-frame' && req.method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const { frame, data } = JSON.parse(body);
        const base64Data = data.replace(/^data:image\/png;base64,/, '');
        const filename = path.join(tempDir, 'frame_' + String(frame).padStart(4, '0') + '.png');
        fs.writeFileSync(filename, base64Data, 'base64');
        res.writeHead(200);
        res.end('OK');
      });
    } else if (req.url === '/done') {
      res.writeHead(200);
      res.end('DONE');
      console.log(`All frames for ${targetName} captured!`);
      if (chromeProcess) chromeProcess.kill();
      server.close(() => {
        console.log(`Generating WebP and GIF for ${targetName}...`);
        const outWebp = path.join(rootDir, 'public', targetName + '_anim.webp');
        const outGif = path.join(rootDir, 'public', targetName + '.gif');
        const inputPattern = path.join(tempDir, 'frame_%04d.png');
        
        const cmd1 = `ffmpeg -framerate 30 -i "${inputPattern}" -vcodec libwebp -lossless 0 -compression_level 4 -q:v 85 -loop 0 "${outWebp}" -y`;
        const cmd2 = `ffmpeg -framerate 30 -i "${inputPattern}" -vf "split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "${outGif}" -y`;
        
        exec(cmd1, (err1) => {
          if (err1) console.error('cmd1 err:', err1);
          else console.log(`${targetName}_anim.webp created!`);
          exec(cmd2, (err2) => {
            if (err2) console.error('cmd2 err:', err2);
            else console.log(`${targetName}.gif created!`);
            fs.rmSync(tempDir, { recursive: true, force: true });
            doneCallback();
          });
        });
      });
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  const port = 38320 + (currentTargetIndex % 10);
  server.listen(port, () => {
    console.log(`Server for ${targetName} on http://localhost:${port}`);
    const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
    chromeProcess = spawn(chromePath, ['--headless=new', '--disable-gpu', `http://localhost:${port}`]);
  });
}

function processNext() {
  if (currentTargetIndex >= targets.length) {
    console.log('\n=== ALL TARGETS COMPLETED! ===');
    process.exit(0);
  }
  const target = targets[currentTargetIndex++];
  runTarget(target, () => {
    setTimeout(processNext, 500);
  });
}

processNext();
