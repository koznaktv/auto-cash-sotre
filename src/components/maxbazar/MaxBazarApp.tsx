'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLanguage, Language } from '@/context/LanguageContext';
import { useStore } from '@/context/StoreContext';
import { getCachedUser, ClientUser, formatSmartPrice } from '@/lib/clientAuth';
import { MAXBAZAR_I18N, MAXBAZAR_CATEGORIES_I18N } from './maxbazarI18n';
import { MaxBazarCardArtwork } from './MaxBazarCardArtwork';
import {
  Search,
  Plus,
  Moon,
  Sun,
  Bell,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  X,
  MoreVertical,
  ChevronDown,
  Clock,
  Zap,
  CreditCard,
  User as UserIcon,
  Home as HomeIcon,
  ShoppingCart,
  Copy,
  Check,
  Headphones,
  Lock,
  Sparkles,
  Gamepad2,
  Smartphone,
  Layers,
  Globe2,
  Tv,
  Wifi,
  Send,
  Server,
  Hash,
  ShoppingBag,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

// Categories matching Screenshot 1
export interface MaxBazarCategory {
  id: string;
  nameAr: string;
  nameUg: string;
  badgeAr: string;
  icon: string;
  image: string;
  accentColor: string;
  bgGradient: string;
  sampleItems: string[];
}

export const MAXBAZAR_CATEGORIES: MaxBazarCategory[] = [
  {
    id: 'games',
    nameAr: 'العاب',
    nameUg: 'ئويۇنلار',
    badgeAr: 'قسم الألعاب',
    icon: '🎮',
    image: '/images/maxbazar/v3/games_v5.webp',
    accentColor: '#3B82F6',
    bgGradient: 'from-blue-500/15 via-blue-600/5 to-transparent',
    sampleItems: ['PUBG Mobile', 'Free Fire', 'Roblox', 'Valorant', '8 Ball Pool'],
  },
  {
    id: 'apps',
    nameAr: 'التطبيقات',
    nameUg: 'ئەپلەر',
    badgeAr: 'قسم التطبيقات',
    icon: '📱',
    image: '/images/maxbazar/v3/apps_v5.webp',
    accentColor: '#8B5CF6',
    bgGradient: 'from-purple-500/15 via-purple-600/5 to-transparent',
    sampleItems: ['TikTok Coins', 'Bigo Live', 'Likee', 'Tango', 'Poppo Live'],
  },
  {
    id: 'credit',
    nameAr: 'الرصيد',
    nameUg: 'سۈرىيە تېلېفون قالدۇقى',
    badgeAr: 'قسم الرصيد',
    icon: '💳',
    image: '/images/maxbazar/v3/credit_v5.webp',
    accentColor: '#10B981',
    bgGradient: 'from-emerald-500/15 via-emerald-600/5 to-transparent',
    sampleItems: ['سيرياتيل Syriatel', 'ام تي ان MTN', 'Syriatel Cash', 'وحدات وباقات'],
  },
  {
    id: 'cards',
    nameAr: 'البطاقات',
    nameUg: 'رەقەملىك كارتىلار',
    badgeAr: 'قسم البطاقات',
    icon: '🎁',
    image: '/images/maxbazar/v3/cards_v5.webp',
    accentColor: '#F59E0B',
    bgGradient: 'from-amber-500/15 via-amber-600/5 to-transparent',
    sampleItems: ['PlayStation Store', 'Xbox Gift', 'Steam Wallet', 'iTunes Apple', 'Razer Gold'],
  },
  {
    id: 'social',
    nameAr: 'سوشل ميديا',
    nameUg: 'ئىجتىمائىي تاراتقۇ',
    badgeAr: 'قسم وسائل التواصل',
    icon: '🌐',
    image: '/images/maxbazar/v3/social_v5.webp',
    accentColor: '#EC4899',
    bgGradient: 'from-pink-500/15 via-pink-600/5 to-transparent',
    sampleItems: ['متابعين إنستغرام', 'لايكات فيسبوك', 'مشاهدات تيك توك', 'توثيق حسابات'],
  },
  {
    id: 'payments',
    nameAr: 'مدفوعات الكترونية',
    nameUg: 'ئېلېكترونلۇق پۇل تۆلەش',
    badgeAr: 'مدفوعات الكترونية',
    icon: '🧾',
    image: '/images/maxbazar/v3/payments_v5.webp',
    accentColor: '#06B6D4',
    bgGradient: 'from-cyan-500/15 via-cyan-600/5 to-transparent',
    sampleItems: ['تسديد فواتير', 'دفع إلكتروني', 'كروت فيزا افتراضية', 'شحن بوابات'],
  },
  {
    id: 'subscriptions',
    nameAr: 'الإشتراكات والحسابات',
    nameUg: 'VIP ھېساباتلار & ئەزالىق',
    badgeAr: 'قسم الإشتراكات',
    icon: '✨',
    image: '/images/maxbazar/v3/subscriptions_v5.webp',
    accentColor: '#F97316',
    bgGradient: 'from-orange-500/15 via-orange-600/5 to-transparent',
    sampleItems: ['ChatGPT Plus', 'Netflix 4K Premium', 'CapCut Pro', 'Canva Pro', 'Amazon Prime'],
  },
  {
    id: 'software',
    nameAr: 'خدمات سوفتوير',
    nameUg: 'يۇمشاق دېتال مۇلازىمەتلىرى',
    badgeAr: 'خدمات سوفتوير',
    icon: '💻',
    image: '/images/maxbazar/v3/software_v5.webp',
    accentColor: '#6366F1',
    bgGradient: 'from-indigo-500/15 via-indigo-600/5 to-transparent',
    sampleItems: ['تفعيل بوكسات HalabTech', 'Chimera Tool', 'تخطي حماية FRP', 'رومات رسمية'],
  },
  {
    id: 'internet',
    nameAr: 'فواتير الانترنت',
    nameUg: 'ۋايفاي تور كارتىلىرى',
    badgeAr: 'فواتير الانترنت',
    icon: '📡',
    image: '/images/maxbazar/v3/internet_v5.webp',
    accentColor: '#14B8A6',
    bgGradient: 'from-teal-500/15 via-teal-600/5 to-transparent',
    sampleItems: ['شبكة الفرسان Fursan Net', 'مجاهد نت Mujahid Net', 'إعزاز نت Azez Net', 'شبكة الوفاء'],
  },
  {
    id: 'telegram',
    nameAr: 'خدمات تيليجرام',
    nameUg: 'تېلېگرامما مۇلازىمەتلىرى',
    badgeAr: 'خدمات تيليجرام',
    icon: '✈️',
    image: '/images/maxbazar/v3/telegram_v5.webp',
    accentColor: '#0284C7',
    bgGradient: 'from-sky-500/15 via-sky-600/5 to-transparent',
    sampleItems: ['نجوم تيليجرام Stars', 'اشتراك Telegram Premium', 'تفاعل ومشتركين قنوات'],
  },
  {
    id: 'hosting',
    nameAr: 'إستضافات وسيرفرات',
    nameUg: 'تور بوشلۇقى & مۇلازىمېتىر',
    badgeAr: 'إستضافات وسيرفرات',
    icon: '🖥️',
    image: '/images/maxbazar/v3/hosting_v5.webp',
    accentColor: '#4F46E5',
    bgGradient: 'from-blue-600/15 via-indigo-700/5 to-transparent',
    sampleItems: ['خوادم VPS Cloud', 'استضافة مواقع سريعة', 'لوحات تحكم cPanel', 'دومينات عالمية'],
  },
  {
    id: 'numbers',
    nameAr: 'الارقام الإفتراضية',
    nameUg: 'مەۋھۇم نومۇرلار',
    badgeAr: 'الارقام الإفتراضية',
    icon: '📞',
    image: '/images/maxbazar/v3/numbers_v5.webp',
    accentColor: '#E11D48',
    bgGradient: 'from-rose-500/15 via-rose-600/5 to-transparent',
    sampleItems: ['أرقام واتساب WhatsApp', 'أرقام تيليجرام', 'تفعيل Google', 'أكثر من 150 دولة'],
  },
];

// Payment methods matching Screenshot 3
export const PAYMENT_METHODS = [
  {
    id: 'sham_cash',
    nameAr: 'شام كاش',
    nameUg: 'شام كاش (Sham Cash)',
    badgeAr: 'تتطلب توثيق الحساب 🔒',
    badgeColor: 'amber',
    icon: '⚡',
    logo: '/images/services/syriatel.png',
  },
  {
    id: 'syriatel_cash',
    nameAr: 'سيرياتيل كاش',
    nameUg: 'سيرياتيل كاش (Syriatel)',
    badgeAr: '⚡ شحن فوري',
    badgeColor: 'emerald',
    icon: '⚡',
    logo: '/images/services/syriatel.png',
  },
  {
    id: 'binance_pay',
    nameAr: 'Binance Pay',
    nameUg: 'بىنانس پاي (Binance Pay)',
    badgeAr: '⚡ شحن فوري',
    badgeColor: 'amber',
    icon: '🟡',
    logo: '/images/services/usdt.png',
  },
  {
    id: 'usdt_auto',
    nameAr: 'USDT تلقائي',
    nameUg: 'ئاپتوماتىك USDT (TRC20)',
    badgeAr: '⚡ شحن فوري',
    badgeColor: 'emerald',
    icon: '₮',
    logo: '/images/services/usdt.png',
  },
  {
    id: 'al_haram',
    nameAr: 'الهرم / الفؤاد',
    nameUg: 'ھەرەم ۋە فۇئاد ئىچكى پۇل يۆتكەش',
    badgeAr: 'حوالات داخلية',
    badgeColor: 'blue',
    icon: '🏢',
    logo: '/images/services/syriatel.png',
  },
  {
    id: 'cashu',
    nameAr: 'كاش يو / قسائم',
    nameUg: 'كاشيو & كارتىلار',
    badgeAr: 'قسائم شحن',
    badgeColor: 'purple',
    icon: '🎫',
    logo: '/images/services/razer.png',
  },
  {
    id: 'manual_transfer',
    nameAr: 'حوالات يدوية',
    nameUg: 'قولدا مەمۇرىي تەكشۈرۈش',
    badgeAr: 'تأكيد يدوي',
    badgeColor: 'slate',
    icon: '✍️',
    logo: '/images/services/syriatel.png',
  },
  {
    id: 'authorized_agent',
    nameAr: 'وكيل معتمد',
    nameUg: 'ھوقۇق بېرىلگەن ۋاكالەتچى',
    badgeAr: 'دفع مباشر',
    badgeColor: 'emerald',
    icon: '🤝',
    logo: '/brand_logo.png',
  },
];

function cleanProductName(name: string, categoryName?: string): string {
  if (!name) return '';
  let cleaned = name.trim();
  if (categoryName) {
    const cat = categoryName.trim();
    const escaped = cat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    cleaned = cleaned.replace(new RegExp(`^${escaped}\\s*[-–—:]\\s*`, 'i'), '');
    cleaned = cleaned.replace(new RegExp(`\\s*[-–—]\\s*${escaped}$`, 'i'), '');
    cleaned = cleaned.replace(new RegExp(`\\s*\\(${escaped}\\)$`, 'i'), '');
  }
  return cleaned.trim() || name;
}

function localizeParamLabel(rawLabel: string, lang: Language): string {
  const l = (rawLabel || '').toLowerCase().trim();

  // 1. Player ID
  if (l.includes('ايدي') || l.includes('آيدي') || l.includes('player') || l.includes('معرف') || l.includes('user id') || l === 'id') {
    switch (lang) {
      case 'ug': return 'ئويۇنچى ID نومۇرى (Player ID)';
      case 'en': return 'Player ID / User ID';
      case 'tr': return 'Oyuncu ID (Player ID)';
      case 'uz': return 'O‘yinchi ID (Player ID)';
      case 'ru': return 'ID Игрока (Player ID)';
      default: return 'معرف اللاعب (Player ID)';
    }
  }

  // 2. Server ID / Zone ID
  if (l.includes('سيرفر') || l.includes('server') || l.includes('zone')) {
    switch (lang) {
      case 'ug': return 'رايون نومۇرى (Zone ID / Server ID)';
      case 'en': return 'Server ID / Zone ID';
      case 'tr': return 'Sunucu / Bölge No (Zone ID)';
      case 'uz': return 'Server ID / Hudud kodi (Zone ID)';
      case 'ru': return 'ID Сервера / Зоны (Zone ID)';
      default: return 'رقم السيرفر (Zone ID)';
    }
  }

  // 3. Phone / Subscriber
  if (l.includes('مشترك') || l.includes('هاتف') || l.includes('phone') || l.includes('موبايل')) {
    switch (lang) {
      case 'ug': return 'تېلېفون ياكى مۇشتەرى نومۇرى';
      case 'en': return 'Phone / Subscriber Number';
      case 'tr': return 'Telefon / Abone Numarası';
      case 'uz': return 'Telefon / Obunachi raqami';
      case 'ru': return 'Номер телефона / Абонент';
      default: return 'رقم الهاتف / رقم المشترك';
    }
  }

  // 4. Email
  if (l.includes('ايميل') || l.includes('إيميل') || l.includes('email') || l.includes('بريد')) {
    switch (lang) {
      case 'ug': return 'ئېلخەت ئادرېسى (Email)';
      case 'en': return 'Email Address';
      case 'tr': return 'E-posta Adresi (Email)';
      case 'uz': return 'Elektron pochta (Email)';
      case 'ru': return 'Электронная почта (Email)';
      default: return 'البريد الإلكتروني (Email)';
    }
  }

  // 5. Password
  if (l.includes('مرور') || l.includes('pass') || l.includes('كلمة السر')) {
    switch (lang) {
      case 'ug': return 'پارول (Password)';
      case 'en': return 'Password';
      case 'tr': return 'Şifre (Password)';
      case 'uz': return 'Parol (Password)';
      case 'ru': return 'Пароль (Password)';
      default: return 'كلمة المرور (Password)';
    }
  }

  // 6. Device System (iOS / Android)
  if (l.includes('نظام') || l.includes('software') || l.includes('هاتفك')) {
    switch (lang) {
      case 'ug': return 'تېلېفون سىستېمىسى (Android ياكى iOS)';
      case 'en': return 'Operating System (Android / iOS)';
      case 'tr': return 'Cihaz Sistemi (Android / iOS)';
      case 'uz': return 'Qurilma tizimi (Android / iOS)';
      case 'ru': return 'Система устройства (Android / iOS)';
      default: return 'نظام الهاتف (Android / iOS)';
    }
  }

  // 7. Full Name
  if (l.includes('الاسم') || l.includes('full_name') || l.includes('name')) {
    switch (lang) {
      case 'ug': return 'تولۇق ئىسىم-فامىلە';
      case 'en': return 'Full Name';
      case 'tr': return 'Ad Soyad';
      case 'uz': return 'To‘liq ism';
      case 'ru': return 'Полное имя';
      default: return 'الاسم الكامل';
    }
  }

  // 8. City / Province
  if (l.includes('مدينة') || l.includes('محافظة') || l.includes('city')) {
    switch (lang) {
      case 'ug': return 'شەھەر ياكى ۋىلايەت';
      case 'en': return 'City / Province';
      case 'tr': return 'Şehir / İl';
      case 'uz': return 'Shahar / Viloyat';
      case 'ru': return 'Город / Область';
      default: return 'المحافظة / المدينة';
    }
  }

  // 9. Detailed Address
  if (l.includes('عنوان') || l.includes('address')) {
    switch (lang) {
      case 'ug': return 'تەپسىلىي ئادرېس';
      case 'en': return 'Detailed Delivery Address';
      case 'tr': return 'Açık Teslimat Adresi';
      case 'uz': return 'Yetkazib berish manzili';
      case 'ru': return 'Подробный адрес доставки';
      default: return 'العنوان بالتفصيل';
    }
  }

  // 10. Link
  if (l.includes('رابط') || l.includes('link') || l.includes('url')) {
    switch (lang) {
      case 'ug': return 'ئۇلىنىش ئادرېسى (Link / URL)';
      case 'en': return 'Link (URL)';
      case 'tr': return 'Bağlantı (Link / URL)';
      case 'uz': return 'Havola (Link / URL)';
      case 'ru': return 'Ссылка (URL)';
      default: return 'الرابط (Link)';
    }
  }

  // 11. Username
  if (l.includes('مستخدم') || l.includes('username')) {
    switch (lang) {
      case 'ug': return 'ئىشلەتكۈچى نامى (Username)';
      case 'en': return 'Username';
      case 'tr': return 'Kullanıcı Adı (Username)';
      case 'uz': return 'Foydalanuvchi nomi (Username)';
      case 'ru': return 'Имя пользователя (Username)';
      default: return 'اسم المستخدم (Username)';
    }
  }

  return rawLabel;
}

function localizeProductNotice(product: any, lang: Language): string | null {
  if (!product) return null;
  const pName = ((product.product_name || product.name || '') + ' ' + (product.category_name || '')).toLowerCase();

  // Games needing Player ID (+ Zone ID)
  if (
    pName.includes('mobile legends') ||
    pName.includes('mlbb') ||
    pName.includes('pubg') ||
    pName.includes('freefire') ||
    pName.includes('free fire') ||
    pName.includes('clash') ||
    pName.includes('brawl') ||
    pName.includes('honor of kings') ||
    pName.includes('blood strike')
  ) {
    switch (lang) {
      case 'ug':
        return '⚡ سېكۇنتتا ئاپتوماتىك قاچىلىنىدۇ. ئويۇنچى كىملىكى (UID) ۋە رايون نومۇرىنى تىرناقسىز توغرا كىرگۈزۈڭ.';
      case 'en':
        return '⚡ Instant automatic delivery 24/7. Enter your Player ID and Zone ID without brackets.';
      case 'tr':
        return '⚡ 7/24 anında otomatik teslimat. Oyuncu ID ve Bölge kodunu parantez olmadan giriniz.';
      case 'uz':
        return '⚡ 24/7 lahzalik avtomatik to‘ldirish. O‘yinchi ID va hudud kodini qavssiz kiriting.';
      case 'ru':
        return '⚡ Мгновенная доставка 24/7. Вводите ID игрока и зону без скобок.';
      default:
        return '⚡ الخدمة تعمل بشكل تلقائي فوري 24 ساعة. يرجى إدخال الآيدي والسيرفر بدون أقواس.';
    }
  }

  // SyriaTel / MTN / Telecom / Wifi
  if (pName.includes('syriatel') || pName.includes('mtn') || pName.includes('سيرياتيل') || pName.includes('نت')) {
    switch (lang) {
      case 'ug':
        return '⚡ تېلېفون نومۇرىنى 09 دىن باشلاپ توغرا كىرگۈزۈڭ. دەرھال ھېساباتقا يۆتكىلىدۇ.';
      case 'en':
        return '⚡ Please ensure your phone number starts with 09 correctly. Transferred immediately.';
      case 'tr':
        return '⚡ Lütfen telefon numarasını 09 ile başlayacak şekilde doğru giriniz.';
      case 'uz':
        return '⚡ Iltimos, raqamni 09 bilan boshlab to‘g‘ri kiriting.';
      case 'ru':
        return '⚡ Убедитесь, что номер начинается с 09. Пополнение моментальное.';
      default:
        return '⚡ يرجى التأكد من كتابة الرقم بدءاً من 09 بشكل صحيح. يتم التحويل فوراً.';
    }
  }

  // Digital accounts / vouchers
  if (pName.includes('chatgpt') || pName.includes('canva') || pName.includes('telegram') || pName.includes('نجوم')) {
    switch (lang) {
      case 'ug':
        return '⚡ زاكاز قىلىنغان كود ياكى ھېسابات ئۇچۇرى دەرھال ئېكراندا ۋە زاكازلار تىزىملىكىدە چىقىدۇ.';
      case 'en':
        return '⚡ Voucher code or account credentials will be delivered instantly on screen.';
      case 'tr':
        return '⚡ Kod veya hesap bilgileri anında ekranda ve siparişlerinizde görünecektir.';
      case 'uz':
        return '⚡ Kod yoki hisob maʼlumotlari darhol ekranda va buyurtmalaringizda chiqadi.';
      case 'ru':
        return '⚡ Код или данные аккаунта отобразятся сразу на экране и в истории заказов.';
      default:
        return '⚡ يتم تسليم كود القسيمة أو بيانات الحساب فوراً على الشاشة وقسم الطلبات.';
    }
  }

  return null;
}

function getSubcategoryImage(subName: string, categoryId: string | null): string {
  const s = (subName || '').toLowerCase();

  // 0. Asphalt 9: Legends (MUST be prioritized before generic 'legends' check!)
  if (s.includes('asphalt')) return '/images/services/asphalt_9.webp';

  // 1. Mobile Legends (3 specific types matching provider)
  if (s.includes('mobile legends') || s.includes('mlbb') || s.includes('legend mobile') || (s.includes('legend') && !s.includes('asphalt'))) {
    if (s.includes('turkey') || s.includes('تركيا') || s.includes('تۈركىيە') || s.includes('tr')) {
      return '/images/services/mlbb_turkey.webp';
    }
    if (s.includes('special') || s.includes('ئالاھىدە') || s.includes('خاص') || s.includes('next') || s.includes('ئاسىيا') || s.includes('فىلىپپىن') || s.includes('asia') || s.includes('ph')) {
      return '/images/services/mlbb_special.webp';
    }
    return '/images/services/mlbb_global.webp';
  }

  // 2. Specific Major Games
  if (s.includes('wuthering waves')) return '/images/services/wuthering_waves.webp';
  if (s.includes('efootball') || s.includes('e-football') || s.includes('بيس')) return '/images/services/efootball.webp';
  if (s.includes('fc mobile') || s.includes('fifa')) return '/images/services/fc_mobile.webp';
  if (s.includes('pubg mobile') || s.includes('ببجي موبايل') || s.includes('pubg')) {
    if (s.includes('new state')) return '/images/services/pubg_new_state.webp';
    return '/images/services/pubg_mobile.webp';
  }
  if (s.includes('freefire') || s.includes('free fire') || s.includes('فري فاير') || s.includes('garena')) return '/images/services/free_fire.webp';
  if (s.includes('clash of clans') || s.includes('كلاش اوف كلانس')) return '/images/services/clash_of_clans.webp';
  if (s.includes('clash royale') || s.includes('كلاش رويال')) return '/images/services/clash_royale.webp';
  if (s.includes('brawl stars') || s.includes('براول ستارز')) return '/images/services/brawl_stars.webp';
  if (s.includes('hay day') || s.includes('هاي داي')) return '/images/services/hay_day.webp';
  if (s.includes('roblox') || s.includes('روبلوكس')) return '/images/services/roblox.webp';
  if (s.includes('honor of kings') || s.includes('شرف الملوك') || s.includes('hok')) return '/images/services/honor_of_kings.webp';
  if (s.includes('genshin') || s.includes('جينشين')) return '/images/services/genshin_impact.webp';
  if (s.includes('fortnite') || s.includes('فورتنايت')) return '/images/services/fortnite.webp';
  if (s.includes('call of duty') || s.includes('كول اوف ديوتي') || s.includes('cod')) return '/images/services/call_of_duty.webp';
  if (s.includes('jawaker') || s.includes('جواكر')) return '/images/services/jawaker.webp';
  if (s.includes('arena breakout')) return '/images/services/arena_breakout.webp';
  if (s.includes('blood strike')) return '/images/services/blood_strike.webp';
  if (s.includes('delta force')) return '/images/services/delta_force.webp';
  if (s.includes('farlight')) return '/images/services/farlight_84.webp';
  if (s.includes('whiteout') || s.includes('white out')) return '/images/services/whiteout_survival.webp';
  if (s.includes('asphalt')) return '/images/services/asphalt_9.webp';
  if (s.includes('last war')) return '/images/services/last_war.webp';
  if (s.includes('identity v')) return '/images/services/identity_v.webp';
  if (s.includes('growtopia')) return '/images/services/growtopia.webp';
  if (s.includes('crossout')) return '/images/services/crossout_mobile.webp';
  if (s.includes('acecraft')) return '/images/services/acecraft.webp';
  if (s.includes('ace racer') || s.includes('aceracer')) return '/images/services/aceracer.webp';
  if (s.includes('destiny')) return '/images/services/destiny_rising.webp';
  if (s.includes('eve echoes')) return '/images/services/eve_echoes.webp';
  if (s.includes('kingshot')) return '/images/services/kingshot.webp';
  if (s.includes('last island')) return s.includes('lite') ? '/images/services/last_island_lite.webp' : '/images/services/last_island.webp';
  if (s.includes('oxide')) return '/images/services/oxide_survival.webp';
  if (s.includes('warpath') || s.includes('نداء الحرب')) return '/images/services/warpath.webp';
  if (s.includes('lords mobile')) return '/images/services/lords_mobile.webp';
  if (s.includes('yalla ludo') || s.includes('يلا لودو')) return '/images/services/yalla_ludo.webp';
  if (s.includes('stumble guys')) return '/images/services/stumble_guys.webp';
  if (s.includes('age of empire') || s.includes('عصر الامبراطوريات')) return '/images/services/age_of_empires.webp';
  if (s.includes('ball pool') || s.includes('8 ball')) return '/images/services/ball_pool_8.webp';
  if (s.includes('valorant')) return '/images/services/razer_gold.webp';
  if (s.includes('minecraft') || s.includes('ماين كرافت')) return '/images/services/playstation.webp';
  if (s.includes('revenge of sultans') || s.includes('انتقام السلاطين')) return '/images/services/revenge_of_sultans.webp';
  if (s.includes('top war')) return '/images/services/top_war.webp';
  if (s.includes('super sus')) return '/images/services/super_sus.webp';
  if (s.includes('weplay') || s.includes('وي بلاي')) return '/images/services/weplay.webp';

  // 3. Apps, Subscriptions, AI
  if (s.includes('netflix') || s.includes('نتفلكس')) return '/images/services/netflix.webp';
  if (s.includes('spotify') || s.includes('سبوتيفاي')) return '/images/services/spotify.webp';
  if (s.includes('chatgpt') || s.includes('chat gpt')) return '/images/services/chatgpt.webp';
  if (s.includes('gemini') || s.includes('جيميني')) return '/images/services/google_gemini.webp';
  if (s.includes('canva') || s.includes('كانفا')) return '/images/services/canva.webp';
  if (s.includes('capcut') || s.includes('كاب كات')) return '/images/services/capcut.webp';
  if (s.includes('shahid') || s.includes('شاهد')) return '/images/services/shahid.webp';
  if (s.includes('osn')) return '/images/services/osn_plus.webp';
  if (s.includes('anghami')) return '/images/services/anghami.webp';
  if (s.includes('picsart')) return '/images/services/picsart.webp';
  if (s.includes('cursor')) return '/images/services/cursor_pro.webp';
  if (s.includes('kling')) return '/images/services/kling_ai.webp';
  if (s.includes('heygen')) return '/images/services/heygen_ai.webp';
  if (s.includes('super grok') || s.includes('grok')) return '/images/services/super_grok.webp';
  if (s.includes('duolingo') || s.includes('دولينجو')) return '/images/services/duolingo.webp';
  if (s.includes('perplexity')) return '/images/services/perplexity.webp';
  if (s.includes('deepseek')) return '/images/services/deepseek.webp';
  if (s.includes('elevenlabs')) return '/images/services/elevenlabs.webp';
  if (s.includes('zoom')) return '/images/services/zoom.webp';
  if (s.includes('icloud')) return '/images/services/icloud.webp';

  // 4. Social & Chat Apps
  if (s.includes('telegram') || s.includes('تيليجرام') || s.includes('نجوم')) return '/images/services/telegram.webp';
  if (s.includes('tiktok') || s.includes('تيك توك')) return '/images/services/tiktok.webp';
  if (s.includes('instagram') || s.includes('انستغرام')) return '/images/services/instagram.webp';
  if (s.includes('facebook') || s.includes('فيسبوك')) return '/images/services/facebook.webp';
  if (s.includes('youtube') || s.includes('يوتيوب')) return '/images/services/youtube.webp';
  if (s.includes('snapchat') || s.includes('سناب شات')) return '/images/services/snapchat.webp';
  if (s.includes('twitter') || s.includes('تويتر') || s.includes('بريميوم تويتر')) return '/images/services/twitter_x.webp';
  if (s.includes('discord')) return '/images/services/discord.webp';
  if (s.includes('meyo') || s.includes('ميو')) return '/images/services/meyo.webp';
  if (s.includes('bigo') || s.includes('بيجو')) return '/images/services/bigo_live.webp';
  if (s.includes('likee') || s.includes('لايكي')) return '/images/services/likee.webp';
  if (s.includes('azar') || s.includes('ازار')) return '/images/services/azar.webp';
  if (s.includes('imo') || s.includes('ايمو')) return '/images/services/imo.webp';
  if (s.includes('whatsapp') || s.includes('واتساب')) return '/images/services/whatsapp.webp';

  // 5. Telecom, Syrian Cards & ISPs
  if (s.includes('syriatel') || s.includes('سيرياتيل')) return '/images/services/syriatel_v2.webp';
  if (s.includes('mtn') || s.includes('ام تي ان')) return '/images/services/mtn_v2.webp';
  if (s.includes('turkcell') || s.includes('توركسيل')) return '/images/services/turkcell.webp';
  if (s.includes('turk telekom')) return '/images/services/turk_telekom.webp';
  if (s.includes('vodafone')) return '/images/services/vodafone_cash.webp';
  if (s.includes('azez')) return '/images/services/azez_net.webp';
  if (s.includes('fursan')) return '/images/services/fursan_net.webp';
  if (
    s.includes('نت') ||
    s.includes('net') ||
    s.includes('تكامل') ||
    s.includes('ناس') ||
    s.includes('امنية') ||
    s.includes('امواج') ||
    s.includes('شركة دنيا') ||
    s.includes('شركة يارا') ||
    s.includes('wifi') ||
    s.includes('واي فاي')
  ) {
    return '/images/services/wifi_cards.webp';
  }

  // 6. Gift Cards & Game Stores
  if (s.includes('nintendo')) return '/images/services/nintendo_switch.webp';
  if (s.includes('xbox')) return '/images/services/xbox.webp';
  if (s.includes('noon') || s.includes('نون')) return '/images/services/noon.webp';
  if (s.includes('gamestop')) return '/images/services/gamestop.webp';
  if (s.includes('razer') || s.includes('رايزر')) return '/images/services/razer_gold.webp';
  if (s.includes('steam') || s.includes('ستيم')) return '/images/services/steam.webp';
  if (s.includes('playstation') || s.includes('بلايستيشن') || s.includes('psn')) return '/images/services/playstation.webp';
  if (s.includes('itunes') || s.includes('apple') || s.includes('ابل')) return '/images/services/apple_itunes.webp';
  if (s.includes('google play') || s.includes('جوجل بلاي')) return '/images/services/google_play.webp';
  if (s.includes('visa') || s.includes('mastercard') || s.includes('فيزا')) return '/images/services/visa_card.webp';
  if (s.includes('usdt') || s.includes('crypto')) return '/images/services/crypto_usdt.webp';

  // 7. GSM Software Tools
  if (s.includes('chimera')) return '/images/services/chimera.webp';
  if (s.includes('unlocktool') || s.includes('unlock tool')) return '/images/services/unlocktool.webp';
  if (s.includes('dft')) return '/images/services/dft_pro.webp';
  if (s.includes('eft')) return '/images/services/eft_pro.webp';
  if (s.includes('halabtech') || s.includes('halab')) return '/images/services/halabtech.webp';
  if (s.includes('tsm')) return '/images/services/tsm_tool.webp';
  if (s.includes('borneo')) return '/images/services/borneo_schematics.webp';

  // 8. VPN
  if (s.includes('express vpn') || s.includes('expressvpn')) return '/images/services/express_vpn.webp';
  if (s.includes('nord vpn') || s.includes('nordvpn')) return '/images/services/nord_vpn.webp';
  if (s.includes('proton vpn') || s.includes('protonvpn')) return '/images/services/proton_vpn.webp';
  if (s.includes('pure vpn')) return '/images/services/pure_vpn.webp';

  // Fallback to Category 3D Illustration
  const matchedCat = MAXBAZAR_CATEGORIES.find((c) => c.id === categoryId);
  return matchedCat?.image || '/images/maxbazar/v3/games_3d.webp';
}

function getProductCurrencyIcon(productName: string, categoryName: string, subCategory?: string | null): string {
  const p = (productName || '').toLowerCase();
  const c = (categoryName || '').toLowerCase();
  const s = (subCategory || '').toLowerCase();
  const combined = `${p} ${c} ${s}`;

  // 1. SyriaTel
  if (combined.includes('syriatel') || combined.includes('سيرياتيل') || combined.includes('سىرياتېل') || combined.includes('سير')) {
    return '/images/services/syriatel_v2.webp';
  }
  // 2. MTN
  if (combined.includes('mtn') || combined.includes('ام تي ان') || combined.includes('إم تي إن')) {
    return '/images/services/mtn_v2.webp';
  }
  // 3. PUBG Mobile UC
  if (combined.includes('pubg') || combined.includes('بوبجي') || combined.includes('ببجي') || combined.includes('uc')) {
    return '/images/currencies/pubg_uc.png';
  }
  // 4. Mobile Legends (MLBB) - All 3 types (Global, Asia, Turkey)
  if (combined.includes('mobile legends') || combined.includes('mlbb') || combined.includes('legend mobile') || combined.includes('باڭباڭ') || combined.includes('موبايل ليجند') || combined.includes('موبايل ليجندز')) {
    return '/images/currencies/mlbb_coupon_v2.png';
  }
  // 5. Free Fire (Neon Booyah Badge sent by user)
  if (combined.includes('free fire') || combined.includes('freefire') || combined.includes('فری فایر') || combined.includes('فري فاير')) {
    return '/images/currencies/freefire_v2.png';
  }
  // 6. Honor of Kings (Official Token Card sent by user)
  if (combined.includes('honor of kings') || combined.includes('honor') || combined.includes('hok') || combined.includes('هانر') || combined.includes('شرف الملوك') || combined.includes('king of glory')) {
    return '/images/currencies/hok_tokens_v2.png';
  }
  // 7. Roblox Robux
  if (combined.includes('roblox') || combined.includes('robux') || combined.includes('روبلوكس')) {
    return '/images/currencies/roblox_robux.png';
  }
  // 8. Telegram Stars
  if (combined.includes('telegram') || combined.includes('تیلیگرام') || combined.includes('تېلېگرامما') || combined.includes('stars') || combined.includes('نجوم')) {
    return '/images/currencies/telegram_star.png';
  }
  // 9. TikTok Coins
  if (combined.includes('tiktok') || combined.includes('تيك توك') || combined.includes('تېكتوك')) {
    return '/images/currencies/tiktok_coin.png';
  }
  // 10. Brawl Stars
  if (combined.includes('brawl') || combined.includes('براول')) {
    return '/images/currencies/brawl_stars_gem.png';
  }
  // 11. Clash of Clans (Gold 3D Shield Logo sent by user)
  if (combined.includes('clash of clans') || combined.includes('كلاش اوف كلانس') || combined.includes('كلاش ئوف كىلانس') || combined.includes('coc')) {
    return '/images/currencies/clash_of_clans_v2.png';
  }
  // 12. Clash Royale
  if (combined.includes('clash') || combined.includes('كلاش')) {
    return '/images/currencies/clash_gems.png';
  }
  // 13. Yalla Ludo
  if (combined.includes('yalla') || combined.includes('ludo') || combined.includes('يلا لودو')) {
    return '/images/currencies/yalla_ludo_gems.png';
  }
  // 14. Arena Breakout (ARENA BREAKOUT Logo sent by user)
  if (combined.includes('arena breakout') || combined.includes('breakout') || combined.includes('bonds') || combined.includes('بوند') || combined.includes('أرينا') || combined.includes('ئارىنا')) {
    return '/images/currencies/arena_breakout_v2.png';
  }
  // 15. Delta Force (Coins & Passes sent by user)
  if (combined.includes('delta force') || combined.includes('delta') || combined.includes('ديلتا') || combined.includes('دېلتا')) {
    return '/images/currencies/delta_force_v2.png';
  }
  // 16. Wifi Cards
  if (combined.includes('wifi') || combined.includes('واي فاي') || combined.includes('تور كارتى') || combined.includes('نت')) {
    return '/images/services/wifi_cards.webp';
  }

  // Fallback: 3D Game Diamond
  return '/images/currencies/diamond_generic.png';
}

function getSubcategorySortRank(name: string, categoryId: string | null): number {
  const s = (name || '').toLowerCase();
  if (categoryId === 'games') {
    // Row 1 (Matching screenshot exactly)
    if (s.includes('efootball') || s.includes('fc mobile') || s.includes('fifa') || s.includes('بيس')) return 10;
    if (s.includes('clash of clans')) return 20;
    if (s.includes('free fire') || s.includes('freefire')) return 30;
    if (s.includes('pubg mobile') || (s.includes('pubg') && !s.includes('lite') && !s.includes('new state') && !s.includes('offer') && !s.includes('additions') && !s.includes('global'))) return 40;

    // Row 2
    if (s.includes('wuthering waves')) return 50;
    if (s.includes('brawl stars')) return 60;
    if (s.includes('clash royale')) return 70;
    if (s.includes('hay day')) return 80;

    // Row 3 (Mobile Legends 3 Types)
    if (s.includes('mobile legends') || s.includes('mlbb') || s.includes('legend mobile')) {
      if (s.includes('tr') || s.includes('turkey') || s.includes('تركيا')) return 90;
      if (s.includes('next') || s.includes('special')) return 91;
      return 92;
    }

    // Row 4
    if (s.includes('roblox')) return 100;
    if (s.includes('call of duty') || s.includes('cod')) return 110;
    if (s.includes('blood strike')) return 120;
    if (s.includes('genshin')) return 130;

    // Row 5 & beyond
    if (s.includes('honor of kings')) return 140;
    if (s.includes('whiteout') || s.includes('white out')) return 150;
    if (s.includes('fortnite')) return 160;
    if (s.includes('farlight')) return 170;
    if (s.includes('revenge of sultans') || s.includes('انتقام السلاطين')) return 180;
    if (s.includes('king of avalon')) return 190;
    if (s.includes('top war')) return 200;
    if (s.includes('ball pool') || s.includes('8 ball')) return 210;
    if (s.includes('yalla ludo')) return 220;
    if (s.includes('jawaker')) return 230;
    if (s.includes('we play') || s.includes('weplay')) return 240;
    if (s.includes('kamlna')) return 250;
    if (s.includes('pubg new state')) return 260;
    if (s.includes('pubgm lite')) return 270;
    return 500;
  }
  return 500;
}

export default function MaxBazarApp() {
  const router = useRouter();
  const { lang, setLang, openLanguageModal, dir, isRTL } = useLanguage();
  const { maxstoreBalance, switchStore } = useStore();

  const mbT = MAXBAZAR_I18N[lang] || MAXBAZAR_I18N.ug;

  // Active Tab: 0 = الرئيسية, 1 = طلباتي, 2 = الشحن, 3 = الإيداعات, 4 = حسابي
  const [activeTab, setActiveTab] = useState<number>(0);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [depositFilter, setDepositFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');

  const [currentUser, setCurrentUser] = useState<ClientUser | null>(() => {
    if (typeof window !== 'undefined') return getCachedUser();
    return null;
  });

  const [providerProfile, setProviderProfile] = useState<{
    balance?: string | number;
    user_id?: number;
    username?: string;
  } | null>(null);

  // Live Catalog State from MaxStore API (1,418 products)
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({});
  const [categoryProducts, setCategoryProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string>('all');
  const [creditSubTab, setCreditSubTab] = useState<'balance' | 'baqat'>('balance');
  const [categorySearch, setCategorySearch] = useState('');
  const [mlbbSearch, setMlbbSearch] = useState('');
  const [searchProducts, setSearchProducts] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  // Order Placement Modal State
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [orderInputs, setOrderInputs] = useState<Record<string, string>>({});
  const [orderQty, setOrderQty] = useState<number>(1);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderResult, setOrderResult] = useState<any | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Sham Cash In-App Deposit Flow (Integrated directly into MAX-BAZAR)
  const [showShamCashDrawer, setShowShamCashDrawer] = useState(false);
  const [shamAmount, setShamAmount] = useState<number>(10);
  const [shamTxId, setShamTxId] = useState('');
  const [shamAddress, setShamAddress] = useState('efe8a2b200d66411c7c7e296369cbba8');
  const [shamExchangeRate, setShamExchangeRate] = useState(14390);
  const [shamSubmitting, setShamSubmitting] = useState(false);
  const [shamSuccess, setShamSuccess] = useState<any | null>(null);
  const [shamError, setShamError] = useState<string | null>(null);
  const [copiedShamAddress, setCopiedShamAddress] = useState(false);

  useEffect(() => {
    fetch('/api/deposits/config')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.shamcashAddress) setShamAddress(data.shamcashAddress);
          if (data.exchangeRate) setShamExchangeRate(data.exchangeRate);
        }
      })
      .catch(() => null);
  }, []);

  const copyShamAddress = () => {
    try {
      navigator.clipboard.writeText(shamAddress);
      setCopiedShamAddress(true);
      setTimeout(() => setCopiedShamAddress(false), 2000);
    } catch {}
  };

  const handleShamCashSubmit = async () => {
    if (!shamTxId.trim()) {
      setShamError(lang === 'ug' ? 'شامكەش مەشغۇلات تالون نومۇرى (رقم العملية) كىرگۈزۈڭ' : 'يرجى إدخال رقم العملية (TXID)');
      return;
    }
    setShamSubmitting(true);
    setShamError(null);
    setShamSuccess(null);

    try {
      const res = await fetch('/api/deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(shamAmount) || 0,
          method: 'شامكەش (Sham Cash)',
          txId: shamTxId.trim(),
          userName: currentUser?.name || 'MAX-BAZAR User',
          userEmail: currentUser?.email || `${userId}@maxbazar.app`,
          userId: userId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setShamSuccess(data.deposit || { amount: shamAmount, txId: shamTxId });
        setShamTxId('');
        fetch('/api/maxstore/status')
          .then((res) => res.json())
          .then((d) => {
            if (d.profile) setProviderProfile(d.profile);
          })
          .catch(() => null);
      } else {
        setShamError(data.message || (lang === 'ug' ? 'مەشغۇلات مەغلۇپ بولدى' : 'فشلت العملية'));
      }
    } catch (e: any) {
      setShamError(e?.message || 'Connection error');
    } finally {
      setShamSubmitting(false);
    }
  };

  useEffect(() => {
    const handleAuthChange = () => {
      setCurrentUser(getCachedUser());
    };
    window.addEventListener('autocash-auth-changed', handleAuthChange);
    return () => window.removeEventListener('autocash-auth-changed', handleAuthChange);
  }, []);

  // Fetch real-time live balance & profile from MaxStore Wholesale API
  useEffect(() => {
    fetch('/api/maxstore/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.profile) {
          setProviderProfile(data.profile);
        }
      })
      .catch(() => null);
  }, []);

  // Fetch live product category counts on mount
  useEffect(() => {
    fetch('/api/maxstore/products?category=all&limit=1')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.counts) {
          setCategoryCounts(data.counts);
        }
      })
      .catch(() => null);
  }, []);

  // Fetch products whenever a category is selected
  useEffect(() => {
    if (!selectedCategory) {
      setCategoryProducts([]);
      setSelectedSubCategory('all');
      setCreditSubTab('balance');
      return;
    }
    setLoadingProducts(true);
    setSelectedSubCategory('all');
    setCreditSubTab('balance');
    fetch(`/api/maxstore/products?category=${selectedCategory}&limit=1000`)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.products) {
          setCategoryProducts(data.products);
        }
      })
      .catch(() => null)
      .finally(() => setLoadingProducts(false));
  }, [selectedCategory]);

  // Live search debounced
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSearchProducts([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(() => {
      fetch(`/api/maxstore/products?q=${encodeURIComponent(q)}&limit=50`)
        .then((res) => res.json())
        .then((data) => {
          if (data.ok && data.products) {
            setSearchProducts(data.products);
          }
        })
        .catch(() => null)
        .finally(() => setSearching(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Unique subcategories inside the selected category
  const subCategories = useMemo(() => {
    if (!categoryProducts.length) return [];
    const set = new Set<string>();
    for (const p of categoryProducts) {
      if (p.category_name) set.add(p.category_name);
    }
    return Array.from(set);
  }, [categoryProducts]);

  // Structured subcategories with images, counts, and prices for 4-column visual grid
  const subCategoryCards = useMemo(() => {
    if (!categoryProducts.length) return [];
    const map = new Map<string, { name: string; count: number; image: string; minPrice: number; tag?: string }>();

    for (const p of categoryProducts) {
      const subName = (p.category_name || '').trim();
      if (!subName) continue;

      const price = Number(p.price) || 0;
      if (!map.has(subName)) {
        map.set(subName, {
          name: subName,
          count: 1,
          image: getSubcategoryImage(subName, selectedCategory),
          minPrice: price,
        });
      } else {
        const entry = map.get(subName)!;
        entry.count += 1;
        if (price > 0 && (entry.minPrice === 0 || price < entry.minPrice)) {
          entry.minPrice = price;
        }
      }
    }

    let cards = Array.from(map.values());

    // 1. If viewing Games: display in user's prioritized order, with Mobile Legends unified into 1 card
    if (selectedCategory === 'games') {
      const gameDefs = [
        // Top 8 prioritized by user
        { name: 'PUBG Mobile', match: (p: any) => (p.category_name||'').toLowerCase().includes('pubg') },
        { 
          name: 'Mobile Legends', 
          tag: '3 تۈر', 
          match: (p: any) => {
            const c = (p.category_name||'').toLowerCase();
            return (c.includes('legend') || c.includes('mlbb')) && !c.includes('asphalt');
          }
        },
        { name: 'Honor of Kings', match: (p: any) => (p.category_name||'').toLowerCase().includes('honor of kings') },
        { name: 'Delta Force', match: (p: any) => (p.category_name||'').toLowerCase().includes('delta force') },
        { name: 'Arena Breakout', match: (p: any) => (p.category_name||'').toLowerCase().includes('arena breakout') },
        { name: 'FreeFire', match: (p: any) => (p.category_name||'').toLowerCase().includes('freefire') },
        { name: 'Clash Of Clans', match: (p: any) => (p.category_name||'').toLowerCase().includes('clash of clans') },
        { name: 'Aceracer', match: (p: any) => (p.category_name||'').toLowerCase().includes('aceracer') },

        // Remaining Games from Catalog
        { name: 'eFootball', match: (p: any) => (p.category_name||'').toLowerCase().includes('efootball') },
        { name: 'Wuthering Waves', match: (p: any) => (p.category_name||'').toLowerCase().includes('wuthering waves') },
        { name: 'Brawl Stars', match: (p: any) => (p.category_name||'').toLowerCase().includes('brawl stars') },
        { name: 'Clash Royale', match: (p: any) => (p.category_name||'').toLowerCase().includes('clash royale') },
        { name: 'Hay Day', match: (p: any) => (p.category_name||'').toLowerCase().includes('hay day') },
        { name: 'Acecraft', match: (p: any) => (p.category_name||'').toLowerCase().includes('acecraft') },
        { name: 'Age of Empire Mobile', match: (p: any) => (p.category_name||'').toLowerCase().includes('age of empire') },
        { name: 'Crossout Mobile', match: (p: any) => (p.category_name||'').toLowerCase().includes('crossout') },
        { name: 'Blood Strike', match: (p: any) => (p.category_name||'').toLowerCase().includes('blood strike') },
        { name: 'Asphalt 9: Legends', match: (p: any) => (p.category_name||'').toLowerCase().includes('asphalt') },
        { name: 'Genshin Impact', match: (p: any) => (p.category_name||'').toLowerCase().includes('genshin') },
        { name: 'Farlight 84', match: (p: any) => (p.category_name||'').toLowerCase().includes('farlight') },
        { name: 'Eve Echoes', match: (p: any) => (p.category_name||'').toLowerCase().includes('eve echoes') },
        { name: 'Destiny: Rising', match: (p: any) => (p.category_name||'').toLowerCase().includes('destiny') },
        { name: 'Kingshot', match: (p: any) => (p.category_name||'').toLowerCase().includes('kingshot') },
        { name: 'Identity V', match: (p: any) => (p.category_name||'').toLowerCase().includes('identity v') },
        { name: 'Growtopia', match: (p: any) => (p.category_name||'').toLowerCase().includes('growtopia') },
        { name: 'Last War', match: (p: any) => (p.category_name||'').toLowerCase().includes('last war') },
        { name: 'Whiteout Survival', match: (p: any) => (p.category_name||'').toLowerCase().includes('whiteout') },
        { name: 'Oxide: Survival Island', match: (p: any) => (p.category_name||'').toLowerCase().includes('oxide') },
        { name: 'Lords Mobile', match: (p: any) => (p.category_name||'').toLowerCase().includes('lords mobile') },
        { name: 'انتقام السلاطين', match: (p: any) => (p.category_name||'').toLowerCase().includes('انتقام السلاطين') },
        { name: 'Last Island Of Survival', match: (p: any) => (p.category_name||'').toLowerCase().includes('last island of survival') && !(p.category_name||'').toLowerCase().includes('lite') },
        { name: 'Last Island Of Survival Lite', match: (p: any) => (p.category_name||'').toLowerCase().includes('last island of survival lite') },
        { name: 'Jawaker', match: (p: any) => (p.category_name||'').toLowerCase().includes('jawaker') },
        { name: 'FC Mobile', match: (p: any) => (p.category_name||'').toLowerCase().includes('fc mobile') },
      ];

      cards = gameDefs.map((def) => {
        const prods = categoryProducts.filter(def.match);
        const count = prods.length;
        const prices = prods.map((p) => Number(p.price) || 0).filter((pr) => pr > 0);
        const minPrice = prices.length ? Math.min(...prices) : 1;
        return {
          name: def.name,
          count: count || 1,
          image: getSubcategoryImage(def.name, selectedCategory),
          minPrice: minPrice || 1,
          tag: def.tag,
        };
      });
    }

    // 2. If viewing Credit (كارتىغا پۇل قاچىلاش): strictly ONLY Syriatel and MTN!
    if (selectedCategory === 'credit') {
      const syrProds = categoryProducts.filter((p) => {
        const c = (p.category_name || '').toLowerCase();
        const n = (p.name || '').toLowerCase();
        return c.includes('syria') || n.includes('syria') || c.includes('سيريا') || n.includes('سيريا');
      });
      const mtnProds = categoryProducts.filter((p) => {
        const c = (p.category_name || '').toLowerCase();
        const n = (p.name || '').toLowerCase();
        return c.includes('mtn') || n.includes('mtn');
      });

      cards = [
        {
          name: 'سىرياتېل (Syriatel)',
          count: syrProds.length || 16,
          image: '/images/services/syriatel_v2.webp',
          minPrice: 0.0075,
          tag: 'Syriatel',
        },
        {
          name: 'ئىمتىئېن (MTN)',
          count: mtnProds.length || 15,
          image: '/images/services/mtn_v2.webp',
          minPrice: 0.0075,
          tag: 'MTN',
        },
      ];
    }

    return cards;
  }, [categoryProducts, selectedCategory]);

  const filteredSubCategoryCards = useMemo(() => {
    const q = categorySearch.trim().toLowerCase();
    if (!q) return subCategoryCards;
    return subCategoryCards.filter((c) => c.name.toLowerCase().includes(q));
  }, [subCategoryCards, categorySearch]);

  // Dedicated Mobile Legends 3 Editions Data (exact replica of MaxStore user screenshot)
  const mlbbEditions = useMemo(() => {
    const turkeyProds = categoryProducts.filter((p) => (p.category_name || '').toLowerCase().includes('turkey'));
    const specialProds = categoryProducts.filter((p) => (p.category_name || '').toLowerCase().includes('special'));
    const globalProds = categoryProducts.filter((p) => {
      const c = (p.category_name || '').toLowerCase();
      return (c.includes('legend') || c.includes('mlbb')) && !c.includes('turkey') && !c.includes('special') && !c.includes('asphalt');
    });

    return [
      {
        id: 'Mobile Legends Global',
        title: 'Mobile 🫆 Legends',
        subtitle: lang === 'ug' ? 'خەلقئارالىق (Global)' : lang === 'ar' ? 'عالمي' : 'Global',
        tag: 'Global',
        count: globalProds.length,
        image: '/images/services/mlbb_global.webp',
      },
      {
        id: 'Mobile Legends Special',
        title: 'Mobile Legends',
        subtitle: lang === 'ug' ? 'ئاسىيا (Special)' : lang === 'ar' ? 'خاص / آسيا' : 'Special / Asia',
        tag: 'Special',
        count: specialProds.length,
        image: '/images/services/mlbb_special.webp',
      },
      {
        id: 'Mobile Legends Turkey',
        title: 'Mobile Legends',
        subtitle: lang === 'ug' ? 'تۈركىيە (Turkey)' : lang === 'ar' ? 'تركيا' : 'Turkey',
        tag: '🇹🇷 Turkey',
        count: turkeyProds.length,
        image: '/images/services/mlbb_turkey.webp',
      },
    ];
  }, [categoryProducts, lang]);

  const filteredMlbbEditions = useMemo(() => {
    const q = mlbbSearch.trim().toLowerCase();
    if (!q) return mlbbEditions;
    return mlbbEditions.filter((e) =>
      e.title.toLowerCase().includes(q) ||
      e.subtitle.toLowerCase().includes(q) ||
      (e.tag && e.tag.toLowerCase().includes(q))
    );
  }, [mlbbEditions, mlbbSearch]);

  // Filtered products list for selected category, sorted cleanly by price ascending
  const displayedProducts = useMemo(() => {
    let prods = categoryProducts;
    if (selectedSubCategory !== 'all') {
      const s = selectedSubCategory.toLowerCase();

      // Mobile Legends (3 types)
      if (s.includes('mobile legends') || s.includes('legend mobile') || s.includes('mlbb')) {
        if (s.includes('turkey') || s.includes('تۈركىيە')) {
          prods = categoryProducts.filter((p) => (p.category_name || '').toLowerCase().includes('turkey'));
        } else if (s.includes('special') || s.includes('ئاسىيا') || s.includes('فىلىپپىن')) {
          prods = categoryProducts.filter((p) => (p.category_name || '').toLowerCase().includes('special'));
        } else {
          prods = categoryProducts.filter((p) => {
            const c = (p.category_name || '').toLowerCase();
            return (c.includes('legend') || c.includes('mlbb')) && !c.includes('turkey') && !c.includes('special') && !c.includes('asphalt');
          });
        }
      }
      // Free Fire
      else if (s.includes('free fire') || s.includes('freefire')) {
        prods = categoryProducts.filter((p) => (p.category_name || '').toLowerCase().includes('freefire'));
      }
      // PUBG Mobile
      else if (s.includes('pubg')) {
        prods = categoryProducts.filter((p) => (p.category_name || '').toLowerCase().includes('pubg'));
      }
      // Clash Of Clans
      else if (s.includes('clash of clans')) {
        prods = categoryProducts.filter((p) => (p.category_name || '').toLowerCase().includes('clash of clans'));
      }
      // Clash Royale
      else if (s.includes('clash royale')) {
        prods = categoryProducts.filter((p) => (p.category_name || '').toLowerCase().includes('clash royale'));
      }
      // Last Island Of Survival Lite vs Full
      else if (s.includes('last island of survival lite')) {
        prods = categoryProducts.filter((p) => (p.category_name || '').toLowerCase().includes('last island of survival lite'));
      }
      else if (s.includes('last island')) {
        prods = categoryProducts.filter((p) => (p.category_name || '').toLowerCase().includes('last island of survival') && !(p.category_name || '').toLowerCase().includes('lite'));
      }
      // Syriatel (balance or baqat)
      else if (s.includes('syriatel') || s.includes('سيرياتيل') || s.includes('سىرياتېل')) {
        prods = categoryProducts.filter((p) => {
          const c = (p.category_name || '').toLowerCase();
          const n = (p.name || '').toLowerCase();
          return c.includes('syria') || n.includes('syria') || c.includes('سيريا') || n.includes('سيريا');
        });
        if (creditSubTab === 'balance') {
          prods = prods.filter((p) => (p as any).subType === 'balance' || p.name.includes('ليرة SYR'));
        } else if (creditSubTab === 'baqat') {
          prods = prods.filter((p) => (p as any).subType === 'baqat' || p.name.includes('باقة') || p.name.includes('غيغا') || p.name.includes('رسالة') || p.name.includes('دقيقة'));
        }
      }
      // MTN (balance or baqat)
      else if (s.includes('mtn') || s.includes('ئىمتىئېن') || s.includes('ام تي')) {
        prods = categoryProducts.filter((p) => {
          const c = (p.category_name || '').toLowerCase();
          const n = (p.name || '').toLowerCase();
          return c.includes('mtn') || n.includes('mtn');
        });
        if (creditSubTab === 'balance') {
          prods = prods.filter((p) => (p as any).subType === 'balance' || p.name.includes('ليرة SYR'));
        } else if (creditSubTab === 'baqat') {
          prods = prods.filter((p) => (p as any).subType === 'baqat' || p.name.includes('باقة') || p.name.includes('غيغا') || p.name.includes('رسالة') || p.name.includes('دقيقة'));
        }
      }
      // Arena Breakout
      else if (s.includes('arena breakout')) {
        prods = categoryProducts.filter((p) => {
          const c = (p.category_name || '').toLowerCase();
          const n = (p.name || '').toLowerCase();
          return c.includes('arena breakout') || n.includes('arena breakout') || n.includes('bonds');
        });
      }
      // Delta Force
      else if (s.includes('delta force')) {
        prods = categoryProducts.filter((p) => {
          const c = (p.category_name || '').toLowerCase();
          const n = (p.name || '').toLowerCase();
          return c.includes('delta') || n.includes('delta');
        });
      }
      // General Subcategory
      else {
        prods = categoryProducts.filter((p) => {
          const c = (p.category_name || '').toLowerCase();
          return p.category_name === selectedSubCategory || c.includes(s) || s.includes(c);
        });
      }
    }
    return [...prods].sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
  }, [categoryProducts, selectedSubCategory, creditSubTab]);

  // Handle Order Submit
  const handlePlaceOrder = async () => {
    if (!selectedProduct) return;
    setOrderSubmitting(true);
    setOrderError(null);
    setOrderResult(null);

    try {
      const res = await fetch('/api/maxstore/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProduct.id,
          qty: orderQty,
          params: orderInputs,
          product_name: selectedProduct.name || (selectedProduct as any).title || 'MaxStore مەھسۇلاتى',
          package_name: selectedProduct.name || '',
          price: (Number(selectedProduct.price) || 0) * orderQty,
          user_name: currentUser?.name || currentUser?.id || 'MaxStore خېرىدارى',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        setOrderError(data.error || 'فشل إرسال الطلب، تأكد من صحة البيانات أو الرصيد');
      } else {
        setOrderResult(data.data);
      }
    } catch (err: any) {
      setOrderError(err?.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const liveBalanceNum = providerProfile?.balance !== undefined
    ? parseFloat(String(providerProfile.balance))
    : (typeof maxstoreBalance === 'number' ? maxstoreBalance : 0.064);
  const balanceUSD = isNaN(liveBalanceNum) ? 0.064 : liveBalanceNum;
  const balanceDisplay = `${balanceUSD.toFixed(3)}$`;

  const userId = providerProfile?.user_id ? String(providerProfile.user_id) : (currentUser?.id || '7575664493');

  const copyToClipboard = (text: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    } catch {}
  };

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return MAXBAZAR_CATEGORIES;
    const q = searchQuery.toLowerCase().trim();
    return MAXBAZAR_CATEGORIES.filter((c) => {
      const localizedName = (MAXBAZAR_CATEGORIES_I18N[c.id]?.name[lang] || c.nameAr).toLowerCase();
      return (
        localizedName.includes(q) ||
        c.nameAr.toLowerCase().includes(q) ||
        c.nameUg.toLowerCase().includes(q) ||
        c.sampleItems.some((i) => i.toLowerCase().includes(q))
      );
    });
  }, [searchQuery, lang]);

  return (
    <div
      dir={dir}
      className={`min-h-screen pb-24 transition-colors font-alkatip select-none relative ${
        isDarkMode ? 'bg-[#0A0F1D] text-slate-100' : 'bg-[#F2F4FB] text-slate-900'
      }`}
    >
      {/* =========================================================================
          AMBIENT UYGHUR CULTURAL BACKGROUND BACKDROP
          (Fixed, pointer-events-none, z-0: 100% non-blocking, zero layout shift)
      ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <Image
          src="/images/maxbazar/uyghur_bg.webp"
          alt=""
          fill
          priority
          unoptimized
          className={`object-cover object-top transition-opacity duration-700 ${
            isDarkMode ? 'opacity-30 mix-blend-luminosity' : 'opacity-35'
          }`}
        />
        {/* Soft Vignette / Gradient Mask ensuring cards, text, and buttons remain 100% crisp & legible */}
        <div
          className={`absolute inset-0 transition-colors duration-700 ${
            isDarkMode
              ? 'bg-gradient-to-b from-[#0A0F1D]/60 via-[#0A0F1D]/85 to-[#0A0F1D]'
              : 'bg-gradient-to-b from-white/30 via-[#F2F4FB]/85 to-[#F2F4FB]'
          }`}
        />
      </div>

      {/* =========================================================================
          1. TELEGRAM MINI APP TOP HEADER (Blue Theme Matching Screenshot)
      ========================================================================= */}
      <div className="sticky top-0 z-50 bg-[#3744D9] text-white pt-[env(safe-area-inset-top,0px)] shadow-md">
        <div className="max-w-md mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                // Exit or return to main store
                switchStore('autocash');
                router.push('/');
              }}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition text-white"
              title="خروج / العودة إلى AUTO CASH"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer font-bold text-base tracking-wide">
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-amber-300/60 shadow-md shadow-amber-500/20 shrink-0 bg-transparent">
                <Image
                  src="/images/maxbazar/v3/maxbazar_gold_round.png"
                  alt="MAX-BAZAR"
                  fill
                  className="object-cover scale-105"
                  priority
                />
              </div>
              <span>MAX-BAZAR</span>
              <ChevronDown className="w-4 h-4 opacity-80" />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => switchStore('autocash')}
              className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition flex items-center gap-1"
              title="التبديل إلى AUTO CASH"
            >
              <span>AUTO CASH</span>
              <ExternalLink className="w-3 h-3" />
            </button>
            <button className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition text-white">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Pill Action Bar (Screenshot 1 top controls) */}
        <div className={`px-4 py-2 border-t border-white/10 ${isDarkMode ? 'bg-[#10182F]' : 'bg-[#E7ECF9]'}`}>
          <div className="max-w-md mx-auto flex items-center justify-between gap-1.5">
            {/* Balance Pill Button */}
            <button
              onClick={() => setActiveTab(2)} // Navigate to Deposit
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#4E5AE8] hover:bg-[#3D47D9] text-white text-xs font-black shadow-sm transition active:scale-95 group"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3] group-hover:rotate-90 transition-transform" />
              <span className="font-mono">{balanceDisplay}</span>
              <span className="inline-flex items-center justify-center w-4 h-4 shrink-0 aspect-square select-none leading-none">
                <svg
                  viewBox="0 0 24 24"
                  className="w-4 h-4 shrink-0 aspect-square animate-dollar-coin drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="mbGoldCoinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FEF08A" />
                      <stop offset="30%" stopColor="#FBBF24" />
                      <stop offset="70%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#D97706" />
                    </linearGradient>
                    <linearGradient id="mbGoldRimGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFFBEB" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#92400E" />
                    </linearGradient>
                  </defs>
                  <circle cx="12" cy="12" r="11" fill="url(#mbGoldRimGrad)" />
                  <circle cx="12" cy="12" r="9.5" fill="url(#mbGoldCoinGrad)" stroke="#FEF9C3" strokeWidth="0.7" />
                  <circle cx="12" cy="12" r="7.8" fill="none" stroke="#78350F" strokeWidth="0.6" strokeDasharray="1.2 1" opacity="0.45" />
                  <text
                    x="12"
                    y="16"
                    textAnchor="middle"
                    fontSize="12"
                    fontWeight="900"
                    fontFamily="system-ui, -apple-system, sans-serif"
                    fill="#78350F"
                  >
                    $
                  </text>
                </svg>
              </span>
            </button>

            {/* Quick Control Icons */}
            <div className="flex items-center gap-1.5">
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-7 h-7 rounded-full flex items-center justify-center transition border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-amber-300'
                    : 'bg-white border-slate-200 text-slate-700 shadow-xs'
                }`}
                title="الوضع الليلي / النهاري"
              >
                {isDarkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
              </button>

              {/* Notification Bell */}
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                className={`relative w-7 h-7 rounded-full flex items-center justify-center transition border ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-300'
                    : 'bg-white border-slate-200 text-slate-700 shadow-xs'
                }`}
                title={mbT.notifications}
              >
                <Bell className="w-3.5 h-3.5 text-amber-500" />
                {hasUnreadNotifications && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-500 border border-white dark:border-slate-800" />
                )}
              </button>

              {/* 6 Languages Switcher Button */}
              <button
                type="button"
                onClick={openLanguageModal}
                className={`h-7 px-2.5 rounded-full flex items-center justify-center gap-1.5 text-xs font-bold transition border cursor-pointer active:scale-95 ${
                  isDarkMode
                    ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-xs'
                }`}
                title={mbT.languageSelect}
              >
                <Globe2 className="w-3.5 h-3.5 text-[#3744D9] dark:text-blue-400 shrink-0" />
                <span className="text-[11px] font-bold whitespace-nowrap">{mbT.languageSelect}</span>
              </button>

              {/* Avatar / Profile quick click */}
              <button
                onClick={() => setActiveTab(4)}
                className="w-8 h-8 rounded-full bg-[#FFD027] border-2 border-white shadow-sm flex items-center justify-center overflow-hidden active:scale-95 transition"
                title="حسابي"
              >
                <span className="text-base select-none">😊</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN CONTENT BODY (Dynamic Switcher for 5 screens or Notifications)
      ========================================================================= */}
      <main className="max-w-md mx-auto px-4 py-4 pb-28 relative z-10">

        {/* -------------------------------------------------------------------
            NOTIFICATIONS VIEW (Triggered by Bell Icon in Header)
        ------------------------------------------------------------------- */}
        {showNotifications ? (
          <div className="space-y-4 animate-fadeIn">
            {/* Top Back Action */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowNotifications(false)}
                className="text-xs font-bold text-[#3744D9] dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
              >
                <span>{isRTL ? '› ' : '‹ '}{mbT.back}</span>
              </button>
            </div>

            {/* Title & Mark All Read */}
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {mbT.notifications}
              </h1>
              <button
                onClick={() => setHasUnreadNotifications(false)}
                className="text-xs text-slate-500 hover:text-[#3744D9] dark:hover:text-blue-400 mt-1 flex items-center gap-1 font-bold transition cursor-pointer"
              >
                <span>{mbT.markAllRead}</span>
              </button>
            </div>

            {/* Instant Notification Info Banner */}
            <div
              className={`p-3.5 rounded-2xl border text-xs leading-relaxed font-medium ${
                isDarkMode
                  ? 'bg-[#131C33] border-blue-500/30 text-slate-300'
                  : 'bg-white border-blue-200/80 text-slate-700 shadow-xs'
              }`}
            >
              {mbT.notificationNotice}
            </div>

            {/* Notification Cards List */}
            <div className="space-y-3">
              {/* Card 1: Balance Added (Sham Cash) */}
              <div
                className={`p-4 rounded-3xl border shadow-sm transition-all ${
                  isDarkMode ? 'bg-[#10182F] border-slate-800' : 'bg-white border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-xl shrink-0">
                    💰
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>
                        {lang === 'ug'
                          ? '✅ ھېسابات قالدۇقى تولۇقلاندى'
                          : lang === 'ar'
                          ? '✅ تمت إضافة الرصيد'
                          : lang === 'tr'
                          ? '✅ Bakiye Yüklendi'
                          : lang === 'uz'
                          ? '✅ Balans to‘ldirildi'
                          : lang === 'ru'
                          ? '✅ Баланс пополнен'
                          : '✅ Balance Added'}
                      </span>
                    </h4>
                    <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1 mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">💰 {lang === 'ug' ? 'سوممىسى:' : lang === 'ar' ? 'المبلغ:' : 'Amount:'}</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">${(shamSuccess?.amount || 5).toString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">💳 {lang === 'ug' ? 'ئۇسۇلى:' : lang === 'ar' ? 'الطريقة:' : 'Method:'}</span>
                        <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">shamcash</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">👛 {lang === 'ug' ? 'يېڭى قالدۇق سوممىڭىز:' : lang === 'ar' ? 'رصيدك الجديد:' : 'New Balance:'}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">${balanceUSD.toFixed(3)}</span>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2.5 font-mono">
                      13:14:06 03/11/2026
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Account Verified */}
              <div
                className={`p-4 rounded-3xl border shadow-sm transition-all ${
                  isDarkMode ? 'bg-[#10182F] border-slate-800' : 'bg-white border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center text-xl shrink-0">
                    🔔
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>
                        {lang === 'ug'
                          ? '🎉 ھېساباتىڭىز مۇۋەپپەقىيەتلىك دەلىللەندى!'
                          : lang === 'ar'
                          ? '🎉 تم توثيق حسابك بنجاح!'
                          : lang === 'tr'
                          ? '🎉 Hesabınız başarıyla doğrulandı!'
                          : lang === 'uz'
                          ? '🎉 Hisobingiz muvaffaqiyatli tasdiqlandi!'
                          : lang === 'ru'
                          ? '🎉 Ваш аккаунт успешно верифицирован!'
                          : '🎉 Account Verified Successfully!'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {lang === 'ug'
                        ? 'ھازىر بارلىق تۈر ۋە پۇل تۆلەش ئۇسۇللىرىنى ئىشلىتەلەيسىز.'
                        : lang === 'ar'
                        ? 'يمكنك الآن استخدام كل طرق الدفع.'
                        : lang === 'tr'
                        ? 'Artık tüm ödeme yöntemlerini kullanabilirsiniz.'
                        : lang === 'uz'
                        ? 'Endi barcha to‘lov usullaridan foydalanishingiz mumkin.'
                        : lang === 'ru'
                        ? 'Теперь вы можете использовать все способы оплаты.'
                        : 'You can now use all payment methods.'}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-2.5 font-mono">
                      13:09:28 03/11/2026
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 3: Dynamic Order Notification if placed */}
              {orderResult && (
                <div
                  className={`p-4 rounded-3xl border shadow-sm transition-all ${
                    isDarkMode ? 'bg-[#10182F] border-slate-800' : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-xl shrink-0">
                      ⚡
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>
                          {lang === 'ug'
                            ? '🛍️ زاكازىڭىز مۇۋەپپەقىيەتلىك بېجىرىلدى'
                            : lang === 'ar'
                            ? '🛍️ تم استلام وتنفيذ طلبك'
                            : '🛍️ Order Executed Successfully'}
                        </span>
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {lang === 'ug'
                          ? 'مۇلازىمەت ھېساباتىڭىزغا قاچىلاندى.'
                          : lang === 'ar'
                          ? 'تم شحن الخدمة بنجاح وتأكيد المعاملة فوراً.'
                          : 'Service has been recharged to your account.'}
                      </p>
                      <div className="text-[10px] text-slate-400 mt-2.5 font-mono">
                        {new Date().toLocaleTimeString('en-GB')} {new Date().toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Card 4: Telegram Bot Alert */}
              <div
                className={`p-4 rounded-3xl border shadow-sm transition-all ${
                  isDarkMode ? 'bg-[#10182F] border-slate-800' : 'bg-white border-slate-200/80'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/15 text-sky-500 flex items-center justify-center text-xl shrink-0">
                    🤖
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>
                        {lang === 'ug'
                          ? '🤖 ھېساباتىڭىز MAX-BAZAR بوتىغا ئۇلاندى'
                          : lang === 'ar'
                          ? '🤖 تم ربط حسابك ببوت MAX-BAZAR'
                          : '🤖 Account Connected to MAX-BAZAR Bot'}
                      </span>
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      {lang === 'ug'
                        ? 'بارلىق يېڭى ئۇچۇرلار @maxbazar_bot ئارقىلىق دەرھال يەتكۈزۈلىدۇ.'
                        : lang === 'ar'
                        ? 'ستصلك جميع التنبيهات الفورية أولاً بأول عبر بوت التليجرام @maxbazar_bot'
                        : 'All instant notifications are delivered via @maxbazar_bot.'}
                    </p>
                    <div className="text-[10px] text-slate-400 mt-2.5 font-mono">
                      12:45:00 03/11/2026
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
        {/* -------------------------------------------------------------------
            SCREEN 0: الرئيسية (Home Storefront or Dedicated Category Page)
        ------------------------------------------------------------------- */}
        {activeTab === 0 && (
          <div className="space-y-4 animate-fadeIn">
            {/* If NO category selected: Show Global Search & 13 Categories */}
            {!selectedCategory ? (
              <>
                {/* Search Input Box */}
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={mbT.searchPlaceholder}
                    className={`w-full py-2.5 ps-10 pe-4 rounded-2xl text-xs font-medium transition outline-none border ${
                      isDarkMode
                        ? 'bg-[#151F36] border-slate-800 text-white placeholder-slate-500 focus:border-blue-500'
                        : 'bg-white border-slate-200/90 text-slate-900 placeholder-slate-400 focus:border-[#3744D9] shadow-xs'
                    }`}
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Instant Search Results Drawer */}
                {searchQuery.trim() && (
                  <div className={`p-4 rounded-3xl border transition-all ${
                    isDarkMode ? 'bg-[#131C33] border-blue-500/30' : 'bg-white border-blue-200 shadow-md'
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Search className="w-4 h-4 text-[#3744D9]" />
                        <h3 className="font-black text-xs text-slate-900 dark:text-white">
                          {mbT.searchResults} &ldquo;{searchQuery}&rdquo;
                        </h3>
                      </div>
                      {searching ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#3744D9]" />
                      ) : (
                        <span className="text-[11px] font-bold text-slate-400">
                          {searchProducts.length} {mbT.products}
                        </span>
                      )}
                    </div>

                    {searching && searchProducts.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-[#3744D9]" />
                        <span>{mbT.searchingInCatalog}</span>
                      </div>
                    ) : searchProducts.length === 0 ? (
                      <div className="py-6 text-center text-xs text-slate-400">
                        {mbT.noProductsFound}
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-72 overflow-y-auto pe-1">
                        {searchProducts.map((p) => {
                          const pPrice = Number(p.price) || 0;
                          return (
                            <div
                              key={p.id}
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                                isDarkMode
                                  ? 'bg-[#0E1528] border-slate-800 hover:border-blue-500/50'
                                  : 'bg-slate-50 border-slate-200/80 hover:border-blue-300'
                              }`}
                            >
                              <div className="min-w-0 pe-2">
                                <h4 className="font-bold text-slate-900 dark:text-white truncate text-xs">
                                  {p.product_name || p.name}
                                </h4>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[10px] text-slate-400">
                                    {p.category_name}
                                  </span>
                                  <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 font-mono">
                                    {pPrice.toFixed(3)}$
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  setSelectedProduct(p);
                                  setOrderInputs({});
                                  setOrderQty(1);
                                  setOrderError(null);
                                  setOrderResult(null);
                                }}
                                className="shrink-0 px-3 py-1.5 rounded-xl bg-[#3744D9] hover:bg-blue-700 text-white text-[11px] font-black shadow-xs transition active:scale-95"
                              >
                                {mbT.fastOrder} ⚡
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Section Header: تصنيفات المتجر (Count 13) */}
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-[#3744D9]" />
                    <h2 className="text-sm font-black text-slate-900 dark:text-white">
                      {mbT.storeCategories}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-[#4E5AE8]/15 text-[#3744D9] dark:text-blue-400 text-[11px] font-black">
                      {filteredCategories.length}
                    </span>
                  </div>
                </div>

                {/* Categories Grid (Styled with full-bleed authentic provider squircle cards) */}
                <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 pt-1">
                  {filteredCategories.map((cat) => {
                    const catTitle = MAXBAZAR_CATEGORIES_I18N[cat.id]?.name[lang] || cat.nameAr;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setSelectedSubCategory('all');
                          setCreditSubTab('balance');
                          setCategorySearch('');
                        }}
                        className="group flex flex-col items-center cursor-pointer active:scale-95 transition-all text-center"
                      >
                        <div className="relative aspect-square w-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-md border border-slate-200/70 dark:border-slate-800 transition-all duration-300 group-hover:shadow-xl group-hover:-translate-y-0.5 bg-gradient-to-b from-sky-50 to-sky-100/40 dark:from-slate-900 dark:to-slate-950">
                          <Image
                            src={cat.image}
                            alt={catTitle}
                            fill
                            sizes="(max-width: 640px) 25vw, 120px"
                            className="object-cover"
                            unoptimized
                            priority
                          />
                        </div>

                        <span className="text-[10px] sm:text-[11.5px] font-black font-alkatip text-slate-800 dark:text-slate-100 mt-1.5 line-clamp-2 leading-tight text-center break-words px-0.5 min-h-[26px] flex items-center justify-center">
                          {catTitle}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* DEDICATED CATEGORY VIEW (Exact layout from user screenshot) */
              (() => {
                const currentCat = MAXBAZAR_CATEGORIES.find((c) => c.id === selectedCategory);
                const catTitle = MAXBAZAR_CATEGORIES_I18N[currentCat?.id || '']?.name[lang] || currentCat?.nameAr;
                const isMlbbHub = selectedCategory === 'games' && selectedSubCategory === 'Mobile Legends';
                const isMlbbEdition = selectedCategory === 'games' && (
                  selectedSubCategory === 'Mobile Legends Turkey' ||
                  selectedSubCategory === 'Mobile Legends Special' ||
                  selectedSubCategory === 'Mobile Legends Global'
                );

                return (
                  <div className="space-y-3">
                    {/* App-like Sleek Category Navigation Bar */}
                    <div className="flex items-center justify-between gap-3 pb-1 pt-0.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <button
                          onClick={() => {
                            if (isMlbbEdition) {
                              setSelectedSubCategory('Mobile Legends');
                            } else if (selectedSubCategory !== 'all') {
                              setSelectedSubCategory('all');
                              setCreditSubTab('balance');
                            } else {
                              setSelectedCategory(null);
                              setCategorySearch('');
                            }
                          }}
                          className="w-9 h-9 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-xs flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-700 transition active:scale-90 cursor-pointer shrink-0"
                          title={mbT.back}
                        >
                          {isRTL ? <ChevronRight className="w-5 h-5 stroke-[2.5]" /> : <ChevronLeft className="w-5 h-5 stroke-[2.5]" />}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight truncate">
                              {selectedSubCategory === 'all'
                                ? catTitle
                                : isMlbbEdition
                                ? (selectedSubCategory === 'Mobile Legends Turkey'
                                    ? (lang === 'ug' ? 'Mobile Legends (تۈركىيە)' : lang === 'ar' ? 'Mobile Legends (تركيا)' : 'Mobile Legends (Turkey)')
                                    : selectedSubCategory === 'Mobile Legends Special'
                                    ? (lang === 'ug' ? 'Mobile Legends (ئاسىيا Special)' : lang === 'ar' ? 'Mobile Legends (خاص)' : 'Mobile Legends (Special)')
                                    : (lang === 'ug' ? 'Mobile 🫆 Legends (خەلقئارا)' : lang === 'ar' ? 'Mobile 🫆 Legends (عالمي)' : 'Mobile 🫆 Legends (Global)'))
                                : selectedSubCategory}
                            </h1>
                            {selectedSubCategory !== 'all' && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-[#3744D9] dark:text-blue-400 font-bold shrink-0">
                                {isMlbbEdition ? 'Mobile Legends' : catTitle}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                            {selectedSubCategory === 'all'
                              ? (lang === 'ug' ? `${filteredSubCategoryCards.length} ئويۇن كۆرسىتىلدى` : lang === 'ar' ? `${filteredSubCategoryCards.length} لعبة متاحة` : `${filteredSubCategoryCards.length} games available`)
                              : isMlbbHub
                              ? (lang === 'ug' ? '3 تۈردىكى تاللاش' : lang === 'ar' ? '3 أقسام متاحة' : '3 editions available')
                              : (lang === 'ug' ? `${displayedProducts.length} بولاق سېتىشتا` : lang === 'ar' ? `${displayedProducts.length} باقة متاحة` : `${displayedProducts.length} packages available`)}
                          </p>
                        </div>
                      </div>

                      {/* Quick Home Pill */}
                      <button
                        onClick={() => {
                          setSelectedCategory(null);
                          setSelectedSubCategory('all');
                          setCreditSubTab('balance');
                          setCategorySearch('');
                          setMlbbSearch('');
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 transition active:scale-95 flex items-center gap-1.5 shrink-0"
                      >
                        <HomeIcon className="w-3.5 h-3.5 text-[#3744D9]" />
                        <span>{mbT.home}</span>
                      </button>
                    </div>

                    {/* View 1.5: Dedicated Mobile Legends 3-Editions Hub Page (exact replica of user screenshot) */}
                    {isMlbbHub ? (
                      <div className="space-y-4 pt-1 animate-fadeIn">
                        {/* Top Breadcrumb & Back text button matching screenshot */}
                        <div className="flex items-center justify-between pb-0.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
                            <button
                              onClick={() => setSelectedSubCategory('all')}
                              className="hover:text-[#3744D9] dark:hover:text-blue-400 transition cursor-pointer"
                            >
                              {lang === 'ug' ? 'باش بەت' : lang === 'ar' ? 'الرئيسية' : 'Home'}
                            </button>
                            <span className="opacity-40">›</span>
                            <span className="text-slate-900 dark:text-white font-black">Mobile Legends</span>
                          </div>

                          <button
                            onClick={() => setSelectedSubCategory('all')}
                            className="text-xs font-bold text-[#3744D9] dark:text-blue-400 flex items-center gap-1 hover:underline cursor-pointer"
                          >
                            <span>{isRTL ? '› ' : '‹ '}{lang === 'ug' ? 'قايتىش' : lang === 'ar' ? 'رجوع' : 'Back'}</span>
                          </button>
                        </div>

                        {/* Big Section Header banner matching screenshot */}
                        <div>
                          <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Mobile Legends
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                            {lang === 'ug'
                              ? 'تۆۋەندىكى تۈرلەردىن بىرىنى تاللاپ كۆرۈڭ ۋە سېتىۋېلىڭ'
                              : lang === 'ar'
                              ? 'اختر من التصنيفات التالية للمشاهدة والشراء'
                              : 'Choose from the following categories to view and purchase'}
                          </p>
                        </div>

                        {/* Search inside MLBB section matching screenshot */}
                        <div className="relative">
                          <input
                            type="text"
                            value={mlbbSearch}
                            onChange={(e) => setMlbbSearch(e.target.value)}
                            placeholder={lang === 'ug' ? 'بۇ بۆلەكتىن ئىزدەڭ...' : lang === 'ar' ? 'ابحث داخل هذا القسم...' : 'Search inside this section...'}
                            className={`w-full py-2.5 ps-9 pe-8 rounded-2xl text-xs font-medium transition outline-none border ${
                              isDarkMode
                                ? 'bg-[#151F36] border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                                : 'bg-white border-slate-200/90 text-slate-900 placeholder-slate-400 focus:border-[#3744D9] shadow-xs'
                            }`}
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          {mlbbSearch && (
                            <button
                              onClick={() => setMlbbSearch('')}
                              className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* 3 Mobile Legends Sub-cards matching screenshot */}
                        <div className="grid grid-cols-3 gap-3 pt-2">
                          {filteredMlbbEditions.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => {
                                setSelectedSubCategory(item.id);
                                setMlbbSearch('');
                              }}
                              className="group flex flex-col items-center cursor-pointer active:scale-95 transition-all text-center"
                            >
                              <MaxBazarCardArtwork
                                image={item.image}
                                name={item.title}
                                tag={item.tag}
                                category="games"
                              />
                              <span className="text-[10px] sm:text-[11px] font-bold font-alkatip text-slate-800 dark:text-slate-100 text-center mt-1.5 line-clamp-2 leading-tight break-words px-0.5 min-h-[26px] flex items-center justify-center">
                                <bdi>{item.title}</bdi>
                              </span>
                              <span className="text-[9px] text-[#3744D9] dark:text-blue-400 font-bold -mt-0.5">
                                {item.subtitle}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : selectedSubCategory === 'all' ? (
                      <>
                        {/* Search Inside Category */}
                        <div className="relative">
                          <input
                            type="text"
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            placeholder={mbT.searchInsideCategory}
                            className={`w-full py-2.5 ps-9 pe-8 rounded-2xl text-xs font-medium transition outline-none border ${
                              isDarkMode
                                ? 'bg-[#151F36] border-slate-700 text-white placeholder-slate-500 focus:border-blue-500'
                                : 'bg-white border-slate-200/90 text-slate-900 placeholder-slate-400 focus:border-[#3744D9] shadow-xs'
                            }`}
                          />
                          <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          {categorySearch && (
                            <button
                              onClick={() => setCategorySearch('')}
                              className="absolute end-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        {/* Loading / Empty / Grid */}
                        {loadingProducts ? (
                          <div className="py-16 text-center flex flex-col items-center justify-center gap-2.5">
                            <Loader2 className="w-7 h-7 animate-spin text-[#3744D9]" />
                            <span className="text-xs text-slate-400 font-bold">{mbT.searchingInCatalog}</span>
                          </div>
                        ) : filteredSubCategoryCards.length === 0 ? (
                          <div className="py-12 text-center text-xs text-slate-400">
                            {mbT.noProductsFound}
                          </div>
                        ) : (
                          <div className="grid grid-cols-4 gap-2.5 sm:gap-3.5 pt-1">
                            {filteredSubCategoryCards.map((item) => (
                              <div
                                key={item.name}
                                onClick={() => setSelectedSubCategory(item.name)}
                                className="group flex flex-col items-center cursor-pointer active:scale-95 transition-all text-center"
                              >
                                <MaxBazarCardArtwork
                                  image={item.image}
                                  name={item.name}
                                  tag={item.tag}
                                  category={selectedCategory}
                                />
                                <span
                                  className="text-[10px] sm:text-[11px] font-bold font-alkatip text-slate-800 dark:text-slate-100 text-center mt-1.5 line-clamp-2 leading-tight break-words px-0.5 min-h-[26px] flex items-center justify-center"
                                >
                                  <bdi>{item.name}</bdi>
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      /* View 2: Specific Subcategory Product Packs List */
                      <div className="space-y-3 pt-1">
                        <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-blue-500/10 via-blue-500/5 to-transparent border border-blue-500/20">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-slate-700 bg-slate-900 shrink-0">
                              <Image
                                src={getSubcategoryImage(selectedSubCategory, selectedCategory) || '/brand_logo.png'}
                                alt={selectedSubCategory}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                            <div className="min-w-0">
                              <h3 className="font-black text-sm text-slate-900 dark:text-white truncate">
                                {isMlbbEdition
                                  ? (selectedSubCategory === 'Mobile Legends Turkey'
                                      ? (lang === 'ug' ? 'Mobile Legends (تۈركىيە)' : lang === 'ar' ? 'Mobile Legends (تركيا)' : 'Mobile Legends (Turkey)')
                                      : selectedSubCategory === 'Mobile Legends Special'
                                      ? (lang === 'ug' ? 'Mobile Legends (ئاسىيا Special)' : lang === 'ar' ? 'Mobile Legends (خاص)' : 'Mobile Legends (Special)')
                                      : (lang === 'ug' ? 'Mobile 🫆 Legends (خەلقئارا)' : lang === 'ar' ? 'Mobile 🫆 Legends (عالمي)' : 'Mobile 🫆 Legends (Global)'))
                                  : selectedSubCategory}
                              </h3>
                              <span className="text-[10px] text-[#3744D9] dark:text-blue-400 font-bold">
                                {displayedProducts.length} {mbT.products}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              if (isMlbbEdition) {
                                setSelectedSubCategory('Mobile Legends');
                              } else {
                                setSelectedSubCategory('all');
                                setCreditSubTab('balance');
                              }
                            }}
                            className="shrink-0 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-xs hover:bg-slate-50 transition cursor-pointer"
                          >
                            {mbT.back}
                          </button>
                        </div>

                        {/* Dedicated PWA Micro-App Promo Card */}
                        {selectedSubCategory.toLowerCase().includes('honor') && (
                          <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-500/20 via-[#151F38] to-[#0D1527] border border-amber-500/40 flex items-center justify-between gap-3 shadow-md animate-fadeIn">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-9 h-9 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-300 font-bold text-base">
                                👑
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-black text-amber-300 block truncate">Honor of Kings مەخسۇس PWA ئەپى تەييار!</span>
                                <span className="text-[10px] text-slate-300 block truncate">تېلېفونىڭىزغا قاچىلاپ، تېلېگرامما كودى بىلەن سېكۇنتتا قاچىلاڭ</span>
                              </div>
                            </div>
                            <a
                              href="/apps/honor-of-kings"
                              target="_blank"
                              rel="noreferrer"
                              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs whitespace-nowrap shadow-sm transition active:scale-95 shrink-0"
                            >
                              ئەپنى ئېچىش 🚀
                            </a>
                          </div>
                        )}

                        {/* If in credit category (كارتىغا پۇل قاچىلاش), show strictly 2 toggle tabs: كارتا پۇلى vs باقات شەھرىيە */}
                        {selectedCategory === 'credit' && (
                          <div className="space-y-2.5">
                            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
                              <button
                                onClick={() => setCreditSubTab('balance')}
                                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                                  creditSubTab === 'balance'
                                    ? 'bg-white dark:bg-[#12192e] text-[#3744D9] dark:text-blue-400 shadow-sm border border-blue-500/20'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                              >
                                <span>💳</span>
                                <span>{lang === 'ug' ? 'كارتا پۇلى' : lang === 'ar' ? 'رصيد SyriaTel' : 'Balance'}</span>
                              </button>
                              <button
                                onClick={() => setCreditSubTab('baqat')}
                                className={`flex-1 py-2 rounded-xl text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1.5 text-center ${
                                  creditSubTab === 'baqat'
                                    ? 'bg-white dark:bg-[#12192e] text-[#3744D9] dark:text-blue-400 shadow-sm border border-blue-500/20'
                                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                                }`}
                              >
                                <span>🌐</span>
                                <span>{lang === 'ug' ? 'ئايلىق تورلار (باقات شەھرىيە)' : lang === 'ar' ? 'باقات شهرية' : 'Monthly Bundles'}</span>
                              </button>
                            </div>

                            {/* Official Number Format Information Banner (Matching Upstream Screenshot) */}
                            <div className="p-3 rounded-2xl bg-blue-500/10 dark:bg-blue-900/20 border border-blue-500/20 text-xs leading-relaxed">
                              <div className="flex items-start gap-2.5">
                                <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 text-xs font-black mt-0.5">
                                  i
                                </div>
                                <div className="text-slate-700 dark:text-slate-200 space-y-1 text-[11px] sm:text-xs">
                                  <p>
                                    • {lang === 'ug'
                                      ? 'قوبۇل قىلىنىدىغان نۇمۇر شەكلى: 0930606060 ، چوقۇم 09 بىلەن باشلىنىدىغان 10 خانىلىق بولسۇن.'
                                      : 'صيغة الرقم المقبولة : 0930606060 , بداية الرقم حصراً 09 وهو 10 ارقام فقط.'}
                                  </p>
                                  <p className="font-bold text-blue-600 dark:text-blue-400">
                                    • {lang === 'ug'
                                      ? 'نۇمۇرنىڭ سىرياتېل (SyriaTel) ئىكەنلىكىنى قانداق پەرقلەندۈرىمىز؟'
                                      : 'كيف تعرف ان الرقم هو SYRIATEL ؟'}
                                  </p>
                                  <p>
                                    • {lang === 'ug'
                                      ? 'سىرياتېل نومۇرىنىڭ بېشى: 093 ياكى 098 ياكى 099 بولىدۇ (MTN بولسا 094, 095, 096).'
                                      : 'رقم سيرتيل يكون بدايته هي: 093 او 098 او 099 .'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Product Cards */}
                        <div className="space-y-2.5 pe-1">
                          {displayedProducts.map((product) => {
                            const pPrice = Number(product.price) || 0;
                            const currencyIcon = getProductCurrencyIcon(
                              product.product_name || product.name,
                              product.category_name || selectedSubCategory || '',
                              selectedSubCategory
                            );

                            return (
                              <div
                                key={product.id}
                                onClick={() => {
                                  setSelectedProduct(product);
                                  setOrderInputs({});
                                  setOrderQty(1);
                                  setOrderError(null);
                                  setOrderResult(null);
                                }}
                                className={`flex items-center justify-between p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl border transition-all cursor-pointer active:scale-[0.99] group shadow-xs hover:shadow-md ${
                                  isDarkMode
                                    ? 'bg-[#0E1528] border-slate-800 hover:border-blue-500/50'
                                    : 'bg-white border-slate-200/90 hover:border-blue-400'
                                }`}
                              >
                                {/* Start Group: Currency Icon + Name & Blue Price (Matching Upstream Screenshot) */}
                                <div className="flex items-center gap-3 min-w-0">
                                  {/* Currency Icon (PUBG UC, Diamonds, Robux, etc.) */}
                                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-[#edf2fd] dark:bg-slate-800/90 p-1.5 flex items-center justify-center shrink-0 border border-blue-500/10 shadow-xs group-hover:scale-105 transition-transform overflow-hidden">
                                    <Image
                                      src={currencyIcon}
                                      alt="Currency"
                                      fill
                                      unoptimized
                                      className="object-contain p-1 drop-shadow-sm"
                                      sizes="56px"
                                    />
                                  </div>

                                  {/* Title & Blue Price */}
                                  <div className="min-w-0 text-start">
                                    <h4 className="font-extrabold text-slate-900 dark:text-white truncate text-xs sm:text-sm leading-snug group-hover:text-[#2541db] dark:group-hover:text-blue-400 transition">
                                      {cleanProductName(product.product_name || product.name, product.category_name)}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs sm:text-sm font-black text-[#2541db] dark:text-blue-400 font-mono tracking-tight">
                                        {pPrice < 1 ? `$${Number(pPrice.toFixed(7))}` : `$${pPrice.toFixed(3)}`}
                                      </span>
                                      {product.name && product.name.includes('ليرة') && (
                                        <span className="text-[11px] font-bold text-slate-500 font-alkatip">
                                          ({product.name.split(' ')[0]} ليرة SYR)
                                        </span>
                                      )}
                                      <span className="text-[10px] text-slate-400 font-medium">
                                        ⚡ {lang === 'ug' ? 'دەرھال' : lang === 'ar' ? 'فوري' : 'Instant'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Quick Order Button */}
                                <div className="shrink-0 ps-2">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedProduct(product);
                                      setOrderInputs({});
                                      setOrderQty(1);
                                      setOrderError(null);
                                      setOrderResult(null);
                                    }}
                                    className="px-3 py-1.5 rounded-xl bg-blue-500/10 hover:bg-[#3744D9] text-[#3744D9] hover:text-white dark:bg-blue-500/20 dark:text-blue-300 dark:hover:bg-[#3744D9] dark:hover:text-white text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95"
                                  >
                                    <span>{mbT.orderNow}</span>
                                    <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            SCREEN 1: طلباتي (My Orders matching Screenshot 2)
        ------------------------------------------------------------------- */}
        {activeTab === 1 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header with back */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTab(0)}
                className="text-xs font-bold text-[#3744D9] dark:text-blue-400 flex items-center gap-1 hover:underline"
              >
                <span>{isRTL ? '› ' : '‹ '}{mbT.backToHome}</span>
              </button>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {mbT.orders}
              </h2>
            </div>

            {/* 3 Summary Stats Cards */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className={`p-3 rounded-2xl text-center border ${
                isDarkMode ? 'bg-[#131B30] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
              }`}>
                <div className="text-base font-black text-slate-900 dark:text-white">0</div>
                <div className="text-[10px] text-slate-500 font-bold mt-0.5">{mbT.totalOrders}</div>
              </div>

              <div className={`p-3 rounded-2xl text-center border ${
                isDarkMode ? 'bg-[#131B30] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
              }`}>
                <div className="text-base font-black text-emerald-500">0</div>
                <div className="text-[10px] text-slate-500 font-bold mt-0.5">{mbT.completedOrders}</div>
              </div>

              <div className={`p-3 rounded-2xl text-center border ${
                isDarkMode ? 'bg-[#131B30] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
              }`}>
                <div className="text-base font-black text-rose-500">0</div>
                <div className="text-[10px] text-slate-500 font-bold mt-0.5">{mbT.failedOrders}</div>
              </div>
            </div>

            {/* Value card */}
            <div className={`p-4 rounded-2xl text-center border ${
              isDarkMode ? 'bg-[#131B30] border-slate-800' : 'bg-white border-slate-200/80 shadow-xs'
            }`}>
              <div className="text-xl font-black text-[#3744D9] dark:text-blue-400 font-mono">0$</div>
              <div className="text-xs text-slate-500 font-bold mt-1">{mbT.completedValue}</div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder={mbT.searchPlaceholder}
                className={`w-full py-2.5 ps-10 pe-4 rounded-2xl text-xs font-medium border outline-none ${
                  isDarkMode
                    ? 'bg-[#151F36] border-slate-800 text-white placeholder-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-xs'
                }`}
              />
              <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
              {[
                { id: 'all', label: mbT.all },
                { id: 'pending', label: mbT.pending },
                { id: 'completed', label: mbT.completed },
                { id: 'failed', label: mbT.failedOrders },
                { id: 'sources', label: mbT.allSources },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setOrderFilter(pill.id as any)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    orderFilter === pill.id
                      ? 'bg-[#3744D9] text-white shadow-xs'
                      : isDarkMode
                      ? 'bg-[#151F36] text-slate-400 hover:text-white border border-slate-800'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-xs'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Empty State matching Screenshot 2 */}
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <ShoppingCart className="w-8 h-8 text-[#3744D9] opacity-70" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {mbT.noOrdersYet}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                {mbT.noOrdersSub}
              </p>
              <button
                onClick={() => setActiveTab(0)}
                className="mt-4 px-4 py-2 rounded-xl bg-[#3744D9] text-white text-xs font-black shadow-md hover:bg-blue-700 transition"
              >
                {mbT.storeCategories}
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            SCREEN 2: الشحن (Deposit matching Screenshot 3 & Sham Cash In-App)
        ------------------------------------------------------------------- */}
        {activeTab === 2 && (
          <div className="space-y-4 animate-fadeIn">
            {showShamCashDrawer ? (
              /* Sham Cash In-App Deposit View */
              <div className="space-y-4 animate-fadeIn">
                {/* Header with back to methods */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => {
                      setShowShamCashDrawer(false);
                      setShamSuccess(null);
                      setShamError(null);
                    }}
                    className="text-xs font-bold text-[#3744D9] dark:text-blue-400 flex items-center gap-1 hover:underline"
                  >
                    <span>{isRTL ? '› ' : '‹ '}{lang === 'ug' ? 'باشقا ئۇسۇللارغا قايتىش' : 'الرجوع لطرق الشحن'}</span>
                  </button>
                  <div className="text-end">
                    <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-1.5 justify-end">
                      <span>شام كاش (Sham Cash)</span>
                      <span className="text-amber-500">⚡</span>
                    </h2>
                    <span className="text-[10px] text-emerald-500 font-bold block">
                      {lang === 'ug' ? '● سېكۇنت ئىچىدە ئاپتوماتىك قاچىلاش' : '● شحن فوري وتلقائي 24/7'}
                    </span>
                  </div>
                </div>

                {/* Balance & Rate Banner */}
                <div className="p-4 rounded-3xl bg-gradient-to-r from-[#4A5BF5] via-[#3B4AD9] to-[#2B35B8] text-white shadow-lg relative overflow-hidden">
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-blue-200 block">{mbT.currentBalance}</span>
                      <span className="text-2xl font-black font-mono">{balanceDisplay}</span>
                    </div>
                    <div className="text-end">
                      <span className="text-[10px] text-blue-200 block">
                        {lang === 'ug' ? 'ئالماشتۇرۇش نىسبىتى' : 'سعر الصرف'}
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-white/20 text-white font-mono text-xs font-black inline-block mt-0.5">
                        1$ = {shamExchangeRate.toLocaleString()} ل.س
                      </span>
                    </div>
                  </div>
                </div>

                {/* Official Sham Cash Account Card */}
                <div className={`p-4 rounded-3xl border ${
                  isDarkMode ? 'bg-[#131B30] border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
                }`}>
                  <span className="text-xs font-black text-slate-700 dark:text-slate-200 block mb-2">
                    {lang === 'ug' ? 'شامكەش (Sham Cash) مەخسۇس قوبۇللاش ھېساباتىمىز:' : 'حساب شام كاش (Sham Cash) المعتمد للتحويل:'}
                  </span>
                  
                  <div className={`p-3 rounded-2xl flex items-center justify-between gap-2 border font-mono ${
                    isDarkMode ? 'bg-[#0E1528] border-slate-700' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <span className="text-xs sm:text-sm font-black text-[#3744D9] dark:text-blue-400 break-all select-all">
                      {shamAddress}
                    </span>
                    <button
                      onClick={copyShamAddress}
                      className="shrink-0 px-3 py-1.5 rounded-xl bg-[#3744D9] hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition active:scale-95"
                    >
                      {copiedShamAddress ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                          <span>{mbT.idCopied}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>{mbT.copyId}</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* 3 Simple Visual Steps */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-500/15 text-[#3744D9] dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</span>
                      <span>{lang === 'ug' ? 'شامكەش ئەپىنى ئېچىپ، يۇقىرىدىكى ھېساباتقا لازىملىق پۇلنى ئەۋەتىڭ.' : 'افتح تطبيق شام كاش وحول المبلغ المطلوب للحساب أعلاه.'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-500/15 text-[#3744D9] dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</span>
                      <span>{lang === 'ug' ? 'پۇل كۆچۈرۈلگەندىن كېيىن، تالوندىكى مەشغۇلات نومۇرى (رقم العملية / TXID) نى تۆۋەنگە كىرگۈزۈڭ.' : 'بعد التحويل انسخ رقم العملية (TXID) والصقه في الحقل أدناه.'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-blue-500/15 text-[#3744D9] dark:text-blue-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</span>
                      <span>{lang === 'ug' ? '«دەرھال قاچىلاش» نى بېسىڭ — قالدۇقىڭىز شۇئان قاچىلىنىدۇ!' : 'اضغط تأكيد الشحن وسيتم إضافة الرصيد لحسابك تلقائياً وبشكل فوري!'}</span>
                    </div>
                  </div>
                </div>

                {/* TXID / Operation Number Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center justify-between">
                    <span>{lang === 'ug' ? 'شامكەش مەشغۇلات نومۇرى (رقم العملية / TXID):' : 'رقم عملية التحويل من شام كاش (TXID):'}</span>
                    <span className="text-[10px] text-rose-500 font-normal">{mbT.requiredField}</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={shamTxId}
                      onChange={(e) => setShamTxId(e.target.value)}
                      placeholder={lang === 'ug' ? 'مەسىلەن: 202611030987...' : 'مثال: 202611030987...'}
                      className={`w-full py-2.5 px-3.5 rounded-2xl text-xs font-mono outline-none border transition ${
                        isDarkMode
                          ? 'bg-[#151F36] border-slate-800 text-white focus:border-blue-500'
                          : 'bg-white border-slate-200 text-slate-900 focus:border-[#3744D9] shadow-xs'
                      }`}
                    />
                  </div>
                </div>

                {/* Error Banner */}
                {shamError && (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{shamError}</span>
                  </div>
                )}

                {/* Success Card */}
                {shamSuccess && (
                  <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto text-xl font-bold">
                      ✓
                    </div>
                    <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {lang === 'ug' ? 'شامكەش ئارقىلىق پۇل مۇۋەپپەقىيەتلىك ئەۋەتىلدى!' : 'تم إرسال طلب الشحن بنجاح!'}
                    </h4>
                    <p className="text-xs text-slate-500">
                      {lang === 'ug' ? 'مەشغۇلات نومۇرى:' : 'رقم العملية:'} <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{shamSuccess.txId}</span>
                    </p>
                    <button
                      onClick={() => {
                        setShamSuccess(null);
                        setShowShamCashDrawer(false);
                      }}
                      className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-xs"
                    >
                      {mbT.ok}
                    </button>
                  </div>
                )}

                {/* Submit Action Button */}
                {!shamSuccess && (
                  <button
                    disabled={shamSubmitting}
                    onClick={handleShamCashSubmit}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#3744D9] via-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50"
                  >
                    {shamSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{lang === 'ug' ? 'شامكەش دەلىللەنمەكتە...' : 'جاري التحقق من شام كاش...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{lang === 'ug' ? 'تەستىقلاش ۋە دەرھال قالدۇق قاچىلاش' : 'تأكيد الشحن الفوري الآن'}</span>
                        <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                      </>
                    )}
                  </button>
                )}
              </div>
            ) : (
              /* Normal payment methods list */
              <>
                {/* Header with back */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setActiveTab(0)}
                    className="text-xs font-bold text-[#3744D9] dark:text-blue-400 flex items-center gap-1 hover:underline"
                  >
                    <span>{isRTL ? '› ' : '‹ '}{mbT.back}</span>
                  </button>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">
                    {mbT.recharge}
                  </h2>
                </div>

                {/* Large Gradient Balance Banner (Screenshot 3 Blue-Violet Banner) */}
                <div className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-r from-[#4A5BF5] via-[#3B4AD9] to-[#2B35B8] text-white shadow-xl">
                  <div className="absolute top-0 end-0 -mt-8 -me-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10 text-center">
                    <span className="text-xs text-blue-200 font-bold block mb-1">
                      {mbT.currentBalance}
                    </span>
                    <span className="text-3xl sm:text-4xl font-black font-mono tracking-tight block">
                      {balanceDisplay}
                    </span>
                  </div>
                </div>

                {/* Section Header: طرق الشحن (Count 8) */}
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-4 rounded-full bg-[#3744D9]" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      {mbT.depositMethods}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-black">
                      1 {lang === 'ug' ? 'ئاكتىپ' : 'متاح'} • 7 {mbT.comingSoon}
                    </span>
                  </div>
                </div>

                {/* 8 Payment Methods List: Sham Cash is Active, Others are Coming Soon */}
                <div className="space-y-2.5">
                  {PAYMENT_METHODS.map((method) => {
                    const isShamCash = method.id === 'sham_cash';
                    const methodName = lang === 'ug' ? method.nameUg : method.nameAr;

                    return (
                      <div
                        key={method.id}
                        onClick={() => {
                          if (isShamCash) {
                            setShowShamCashDrawer(true);
                          } else {
                            alert(mbT.comingSoonNotice);
                          }
                        }}
                        className={`flex items-center justify-between p-3.5 rounded-2xl cursor-pointer transition active:scale-[0.98] border ${
                          isShamCash
                            ? isDarkMode
                              ? 'bg-[#152342] hover:bg-[#1a2c52] border-emerald-500/40 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                              : 'bg-white hover:bg-emerald-50/40 border-emerald-400/60 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-400/30'
                            : isDarkMode
                              ? 'bg-[#131B30]/70 hover:bg-[#182340] border-slate-800 opacity-75 hover:opacity-90'
                              : 'bg-white/80 hover:bg-slate-50 border-slate-200/80 opacity-80 hover:opacity-100 shadow-xs'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-inner flex-shrink-0 ${
                            isShamCash
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                              : 'bg-slate-100 dark:bg-slate-800'
                          }`}>
                            <span>{method.icon}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white">
                                {methodName}
                              </h4>
                              {isShamCash && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                              )}
                            </div>
                            <div className="mt-1">
                              {isShamCash ? (
                                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-black border border-emerald-500/25 inline-flex items-center gap-1">
                                  <span>⚡</span>
                                  <span>{mbT.instantRecharge}</span>
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20 inline-flex items-center gap-1">
                                  <span>⏳</span>
                                  <span>{mbT.comingSoon}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isShamCash ? (
                            <span className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 hidden sm:inline-block">
                              {lang === 'ug' ? 'دەرھال قاچىلاش' : 'شحن الآن'}
                            </span>
                          ) : null}
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                            isShamCash
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                          }`}>
                            <ChevronLeft className={`w-4 h-4 ${!isRTL ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}

        {/* -------------------------------------------------------------------
            SCREEN 3: الإيداعات (Deposit History matching Screenshot 4)
        ------------------------------------------------------------------- */}
        {activeTab === 3 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header with back */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTab(0)}
                className="text-xs font-bold text-[#3744D9] dark:text-blue-400 flex items-center gap-1 hover:underline"
              >
                <span>{isRTL ? '› ' : '‹ '}{mbT.back}</span>
              </button>
              <div className="text-end">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  {mbT.deposits}
                </h2>
                <span className="text-[11px] text-slate-400">
                  {mbT.depositHistory}
                </span>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder={mbT.searchPlaceholder}
                className={`w-full py-2.5 ps-10 pe-4 rounded-2xl text-xs font-medium border outline-none ${
                  isDarkMode
                    ? 'bg-[#151F36] border-slate-800 text-white placeholder-slate-500'
                    : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 shadow-xs'
                }`}
              />
              <Search className="w-4 h-4 text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Filter Pills: الكل ، معلقة ، مكتملة ، مرفوضة */}
            <div className="flex items-center gap-2">
              {[
                { id: 'all', label: mbT.all },
                { id: 'pending', label: mbT.pending },
                { id: 'completed', label: mbT.completed },
                { id: 'rejected', label: mbT.rejected },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setDepositFilter(pill.id as any)}
                  className={`flex-1 py-1.5 rounded-full text-xs font-bold transition text-center ${
                    depositFilter === pill.id
                      ? 'bg-[#3744D9] text-white shadow-xs'
                      : isDarkMode
                      ? 'bg-[#151F36] text-slate-400 hover:text-white border border-slate-800'
                      : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200/80 shadow-xs'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Empty State */}
            <div className="py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                <CreditCard className="w-8 h-8 text-[#3744D9] opacity-70" />
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                {mbT.noDepositsYet}
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 leading-relaxed">
                {mbT.noDepositsSub}
              </p>
              <button
                onClick={() => setActiveTab(2)}
                className="mt-4 px-4 py-2 rounded-xl bg-[#3744D9] text-white text-xs font-black shadow-md hover:bg-blue-700 transition"
              >
                {mbT.quickRechargeNow}
              </button>
            </div>
          </div>
        )}

        {/* -------------------------------------------------------------------
            SCREEN 4: حسابي (Profile matching Screenshot 5)
        ------------------------------------------------------------------- */}
        {activeTab === 4 && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header with back */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveTab(0)}
                className="text-xs font-bold text-[#3744D9] dark:text-blue-400 flex items-center gap-1 hover:underline"
              >
                <span>{isRTL ? '› ' : '‹ '}{mbT.back}</span>
              </button>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                {mbT.account}
              </h2>
            </div>

            {/* User Profile Card */}
            <div className={`p-5 rounded-3xl border ${
              isDarkMode ? 'bg-[#131B30] border-slate-800' : 'bg-white border-slate-200/80 shadow-sm'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="text-start">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {currentUser?.name || (lang === 'ug' ? 'MAX-BAZAR ئىشلەتكۈچىسى' : 'مستخدم MAX-BAZAR')}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {currentUser?.email || 'Telegram WebApp'}
                  </p>
                  {/* Copyable ID */}
                  <button
                    onClick={() => copyToClipboard(userId)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 text-[#3744D9] dark:text-blue-400 text-[11px] font-mono font-bold mt-2 hover:bg-blue-500/20 transition"
                  >
                    <span>ID: {userId}</span>
                    {copiedId ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>

                <div className="w-16 h-16 rounded-full bg-[#FFD027] border-2 border-white shadow-md flex items-center justify-center text-3xl">
                  😊
                </div>
              </div>

              {/* Balance & Spent Boxes */}
              <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <div className={`p-3 rounded-2xl text-center ${
                  isDarkMode ? 'bg-[#0E1528]' : 'bg-slate-50'
                }`}>
                  <span className="text-[10px] text-slate-400 font-bold block">{mbT.currentBalance}</span>
                  <span className="text-sm sm:text-base font-black text-[#3744D9] dark:text-blue-400 font-mono mt-0.5 block">
                    {balanceDisplay}
                  </span>
                </div>

                <div className={`p-3 rounded-2xl text-center ${
                  isDarkMode ? 'bg-[#0E1528]' : 'bg-slate-50'
                }`}>
                  <span className="text-[10px] text-slate-400 font-bold block">{mbT.totalSpent}</span>
                  <span className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5 block">
                    0$
                  </span>
                </div>
              </div>

              {/* Fast Recharge CTA */}
              <button
                onClick={() => setActiveTab(2)}
                className="w-full mt-3.5 py-3 rounded-2xl bg-[#E8EBFC] hover:bg-[#D9DFFB] dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-[#3744D9] dark:text-blue-300 text-xs font-black flex items-center justify-center gap-2 transition active:scale-[0.98]"
              >
                <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span>{mbT.quickRechargeNow}</span>
              </button>
            </div>

            {/* Services List (الخدمات والميزات) */}
            <div className={`rounded-2xl border overflow-hidden ${
              isDarkMode ? 'bg-[#131B30] border-slate-800 divide-y divide-slate-800' : 'bg-white border-slate-200/80 divide-y divide-slate-100 shadow-xs'
            }`}>
              {/* 6 Languages Switcher Row */}
              <div
                onClick={openLanguageModal}
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-[#3744D9] flex items-center justify-center">
                    <Globe2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">{mbT.languageSelect}</h4>
                    <span className="text-[10px] text-blue-500 font-bold uppercase">{lang} • 6 Languages</span>
                  </div>
                </div>
                <ChevronLeft className={`w-4 h-4 text-slate-400 ${!isRTL ? 'rotate-180' : ''}`} />
              </div>



              <a
                href="https://t.me/nasrulla0996"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center">
                    <Headphones className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      {lang === 'ug' ? 'بىۋاسىتە خېرىدارلار مۇلازىمىتى' : 'الدعم الفني المباشر'}
                    </h4>
                    <span className="text-[10px] text-slate-400">24/7 Telegram</span>
                  </div>
                </div>
                <ChevronLeft className={`w-4 h-4 text-slate-400 ${!isRTL ? 'rotate-180' : ''}`} />
              </a>
            </div>
          </div>
        )}
          </>
        )}
      </main>

      {/* =========================================================================
          ORDER PLACEMENT MODAL (Direct wholesale order to MaxStore)
      ========================================================================= */}
      {selectedProduct && (
        <div
          dir={dir}
          className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn"
          onClick={() => {
            if (!orderSubmitting) setSelectedProduct(null);
          }}
        >
          <div
            className={`w-full max-w-md max-h-[88vh] flex flex-col rounded-3xl border shadow-2xl transition-all overflow-hidden ${
              isDarkMode ? 'bg-[#10182F] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-200/60 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-12 rounded-2xl overflow-hidden shadow-md border-2 border-white dark:border-slate-700 bg-[#edf2fd] dark:bg-slate-800 p-1 shrink-0 flex items-center justify-center">
                  <Image
                    src={getProductCurrencyIcon(selectedProduct.product_name || selectedProduct.name, selectedProduct.category_name, selectedCategory)}
                    alt={selectedProduct.category_name || 'Product'}
                    fill
                    unoptimized
                    className="object-contain p-1"
                    sizes="48px"
                  />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                    {cleanProductName(selectedProduct.product_name || selectedProduct.name, selectedProduct.category_name)}
                  </h3>
                  <span className="text-xs text-slate-400 font-bold truncate block">
                    {selectedProduct.category_name}
                  </span>
                </div>
              </div>
              <button
                disabled={orderSubmitting}
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white flex items-center justify-center text-sm font-bold shrink-0 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-3.5 flex-1">
              {/* Localized Instructions & Notice Banner */}
              {localizeProductNotice(selectedProduct, lang) && (
                <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 font-medium leading-relaxed">
                  {localizeProductNotice(selectedProduct, lang)}
                </div>
              )}

              {/* Price Banner Card */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/5 border border-blue-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center text-[#3744D9] dark:text-blue-400 font-black">
                    🏷️
                  </div>
                  <span className="text-xs text-slate-700 dark:text-slate-200 font-bold">
                    {mbT.servicePrice}
                  </span>
                </div>
                <div className="text-end">
                  <div className="text-base sm:text-lg font-black text-[#3744D9] dark:text-blue-400 font-mono tracking-tight">
                    {(() => {
                      const totalVal = Number(selectedProduct.price) * orderQty;
                      return totalVal < 1 ? `$${Number(totalVal.toFixed(7))}` : `$${totalVal.toFixed(3)}`;
                    })()}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {mbT.yourBalance}: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{balanceDisplay}</span>
                  </div>
                </div>
              </div>

              {/* Success State */}
              {orderResult ? (
                <div className="py-6 text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-emerald-500/15 text-emerald-500 mx-auto flex items-center justify-center text-2xl border border-emerald-500/30">
                    ✓
                  </div>
                  <h4 className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                    {mbT.orderSuccess}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {mbT.orderStatus} <span className="font-bold text-slate-900 dark:text-white">{orderResult.status}</span>
                  </p>
                  {orderResult.delivery && orderResult.delivery.length > 0 && (
                    <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs text-emerald-600 font-bold select-all">
                      {orderResult.delivery.join('\n')}
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className="w-full py-2.5 rounded-xl bg-[#3744D9] text-white text-xs font-black shadow-xs cursor-pointer"
                  >
                    {mbT.ok}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Dynamic Parameter Inputs (Player ID, Server ID, Email, System, Phone, Address, etc.) */}
                  {(() => {
                    const activeParams =
                      selectedProduct.params_meta && selectedProduct.params_meta.length > 0
                        ? selectedProduct.params_meta
                        : (selectedProduct.params || []).map((p: string) => ({
                            name: p,
                            label: p,
                            type: 'text',
                            required: true,
                          }));

                    if (!activeParams || activeParams.length === 0) {
                      return (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500">
                          {mbT.noExtraInputs}
                        </div>
                      );
                    }

                    return activeParams.map((param: any, idx: number) => {
                      const labelText = localizeParamLabel(param.label || param.name, lang);
                      const paramKey = param.name || `param_${idx}`;

                      // Option Selector Buttons (e.g. iOS / Android)
                      if (param.options && Array.isArray(param.options) && param.options.length > 0) {
                        return (
                          <div key={idx} className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                              <span>{labelText}</span>
                              {param.required && (
                                <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                                  * {mbT.requiredField}
                                </span>
                              )}
                            </label>
                            <div className="flex flex-wrap gap-2 pt-0.5">
                              {param.options.map((opt: string) => (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() => setOrderInputs({ ...orderInputs, [paramKey]: opt })}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border cursor-pointer ${
                                    orderInputs[paramKey] === opt
                                      ? 'bg-[#3744D9] text-white border-[#3744D9] shadow-xs'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                                  }`}
                                >
                                  {opt}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      // Textarea (e.g. Detailed Address)
                      if (param.type === 'textarea') {
                        return (
                          <div key={idx} className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                              <span>{labelText}</span>
                              {param.required && (
                                <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                                  * {mbT.requiredField}
                                </span>
                              )}
                            </label>
                            <textarea
                              rows={2}
                              value={orderInputs[paramKey] || ''}
                              onChange={(e) => setOrderInputs({ ...orderInputs, [paramKey]: e.target.value })}
                              placeholder={labelText}
                              className={`w-full py-2.5 px-3 rounded-xl text-xs outline-none border transition resize-none ${
                                isDarkMode
                                  ? 'bg-[#0E1528] border-slate-700 text-white focus:border-blue-500'
                                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#3744D9]'
                              }`}
                            />
                          </div>
                        );
                      }

                      // General Inputs (Text, Number, Email, Password, Tel)
                      const inputType =
                        param.type === 'password'
                          ? 'password'
                          : param.type === 'email'
                          ? 'email'
                          : param.type === 'number' || param.type === 'tel'
                          ? 'tel'
                          : 'text';

                      const placeholderText =
                        param.placeholder ||
                        (param.name?.toLowerCase().includes('id')
                          ? (lang === 'ug' ? 'مەسىلەن: 123456789' : lang === 'ar' ? 'مثال: 123456789' : 'e.g. 123456789')
                          : param.name?.toLowerCase().includes('phone') || param.name?.toLowerCase().includes('هاتف')
                          ? '09xxxxxxxx'
                          : labelText);

                      return (
                        <div key={idx} className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                            <span>{labelText}</span>
                            {param.required && (
                              <span className="text-[10px] text-rose-500 font-bold bg-rose-500/10 px-1.5 py-0.5 rounded-md">
                                * {mbT.requiredField}
                              </span>
                            )}
                          </label>
                          <input
                            type={inputType}
                            value={orderInputs[paramKey] || ''}
                            onChange={(e) => setOrderInputs({ ...orderInputs, [paramKey]: e.target.value })}
                            placeholder={placeholderText}
                            className={`w-full py-2.5 px-3.5 rounded-xl text-xs outline-none border transition ${
                              isDarkMode
                                ? 'bg-[#0E1528] border-slate-700 text-white focus:border-blue-500'
                                : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-[#3744D9]'
                            }`}
                          />
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Modal Footer with Submit Button */}
            {!orderResult && (
              <div className="p-4 sm:p-5 pt-3 border-t border-slate-200/60 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
                {/* Error Banner */}
                {orderError && (
                  <div className="mb-2.5 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{orderError}</span>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  disabled={orderSubmitting}
                  onClick={handlePlaceOrder}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#3744D9] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white text-xs sm:text-sm font-black shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {orderSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{mbT.sendingOrder}</span>
                    </>
                  ) : (
                    <>
                      <span>{mbT.orderConfirm}</span>
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          3. 5-TAB BOTTOM NAVIGATION BAR (Exact replica of screenshots)
      ========================================================================= */}
      <nav
        dir={dir}
        className={`fixed bottom-0 inset-x-0 z-50 h-16 border-t px-2 flex items-center justify-around backdrop-blur-lg ${
          isDarkMode
            ? 'bg-[#0B1020]/95 border-slate-800 text-slate-400'
            : 'bg-white/95 border-slate-200 text-slate-600 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
        }`}
      >
        {[
          { id: 0, label: mbT.home, icon: HomeIcon },
          { id: 1, label: mbT.orders, icon: Clock },
          { id: 2, label: mbT.recharge, icon: Zap },
          { id: 3, label: mbT.deposits, icon: CreditCard },
          { id: 4, label: mbT.account, icon: UserIcon },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setShowNotifications(false);
              }}
              className={`relative flex flex-col items-center justify-center transition-all ${
                isActive
                  ? 'text-[#3744D9] dark:text-blue-400 font-black'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold'
              }`}
            >
              {/* Highlight pill around active icon/button */}
              {isActive ? (
                <div className="px-2.5 sm:px-3.5 py-1 rounded-full bg-[#4E5AE8] text-white flex flex-col items-center justify-center shadow-md shadow-blue-500/25 whitespace-nowrap">
                  <Icon className="w-4 h-4 stroke-[2.5]" />
                  <span className="text-[10px] font-black mt-0.5">{tab.label}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-1 whitespace-nowrap px-1">
                  <Icon className="w-4 h-4 stroke-[2]" />
                  <span className="text-[10px] font-bold mt-0.5">{tab.label}</span>
                </div>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
