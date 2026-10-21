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
  version: '1.2.2',
  code: 5,
  minRequiredVersion: '1.2.2', // Any installed app version lower than 1.2.2 is strictly disabled
  forceUpdate: true,
  releaseDate: '2026-10-21',
  downloadUrl: '/download/autocash.apk',
  releaseNotes: {
    ug: 'AUTO CASH v1.2.2: ئەپ سىنبەلگىسى (App Launcher Icon) تولۇق سۈزۈك، يۇقىرى ئېنىقلىقتىكى Adaptive ھالەتكە يېڭىلاندى. قارشى ئېلىش بېتىدىكى رەسىم ۋە ئالتۇن بەلگە تولۇق سۈزۈكلەشتۈرۈلدى.',
    en: 'AUTO CASH v1.2.2: Launcher icon upgraded to ultra-sharp high-DPI Adaptive Icon. Welcome splash screen graphics and golden brand emblem enhanced with crystal-clear rendering.',
    ar: 'AUTO CASH v1.2.2: ترقية أيقونة التطبيق بدقة فائقة بتقنية Adaptive Icon وشاشة ترحيبية فائقة الوضوح.',
    tr: 'AUTO CASH v1.2.2: Uygulama simgesi ultra net Adaptive Icon formatına yükseltildi ve karşılama ekranı görseli kristal netliğine kavuşturuldu.',
    uz: 'AUTO CASH v1.2.2: Ilova belgisi ultra aniq Adaptive Icon formatiga yangilandi va kutib olish ekrani rasmi to‘liq tiniqlashtirildi.',
    ru: 'AUTO CASH v1.2.2: Иконка приложения обновлена до сверхчеткого Adaptive Icon, графика приветственного экрана улучшена.',
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
