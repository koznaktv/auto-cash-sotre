/**
 * Auto-Revert Promo Script
 * Automatically triggers at or after midnight (2026-10-28 23:59:59+03:00)
 * to permanently clean up promo prices in autocash_services.json and push to GitHub.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SERVICES_FILE = path.join(__dirname, '..', 'data', 'autocash_services.json');

function revertPromo() {
  if (!fs.existsSync(SERVICES_FILE)) {
    console.error('File not found:', SERVICES_FILE);
    return;
  }

  const data = JSON.parse(fs.readFileSync(SERVICES_FILE, 'utf8'));
  let changed = false;

  data.forEach((service) => {
    if (!service.packages || !Array.isArray(service.packages)) return;
    service.packages.forEach((pkg) => {
      if (pkg.promoPrice !== undefined && pkg.regularPrice !== undefined) {
        console.log(`Reverting ${pkg.id} (${pkg.title}): ${pkg.price} => ${pkg.regularPrice}`);
        pkg.price = pkg.regularPrice;
        if (pkg.regularOriginalPrice !== undefined) {
          pkg.originalPrice = pkg.regularOriginalPrice;
        }
        delete pkg.promoPrice;
        delete pkg.regularPrice;
        delete pkg.regularOriginalPrice;
        delete pkg.promoEndsAt;
        changed = true;
      }
    });
  });

  if (changed) {
    fs.writeFileSync(SERVICES_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('Successfully reverted promo prices in autocash_services.json');

    try {
      execSync('git add data/autocash_services.json', { cwd: path.join(__dirname, '..') });
      execSync('git commit -m "chore: auto-revert MLBB promo prices after midnight"', { cwd: path.join(__dirname, '..') });
      execSync('git push origin main', { cwd: path.join(__dirname, '..') });
      console.log('Successfully committed and pushed reverted prices to GitHub');
    } catch (gitErr) {
      console.warn('Git push notice (can be pushed manually):', gitErr.message);
    }
  } else {
    console.log('No promo packages needed reverting.');
  }
}

if (require.main === module) {
  revertPromo();
}

module.exports = { revertPromo };
