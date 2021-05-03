import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import translationDe from "./public/locales/de/translation.json";
import translationEn from "./public/locales/en/translation.json";

export const resources = {
  en: {
    translation: translationEn,
  },
  de: {
    translation: translationDe,
  },
} as const;

i18n.use(initReactI18next).init({
  lng: "de",
  resources,
});
