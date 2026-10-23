#!/usr/bin/env node
/**
 * AUTO CASH - AI Assistant Catalog Helper
 * Easily search, add, edit, or remove products from Othman Store & Sahl Cash directly into the storefront.
 */
const fs = require('fs');
const path = require('path');
const https = require('https');

const ROOT_DIR = path.resolve(__dirname, '..');
const SERVICES_FILE = path.join(ROOT_DIR, 'data', 'autocash_services.json');
const CONFIG_FILE = path.join(ROOT_DIR, 'data', 'provider_config.json');

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
    } catch {}
  }
  return {};
}

function fetchJson(url, token) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      hostname: parsed.hostname,
      path: parsed.pathname + (parsed.search || ''),
      method: 'GET',
      headers: {
        'api-token': token,
        'User-Agent': 'Mozilla/5.0',
      },
      timeout: 15000,
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timed out'));
    });
    req.end();
  });
}

function loadServices() {
  if (fs.existsSync(SERVICES_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(SERVICES_FILE, 'utf-8'));
    } catch {}
  }
  return [];
}

function saveServices(list) {
  fs.writeFileSync(SERVICES_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

async function listProviderProducts(provider = 'othman', query = '') {
  const config = loadConfig();
  const token = provider === 'othman' ? config.othmanApiKey : config.providerApiKey;
  const baseUrl = provider === 'othman' ? (config.othmanApiUrl || 'https://api.othman-storee.com') : (config.providerApiUrl || 'https://api.sahl-cash.com');

  if (!token) {
    console.error(`Token for ${provider} is not configured.`);
    return [];
  }

  const url = `${baseUrl.replace(/\/+$/, '')}/client/api/products`;
  console.log(`Fetching from ${url}...`);
  const products = await fetchJson(url, token);

  if (!Array.isArray(products)) {
    console.error('Failed to get products:', products);
    return [];
  }

  const q = query.toLowerCase().trim();
  const filtered = q
    ? products.filter((p) => (p.name && p.name.toLowerCase().includes(q)) || (p.category_name && p.category_name.toLowerCase().includes(q)) || (p.description && p.description.toLowerCase().includes(q)))
    : products;

  return filtered;
}

const command = process.argv[2];

async function main() {
  if (command === 'search') {
    const provider = process.argv[3] || 'othman';
    const query = process.argv.slice(4).join(' ') || '';
    const prods = await listProviderProducts(provider, query);
    console.log(`Found ${prods.length} products for query "${query}":`);
    console.log(
      JSON.stringify(
        prods.slice(0, 30).map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category_name,
          price: p.price,
          product_type: p.product_type,
          params: p.params,
        })),
        null,
        2
      )
    );
  } else if (command === 'list-store') {
    const srvs = loadServices();
    console.log(`Store currently has ${srvs.length} services:`);
    srvs.forEach((s) => {
      console.log(`- [${s.id}] ${s.name} (${s.category}) - ${s.packages?.length || 0} packages`);
    });
  } else if (command === 'add-service') {
    // Custom payload passed as JSON file or string
    const jsonStr = process.argv[3];
    const newService = JSON.parse(jsonStr);
    const services = loadServices();
    const existingIdx = services.findIndex((s) => s.id === newService.id || s.name.toLowerCase() === newService.name.toLowerCase());
    if (existingIdx !== -1) {
      services[existingIdx] = { ...services[existingIdx], ...newService };
      console.log(`Updated existing service: ${newService.name} (${newService.id})`);
    } else {
      services.unshift(newService);
      console.log(`Added new service: ${newService.name} (${newService.id})`);
    }
    saveServices(services);
  } else if (command === 'remove-service') {
    const idOrName = process.argv[3];
    let services = loadServices();
    const before = services.length;
    services = services.filter((s) => s.id !== idOrName && s.name.toLowerCase() !== idOrName.toLowerCase());
    saveServices(services);
    console.log(`Removed: ${before - services.length} service(s). Remaining: ${services.length}`);
  } else {
    console.log('Usage:');
    console.log('  node scripts/catalog_helper.js search <othman|sahl> <query>');
    console.log('  node scripts/catalog_helper.js list-store');
    console.log('  node scripts/catalog_helper.js add-service \'<json>\'');
    console.log('  node scripts/catalog_helper.js remove-service <id|name>');
  }
}

main().catch(console.error);
