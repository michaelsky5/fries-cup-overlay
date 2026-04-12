import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhTranslation from './locales/zh/translation.json';
import enTranslation from './locales/en/translation.json';

const resources = {
  zh: { translation: zhTranslation },
  en: { translation: enTranslation }
};

// 🚀 获取浏览器默认语言
const getBrowserLanguage = () => {
  const lang = navigator.language || navigator.userLanguage;
  return lang.toLowerCase().startsWith('zh') ? 'zh' : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getBrowserLanguage(), // 🚀 动态设置为系统语言，而不是写死
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;