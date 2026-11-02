'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import SGCSubpageLayout from '@/components/SGCSubpageLayout';
import {
  Code2,
  Terminal,
  Copy,
  Check,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  Send,
  HelpCircle,
  FileJson,
  CheckCircle2,
} from 'lucide-react';

interface CodeSnippetProps {
  code: string;
  lang?: string;
}

function CodeBlock({ code, lang = 'bash' }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative rounded-xl bg-black/80 border border-white/10 overflow-hidden my-3">
      <div className="flex items-center justify-between px-4 py-2 bg-white/5 border-b border-white/5 text-[11px] text-slate-400 font-mono">
        <span>{lang}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'كۆچۈرۈلدى!' : 'كۆچۈرۈش'}</span>
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto leading-relaxed select-all" dir="ltr">
        {code}
      </pre>
    </div>
  );
}

export default function ApiDocsPage() {
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'python' | 'php'>('curl');

  return (
    <SGCSubpageLayout
      title="API ھۆججەتلىرى (Developer Docs)"
      subtitle="AUTO CASH نىڭ REST API سى ئارقىلىق ئۆزىڭىزنىڭ توربىتى ياكى بوتىڭىزنى ئۇلاڭ"
      headerActions={
        <Link
          href="/account"
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:brightness-110 text-slate-950 text-xs font-black transition shadow-sm cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>API Key ئېلىش</span>
        </Link>
      }
    >
      <div className="max-w-4xl mx-auto space-y-8 pb-12">
        {/* Hero Section */}
        <div className="p-5 sm:p-7 rounded-2xl bg-gradient-to-br from-[#0c1424] via-[#0f1b2d] to-[#121c2e] border border-amber-500/30 shadow-lg space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30">v1.0.0</span>
            <span>REST API DOCUMENTATION</span>
          </div>
          <h1 className="font-ukij text-xl sm:text-2xl font-black text-white">
            AUTO CASH ئوچۇق API سۇپىسى
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-alkatip">
            بۇ ھۆججەت ئارقىلىق سىز AUTO CASH سىستېمىسىدىكى بارلىق ئويۇن تولۇقلاشلىرى، Wi-Fi تور كارتىلىرى،
            سوۋغات كارتىلىرى ۋە رەقەملىك تەييار ھېساباتلارنى ئۆزىڭىزنىڭ شەخسىي توربېتىڭىزگە، تېلېگرامما بوتىڭىزغا
            ياكى يانفون ئەپلىرىڭىزگە ئاپتوماتىك ئۇلاپ سېتىش ئىمكانىيىتىگە ئىگە بولىسىز.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
              <Zap className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-white block">دەرھال بېجىرىش</span>
                <span className="text-[10px] text-slate-400">سېكۇنت ئىچىدە ئاپتوماتىك</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-white block">VIP ئېتىبار كاپالىتى</span>
                <span className="text-[10px] text-slate-400">VIP دەرىجىڭىزگە قاراپ ئەڭ ئەرزان باھا</span>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center gap-3">
              <FileJson className="w-5 h-5 text-cyan-400 shrink-0" />
              <div>
                <span className="text-[11px] font-bold text-white block">ئۆلچەملىك JSON</span>
                <span className="text-[10px] text-slate-400">ھەر قانداق تىل بىلەن ئوڭۇشلۇق ئۇلىنىدۇ</span>
              </div>
            </div>
          </div>
        </div>

        {/* Authentication Section */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
            <KeyRound className="w-5 h-5 text-amber-500" />
            <h2 className="font-ukij text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              دەلىللەش (Authentication)
            </h2>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-alkatip">
            بارلىق API تەلەپلىرىدە شەخسىي كۇنۇپكىڭىزنى HTTP Header ئارقىلىق ئەۋەتىشىڭىز كېرەك. تۆۋەندىكى شەكىللەرنىڭ خالىغان بىرىنى ئىشلەتسىڭىز بولىدۇ:
          </p>

          <div className="space-y-2 text-xs font-mono" dir="ltr">
            <div className="p-3 rounded-xl bg-slate-900 text-amber-300 border border-white/10">
              Authorization: Bearer ac_live_xxxxxxxxxxxxxxxxxxxxxxxx
            </div>
            <div className="p-3 rounded-xl bg-slate-900 text-cyan-300 border border-white/10">
              api-token: ac_live_xxxxxxxxxxxxxxxxxxxxxxxx
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
            💡 <strong>ئەسكەرتىش:</strong> API Key نى باشقىلارغا تەمىنلىمەڭ ۋە توركۆرگۈچنىڭ ئالدى بەت كودىغا ئاشكارە قويماڭ. كۇنۇپكىڭىزنى <Link href="/account" className="underline font-bold">شەخسىي ھېسابات بېتىڭىزدىن</Link> خالىغان ۋاقىتتا قايتا ھاسىل قىلالايسىز.
          </div>
        </div>

        {/* Language Code Snippet Switcher */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-ukij text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              كود مىساللىرى (Code Snippets)
            </h2>
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
              {(['curl', 'js', 'python', 'php'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                    activeTab === tab
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-white'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'curl' && (
            <CodeBlock
              lang="cURL"
              code={`# 1. قالدۇق ۋە ھېسابات ئۇچۇرىنى تەكشۈرۈش
curl -X GET "https://autocash.pro/api/v1/profile" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# 2. مەھسۇلاتلار ۋە VIP باھالارنى ئېلىش
curl -X GET "https://autocash.pro/api/v1/products" \\
  -H "Authorization: Bearer YOUR_API_KEY"

# 3. يېڭى زاكاز يوللاش (سېتىۋېلىش)
curl -X POST "https://autocash.pro/api/v1/orders" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "serviceId": "pubg_mobile",
    "packageId": "60_uc",
    "targetAccount": "512345678"
  }'

# 4. زاكاز بېجىرىلىش ھالىتىنى تەكشۈرۈش
curl -X GET "https://autocash.pro/api/v1/check?orderId=ORD-12345678" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
            />
          )}

          {activeTab === 'js' && (
            <CodeBlock
              lang="JavaScript (Node.js / Fetch)"
              code={`const API_KEY = 'YOUR_API_KEY';
const BASE_URL = 'https://autocash.pro/api/v1';

// 1. قالدۇق تەكشۈرۈش
async function getProfile() {
  const res = await fetch(\`\${BASE_URL}/profile\`, {
    headers: { 'Authorization': \`Bearer \${API_KEY}\` }
  });
  return await res.json();
}

// 2. مەھسۇلاتلار تىزىملىكىنى ئېلىش
async function getProducts() {
  const res = await fetch(\`\${BASE_URL}/products\`, {
    headers: { 'Authorization': \`Bearer \${API_KEY}\` }
  });
  return await res.json();
}

// 3. ئاپتوماتىك زاكاز يوللاش
async function createOrder(serviceId, packageId, targetAccount) {
  const res = await fetch(\`\${BASE_URL}/orders\`, {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ serviceId, packageId, targetAccount })
  });
  return await res.json();
}

// 4. زاكاز ئەھۋالىنى تەكشۈرۈش
async function checkOrder(orderId) {
  const res = await fetch(\`\${BASE_URL}/check?orderId=\${orderId}\`, {
    headers: { 'Authorization': \`Bearer \${API_KEY}\` }
  });
  return await res.json();
}`}
            />
          )}

          {activeTab === 'python' && (
            <CodeBlock
              lang="Python (requests)"
              code={`import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "https://autocash.pro/api/v1"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# 1. قالدۇق ۋە ھېسابات ئۇچۇرىنى تەكشۈرۈش
profile = requests.get(f"{BASE_URL}/profile", headers=HEADERS).json()
print("قالدۇق:", profile.get("data", {}).get("balance"))

# 2. مەھسۇلات تىزىملىكىنى كۆرۈش
products = requests.get(f"{BASE_URL}/products", headers=HEADERS).json()

# 3. زاكاز يوللاش
payload = {
    "serviceId": "pubg_mobile",
    "packageId": "60_uc",
    "targetAccount": "512345678"
}
order_res = requests.post(f"{BASE_URL}/orders", json=payload, headers=HEADERS).json()
print("زاكاز ئەھۋالى:", order_res)

# 4. زاكاز بېجىرىلىش ئەھۋالىنى تەكشۈرۈش
order_id = order_res.get("order", {}).get("id")
if order_id:
    status_res = requests.get(f"{BASE_URL}/check?orderId={order_id}", headers=HEADERS).json()
    print("تەپسىلاتى:", status_res)`}
            />
          )}

          {activeTab === 'php' && (
            <CodeBlock
              lang="PHP (cURL)"
              code={`<?php
$apiKey = "YOUR_API_KEY";
$baseUrl = "https://autocash.pro/api/v1";

function callAutoCashApi($endpoint, $method = 'GET', $data = null) {
    global $apiKey, $baseUrl;
    $ch = curl_init("$baseUrl/$endpoint");
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        "Authorization: Bearer $apiKey",
        "Content-Type: application/json"
    ]);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }

    $response = curl_exec($ch);
    curl_close($ch);
    return json_decode($response, true);
}

// 1. قالدۇق تەكشۈرۈش
$profile = callAutoCashApi("profile");
echo "قالدۇق: " . $profile['data']['balance'] . " USD\\n";

// 2. زاكاز يوللاش
$order = callAutoCashApi("orders", "POST", [
    "serviceId" => "pubg_mobile",
    "packageId" => "60_uc",
    "targetAccount" => "512345678"
]);
print_r($order);
?>`}
            />
          )}
        </div>

        {/* Detailed API Endpoints */}
        <div className="space-y-6">
          <h2 className="font-ukij text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            ئەڭ ئاساسلىق كۆرۈنمە يۈزلەر (API Endpoints)
          </h2>

          {/* Endpoint 1: Profile */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2" dir="ltr">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                  GET
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  /api/v1/profile
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-alkatip">
                ھېسابات ۋە قالدۇق ئۇچۇرى
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-alkatip">
              ئىشلەتكۈچىنىڭ نۆۋەتتىكى قالدۇقى، VIP دەرىجىسى ۋە ئېتىبار نىسبىتىنى قايتۇرىدۇ.
            </p>

            <CodeBlock
              lang="JSON Response"
              code={`{
  "success": true,
  "data": {
    "userId": "USR-123456",
    "name": "مۇھەممەت",
    "email": "user@example.com",
    "balance": 150.50,
    "currency": "USD",
    "vipTier": "vip3",
    "vipDiscountPercent": 2,
    "totalSpent": 650.00
  }
}`}
            />
          </div>

          {/* Endpoint 2: Products */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2" dir="ltr">
                <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 font-mono text-xs font-bold border border-emerald-500/30">
                  GET
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  /api/v1/products
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-alkatip">
                مەھسۇلات تىزىملىكى ۋە VIP باھالار
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-alkatip">
              توربەتتىكى بارلىق مەھسۇلاتلارنى قايتۇرىدۇ. ھەر بىر تۈرنىڭ <code>price</code> قىممىتىگە سىزنىڭ VIP ئېتىبارىڭىز ئاللىقاچان ھېسابلاپ قويۇلغان بولىدۇ.
              ئىختىيارىي پارامېتىرلار: <code>?category=games</code> ياكى <code>?q=pubg</code>.
            </p>

            <CodeBlock
              lang="JSON Response"
              code={`{
  "success": true,
  "vipTier": "vip3",
  "vipDiscountPercent": 2,
  "count": 1,
  "products": [
    {
      "serviceId": "pubg_mobile",
      "name": "PUBG Mobile (بۆسۈپ ئۆتۈش)",
      "category": "games",
      "inputLabel": "ئويۇنچى ID (Player ID)",
      "requiresInput": true,
      "packages": [
        {
          "packageId": "60_uc",
          "title": "60 UC",
          "retailPrice": 1.00,
          "price": 0.98,
          "currency": "USD",
          "vipDiscountPercent": 2
        }
      ]
    }
  ]
}`}
            />
          </div>

          {/* Endpoint 3: Create Order */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2" dir="ltr">
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-400 font-mono text-xs font-bold border border-amber-500/30">
                  POST
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  /api/v1/orders
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-alkatip">
                ئاپتوماتىك زاكاز يوللاش (سېتىۋېلىش)
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-alkatip">
              ھېسابات قالدۇقىڭىزدىن تۇتۇپ زاكازنى بېجىرىدۇ. كارت تالونى ياكى Wi-Fi كارتىلىرى بولسا نەتىجىدە دەرھال كودلار چىقىپ بېرىلىدۇ.
            </p>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">يوللىنىدىغان مەزمۇن (JSON Body):</span>
              <CodeBlock
                lang="JSON Request"
                code={`{
  "serviceId": "pubg_mobile",
  "packageId": "60_uc",
  "targetAccount": "5123456789"
}`}
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">قايتىدىغان جاۋاب (JSON Response):</span>
              <CodeBlock
                lang="JSON Response"
                code={`{
  "success": true,
  "order": {
    "id": "ORD-ABC123XYZ",
    "serviceName": "PUBG Mobile",
    "packageTitle": "60 UC",
    "amount": 0.98,
    "targetAccount": "5123456789",
    "status": "completed",
    "createdAt": "2026-11-02T19:00:00.000Z",
    "details": {
      "codes": ["REDEEM-CODE-XXXX-YYYY"]
    }
  },
  "remainingBalance": 149.52,
  "message": "زاكاز مۇۋەپپەقىيەتلىك بېجىرىلدى"
}`}
              />
            </div>
          </div>

          {/* Endpoint 4: Check Order */}
          <div className="p-5 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2" dir="ltr">
                <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30">
                  GET / POST
                </span>
                <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                  /api/v1/check
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-alkatip">
                زاكاز ئەھۋالى ۋە كودلارنى تەكشۈرۈش
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-alkatip">
              بېجىرىلىۋاتقان بىر ياكى بىر قانچە زاكازنىڭ ئەھۋالىنى تەكشۈرىدۇ. ئەگەر كارت كودلىرى تارقىتىلغان بولسا، تەپسىلاتىدا بىللە چىقىپ بېرىدۇ.
              ئىشلىتىش ئۇسۇلى: <code>?orderId=ORD-ABC123XYZ</code> ياكى بىرلا ۋاقىتتا <code>?orders=ORD-1,ORD-2,ORD-3</code>.
            </p>

            <CodeBlock
              lang="JSON Response"
              code={`{
  "success": true,
  "order": {
    "id": "ORD-ABC123XYZ",
    "status": "completed",
    "serviceName": "Wi-Fi كارتىسى",
    "packageTitle": "7 كۈنلۈك چەكسىز",
    "amount": 2.50,
    "details": {
      "wifiCard": {
        "username": "user123",
        "password": "pass456",
        "cardNumber": "CARD-789"
      }
    }
  }
}`}
            />
          </div>
        </div>

        {/* Error Codes Reference Table */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-[#101726] border border-slate-200/90 dark:border-white/10 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-white/10 pb-3">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h2 className="font-ukij text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              خاتالىق كودلىرى (Error Codes)
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" dir="ltr">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-mono">
                  <th className="py-2.5 px-3">HTTP Code</th>
                  <th className="py-2.5 px-3">Error Key</th>
                  <th className="py-2.5 px-3 text-right">چۈشەندۈرۈلۈشى (Meaning)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                <tr>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">401</td>
                  <td className="py-2.5 px-3 text-amber-300">MISSING_API_KEY</td>
                  <td className="py-2.5 px-3 text-right font-alkatip text-slate-300">API Key تەمىنلەنمىگەن</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">401</td>
                  <td className="py-2.5 px-3 text-amber-300">INVALID_API_KEY</td>
                  <td className="py-2.5 px-3 text-right font-alkatip text-slate-300">ئىناۋەتسىز ياكى توغرا بولمىغان API Key</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">402</td>
                  <td className="py-2.5 px-3 text-amber-300">INSUFFICIENT_BALANCE</td>
                  <td className="py-2.5 px-3 text-right font-alkatip text-slate-300">ھېسابات قالدۇقى سېتىۋېلىشقا يەتمىدى</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">404</td>
                  <td className="py-2.5 px-3 text-amber-300">SERVICE_NOT_FOUND</td>
                  <td className="py-2.5 px-3 text-right font-alkatip text-slate-300">تەلەپ قىلىنغان مەھسۇلات تېپىلمىدى</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">409</td>
                  <td className="py-2.5 px-3 text-amber-300">OUT_OF_STOCK</td>
                  <td className="py-2.5 px-3 text-right font-alkatip text-slate-300">كارتا ياكى مەھسۇلات تۈگەپ كەتكەن</td>
                </tr>
                <tr>
                  <td className="py-2.5 px-3 text-rose-400 font-bold">422</td>
                  <td className="py-2.5 px-3 text-amber-300">PROVIDER_REJECTED</td>
                  <td className="py-2.5 px-3 text-right font-alkatip text-slate-300">تەمىنلىگۈچى رەت قىلدى، پۇل ئاپتوماتىك قايتۇرۇلدى</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SGCSubpageLayout>
  );
}
