const fs = require('fs');
const path = require('path');

const numbersHtmlPath = path.join(__dirname, '../public/numbers.html');
const smsHtmlPath = path.join(__dirname, '../public/sms.html');

console.log('Synchronizing public/numbers.html to public/sms.html...');
const content = fs.readFileSync(numbersHtmlPath, 'utf8');
fs.writeFileSync(smsHtmlPath, content, 'utf8');
console.log('Successfully synchronized public/numbers.html and public/sms.html! Size: ' + content.length + ' bytes');
