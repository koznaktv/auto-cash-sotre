export interface AppVersionInfo {
  version: string;
  code: number;
  releaseDate: string;
  downloadUrl: string;
  releaseNotes: Record<string, string>;
}

export const APP_VERSION_CONFIG: AppVersionInfo = {
  version: '1.2.1',
  code: 4,
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
};
