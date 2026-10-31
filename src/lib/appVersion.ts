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
  version: '1.6.0',
  code: 10,
  minRequiredVersion: '1.5.0',
  forceUpdate: false,
  releaseDate: '2026-10-31',
  downloadUrl: '/download/autocash.apk',
  releaseNotes: {
    ug: 'AUTO CASH v1.6.0: توربەت، يانفون ئەپ ۋە تېلېگرامما مىنى ئەپلىرىدە يۈكلىنىش سۈرئىتى ئەڭ يۇقىرى سەۋىيەگە يەتكۈزۈلدى، قېتىۋېلىش پۈتۈنلەي تۈگىتىلدى. باشبەت ۋە پائالىيەتلەر سەھىپىسىگە 3D مېخانىكىلىق جانلىق سائەت، بارلىق سۈرىيەتېل/شامكەش/ئويۇن بولاقلىرىنىڭ كۆپ تىللىق تەپسىلاتلىرى ۋە خېرىدارلار مۇلازىمەت ئورنى تولۇق يېڭىلاندى.',
    en: 'AUTO CASH v1.6.0: Ultra-fast loading and zero-stutter optimizations across Web, Android APK, and Telegram Mini App. Added 3D Mechanical Split-Flap Countdown Clocks, multilingual provider notices, and precision alignment for floating navigation.',
    ar: 'AUTO CASH v1.6.0: سرعة فائقة وانعدام كامل للتجمد عبر الموقع والتطبيق وبوت تيليجرام. إضافة ساعات العد التنازلي الميكانيكية ثلاثية الأبعاد وتحسين دقيق لواجهة المستخدم.',
    tr: 'AUTO CASH v1.6.0: Web, Android APK ve Telegram Mini App üzerinde maksimum hız optimizasyonu ve sıfır donma garantisi. 3D mekanik geri sayım saatleri ve kusursuz hizalama eklendi.',
    uz: 'AUTO CASH v1.6.0: Veb-sayt, Android ilova va Telegram Mini App uchun maksimal tezlik va qotib qolmaslik optimizatsiyasi. 3D mexanik soat va yangilangan xizmatlar.',
    ru: 'AUTO CASH v1.6.0: Максимальное ускорение загрузки и нулевой уровень задержек для Web, Android APK и Telegram Mini App. Добавлены 3D механические часы с обратным отсчетом.',
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
