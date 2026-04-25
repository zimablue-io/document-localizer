export interface Locale {
	code: string
	name: string
}

export const ALL_LOCALES: Locale[] = [
	// English
	{ code: 'en-US', name: 'American English' },
	{ code: 'en-GB', name: 'British English' },
	{ code: 'en-AU', name: 'Australian English' },
	{ code: 'en-CA', name: 'Canadian English' },
	{ code: 'en-NZ', name: 'New Zealand English' },
	{ code: 'en-IE', name: 'Irish English' },
	{ code: 'en-ZA', name: 'South African English' },
	{ code: 'en-IN', name: 'Indian English' },
	{ code: 'en-SG', name: 'Singapore English' },
	// Spanish
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
	// Portuguese
	{ code: 'pt-BR', name: 'Portuguese (Brazil)' },
	{ code: 'pt-PT', name: 'Portuguese (Portugal)' },
	// French
	{ code: 'fr-FR', name: 'French (France)' },
	{ code: 'fr-CA', name: 'French (Canada)' },
	{ code: 'fr-BE', name: 'French (Belgium)' },
	{ code: 'fr-CH', name: 'French (Switzerland)' },
	{ code: 'fr-LU', name: 'French (Luxembourg)' },
	{ code: 'fr-MC', name: 'French (Monaco)' },
	// German
	{ code: 'de-DE', name: 'German (Germany)' },
	{ code: 'de-AT', name: 'German (Austria)' },
	{ code: 'de-CH', name: 'German (Switzerland)' },
	{ code: 'de-LU', name: 'German (Luxembourg)' },
	{ code: 'de-LI', name: 'German (Liechtenstein)' },
	// Italian
	{ code: 'it-IT', name: 'Italian (Italy)' },
	{ code: 'it-CH', name: 'Italian (Switzerland)' },
	// Dutch
	{ code: 'nl-NL', name: 'Dutch (Netherlands)' },
	{ code: 'nl-BE', name: 'Dutch (Belgium)' },
	{ code: 'nl-SR', name: 'Dutch (Suriname)' },
	// Russian
	{ code: 'ru-RU', name: 'Russian (Russia)' },
	{ code: 'ru-BY', name: 'Russian (Belarus)' },
	{ code: 'ru-KZ', name: 'Russian (Kazakhstan)' },
	// Ukrainian
	{ code: 'uk-UA', name: 'Ukrainian (Ukraine)' },
	// Polish
	{ code: 'pl-PL', name: 'Polish (Poland)' },
	// Czech
	{ code: 'cs-CZ', name: 'Czech (Czech Republic)' },
	// Slovak
	{ code: 'sk-SK', name: 'Slovak (Slovakia)' },
	// Hungarian
	{ code: 'hu-HU', name: 'Hungarian (Hungary)' },
	// Romanian
	{ code: 'ro-RO', name: 'Romanian (Romania)' },
	{ code: 'ro-MD', name: 'Romanian (Moldova)' },
	// Bulgarian
	{ code: 'bg-BG', name: 'Bulgarian (Bulgaria)' },
	// Greek
	{ code: 'el-GR', name: 'Greek (Greece)' },
	// Turkish
	{ code: 'tr-TR', name: 'Turkish (Turkey)' },
	{ code: 'tr-CY', name: 'Turkish (Cyprus)' },
	// Arabic
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
	// Hebrew
	{ code: 'he-IL', name: 'Hebrew (Israel)' },
	// Persian
	{ code: 'fa-IR', name: 'Persian (Iran)' },
	{ code: 'fa-AF', name: 'Persian (Afghanistan)' },
	// Hindi
	{ code: 'hi-IN', name: 'Hindi (India)' },
	// Urdu
	{ code: 'ur-PK', name: 'Urdu (Pakistan)' },
	{ code: 'ur-IN', name: 'Urdu (India)' },
	// Bengali
	{ code: 'bn-BD', name: 'Bengali (Bangladesh)' },
	{ code: 'bn-IN', name: 'Bengali (India)' },
	// Chinese
	{ code: 'zh-CN', name: 'Chinese (Simplified, China)' },
	{ code: 'zh-TW', name: 'Chinese (Traditional, Taiwan)' },
	{ code: 'zh-HK', name: 'Chinese (Hong Kong)' },
	{ code: 'zh-SG', name: 'Chinese (Singapore)' },
	{ code: 'zh-MO', name: 'Chinese (Macau)' },
	// Japanese
	{ code: 'ja-JP', name: 'Japanese (Japan)' },
	// Korean
	{ code: 'ko-KR', name: 'Korean (South Korea)' },
	{ code: 'ko-KP', name: 'Korean (North Korea)' },
	// Vietnamese
	{ code: 'vi-VN', name: 'Vietnamese (Vietnam)' },
	// Thai
	{ code: 'th-TH', name: 'Thai (Thailand)' },
	// Indonesian
	{ code: 'id-ID', name: 'Indonesian (Indonesia)' },
	// Malay
	{ code: 'ms-MY', name: 'Malay (Malaysia)' },
	{ code: 'ms-SG', name: 'Malay (Singapore)' },
	{ code: 'ms-BN', name: 'Malay (Brunei)' },
	// Tagalog
	{ code: 'fil-PH', name: 'Filipino (Philippines)' },
	// Swedish
	{ code: 'sv-SE', name: 'Swedish (Sweden)' },
	{ code: 'sv-FI', name: 'Swedish (Finland)' },
	// Norwegian
	{ code: 'nb-NO', name: 'Norwegian Bokmal (Norway)' },
	{ code: 'nn-NO', name: 'Norwegian Nynorsk (Norway)' },
	// Danish
	{ code: 'da-DK', name: 'Danish (Denmark)' },
	// Finnish
	{ code: 'fi-FI', name: 'Finnish (Finland)' },
	// Icelandic
	{ code: 'is-IS', name: 'Icelandic (Iceland)' },
	// Estonian
	{ code: 'et-EE', name: 'Estonian (Estonia)' },
	// Latvian
	{ code: 'lv-LV', name: 'Latvian (Latvia)' },
	// Lithuanian
	{ code: 'lt-LT', name: 'Lithuanian (Lithuania)' },
	// Catalan
	{ code: 'ca-ES', name: 'Catalan (Spain)' },
	// Basque
	{ code: 'eu-ES', name: 'Basque (Spain)' },
	// Galician
	{ code: 'gl-ES', name: 'Galician (Spain)' },
	// Croatian
	{ code: 'hr-HR', name: 'Croatian (Croatia)' },
	// Serbian
	{ code: 'sr-RS', name: 'Serbian (Serbia)' },
	{ code: 'sr-BA', name: 'Serbian (Bosnia)' },
	{ code: 'sr-ME', name: 'Serbian (Montenegro)' },
	// Bosnian
	{ code: 'bs-BA', name: 'Bosnian (Bosnia)' },
	// Slovenian
	{ code: 'sl-SI', name: 'Slovenian (Slovenia)' },
	// Macedonian
	{ code: 'mk-MK', name: 'Macedonian (North Macedonia)' },
	// Albanian
	{ code: 'sq-AL', name: 'Albanian (Albania)' },
	// Welsh
	{ code: 'cy-GB', name: 'Welsh (UK)' },
	// Irish
	{ code: 'ga-IE', name: 'Irish (Ireland)' },
	// Scottish Gaelic
	{ code: 'gd-GB', name: 'Scottish Gaelic (UK)' },
]
