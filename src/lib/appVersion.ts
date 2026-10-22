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
  version: '1.4.0',
  code: 8,
  minRequiredVersion: '1.3.0',
  forceUpdate: false,
  releaseDate: '2026-10-22',
  downloadUrl: '/download/autocash.apk',
  releaseNotes: {
    ug: 'AUTO CASH v1.4.0: يېڭى يۇمىلاق ھەشەمەتلىك ماركا بەلگىسى (Full Circular 3D Gold Logo) تولۇق پۈتتى. ئەپ سىنبەلگىسى، ئېچىلىش ئېكرانى ۋە پۈتۈن كۆرۈنمە يۈز ئەڭ يۇقىرى ئېنىقلىقتا يېڭىلاندى.',
    en: 'AUTO CASH v1.4.0: Full circular luxury 3D gold logo released. App launcher icon, native splash screen, and full UI upgraded to ultra HD circular assets.',
    ar: 'AUTO CASH v1.4.0: إطلاق الشعار الدائري الفاخر الجديد ثلاثي الأبعاد وتحديث أيقونة التطبيق وشاشة البداية بدقة فائقة.',
    tr: 'AUTO CASH v1.4.0: Yepyeni tam yuvarlak lüks 3D altın logo yayınlandı. Uygulama simgesi ve açılış ekranı ultra net yenilendi.',
    uz: 'AUTO CASH v1.4.0: Yangi doiraviy hashamatli 3D oltin logo chiqarildi. Ilova belgisi va barcha ekranlar to‘liq yangilandi.',
    ru: 'AUTO CASH v1.4.0: Выпущен новый полноформатный круглый 3D-логотип. Обновлены иконки приложения и нативный сплэш-скрин.',
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
