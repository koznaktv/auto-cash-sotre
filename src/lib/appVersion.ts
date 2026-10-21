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
  version: '1.2.1',
  code: 4,
  minRequiredVersion: '1.2.1', // Any installed app version lower than 1.2.1 is strictly disabled
  forceUpdate: true,
  releaseDate: '2026-10-21',
  downloadUrl: '/download/autocash.apk',
  releaseNotes: {
    ug: 'AUTO CASH v1.2.1: مەھسۇلات ئىچىدىن ياندىن سىيرىپ قايتىش (Edge Swipe Gesture & Back Navigation) تولۇق ئوڭشالدى. مەھسۇلات تەپسىلاتى ئوچۇق ۋاقىتتا قايتىشنى باسسىڭىز ئەپتىن چىقىپ كەتمەي، ئوڭۇشلۇق تاقىلىدىغان قىلىندى.',
    en: 'AUTO CASH v1.2.1: Fixed edge-swipe gesture navigation inside product details. Swiping or pressing back smoothly closes the active product modal without exiting the app.',
    ar: 'AUTO CASH v1.2.1: تم إصلاح إيماءة الرجوع بالسحب من الحافة داخل تفاصيل المنتج بسلاسة دون الخروج من التطبيق.',
    tr: 'AUTO CASH v1.2.1: Ürün detaylarında kenardan kaydırarak geri dönme hareketi düzeltildi. Geri basıldığında uygulamadan çıkmadan ürün penceresi sorunsuz kapanır.',
    uz: 'AUTO CASH v1.2.1: Mahsulot sahifasida chekkadan surib qaytish harakati to‘liq tuzatildi. Orqaga qaytish bosilganda ilovadan chiqib ketmasdan mahsulot oynasi yopiladi.',
    ru: 'AUTO CASH v1.2.1: Полностью исправлена навигация жестом «Назад» со свайпом от края в деталях товара. Возврат назад закрывает карточку товара, не закрывая приложение.',
  },
  forceUpdateMessages: {
    ug: {
      title: 'بۇ نەشرى ئىناۋەتسىز بولدى / يېڭىلاش مەجبۇرىي',
      message: 'سىز ئىشلىتىۋاتقان ئەپ نەشرى كونا بولۇپ، بىخەتەرلىك ۋە سىستېما تەلەپلىرى سەۋەبىدىن ئىشلىتىش توختىتىلدى. سۇپىدىن داۋاملىق نورمال پايدىلىنىش ۋە مۇلازىمەتلەردىن بەھرىمەن بولۇش ئۈچۈن، دەرھال تۆۋەندىكى ئۇلانمىدىن ئەڭ يېڭى نەشرىنى چۈشۈرۈپ قاچىلاڭ.',
      button: 'ھازىرلا ئەڭ يېڭى نەشرىنى چۈشۈرۈش (APK)',
    },
    en: {
      title: 'This App Version Has Expired / Update Required',
      message: 'The version of the app you are running is outdated and has been disabled for security and system compatibility. To continue using AUTO CASH, please download and install the latest version below.',
      button: 'Download Latest Version Now (APK)',
    },
    ar: {
      title: 'هذا الإصدار من التطبيق قديم / التحديث إجباري',
      message: 'الإصدار الحالي الذي تستخدمه قديم وتم إيقافه لأسباب أمنية وتوافقية. لمواصلة استخدام الخدمات وإتمام الطلبات، يرجى تحميل وتثبيت أحدث إصدار من الرابط أدناه فوراً.',
      button: 'تحميل أحدث إصدار الآن (APK)',
    },
    tr: {
      title: 'Bu Sürümün Süresi Doldu / Güncelleme Zorunlu',
      message: 'Kullandığınız uygulama sürümü eskidir ve güvenlik ile sistem uyumluluğu nedeniyle durdurulmuştur. Hizmetlerden yararlanmaya devam etmek için lütfen aşağıdaki bağlantıdan en son sürümü hemen indirin.',
      button: 'En Son Sürümü Şimdi İndir (APK)',
    },
    uz: {
      title: 'Ushbu ilova talqini eskirgan / Majburiy yangilash',
      message: 'Siz ishlatayotgan ilova talqini eskirgan va xavfsizlik talablari sababli to‘xtatildi. Xizmatlardan to‘liq foydalanish uchun darhol quyidagi havola orqali yangi talqinni yuklab oling.',
      button: 'Eng yangi talqinni hoziroq yuklab olish (APK)',
    },
    ru: {
      title: 'Версия приложения устарела / Требуется обновление',
      message: 'Используемая вами версия приложения устарела и отключена в целях безопасности и совместимости. Для продолжения работы немедленно скачайте и установите актуальную версию по ссылке ниже.',
      button: 'Скачать актуальную версию (APK)',
    },
  },
};
