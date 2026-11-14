const fs = require('fs');

const files = [
  'public/mlbb.html',
  'public/mobile-legends.html',
  'public/pubg.html',
  'public/pubg-mobile.html'
];

let allPassed = true;

files.forEach(f => {
  const html = fs.readFileSync(f, 'utf8');
  console.log(`Checking ${f}...`);
  const checks = {
    openAppSwitcherModal: html.includes('openAppSwitcherModal'),
    appSwitcherModalId: html.includes('id="appSwitcherModal"'),
    buttonText: html.includes('باشقا ئەپلەرگە ئۆتۈش'),
    walletRemainingBox: html.includes('walletRemainingBox'),
    deficitText: html.includes('كەملىگەن قالدۇق پۇلى'),
    noPubgInHeroLink: !html.includes('PUBG Mobile غا ئۆتۈش') && !html.includes('MLBB غا ئۆتۈش')
  };

  for (const [k, v] of Object.entries(checks)) {
    if (!v) {
      console.error(`  FAIL [${k}] in ${f}`);
      allPassed = false;
    } else {
      console.log(`  PASS [${k}]`);
    }
  }

  const sIdx = html.indexOf('<script>');
  const eIdx = html.lastIndexOf('</script>');
  const script = html.substring(sIdx + 8, eIdx);
  try {
    new Function(script);
    console.log('  PASS [Script syntax valid]');
  } catch (err) {
    console.error('  FAIL [Script syntax error]:', err);
    allPassed = false;
  }
});

if (allPassed) {
  console.log('\n>>> ALL 4 HTML STOREFRONT FILES PASSED VERIFICATION PERFECTLY! <<<');
} else {
  console.error('\n>>> SOME CHECKS FAILED! <<<');
  process.exit(1);
}
