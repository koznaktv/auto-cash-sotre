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
  version: '1.3.0',
  code: 7,
  minRequiredVersion: '1.3.0', // Any installed app version lower than 1.3.0 is strictly disabled
  forceUpdate: true,
  releaseDate: '2026-10-21',
  downloadUrl: '/download/autocash.apk',
  releaseNotes: {
    ug: 'AUTO CASH v1.3.0: يېڭى ھەشەمەتلىك رەسمىي ماركا بەلگىسى (Brand New 3D Gold Logo) تولۇق پۈتتى. توربەت ۋە ئەپنىڭ بارلىق جايلىرىدىكى كونا لوگولار دۇنياۋى سەۋىيەدىكى سەرخىل، سۈزۈك ئالتۇن بەلگىگە يېڭىلاندى.',
    en: 'AUTO CASH v1.3.0: Brand new luxury 3D official gold gaming emblem released. All legacy logos across web, mobile app, launcher icons, and splash screens upgraded to crystal-clear high-definition assets.',
    ar: 'AUTO CASH v1.3.0: إطلاق الشعار الرسمي الفاخر الجديد ثلاثي الأبعاد وتحديث كافة الأيقونات وشاشات البداية بدقة استثنائية.',
    tr: 'AUTO CASH v1.3.0: Yepyeni lüks 3D resmi altın logo yayınlandı. Web sitesi, mobil uygulama, simgeler ve açılış ekranları ultra net görselle yenilendi.',
    uz: 'AUTO CASH v1.3.0: Yangi hashamatli 3D rasmiy oltin logo chiqarildi. Barcha ilova belgilari va veb-sayt to‘liq yangilandi.',
    ru: 'AUTO CASH v1.3.0: Выпущен совершенно новый роскошный 3D-логотип. Обновлены все иконки, нативный сплэш-скрин и интерфейс сайта.',
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
