export interface AppVersionInfo {
  version: string;
  code: number;
  minRequiredVersion: string;
  forceUpdate: boolean;
  releaseDate: string;
  downloadUrl: string;
  releaseNotes: Record<string, string>;
  forceUpdateMessages: Record<string, { title: string; message: string; button: string }>;
}

export const APP_VERSION_CONFIG: AppVersionInfo = {
  version: '1.5.0',
  code: 9,
  minRequiredVersion: '1.4.0',
  forceUpdate: false,
  releaseDate: '2026-10-24',
  downloadUrl: '/download/autocash.apk',
  releaseNotes: {
    ug: 'AUTO CASH v1.5.0: كىرىش ۋە تىزىملىتىش كۆرۈنمە يۈزى تۇلۇق يېڭىلىنىپ، ئەپتىكى قېتىۋېلىش ۋە يېزىش ئاستىلىقى تۈپتىن ئوڭشالدى. سىستېما تېزلىكى ۋە كۇنۇپكىلار راۋان ھالەتكە كەلتۈرۈلدى.',
    en: 'AUTO CASH v1.5.0: The login and registration modal has been completely refactored. Keystroke latency, BiDi text freeze, and animation frame stutter resolved for maximum smoothness.',
    ar: 'AUTO CASH v1.5.0: تم إعادة بناء واجهة تسجيل الدخول والاشتراك بالكامل لحل مشكلة التجمد والبطء أثناء الكتابة، مع أداء فائق وسرعة استجابة فورية.',
    tr: 'AUTO CASH v1.5.0: Giriş ve kayıt ekranı optimize edildi, klavye donma ve kasma sorunları tamamen giderildi. Süper akıcı performans sağlandı.',
    uz: 'AUTO CASH v1.5.0: Kirish va ro‘yxatdan o‘tish oynasi yangilandi, qotib qolish va sekinlik muammolari to‘liq bartaraf etildi.',
    ru: 'AUTO CASH v1.5.0: Переработан экран авторизации и регистрации. Полностью устранены задержки ввода клавиатуры и зависания.',
  },
  forceUpdateMessages: {
    ug: {
      title: 'بۇ نەشرى ئىناۋەتسىز بولدى / يېڭىلاش مەجبۇرىي',
      message: 'سىز ئىشلىتىۋاتقان ئەپ نەشرى كونا بولۇپ، بىخەتەرلىك ۋە سىستېما تەلەپلىرى سەۋەبىدىن ئىشلىتىش توختىتىلدى. سۇپىدىن داۋاملىق نورمال پايدىلىنىش ۋە مۇلازىمەتلەردىن بەھرىمەن بولۇش ئۈچۈن، دەرھال تۆۋەندىكى كۇنۇپكىنى بېسىپ ئەڭ يېڭى نەشرىنى توربەتتىن چۈشۈرۈۋېلىڭ.',
      button: 'يېڭى نەشرىنى توربەتتىن چۈشۈرۈڭ',
    },
    en: {
      title: 'This App Version Has Expired / Update Required',
      message: 'The version of the app you are running is outdated and has been disabled for security and system compatibility. To continue using AUTO CASH, please download the latest version from our website below.',
      button: 'Download New Version from Website',
    },
    ar: {
      title: 'هذا الإصدار من التطبيق قديم / التحديث إجباري',
      message: 'الإصدار الحالي الذي تستخدمه قديم وتم إيقافه لأسباب أمنية وتوافقية. لمواصلة استخدام الخدمات وإتمام الطلبات، يرجى تحميل أحدث إصدار من الموقع.',
      button: 'تحميل الإصدار الجديد من الموقع',
    },
    tr: {
      title: 'Bu Sürümün Süresi Doldu / Güncelleme Zorunlu',
      message: 'Kullandığınız uygulama sürümü eskidir ve güvenlik ile sistem uyumluluğu nedeniyle durdurulmuştur. Hizmetlerden yararlanmaya devam etmek için lütfen aşağıdaki bağlantıdan en son sürümü web sitemizden indirin.',
      button: 'Yeni Sürümü Web Sitesinden İndirin',
    },
    uz: {
      title: 'Ushbu ilova talqini eskirgan / Majburiy yangilash',
      message: 'Siz ishlatayotgan ilova talqini eskirgan va xavfsizlik talablari sababli to‘xtatildi. Xizmatlardan to‘liq foydalanish uchun darhol yangi talqinni veb-saytdan yuklab oling.',
      button: 'Yangi talqinni veb-saytdan yuklab oling',
    },
    ru: {
      title: 'Версия приложения устарела / Требуется обновление',
      message: 'Используемая вами версия приложения устарела и отключена в целях безопасности и совместимости. Для продолжения работы скачайте актуальную версию с нашего сайта.',
      button: 'Скачать новую версию с сайта',
    },
  },
};
