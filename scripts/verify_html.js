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
  console.log(`\nChecking ${f}...`);
  const isPubg = f.includes('pubg');
  
  const commonChecks = {
    openAppSwitcherModal: html.includes('openAppSwitcherModal'),
    appSwitcherModalId: html.includes('id="appSwitcherModal"'),
    buttonText: html.includes('باشقا ئەپلەرگە ئۆتۈش'),
    walletRemainingBox: html.includes('walletRemainingBox'),
    deficitText: html.includes('كەملىگەن قالدۇق پۇلى'),
    noOldHeroLink: !html.includes('PUBG Mobile غا ئۆتۈش') && !html.includes('MLBB غا ئۆتۈش'),
    pubgLogoInAppSwitcher: html.includes('pubg_logo.jpg') || html.includes('https://i.ibb.co/KpMvj9fw/3235269bedcbf914ba3e316af4169a3b.jpg')
  };

  for (const [k, v] of Object.entries(commonChecks)) {
    if (!v) {
      console.error(`  FAIL [${k}] in ${f}`);
      allPassed = false;
    } else {
      console.log(`  PASS [${k}]`);
    }
  }

  if (isPubg) {
    const pubgChecks = {
      pubgLogoHero: html.includes('pubg_logo.jpg'),
      noServerButtons: !html.includes('سېرۋېر باھالىرىنى كۆرۈپ بېقىش'),
      noServerLockAlert: !html.includes('سېرۋېر مۇقىملاندى'),
      noServerProtectAlert: !html.includes('سېرۋېر رايونى قوغدالدى'),
      noPreviewGlobalBanner: !html.includes('گىلوبال باھالىرى'),
      noMlbbInput: !html.includes('mlbbInput'),
      noServerTabsMLBB: !html.includes('tabTurkey') && !html.includes('tabSpecial'),
      hasPubgTabs: html.includes('tabDirect') && html.includes('tabPass') && html.includes('tabVoucher'),
      hasPubgInput: html.includes('pubgInput')
    };

    for (const [k, v] of Object.entries(pubgChecks)) {
      if (!v) {
        console.error(`  FAIL PUBG Check [${k}] in ${f}`);
        allPassed = false;
      } else {
        console.log(`  PASS PUBG Check [${k}]`);
      }
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
