/**
 * All available locales for document localization.
 * SSOT (Single Source of Truth): IANA Language Subtag Registry
 * https://www.iana.org/assignments/language-subtag-registry
 */
export interface Locale {
	code: string
	name: string
}

export const ALL_LOCALES: Locale[] = [
	// === AFRICAN LANGUAGES ===
	{ code: 'af-ZA', name: 'Afrikaans (South Africa)' },
	{ code: 'am-ET', name: 'Amharic (Ethiopia)' },
	{ code: 'ha-NG', name: 'Hausa (Nigeria)' },
	{ code: 'ig-NG', name: 'Igbo (Nigeria)' },
	{ code: 'km-KH', name: 'Khmer (Cambodia)' },
	{ code: 'lo-LA', name: 'Lao (Laos)' },
	{ code: 'mg-MG', name: 'Malagasy (Madagascar)' },
	{ code: 'mi-NZ', name: 'Maori (New Zealand)' },
	{ code: 'ms-MY', name: 'Malay (Malaysia)' },
	{ code: 'ms-SG', name: 'Malay (Singapore)' },
	{ code: 'ms-BN', name: 'Malay (Brunei)' },
	{ code: 'ne-NP', name: 'Nepali (Nepal)' },
	{ code: 'om-ET', name: 'Oromo (Ethiopia)' },
	{ code: 'si-LK', name: 'Sinhala (Sri Lanka)' },
	{ code: 'so-SO', name: 'Somali (Somalia)' },
	{ code: 'sw-TZ', name: 'Swahili (Tanzania)' },
	{ code: 'sw-KE', name: 'Swahili (Kenya)' },
	{ code: 'sw-UG', name: 'Swahili (Uganda)' },
	{ code: 'ta-IN', name: 'Tamil (India)' },
	{ code: 'ta-LK', name: 'Tamil (Sri Lanka)' },
	{ code: 'ta-MY', name: 'Tamil (Malaysia)' },
	{ code: 'ta-SG', name: 'Tamil (Singapore)' },
	{ code: 'te-IN', name: 'Telugu (India)' },
	{ code: 'ti-ET', name: 'Tigrinya (Ethiopia)' },
	{ code: 'yo-NG', name: 'Yoruba (Nigeria)' },
	{ code: 'zu-ZA', name: 'Zulu (South Africa)' },

	// === ENGLISH VARIANTS ===
	{ code: 'en-US', name: 'English (US)' },
	{ code: 'en-GB', name: 'English (UK)' },
	{ code: 'en-AU', name: 'English (Australia)' },
	{ code: 'en-CA', name: 'English (Canada)' },
	{ code: 'en-NZ', name: 'English (New Zealand)' },
	{ code: 'en-IE', name: 'English (Ireland)' },
	{ code: 'en-ZA', name: 'English (South Africa)' },
	{ code: 'en-IN', name: 'English (India)' },
	{ code: 'en-SG', name: 'English (Singapore)' },
	{ code: 'en-HK', name: 'English (Hong Kong)' },
	{ code: 'en-PH', name: 'English (Philippines)' },
	{ code: 'en-NG', name: 'English (Nigeria)' },
	{ code: 'en-GH', name: 'English (Ghana)' },
	{ code: 'en-KE', name: 'English (Kenya)' },

	// === SPANISH VARIANTS ===
	{ code: 'es-ES', name: 'Spanish (Spain)' },
	{ code: 'es-MX', name: 'Spanish (Mexico)' },
	{ code: 'es-AR', name: 'Spanish (Argentina)' },
	{ code: 'es-CO', name: 'Spanish (Colombia)' },
	{ code: 'es-CL', name: 'Spanish (Chile)' },
	{ code: 'es-PE', name: 'Spanish (Peru)' },
	{ code: 'es-VE', name: 'Spanish (Venezuela)' },
	{ code: 'es-EC', name: 'Spanish (Ecuador)' },
	{ code: 'es-GT', name: 'Spanish (Guatemala)' },
	{ code: 'es-CU', name: 'Spanish (Cuba)' },
	{ code: 'es-BO', name: 'Spanish (Bolivia)' },
	{ code: 'es-DO', name: 'Spanish (Dominican Republic)' },
	{ code: 'es-HN', name: 'Spanish (Honduras)' },
	{ code: 'es-SV', name: 'Spanish (El Salvador)' },
	{ code: 'es-NI', name: 'Spanish (Nicaragua)' },
	{ code: 'es-CR', name: 'Spanish (Costa Rica)' },
	{ code: 'es-PA', name: 'Spanish (Panama)' },
	{ code: 'es-PY', name: 'Spanish (Paraguay)' },
	{ code: 'es-UY', name: 'Spanish (Uruguay)' },
	{ code: 'es-PR', name: 'Spanish (Puerto Rico)' },
	{ code: 'es-US', name: 'Spanish (US)' },

	// === PORTUGUESE VARIANTS ===
	{ code: 'pt-BR', name: 'Portuguese (Brazil)' },
	{ code: 'pt-PT', name: 'Portuguese (Portugal)' },
	{ code: 'pt-AO', name: 'Portuguese (Angola)' },
	{ code: 'pt-MZ', name: 'Portuguese (Mozambique)' },

	// === FRENCH VARIANTS ===
	{ code: 'fr-FR', name: 'French (France)' },
	{ code: 'fr-CA', name: 'French (Canada)' },
	{ code: 'fr-BE', name: 'French (Belgium)' },
	{ code: 'fr-CH', name: 'French (Switzerland)' },
	{ code: 'fr-LU', name: 'French (Luxembourg)' },
	{ code: 'fr-MC', name: 'French (Monaco)' },
	{ code: 'fr-AF', name: 'French (West Africa)' },
	{ code: 'fr-CM', name: 'French (Cameroon)' },
	{ code: 'fr-CG', name: 'French (Congo)' },
	{ code: 'fr-CD', name: 'French (DR Congo)' },
	{ code: 'fr-SN', name: 'French (Senegal)' },
	{ code: 'fr-ML', name: 'French (Mali)' },
	{ code: 'fr-TG', name: 'French (Togo)' },
	{ code: 'fr-BJ', name: 'French (Benin)' },
	{ code: 'fr-NE', name: 'French (Niger)' },
	{ code: 'fr-BF', name: 'French (Burkina Faso)' },
	{ code: 'fr-CI', name: 'French (Ivory Coast)' },

	// === GERMAN VARIANTS ===
	{ code: 'de-DE', name: 'German (Germany)' },
	{ code: 'de-AT', name: 'German (Austria)' },
	{ code: 'de-CH', name: 'German (Switzerland)' },
	{ code: 'de-LU', name: 'German (Luxembourg)' },
	{ code: 'de-LI', name: 'German (Liechtenstein)' },
	{ code: 'de-BE', name: 'German (Belgium)' },

	// === ITALIAN VARIANTS ===
	{ code: 'it-IT', name: 'Italian (Italy)' },
	{ code: 'it-CH', name: 'Italian (Switzerland)' },

	// === DUTCH VARIANTS ===
	{ code: 'nl-NL', name: 'Dutch (Netherlands)' },
	{ code: 'nl-BE', name: 'Dutch (Belgium)' },
	{ code: 'nl-SR', name: 'Dutch (Suriname)' },

	// === SLAVIC LANGUAGES ===
	{ code: 'ru-RU', name: 'Russian (Russia)' },
	{ code: 'ru-BY', name: 'Russian (Belarus)' },
	{ code: 'ru-KZ', name: 'Russian (Kazakhstan)' },
	{ code: 'ru-UA', name: 'Russian (Ukraine)' },
	{ code: 'uk-UA', name: 'Ukrainian (Ukraine)' },
	{ code: 'pl-PL', name: 'Polish (Poland)' },
	{ code: 'cs-CZ', name: 'Czech (Czech Republic)' },
	{ code: 'sk-SK', name: 'Slovak (Slovakia)' },
	{ code: 'hu-HU', name: 'Hungarian (Hungary)' },
	{ code: 'ro-RO', name: 'Romanian (Romania)' },
	{ code: 'ro-MD', name: 'Romanian (Moldova)' },
	{ code: 'bg-BG', name: 'Bulgarian (Bulgaria)' },
	{ code: 'mk-MK', name: 'Macedonian (North Macedonia)' },
	{ code: 'sq-AL', name: 'Albanian (Albania)' },
	{ code: 'hr-HR', name: 'Croatian (Croatia)' },
	{ code: 'sr-RS', name: 'Serbian (Serbia)' },
	{ code: 'sr-BA', name: 'Serbian (Bosnia)' },
	{ code: 'sr-ME', name: 'Serbian (Montenegro)' },
	{ code: 'bs-BA', name: 'Bosnian (Bosnia)' },
	{ code: 'sl-SI', name: 'Slovenian (Slovenia)' },

	// === BALTIC LANGUAGES ===
	{ code: 'lt-LT', name: 'Lithuanian (Lithuania)' },
	{ code: 'lv-LV', name: 'Latvian (Latvia)' },
	{ code: 'et-EE', name: 'Estonian (Estonia)' },

	// === NORDIC LANGUAGES ===
	{ code: 'sv-SE', name: 'Swedish (Sweden)' },
	{ code: 'sv-FI', name: 'Swedish (Finland)' },
	{ code: 'nb-NO', name: 'Norwegian Bokmal (Norway)' },
	{ code: 'nn-NO', name: 'Norwegian Nynorsk (Norway)' },
	{ code: 'da-DK', name: 'Danish (Denmark)' },
	{ code: 'fi-FI', name: 'Finnish (Finland)' },
	{ code: 'is-IS', name: 'Icelandic (Iceland)' },

	// === GREEK & TURKISH ===
	{ code: 'el-GR', name: 'Greek (Greece)' },
	{ code: 'tr-TR', name: 'Turkish (Turkey)' },
	{ code: 'tr-CY', name: 'Turkish (Cyprus)' },

	// === CAUCASIAN LANGUAGES ===
	{ code: 'ka-GE', name: 'Georgian (Georgia)' },
	{ code: 'hy-AM', name: 'Armenian (Armenia)' },
	{ code: 'az-AZ', name: 'Azerbaijani (Azerbaijan)' },

	// === CENTRAL ASIAN LANGUAGES ===
	{ code: 'kk-KZ', name: 'Kazakh (Kazakhstan)' },
	{ code: 'uz-UZ', name: 'Uzbek (Uzbekistan)' },
	{ code: 'tg-TJ', name: 'Tajik (Tajikistan)' },
	{ code: 'ky-KG', name: 'Kyrgyz (Kyrgyzstan)' },
	{ code: 'tk-TM', name: 'Turkmen (Turkmenistan)' },
	{ code: 'mn-MN', name: 'Mongolian (Mongolia)' },

	// === MIDDLE EASTERN LANGUAGES ===
	{ code: 'ar-SA', name: 'Arabic (Saudi Arabia)' },
	{ code: 'ar-AE', name: 'Arabic (UAE)' },
	{ code: 'ar-EG', name: 'Arabic (Egypt)' },
	{ code: 'ar-MA', name: 'Arabic (Morocco)' },
	{ code: 'ar-DZ', name: 'Arabic (Algeria)' },
	{ code: 'ar-TN', name: 'Arabic (Tunisia)' },
	{ code: 'ar-IQ', name: 'Arabic (Iraq)' },
	{ code: 'ar-JO', name: 'Arabic (Jordan)' },
	{ code: 'ar-LB', name: 'Arabic (Lebanon)' },
	{ code: 'ar-KW', name: 'Arabic (Kuwait)' },
	{ code: 'ar-QA', name: 'Arabic (Qatar)' },
	{ code: 'ar-BH', name: 'Arabic (Bahrain)' },
	{ code: 'ar-SY', name: 'Arabic (Syria)' },
	{ code: 'ar-LY', name: 'Arabic (Libya)' },
	{ code: 'ar-PS', name: 'Arabic (Palestine)' },
	{ code: 'ar-YE', name: 'Arabic (Yemen)' },
	{ code: 'ar-SD', name: 'Arabic (Sudan)' },
	{ code: 'ar-SO', name: 'Arabic (Somalia)' },
	{ code: 'ar-DJ', name: 'Arabic (Djibouti)' },
	{ code: 'ar-KM', name: 'Arabic (Comoros)' },
	{ code: 'he-IL', name: 'Hebrew (Israel)' },

	// === IRANIAN LANGUAGES ===
	{ code: 'fa-IR', name: 'Persian (Iran)' },
	{ code: 'fa-AF', name: 'Persian (Afghanistan)' },
	{ code: 'fa-TJ', name: 'Persian (Tajikistan)' },
	{ code: 'ps-AF', name: 'Pashto (Afghanistan)' },

	// === SOUTH ASIAN LANGUAGES ===
	{ code: 'hi-IN', name: 'Hindi (India)' },
	{ code: 'ur-PK', name: 'Urdu (Pakistan)' },
	{ code: 'ur-IN', name: 'Urdu (India)' },
	{ code: 'bn-BD', name: 'Bengali (Bangladesh)' },
	{ code: 'bn-IN', name: 'Bengali (India)' },
	{ code: 'pa-IN', name: 'Punjabi (India)' },
	{ code: 'pa-PK', name: 'Punjabi (Pakistan)' },
	{ code: 'gu-IN', name: 'Gujarati (India)' },
	{ code: 'mr-IN', name: 'Marathi (India)' },
	{ code: 'kn-IN', name: 'Kannada (India)' },
	{ code: 'ml-IN', name: 'Malayalam (India)' },

	// === SOUTHEAST ASIAN LANGUAGES ===
	{ code: 'id-ID', name: 'Indonesian (Indonesia)' },
	{ code: 'fil-PH', name: 'Filipino (Philippines)' },
	{ code: 'vi-VN', name: 'Vietnamese (Vietnam)' },
	{ code: 'th-TH', name: 'Thai (Thailand)' },
	{ code: 'my-MM', name: 'Burmese (Myanmar)' },

	// === EAST ASIAN LANGUAGES ===
	{ code: 'zh-CN', name: 'Chinese (Simplified, China)' },
	{ code: 'zh-TW', name: 'Chinese (Traditional, Taiwan)' },
	{ code: 'zh-HK', name: 'Chinese (Cantonese, Hong Kong)' },
	{ code: 'zh-SG', name: 'Chinese (Singapore)' },
	{ code: 'zh-MO', name: 'Chinese (Macau)' },
	{ code: 'ja-JP', name: 'Japanese (Japan)' },
	{ code: 'ko-KR', name: 'Korean (South Korea)' },
	{ code: 'ko-KP', name: 'Korean (North Korea)' },

	// === ROMANCE LANGUAGES (OTHER) ===
	{ code: 'ca-ES', name: 'Catalan (Spain)' },
	{ code: 'eu-ES', name: 'Basque (Spain)' },
	{ code: 'gl-ES', name: 'Galician (Spain)' },
	{ code: 'oc-FR', name: 'Occitan (France)' },
	{ code: 'co-FR', name: 'Corsican (France)' },
	{ code: 'cy-GB', name: 'Welsh (UK)' },
	{ code: 'ga-IE', name: 'Irish (Ireland)' },
	{ code: 'gd-GB', name: 'Scottish Gaelic (UK)' },
	{ code: 'mt-MT', name: 'Maltese (Malta)' },
	{ code: 'lb-LU', name: 'Luxembourgish (Luxembourg)' },
]
