'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ug' | 'ar' | 'en';

export interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'rtl' | 'ltr';
  isRTL: boolean;
  getCategoryName: (id: string, defaultName: string) => string;
  getCategoryCount: (id: string, defaultCount: string) => string;
  translatePackageTitle: (title: string) => string;
  translateBadge: (badge?: string) => string | undefined;
  translateInputLabel: (label?: string) => string | undefined;
  translateInputPlaceholder: (placeholder?: string) => string | undefined;
}

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  ug: {
    // General
    appName: 'AUTO CASH',
    brandSlogan: 'ئەپلەرگە، ئويۇنلارغا پۇل قاچىلاش ۋە سۈنئىي ئەقىل ئابۇنىتلىقى',
    welcomeTitle: 'تور بېكەتكە خۇش كەپسىز',
    welcomeSubtitle: 'ئەپلەر، ئويۇنلار، مەۋھۇم نومۇرلار ۋە سۈنئىي ئەقىل ئابۇنىتلىقىغا پۇل قاچىلاش پىلاتفورمىسى',
    enterPlatform: 'سۇپىغا كىرىش',
    copyright: 'AUTO CASH © 2026. بارلىق ھوقۇقلار قوغدىلىدۇ.',

    // Navigation & Header
    home: 'باش بەت',
    store: 'دۇكان',
    menu: 'مېنيۇ',
    menuTitle: 'قوشۇمچە تىزىملىك',
    deposit: 'ھەميانغا پۇل كىرگۈزۈش',
    addFunds: '+ پۇل سېلىش',
    balance: 'قالدۇق:',
    vipMembership: 'VIP ئەزالىق',
    adminPanel: 'باشقۇرۇش مەركىزى',
    online: 'توردا ئاكتىپ',
    selectLanguage: 'تىل تاللاش',
    language: 'تىل',

    // Drawer & User Profile
    guestUser: 'مېھمان ئابۇنت',
    guestBadge: 'مېھمان سالاھىيىتى',
    guestNotLoggedIn: 'تېخى تىزىملاپ كىرمىگەن',
    guestPromo: 'ھېساباتىڭىزغا كىرىپ، ئېتىبار باھالاردىن ۋە مەخسۇس كىملىك (ID) ئىمتىيازلىرىدىن بەھرىمەن بولۇڭ.',
    loginRegister: 'كىرىش / تىزىملىتىش (Gmail)',
    logout: 'چىقىش',
    silverMember: 'VIP دەرىجە 2 (كۈمۈش ئەزا)',
    allServices: 'دۇكان (بارلىق مۇلازىمەتلەر)',
    shamcashDepositDrawer: 'ھەميانغا پۇل كىرگۈزۈش (شامكەش / Sham Cash)',
    myOrdersDrawer: 'مېنىڭ تەلەپلىرىم (زاكازلىرىم)',
    myAccountDrawer: 'مېنىڭ ھېسابىم',
    vipPerksDrawer: 'VIP ئەزالىق ۋە ئېتىبار دەرىجىسى',
    contactSupport: 'ئالاقىلىشىش ۋە قوللاش',
    telegramSupport: 'Telegram خېرىدارلار مۇلازىمىتى',
    whatsappSupport: 'WhatsApp قوللاش مەركىزى',
    connect: 'ئۇلىنىش',

    // Bottom Navigation
    navHome: 'باشبەت',
    navOrders: 'مېنىڭ تەلەپلىرىم',
    navDeposit: 'مېنىڭ ھەميانىم',
    navAccount: 'مېنىڭ ھېسابىم',

    // Home Page
    searchPlaceholder: 'ئەپ ياكى ئويۇن نامى بويىچە ئىزدەڭ...',
    categoriesTitle: 'مۇلازىمەت تۈرلىرى',
    showAll: 'ھەممىسىنى كۆرۈش',
    backToCategories: 'تۈرلەرگە قايتىش',
    hotBadge: 'ئەڭ قىزىق',
    viewPackages: 'بولاقلارنى كۆرۈش',
    instant: 'دەرھال',
    noServicesFound: 'بۇ تۈردە مۇلازىمەت تېپىلمىدى',
    fastDelivery: 'دەرھال ۋە تېز پۇل كىرگۈزۈش',
    securePayment: 'بىخەتەر چىقىم قىلىش كاپالىتى',
    active247: '24/7 ئۇدا تېز مۇلازىمەت',

    // Checkout Modal
    selectPackageLabel: 'تۈر / مۇلازىمەت مىقدارىنى تاللاڭ',
    accountInputFallbackLabel: 'كىملىك ID ياكى ھېسابات ئۇچۇرى',
    accountInputFallbackPlaceholder: 'تەلەپ قىلىنغان كىملىك ياكى نومۇرنى كىرگۈزۈڭ',
    confirmAndPay: 'تۆلەش ۋە زاكاز بېرىش',
    processing: 'بىر تەرەپ قىلىنىۋاتىدۇ...',
    orderSuccess: 'زاكاز مۇۋەپپەقىيەتلىك تاپشۇرۇلدى!',
    close: 'ياپقۇچ',

    // Orders Page
    ordersTitle: 'مېنىڭ تەلەپلىرىم',
    ordersSubtitle: 'زاكازلىرىڭىزنى تېز قوغلاڭ، ھالىتى ۋە ۋاقتى بويىچە ئىزدەڭ ۋە سۈزۈڭ.',
    orderSearchPlaceholder: 'زاكاز نومۇرى ياكى مەھسۇلات نامى بويىچە ئىزدەڭ...',
    statusAll: 'ھەممىسى',
    statusCompleted: 'تاماملاندى',
    statusProcessing: 'بىر تەرەپ قىلىنىۋاتىدۇ',
    statusCancelled: 'بىكار قىلىندى',
    noOrdersFound: 'تېخى ھېچقانداق زاكاز تېپىلمىدى',
    orderId: 'زاكاز نومۇرى:',
    orderTime: 'ۋاقتى:',
    targetAccount: 'ھېسابات / ID:',
    amount: 'مىقدارى:',

    // Deposit Page
    depositTitle: 'ھەميانغا پۇل كىرگۈزۈش (شامكەش / Sham Cash)',
    availableBalanceLabel: 'ئىشلىتىشكە بولىدىغان قالدۇق',
    newDepositBtn: 'شامكەش ئارقىلىق پۇل قاچىلاش',
    paymentMethod: '1. چىقىم يولى:',
    shamcashName: 'شامكەش پۇلى (Sham Cash)',
    officialActive: 'رەسمىي ئاكتىپ',
    transferInstructions: 'شامكەش ھېساباتىمىزغا پۇل ئۆتكۈزۈپ، تۆۋەندىكى تەلەپنى يوللاڭ:',
    copyAddress: 'كۆچۈرۈش',
    copied: 'كۆچۈرۈلدى!',
    enterAmount: 'كىرگۈزىدىغان مىقدار (USD):',
    enterTxId: 'پۇل ئاتقان ئىسپات نومۇرى:',
    enterTxIdPlaceholder: 'پۇل ئاتقان ئىسپات نومۇرىنى كىرگۈزۈڭ...',
    completePaymentBtn: 'دەلىللەش ⚡',
    proofRequiredError: 'پۇل ئاتقان ئىسپات نومۇرىنى كىرگۈزۈڭ!',
    depositSubmittedSuccess: 'تۆلەم تەلەپ خاتىرىسى قوبۇل قىلىندى، دەلىللەنگەندىن كېيىن دەرھال كىرىدۇ!',
    depositSupportHelp: 'مەسىلە كۆرۈلسە بىز بىلەن ئالاقىلىشىڭ',

    // Membership Page
    membershipTitle: 'مېنىڭ ئەزالىقىم',
    currentLevel: 'نۆۋەتتىكى دەرىجە',
    membershipClub: 'AUTO CASH ئەزالىق كۇلۇبى',
    bronze: 'برونزا',
    silver: 'كۈمۈش',
    gold: 'ئالتۇن',
    platinum: 'پلاتىنا',
    diamond: 'ئالماس',
    vipDiscountTitle: 'دەرىجە ئىمتىيازلىرى ۋە ئېتىبار جەدۋىلى',
    discountRate: 'ئېتىبار نىسبىتى',
    spendingRequirement: 'سېتىۋېلىش شەرتى',

    // Account Page
    accountTitle: 'مېنىڭ ھېسابىم',
    accountSubtitle: 'ئۇچۇرلىرىڭىزنى ۋە ھېسابات بىخەتەرلىكىڭىزنى باشقۇرۇش.',
    profileInfo: 'ئاساسىي ئۇچۇرلار',
    usernameLabel: 'ئىشلەتكۈچى نامى:',
    emailLabel: 'ئېلخەت ئادرېسى:',
    phoneLabel: 'تېلېفون نومۇرى:',
    saveChanges: 'ئۇچۇرنى ساقلاش',
    securitySettings: 'بىخەتەرلىك ۋە پارول',
    currentPasswordLabel: 'ھازىرقى پارول:',
    newPasswordLabel: 'يېڭى پارول:',
    updatePassword: 'پارولنى يېڭىلاش',
    totalPurchases: 'ئومۇمىي سېتىۋېلىش',
    totalOrdersCount: 'ئومۇمىي زاكاز سانى',

    // Auth Modal
    loginTab: 'كىرىش',
    registerTab: 'تىزىملىتىش',
    googleSignIn: 'Google ھېساباتى بىلەن تېز كىرىش',
    orEmail: 'ياكى ئېلخەت ئارقىلىق',
    password: 'پارول',
    nameOptional: 'ئىسمىڭىز',
  },

  ar: {
    // General
    appName: 'AUTO CASH',
    brandSlogan: 'شحن التطبيقات والألعاب واشتراكات الذكاء الاصطناعي',
    welcomeTitle: 'أهلاً بكم في AUTO CASH',
    welcomeSubtitle: 'منصة شحن الألعاب والتطبيقات واشتراكات الذكاء الاصطناعي والأرقام الوهمية',
    enterPlatform: 'دخول المنصة',
    copyright: 'AUTO CASH © 2026. جميع الحقوق محفوظة.',

    // Navigation & Header
    home: 'الرئيسية',
    store: 'المتجر',
    menu: 'القائمة',
    menuTitle: 'القائمة الجانبية',
    deposit: 'شحن المحفظة',
    addFunds: '+ إيداع',
    balance: 'الرصيد:',
    vipMembership: 'عضوية VIP',
    adminPanel: 'لوحة التحكم',
    online: 'نشط الآن',
    selectLanguage: 'اختيار اللغة',
    language: 'اللغة',

    // Drawer & User Profile
    guestUser: 'مستخدم زائر',
    guestBadge: 'حساب زائر',
    guestNotLoggedIn: 'لم يتم تسجيل الدخول بعد',
    guestPromo: 'سجّل دخولك للاستفادة من الأسعار المخفضة والمزايا الخاصة بالعضوية.',
    loginRegister: 'تسجيل الدخول / إنشاء حساب',
    logout: 'تسجيل الخروج',
    silverMember: 'VIP المستوى 2 (عضو فضي)',
    allServices: 'المتجر (جميع الخدمات)',
    shamcashDepositDrawer: 'شحن المحفظة (شام كاش / Sham Cash)',
    myOrdersDrawer: 'طلباتي (سجل الطلبات)',
    myAccountDrawer: 'حسابي الشخصي',
    vipPerksDrawer: 'عضوية VIP ومستويات الخصم',
    contactSupport: 'التواصل والدعم',
    telegramSupport: 'خدمة عملاء Telegram',
    whatsappSupport: 'خدمة عملاء WhatsApp',
    connect: 'تواصل',

    // Bottom Navigation
    navHome: 'الرئيسية',
    navOrders: 'طلباتي',
    navDeposit: 'المحفظة',
    navAccount: 'حسابي',

    // Home Page
    searchPlaceholder: 'ابحث بالاسم عن لعبة أو تطبيق أو خدمة...',
    categoriesTitle: 'تصنيفات الخدمات',
    showAll: 'عرض الكل',
    backToCategories: 'العودة للتصنيفات',
    hotBadge: 'الأكثر طلباً',
    viewPackages: 'عرض الباقات',
    instant: 'فوري',
    noServicesFound: 'لم يتم العثور على خدمات مطابقة',
    fastDelivery: 'شحن فوري وسريع',
    securePayment: 'ضمان دفع آمن ومحمي 100%',
    active247: 'خدمة ودعم متواصل 24/7',

    // Checkout Modal
    selectPackageLabel: 'اختر الباقة أو كمية الخدمة',
    accountInputFallbackLabel: 'معرف الحساب أو البيانات المطلوبة',
    accountInputFallbackPlaceholder: 'أدخل المعرف أو الرقم المطلوب للشحن',
    confirmAndPay: 'تأكيد ودفع الطلب',
    processing: 'جاري المعالجة...',
    orderSuccess: 'تم تقديم الطلب بنجاح!',
    close: 'إغلاق',

    // Orders Page
    ordersTitle: 'طلباتي',
    ordersSubtitle: 'تتبع طلباتك بسرعة وابحث حسب الحالة والتاريخ.',
    orderSearchPlaceholder: 'ابحث برقم الطلب أو اسم المنتج...',
    statusAll: 'الكل',
    statusCompleted: 'مكتمل',
    statusProcessing: 'قيد المعالجة',
    statusCancelled: 'ملغي',
    noOrdersFound: 'لا توجد طلبات مسجلة حالياً',
    orderId: 'رقم الطلب:',
    orderTime: 'الوقت:',
    targetAccount: 'الحساب / المعرف:',
    amount: 'المبلغ:',

    // Deposit Page
    depositTitle: 'شحن المحفظة (شام كاش / Sham Cash)',
    availableBalanceLabel: 'الرصيد المتاح',
    newDepositBtn: 'إيداع عبر شام كاش',
    paymentMethod: '1. طريقة الدفع:',
    shamcashName: 'شام كاش (Sham Cash)',
    officialActive: 'مفعل رسمياً',
    transferInstructions: 'قم بالتحويل إلى حساب شام كاش الموضح أدناه ثم أرسل الطلب:',
    copyAddress: 'نسخ',
    copied: 'تم النسخ!',
    enterAmount: 'المبلغ المراد إيداعه (USD):',
    enterTxId: 'رقم إشعار / إثبات التحويل:',
    enterTxIdPlaceholder: 'أدخل رقم إشعار التحويل أو رقم العملية...',
    completePaymentBtn: 'تأكيد ودفع ⚡',
    proofRequiredError: 'يرجى إدخال رقم إشعار التحويل!',
    depositSubmittedSuccess: 'تم استلام طلب الإيداع، وسيتم إضافته لمحفظتك فور التحقق!',
    depositSupportHelp: 'في حال واجهت أي مشكلة تواصل معنا',

    // Membership Page
    membershipTitle: 'عضويتي',
    currentLevel: 'المستوى الحالي',
    membershipClub: 'نادي أعضاء AUTO CASH',
    bronze: 'برونزي',
    silver: 'فضي',
    gold: 'ذهبي',
    platinum: 'بلاتيني',
    diamond: 'ماسي',
    vipDiscountTitle: 'مزايا المستويات وجدول الخصومات',
    discountRate: 'نسبة الخصم',
    spendingRequirement: 'الحد الأدنى للمشتريات',

    // Account Page
    accountTitle: 'حسابي',
    accountSubtitle: 'إدارة بياناتك وأمان حسابك الشخصي.',
    profileInfo: 'البيانات الأساسية',
    usernameLabel: 'اسم المستخدم:',
    emailLabel: 'البريد الإلكتروني:',
    phoneLabel: 'رقم الهاتف:',
    saveChanges: 'حفظ التعديلات',
    securitySettings: 'الأمان وكلمة المرور',
    currentPasswordLabel: 'كلمة المرور الحالية:',
    newPasswordLabel: 'كلمة المرور الجديدة:',
    updatePassword: 'تحديث كلمة المرور',
    totalPurchases: 'إجمالي المشتريات',
    totalOrdersCount: 'عدد الطلبات',

    // Auth Modal
    loginTab: 'تسجيل الدخول',
    registerTab: 'إنشاء حساب',
    googleSignIn: 'الدخول السريع عبر Google',
    orEmail: 'أو عبر البريد الإلكتروني',
    password: 'كلمة المرور',
    nameOptional: 'الاسم الكامل',
  },

  en: {
    // General
    appName: 'AUTO CASH',
    brandSlogan: 'Games, Apps Top-up & AI Subscriptions Hub',
    welcomeTitle: 'Welcome to AUTO CASH',
    welcomeSubtitle: 'Instant digital store for game top-ups, apps, virtual numbers, and AI tools',
    enterPlatform: 'Enter Platform',
    copyright: 'AUTO CASH © 2026. All rights reserved.',

    // Navigation & Header
    home: 'Home',
    store: 'Store',
    menu: 'Menu',
    menuTitle: 'Main Menu',
    deposit: 'Wallet Deposit',
    addFunds: '+ Deposit',
    balance: 'Balance:',
    vipMembership: 'VIP Membership',
    adminPanel: 'Admin Panel',
    online: 'Online',
    selectLanguage: 'Language',
    language: 'Language',

    // Drawer & User Profile
    guestUser: 'Guest User',
    guestBadge: 'Guest Status',
    guestNotLoggedIn: 'Not signed in yet',
    guestPromo: 'Sign in to access exclusive discounts and member ID privileges.',
    loginRegister: 'Sign In / Register',
    logout: 'Log Out',
    silverMember: 'VIP Level 2 (Silver Member)',
    allServices: 'Store (All Services)',
    shamcashDepositDrawer: 'Wallet Deposit (Sham Cash)',
    myOrdersDrawer: 'My Orders (History)',
    myAccountDrawer: 'My Account',
    vipPerksDrawer: 'VIP Membership & Discounts',
    contactSupport: 'Contact & Support',
    telegramSupport: 'Telegram Customer Support',
    whatsappSupport: 'WhatsApp Customer Support',
    connect: 'Contact',

    // Bottom Navigation
    navHome: 'Home',
    navOrders: 'My Orders',
    navDeposit: 'Wallet',
    navAccount: 'Account',

    // Home Page
    searchPlaceholder: 'Search games, apps, or services...',
    categoriesTitle: 'Service Categories',
    showAll: 'View All',
    backToCategories: 'Back to Categories',
    hotBadge: 'Popular',
    viewPackages: 'View Packages',
    instant: 'Instant',
    noServicesFound: 'No services found in this category',
    fastDelivery: 'Fast & Instant Delivery',
    securePayment: '100% Secure Payment Guarantee',
    active247: '24/7 Active Support',

    // Checkout Modal
    selectPackageLabel: 'Select Package / Quantity',
    accountInputFallbackLabel: 'Account ID or Details',
    accountInputFallbackPlaceholder: 'Enter required player ID or account',
    confirmAndPay: 'Confirm & Place Order',
    processing: 'Processing...',
    orderSuccess: 'Order submitted successfully!',
    close: 'Close',

    // Orders Page
    ordersTitle: 'My Orders',
    ordersSubtitle: 'Track your orders easily by status and date.',
    orderSearchPlaceholder: 'Search by order ID or product name...',
    statusAll: 'All',
    statusCompleted: 'Completed',
    statusProcessing: 'Processing',
    statusCancelled: 'Cancelled',
    noOrdersFound: 'No orders found yet',
    orderId: 'Order ID:',
    orderTime: 'Time:',
    targetAccount: 'Account / ID:',
    amount: 'Amount:',

    // Deposit Page
    depositTitle: 'Deposit to Wallet (Sham Cash)',
    availableBalanceLabel: 'Available Balance',
    newDepositBtn: 'Deposit via Sham Cash',
    paymentMethod: '1. Payment Method:',
    shamcashName: 'Sham Cash',
    officialActive: 'Officially Active',
    transferInstructions: 'Transfer funds to our Sham Cash account below, then submit details:',
    copyAddress: 'Copy',
    copied: 'Copied!',
    enterAmount: 'Deposit Amount (USD):',
    enterTxId: 'Payment Proof Number:',
    enterTxIdPlaceholder: 'Enter transaction or proof number...',
    completePaymentBtn: 'Verify ⚡',
    proofRequiredError: 'Please enter payment proof number!',
    depositSubmittedSuccess: 'Deposit request received, will be credited after verification!',
    depositSupportHelp: 'Need help? Contact support',

    // Membership Page
    membershipTitle: 'My Membership',
    currentLevel: 'Current Level',
    membershipClub: 'AUTO CASH Club',
    bronze: 'Bronze',
    silver: 'Silver',
    gold: 'Gold',
    platinum: 'Platinum',
    diamond: 'Diamond',
    vipDiscountTitle: 'VIP Tiers & Discount Rates',
    discountRate: 'Discount Rate',
    spendingRequirement: 'Required Spend',

    // Account Page
    accountTitle: 'My Account',
    accountSubtitle: 'Manage your profile and account security.',
    profileInfo: 'Basic Profile',
    usernameLabel: 'Username:',
    emailLabel: 'Email Address:',
    phoneLabel: 'Phone Number:',
    saveChanges: 'Save Changes',
    securitySettings: 'Security & Password',
    currentPasswordLabel: 'Current Password:',
    newPasswordLabel: 'New Password:',
    updatePassword: 'Update Password',
    totalPurchases: 'Total Purchases',
    totalOrdersCount: 'Total Orders',

    // Auth Modal
    loginTab: 'Sign In',
    registerTab: 'Register',
    googleSignIn: 'Continue with Google',
    orEmail: 'Or with Email',
    password: 'Password',
    nameOptional: 'Full Name',
  },
};

const CATEGORY_NAMES: Record<string, Record<Language, string>> = {
  games: { ug: 'ئويۇنلار', ar: 'الألعاب', en: 'Games' },
  apps: { ug: 'ئەپلەر', ar: 'التطبيقات', en: 'Apps' },
  ai: { ug: 'سۈنئىي ئەقىل', ar: 'الذكاء الاصطناعي', en: 'AI Tools' },
  numbers: { ug: 'مەۋھۇم نومۇر', ar: 'أرقام وهمية (SMS)', en: 'Virtual Numbers' },
  cards: { ug: 'كارتىلار ۋە VCC', ar: 'بطاقات و VCC', en: 'Cards & VCC' },
  accounts: { ug: 'تەييار ھېساباتلار', ar: 'حسابات جاهزة', en: 'Ready Accounts' },
  crypto: { ug: 'شىفىرلىق پۇل (USDT)', ar: 'عملات رقمية (USDT)', en: 'Crypto (USDT)' },
  social: { ug: 'ئىجتىمائىي تاراتقۇ', ar: 'خدمات التواصل', en: 'Social Media' },
  balance: { ug: 'يەرلىك ھەميان', ar: 'محافظ محلية', en: 'Local Wallets' },
};

const CATEGORY_COUNTS: Record<string, Record<Language, string>> = {
  games: { ug: '117 ئويۇن', ar: '117 لعبة', en: '117 Games' },
  apps: { ug: '10 چوڭ ئەپ', ar: '10 تطبيقات', en: '10 Apps' },
  ai: { ug: '10 چوڭ AI', ar: '10 أدوات AI', en: '10 AI Tools' },
  numbers: { ug: '9 خىل SMS', ar: '9 خدمات تفعيل', en: '9 SMS Services' },
  cards: { ug: '11 خىل كارتا', ar: '11 بطاقة دفع', en: '11 Cards' },
  accounts: { ug: 'Netflix, Spotify', ar: 'Netflix, Spotify', en: 'Netflix, Spotify' },
  crypto: { ug: 'Binance, TRC20', ar: 'Binance, TRC20', en: 'Binance, TRC20' },
  social: { ug: 'ئەگەشكۈچى، ياقتۇرۇش', ar: 'متابعون وتفاعل', en: 'Followers & Likes' },
  balance: { ug: 'تولۇقلاش', ar: 'شحن رصيد', en: 'Direct Top-up' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('ug');

  useEffect(() => {
    try {
      const savedLang = localStorage.getItem('autocash_lang') as Language;
      if (savedLang && (savedLang === 'ug' || savedLang === 'ar' || savedLang === 'en')) {
        setLangState(savedLang);
        applyLanguageToDocument(savedLang);
      } else {
        applyLanguageToDocument('ug');
      }
    } catch {
      // Fallback to ug
      applyLanguageToDocument('ug');
    }
  }, []);

  const applyLanguageToDocument = (l: Language) => {
    if (typeof document !== 'undefined') {
      const dir = l === 'en' ? 'ltr' : 'rtl';
      document.documentElement.lang = l;
      document.documentElement.dir = dir;
      if (l === 'en') {
        document.body.classList.add('lang-en');
        document.body.classList.remove('lang-ug', 'lang-ar');
      } else if (l === 'ar') {
        document.body.classList.add('lang-ar');
        document.body.classList.remove('lang-ug', 'lang-en');
      } else {
        document.body.classList.add('lang-ug');
        document.body.classList.remove('lang-ar', 'lang-en');
      }
    }
  };

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    try {
      localStorage.setItem('autocash_lang', newLang);
    } catch (e) {
      console.error(e);
    }
    applyLanguageToDocument(newLang);
  };

  const t = (key: string): string => {
    return TRANSLATIONS[lang]?.[key] || TRANSLATIONS.ug[key] || key;
  };

  const getCategoryName = (id: string, defaultName: string): string => {
    return CATEGORY_NAMES[id]?.[lang] || defaultName;
  };

  const getCategoryCount = (id: string, defaultCount: string): string => {
    return CATEGORY_COUNTS[id]?.[lang] || defaultCount;
  };

  const translatePackageTitle = (title: string): string => {
    if (lang === 'ug') return title;

    if (lang === 'ar') {
      if (title.includes('ئاساسىي')) return title.replace('ئاساسىي بولاق', 'الباقة الأساسية');
      if (title.includes('ئوتتۇرا')) return title.replace('ئوتتۇرا بولاق', 'الباقة المتوسطة');
      if (title.includes('VIP')) return title.replace('VIP بولاق', 'باقة VIP');
      if (title.includes('Ultra')) return title.replace('Ultra بولاق', 'باقة ألترا');
      if (title.includes('بولاق')) return title.replace('بولاق', 'باقة');
      if (title.includes('ئايلىق')) return title.replace('ئايلىق', 'شهري');
      if (title.includes('يىللىق')) return title.replace('يىللىق', 'سنوي');
      return title;
    }

    if (lang === 'en') {
      if (title.includes('ئاساسىي')) return title.replace('ئاساسىي بولاق', 'Basic Pack');
      if (title.includes('ئوتتۇرا')) return title.replace('ئوتتۇرا بولاق', 'Medium Pack');
      if (title.includes('VIP')) return title.replace('VIP بولاق', 'VIP Pack');
      if (title.includes('Ultra')) return title.replace('Ultra بولاق', 'Ultra Pack');
      if (title.includes('بولاق')) return title.replace('بولاق', 'Pack');
      if (title.includes('ئايلىق')) return title.replace('ئايلىق', 'Monthly');
      if (title.includes('يىللىق')) return title.replace('يىللىق', 'Yearly');
      return title;
    }

    return title;
  };

  const translateBadge = (badge?: string): string | undefined => {
    if (!badge) return undefined;
    if (lang === 'ug') return badge;
    if (lang === 'ar') {
      if (badge === 'ئەڭ قىزىق') return 'الأكثر طلباً';
      if (badge === 'يېڭى') return 'جديد';
      if (badge === 'مەخسۇس') return 'مميز';
      return badge;
    }
    if (lang === 'en') {
      if (badge === 'ئەڭ قىزىق') return 'HOT';
      if (badge === 'يېڭى') return 'NEW';
      if (badge === 'مەخسۇس') return 'SPECIAL';
      return badge;
    }
    return badge;
  };

  const translateInputLabel = (label?: string): string | undefined => {
    if (!label) return undefined;
    if (lang === 'ug') return label;
    if (lang === 'ar') {
      if (label.includes('ئويۇنچى ID')) return 'معرف اللاعب (Player ID)';
      if (label.includes('ھېسابات')) return 'معرف الحساب أو البريد';
      return label;
    }
    if (lang === 'en') {
      if (label.includes('ئويۇنچى ID')) return 'Player ID';
      if (label.includes('ھېسابات')) return 'Account ID / Email';
      return label;
    }
    return label;
  };

  const translateInputPlaceholder = (placeholder?: string): string | undefined => {
    if (!placeholder) return undefined;
    if (lang === 'ug') return placeholder;
    if (lang === 'ar') {
      if (placeholder.includes('ئويۇندىكى كىملىك')) return 'أدخل معرف اللاعب ID الخاص بك في اللعبة';
      return 'أدخل البيانات المطلوبة هنا...';
    }
    if (lang === 'en') {
      if (placeholder.includes('ئويۇندىكى كىملىك')) return 'Enter your in-game Player ID';
      return 'Enter required details...';
    }
    return placeholder;
  };

  const dir = lang === 'en' ? 'ltr' : 'rtl';
  const isRTL = dir === 'rtl';

  return (
    <LanguageContext.Provider
      value={{
        lang,
        setLang,
        t,
        dir,
        isRTL,
        getCategoryName,
        getCategoryCount,
        translatePackageTitle,
        translateBadge,
        translateInputLabel,
        translateInputPlaceholder,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
