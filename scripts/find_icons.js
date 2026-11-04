async function run() {
  try {
    const res = await fetch('https://www.midasbuy.com/midasbuy/tr/buy/pubgm', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    const html = await res.text();
    const urls = html.match(/https?:\/\/[^\s"'<>]+\.(?:png|webp|svg|jpg)/gi) || [];
    const matched = urls.filter(u => /uc|coin|diamond/i.test(u));
    console.log('Matched URLs:', Array.from(new Set(matched)).slice(0, 15));
  } catch (err) {
    console.error('Error:', err.message);
  }
}
run();
