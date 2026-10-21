export interface AppVersionInfo {
  version: string;
  code: number;
  releaseDate: string;
  downloadUrl: string;
  releaseNotes: Record<string, string>;
}

export const APP_VERSION_CONFIG: AppVersionInfo = {
  version: '1.2.0',
  code: 3,
  releaseDate: '2026-10-21',
  downloadUrl: '/download/autocash.apk',
  releaseNotes: {
    ug: 'AUTO CASH ئەپىنىڭ v1.2.0 يېڭى نەشرى تارقىتىلدى! ئەپ ئىچىدىن بىۋاسىتە چۈشۈرۈش ئوڭشالدى، تېلېفوننىڭ قايتىش كۇنۇپكىسى ئەقلىي ئىقتىدارغا ئىگە قىلىندى، زاكاز ۋە قالدۇق يېڭىلىنىش تېزلىتىلدى ھەم VIP بەلگىلىرى لەرزان گۈزەللەشتۈرۈلدى.',
    en: 'AUTO CASH App v1.2.0 has been released! Fixed native file downloads, added smart back-button navigation, real-time balance sync, and royal animated VIP badges.',
    ar: 'تم إطلاق الإصدار الجديد v1.2.0 من تطبيق AUTO CASH! تم إصلاح التنزيلات داخل التطبيق، وإضافة زر الرجوع الذكي، ومزامنة الرصيد الفورية، وشارات VIP الملكية المتحركة.',
    tr: 'AUTO CASH Uygulamasının yeni v1.2.0 sürümü yayınlandı! Uygulama içi indirme düzeltildi, akıllı geri tuşu eklendi, bakiye senkronizasyonu hızlandırıldı ve VIP animasyonları yenilendi.',
    uz: 'AUTO CASH ilovasining v1.2.0 yangi talqini chiqarildi! Ilova ichida yuklab olish to‘g‘rilandi, aqlli orqaga qaytish tugmasi va yangi VIP animatsiyalari qo‘shildi.',
    ru: 'Вышла новая версия v1.2.0 приложения AUTO CASH! Исправлена загрузка файлов, улучшена кнопка «Назад», добавлено мгновенное обновление баланса и королевская анимация VIP.',
  },
};
