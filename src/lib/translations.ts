/**
 * CENTRALIZED TRANSLATION SYSTEM
 * ==============================
 * 
 * This file contains ALL Arabic-to-English translations used in the dashboard.
 * Import from this file instead of defining local translations.
 * 
 * IMPORTANT: Run `npm run check:translations` to verify coverage
 * 
 * Usage:
 *   import { translate, translateProject } from '@/lib/translations';
 *   
 *   // Get translation
 *   const english = translate(arabicValue, 'region'); // returns English or original
 *   const projectName = translateProject(arabicProjectName); // translates project names
 */

// =============================================================================
// REGION TRANSLATIONS (COMPLETE - 130+ regions from data)
// =============================================================================
export const REGIONS: Record<string, string> = {
  // Major Islands
  "جزيرة الريم": "Reem Island",
  "جزيرة ياس": "Yas Island",
  "جزيرة السعديات": "Saadiyat Island",
  "جزيرة الجبيل": "Jubail Island",
  "جزيرة فاهد": "Fahid Island",
  "جزيرة الحديريات": "Hudayriyat Island",
  "الحديريات": "Al Hudayriyat",
  "جزيرة المارية": "Al Maryah Island",
  "جزيرة نوراي": "Nurai Island",
  "جزيرة رمحان": "Ramhan Island",
  
  // Major Cities & Areas
  "مدينة خليفة": "Khalifa City",
  "مدينة زايد": "Zayed City",
  "مدينة محمد بن زايد": "Mohammed Bin Zayed City",
  "مدينة شخبوط": "Shakhbout City",
  "مدينة الرياض": "Al Riyadh City",
  "مدينة أبوظبي الصناعية": "Abu Dhabi Industrial City",
  
  // Al- prefixed areas
  "الريف": "Al Reef",
  "الشامخة": "Al Shamkha",
  "الراحة": "Al Raha",
  "الباهية": "Al Bahia",
  "الليان": "Al Layan",
  "الفقع": "Al Faqaa",
  "السمحة": "Al Samha",
  "الروضة": "Al Rawdah",
  "الروضة الشرقية": "Al Rawdah Al Sharqiya",
  "الخالدية": "Al Khalidiya",
  "الحصن": "Al Hosn",
  "الحنيورة": "Al Hanyoora",
  "الخبيصي": "Al Khubaisi",
  "الختم": "Al Khatm",
  "الخزنة": "Al Khazna",
  "الدانة": "Al Dana",
  "الرحبة": "Al Rahba",
  "المرور": "Al Muroor",
  "المشرف": "Al Mushrif",
  "المقطع": "Al Maqtaa",
  "المنهل": "Al Manhal",
  "المنيرة": "Al Muneera",
  "النادي السياحي": "Tourist Club",
  "الهيلي": "Al Hili",
  "الوثبة": "Al Wathba",
  "البطين": "Al Bateen",
  "الكرامة": "Al Karama",
  "الوحدة": "Al Wahda",
  "الظفرة": "Al Dhafra",
  "المفرق": "Al Mafraq",
  "السلع": "Al Silaa",
  "المرفأ": "Al Mirfa",
  "الغربية": "Al Gharbia",
  "القرم": "Al Qurm",
  "الشهامة": "Al Shahama",
  "الشوامخ": "Al Shawamekh",
  "الزاهية": "Al Zahiya",
  "السعادة": "Al Saadah",
  "الجاهلي": "Al Jahili",
  "الجيمي": "Al Jimi",
  "الهير": "Al Hayer",
  "الفلاح": "Al Falah",
  "المعترض": "Al Mutarad",
  "المعمورة": "Al Maamoura",
  "المقام": "Al Maqam",
  "المنتزه": "Al Muntazah",
  "المويجعي": "Al Muwaiji",
  "النباغ": "Al Nabagh",
  "النهضة": "Al Nahda",
  "النوف": "Al Nouf",
  "النُّود": "Al Noud",
  "الوقن": "Al Wagan",
  "العين": "Al Ain",
  "العامرة": "Al Aamra",
  "العجبان": "Al Ajban",
  "العدلة": "Al Adla",
  "العراد": "Al Arad",
  "العزيزة": "Al Aziziya",
  "العشيش": "Al Asheesh",
  "العقابية": "Al Oqabiya",
  "الفاية": "Al Faya",
  "الفوعة": "Al Foah",
  "القطارة": "Al Qattara",
  "القوع": "Al Quaa",
  "الكاسر": "Al Kaser",
  "المحاضر الشرقية": "Al Mahadir Al Sharqiya",
  "المحاضر الغربية": "Al Mahadir Al Gharbiya",
  "المرخانية": "Al Markhaniya",
  "المزون": "Al Mazoon",
  "المسعودي": "Al Masoudi",
  "المطاوعة": "Al Mutawaa",
  "الساد": "Al Saad",
  "السلامات": "Al Salamat",
  "السوت": "Al Sout",
  "الشويب": "Al Shuwaib",
  "الصاروج": "Al Sarooj",
  "الصدر": "Al Sadr",
  "الطف الغربي": "Al Taf Al Gharbi",
  "الطوية": "Al Tawiya",
  "الظاهر": "Al Dhahir",
  "الظاهرة": "Al Dhahira",
  "البحوث": "Al Buhouth",
  
  // Bani/Bou prefixed
  "بني ياس": "Bani Yas",
  "بو الذياب": "Bu Al Dhiyab",
  "بو حصا": "Bu Hasa",
  "بوكرية": "Bukariya",
  
  // Other areas
  "آل نهيان": "Al Nahyan",
  "أبو سمرة": "Abu Samra",
  "أبو قرين": "Abu Qurayn",
  "أم غافة": "Umm Ghafa",
  "عين الفايضة": "Ain Al Faydah",
  "غدير الطير": "Ghadeer Al Tair",
  "شاطئ الراحة": "Al Raha Beach",
  "مصدر": "Masdar",
  "مصفح": "Mussafah",
  "المدينة الصناعية": "Industrial City",
  "زايد الرياضية": "Zayed Sports City",
  "كورنيش أبوظبي": "Abu Dhabi Corniche",
  "مارينا": "Marina",
  "بوابة البحر": "Sea Gate",
  "واحة الزاوية": "Al Zawiya Oasis",
  "خليفة الصناعية": "Khalifa Industrial",
  "حدبة الزعفرانة": "Hadbat Al Zaafrana",
  "حميم": "Humeem",
  "دلما": "Dalma",
  "دهان": "Dahan",
  "ربدان": "Rabdan",
  "رماح": "Remah",
  "رملة سويحان": "Ramlat Sweihan",
  "زاخر": "Zakher",
  "سويحان": "Sweihan",
  "شعاب الأشخر": "Shiab Al Ashkhar",
  "شعبة الوطاه": "Shabat Al Watah",
  "عجيج": "Ajeej",
  "عشارج": "Asharej",
  "غنتوت": "Ghantoot",
  "غنيمة": "Ghunaima",
  "غياثي": "Ghayathi",
  "فلج هزاع": "Falaj Hazza",
  "مبزرة الخضراء": "Mbazzara Al Khadra",
  "مزيد": "Mazyed",
  "مزيرعة": "Muzaira",
  "مساكن": "Masakin",
  "مشيرف": "Mushairef",
  "مويلح": "Muwaileh",
  "ناهل": "Nahel",
  "نعمة": "Naema",
  "نقا الذيب": "Naqa Al Dheeb",
  "هيلي": "Hili",
  "وسط المدينة": "Downtown",
  "يو النظرة": "Yu Al Nazra",
  "جرن يافور": "Jarn Yafoor",
  "بدع المطاوعة": "Bida Al Mutawaa",
  "ياس": "Yas",
};

// =============================================================================
// PROPERTY TYPE TRANSLATIONS (COMPLETE - 40 types from data)
// =============================================================================
export const PROPERTY_TYPES: Record<string, string> = {
  // Residential
  "شقة": "Apartment",
  "ڨيلا": "Villa",
  "تاونهاوس / ڨيلا شبه منفصلة": "Townhouse",
  "دوپلكس": "Duplex",
  "پنتهاوس": "Penthouse",
  "مجمع سكني": "Residential Complex",
  "مجمع سكني (سكن عمال)": "Worker Accommodation",
  "مزرعة": "Farm",
  
  // Commercial
  "مكتب": "Office",
  "مجمع مكاتب": "Office Complex",
  "محل بيع بالتجزئة": "Retail Shop",
  "مول / سوق / مركز بيع بالتجزئة": "Mall / Shopping Center",
  "فندق / منتجع / شقق فندقية": "Hotel / Resort / Hotel Apartments",
  "عيادة / مستشفى": "Clinic / Hospital",
  "مدرسة": "School",
  "مسجد": "Mosque",
  "مصنع": "Factory",
  "ورشة": "Workshop",
  "مرفق تبريد": "Cooling Facility",
  
  // Land - Residential
  "أرض لڨيلا": "Villa Land",
  "أرض لتاونهاوس / ڨيلا شبه منفصلة": "Townhouse Land",
  "أرض لمجمع سكني": "Residential Complex Land",
  "أرض لمجمع سكني (سكن عمال)": "Worker Accommodation Land",
  "أرض لمزرعة": "Farm Land",
  "أرض سكنية أخرى": "Other Residential Land",
  
  // Land - Commercial
  "أرض لمول / سوق / مركز بيع بالتجزئة": "Mall / Shopping Center Land",
  "أرض لمجمع مكاتب": "Office Complex Land",
  "أرض لفندق / منتجع / شقق فندقية": "Hotel / Resort Land",
  "أرض لعيادة / مستشفى": "Clinic / Hospital Land",
  "أرض لمدرسة": "School Land",
  "أرض لمحطة بنزين": "Gas Station Land",
  "أرض لمرفق تبريد": "Cooling Facility Land",
  "أرض لمواقف": "Parking Land",
  "أرض لحديقة": "Garden Land",
  "أرض تجارية أخرى": "Other Commercial Land",
  
  // Land - Other
  "أرض صناعية أخرى": "Other Industrial Land",
  "أرض عامة أخرى": "Other Public Land",
  "أرض أخرى": "Other Land",
  "أرض أخرى متعددة الاستخدام": "Mixed Use Land",
  
  // Other
  "آخر": "Other",
  "أخرى": "Other",
};

// Property Type Short Codes (for badges, charts)
export const PROPERTY_TYPES_SHORT: Record<string, string> = {
  "شقة": "APT",
  "ڨيلا": "VIL",
  "تاونهاوس / ڨيلا شبه منفصلة": "TH",
  "دوپلكس": "DPX",
  "پنتهاوس": "PH",
  "مجمع سكني": "RC",
  "مزرعة": "FRM",
  "مكتب": "OFC",
  "أرض لڨيلا": "VL",
  "أرض لمزرعة": "FL",
  "آخر": "OTH",
};

// =============================================================================
// BEDROOM TRANSLATIONS
// =============================================================================
export const BEDROOMS: Record<string, string> = {
  "ستوديو": "Studio",
  "استوديو": "Studio",
  "غرفة نوم واحدة": "1 Bedroom",
  "1 غرفة نوم": "1 Bedroom",
  "غرفتين نوم": "2 Bedrooms",
  "2 غرف نوم": "2 Bedrooms",
  "٣ غرف نوم": "3 Bedrooms",
  "3 غرف نوم": "3 Bedrooms",
  "٤ غرف نوم": "4 Bedrooms",
  "4 غرف نوم": "4 Bedrooms",
  "٥ غرف نوم": "5 Bedrooms",
  "5 غرف نوم": "5 Bedrooms",
  "٦ غرف نوم وما فوق": "6+ Bedrooms",
  "6 غرف نوم وما فوق": "6+ Bedrooms",
  "غير مصنف": "Unclassified",
  "N/A": "N/A",
};

// Bedroom Short Codes
export const BEDROOMS_SHORT: Record<string, string> = {
  "ستوديو": "Studio",
  "استوديو": "Studio",
  "غرفة نوم واحدة": "1 BR",
  "1 غرفة نوم": "1 BR",
  "غرفتين نوم": "2 BR",
  "2 غرف نوم": "2 BR",
  "٣ غرف نوم": "3 BR",
  "3 غرف نوم": "3 BR",
  "٤ غرف نوم": "4 BR",
  "4 غرف نوم": "4 BR",
  "٥ غرف نوم": "5 BR",
  "5 غرف نوم": "5 BR",
  "٦ غرف نوم وما فوق": "6+ BR",
  "6 غرف نوم وما فوق": "6+ BR",
  "غير مصنف": "N/A",
};

// =============================================================================
// SALE TYPE TRANSLATIONS
// =============================================================================
export const SALE_TYPES: Record<string, string> = {
  "جاهزة": "Ready",
  "على المخطط": "Off-Plan",
  "أمر محكمة": "Court Order",
};

// =============================================================================
// MARKET TYPE TRANSLATIONS
// =============================================================================
export const MARKET_TYPES: Record<string, string> = {
  "أولي": "Primary",
  "ثانوي": "Secondary",
};

// =============================================================================
// ASSET CATEGORY TRANSLATIONS
// =============================================================================
export const ASSET_CATEGORIES: Record<string, string> = {
  "سكني": "Residential",
  "تجاري": "Commercial",
  "صناعي": "Industrial",
  "زراعي": "Agricultural",
  "متعدد الاستخدام": "Mixed Use",
};

// =============================================================================
// PROJECT TRANSLATIONS (COMPLETE - 331 projects)
// =============================================================================
export const PROJECTS: Record<string, string> = {
  // A
  "آزور": "Azure",
  "آيكن": "Icon",
  "أبراج أجوان": "Ajwan Towers",
  "أبراج أمايا": "Amaya Towers",
  "أبراج الجزيرة": "Al Jazeera Towers",
  "أبراج الصحراء (أراضي)": "Desert Towers (Land)",
  "أبراج شمس ميرا": "Shams Meera Towers",
  "أبراج پرستيج": "Prestige Towers",
  "أرابيان هلز (أراضي)": "Arabian Hills (Land)",
  "أرابيان هلز إستيت (أراضي)": "Arabian Hills Estate (Land)",
  "أنسام - المرحلة الأولى": "Ansam - Phase 1",
  "أنسام - المرحلة الثانية - ذا جولف كولّكشن": "Ansam - Phase 2 - The Golf Collection",
  "أوشنسكيپ": "Oceanscape",
  "أويسس رزيدنسز - المبنى ١": "Oasis Residences - Building 1",
  "أويسس رزيدنسز - المبنى ٢": "Oasis Residences - Building 2",
  "أويسس ١": "Oasis 1",
  "أويسس ٢": "Oasis 2",
  "أوپولا رزيدنسز": "Opula Residences",
  "إيلي صعب ووترفرونت": "Elie Saab Waterfront",
  
  // Al/El
  "البندر": "Al Bandar",
  "الديم تلونهومز": "Al Deem Townhomes",
  "الراحة لوفتس ١": "Al Raha Lofts 1",
  "الراحة لوفتس ٢": "Al Raha Lofts 2",
  "الريف - مرافق": "Al Reef - Facilities",
  "الريف داونتاون": "Al Reef Downtown",
  "الريف ٢": "Al Reef 2",
  "الريف، تاونهاوسات - القرية الحديثة": "Al Reef Townhouses - Modern Village",
  "الريف، تاونهاوسات - القرية العربية": "Al Reef Townhouses - Arabian Village",
  "الريف، تاونهاوسات - قرية الصحراء": "Al Reef Townhouses - Desert Village",
  "الريف، تاونهاوسات - قرية المتوسط": "Al Reef Townhouses - Mediterranean Village",
  "الريمان ١ - المرحلة الأولى (أراضي)": "Al Reeman 1 - Phase 1 (Land)",
  "الريمان ١ - المرحلة الثانية (أراضي)": "Al Reeman 1 - Phase 2 (Land)",
  "الريمان ٢ - المرحلة الأولى (أراضي)": "Al Reeman 2 - Phase 1 (Land)",
  "الريمان ٢ - المرحلة الثالثة - في الريمان ٢": "Al Reeman 2 - Phase 3 - In Reeman 2",
  "الريمان ٢ - المرحلة الثانية": "Al Reeman 2 - Phase 2",
  "الزينة": "Al Zeina",
  "العين مول": "Al Ain Mall",
  "الغدير - المرحلة الأولى": "Al Ghadeer - Phase 1",
  "الغدير - المرحلة الأولى (تالا)": "Al Ghadeer - Phase 1 (Tala)",
  "الغدير - المرحلة الأولى (سبيل)": "Al Ghadeer - Phase 1 (Sabeel)",
  "الغدير - المرحلة الأولى (واحة)": "Al Ghadeer - Phase 1 (Oasis)",
  "الفلاح تاون سنتر": "Al Falah Town Center",
  "القرم - المرحلة الأولى": "Al Gurm - Phase 1",
  "القرم - المرحلة الثانية (أراضي)": "Al Gurm - Phase 2 (Land)",
  "المدينة المستدامة - جزيرة ياس - المرحلة الأولى": "Sustainable City - Yas Island - Phase 1",
  "المريف (أراضي)": "Al Mareef (Land)",
  "المشرف جاردنز": "Al Mushrif Gardens",
  "المنيرة (البر الرئيسي)": "Al Muneera (Mainland)",
  "المنيرة (الجزيرة)": "Al Muneera (Island)",
  "المهرة رزيدنس": "Al Mahra Residence",
  "النسيم": "Al Naseem",
  "الهديل": "Al Hadeel",
  
  // B
  "باب القصر رزيدنس ١٨": "Bab Al Qasr Residence 18",
  "باب القصر رزيدنس ١٩": "Bab Al Qasr Residence 19",
  "باب القصر رزيدنس ٢٢": "Bab Al Qasr Residence 22",
  "باب القصر رزيدنس ٢٥": "Bab Al Qasr Residence 25",
  "باب القصر رزيدنس ٣١": "Bab Al Qasr Residence 31",
  "بدع الجبيل - المرحلة الأولى": "Bida Al Jubail - Phase 1",
  "برج أداكس": "Adax Tower",
  "برج الغيث": "Al Ghaith Tower",
  "برج المارية": "Al Maryah Tower",
  "برج الياقوت": "Al Yaqout Tower",
  "برج بينونة": "Baynunah Tower",
  "برج رناد": "Renad Tower",
  "برج پارك ڤيو، جزيرة الريم": "Park View Tower, Reem Island",
  "بلغيلم": "Bilghailam",
  "بلووم جاردنز": "Bloom Gardens",
  "بلووم جاردنز - الضي": "Bloom Gardens - Al Dhay",
  "بلووم جاردنز - فايا": "Bloom Gardens - Faya",
  "بلووم سوهو سكوير": "Bloom Soho Square",
  "بلووم ليڤينج - ألميريا": "Bloom Living - Almeria",
  "بلووم ليڤينج - أولڤيرا": "Bloom Living - Olvera",
  "بلووم ليڤينج - إشبيلية": "Bloom Living - Seville",
  "بلووم ليڤينج - توليدو": "Bloom Living - Toledo",
  "بلووم ليڤينج - غرناطة ١": "Bloom Living - Granada 1",
  "بلووم ليڤينج - غرناطة ٢": "Bloom Living - Granada 2",
  "بلووم ليڤينج - كارمونا": "Bloom Living - Carmona",
  "بلووم ليڤينج - كازارس": "Bloom Living - Casares",
  "بلووم ليڤينج - كوردوبا": "Bloom Living - Cordoba",
  "بوابة الشرق - المرحلة الأولى": "Eastern Gate - Phase 1",
  "بوابة الشرق - المرحلة الثالثة": "Eastern Gate - Phase 3",
  "بوابة الشرق - المرحلة الثانية": "Eastern Gate - Phase 2",
  "بوابة الشرق - المرحلة الرابعة": "Eastern Gate - Phase 4",
  "بوردولك رزيدس": "Bordwalk Residences",
  "بيتش تاورز": "Beach Towers",
  "بين - لاجون": "Being - Lagoon",
  "بين - ووترواي": "Being - Waterway",
  
  // T
  "تاونهاوسات نوايف ڤيلدج": "Nawayef Village Townhouses",
  "ثريّا": "Thuraya",
  
  // J
  "جاردنيا باي": "Gardenia Bay",
  "جبيل تيراسز": "Jubail Terraces",
  "جزيرة جبيل - المرحلة الأولى (أراضي)": "Jubail Island - Phase 1 (Land)",
  "جزيرة جبيل - المرحلة الثالثة": "Jubail Island - Phase 3",
  "جزيرة جبيل - المرحلة الثانية": "Jubail Island - Phase 2",
  "جزيرة رمحان": "Ramhan Island",
  "جزيرة رمحان - المرحلة الأولى": "Ramhan Island - Phase 1",
  "جزيرة رمحان - المرحلة الثالثة": "Ramhan Island - Phase 3",
  "جزيرة ناريل (أراضي)": "Nareel Island (Land)",
  "جلفار رزيدنس": "Julphar Residence",
  "جمام رزيدنس": "Jumam Residence",
  "جواهر السعديات": "Jawaher Al Saadiyat",
  "جولدن ميدوز (أراضي)": "Golden Meadows (Land)",
  "جيكُب & كو بيتشفرونت ليڤينج": "Jacob & Co Beachfront Living",
  
  // H
  "حد السعديات - السهول": "Had Al Saadiyat - Al Suhool",
  "حد السعديات - السيف": "Had Al Saadiyat - Al Saif",
  "حد السعديات - رأس الحد": "Had Al Saadiyat - Ras Al Had",
  "حدائق البطين (ڤلل)": "Al Bateen Gardens (Villas)",
  "حدائق الجرف - المرحلة ١.١ (أراضي)": "Al Jurf Gardens - Phase 1.1 (Land)",
  "حدائق الجرف - المرحلة ١.٢": "Al Jurf Gardens - Phase 1.2",
  "حدائق الجرف - المرحلة ١.٣": "Al Jurf Gardens - Phase 1.3",
  "حدائق الجرف - المرحلة ١.٤": "Al Jurf Gardens - Phase 1.4",
  "حدائق الجرف - المرحلة ٣ أي": "Al Jurf Gardens - Phase 3A",
  "حدائق الجولف": "Golf Gardens",
  "حدائق الراحة - الثروانية": "Al Raha Gardens - Al Tharwaniya",
  "حدائق الراحة - الماريه": "Al Raha Gardens - Al Mariah",
  "حدائق الراحة - الورد": "Al Raha Gardens - Al Ward",
  "حدائق الراحة - حميم": "Al Raha Gardens - Humeem",
  "حدائق الراحة - خنور": "Al Raha Gardens - Khanour",
  "حدائق الراحة - سمرا": "Al Raha Gardens - Samra",
  "حدائق الراحة - سيدرا": "Al Raha Gardens - Sidra",
  "حدائق الراحة - قطوف": "Al Raha Gardens - Qattouf",
  "حدائق الراحة - لحوية": "Al Raha Gardens - Lahweya",
  "حدائق الراحة - مزيرعة": "Al Raha Gardens - Muzaira",
  "حدائق الراحة - ياسمينة": "Al Raha Gardens - Yasmina",
  "حدائق القرم": "Al Qurm Gardens",
  "حي المرزاب": "Al Mirzab District",
  "حي جامعة نيو يورك (أراضي)": "NYU District (Land)",
  
  // Private
  "خصوصي": "Private",
  
  // D
  "دابليو رزيدنسز أبو ظبي": "W Residences Abu Dhabi",
  "دانة أبو ظبي (أراضي)": "Dana Abu Dhabi (Land)",
  "ديونز هايتس (أراضي)": "Dunes Heights (Land)",
  "ديڤا أت ذا باي ١": "Diva at The Bay 1",
  "ديڤا أت ذا باي ٢": "Diva at The Bay 2",
  "ذا باي رزيدنس": "The Bay Residence",
  "ذا باي رزيدنس ٢": "The Bay Residence 2",
  "ذا بردجز (الأبراج ١، ٢، و ٣)": "The Bridges (Towers 1, 2, and 3)",
  "ذا بيتش هاوس": "The Beach House",
  "ذا جايت أند آرك تاورز": "The Gate and Arc Towers",
  "ذا جيت": "The Gate",
  "ذا فاونتن ڤيو رزيدنسس": "The Fountain View Residences",
  "ذا وايڤ": "The Wave",
  "ذا ڤيو": "The View",
  
  // R
  "رانتشز (أراضي)": "Ranches (Land)",
  "رايت كاپتال ١": "Right Capital 1",
  "رايديينت إليت تاور": "Radiant Elite Tower",
  "رايديينت جاردن تاور": "Radiant Garden Tower",
  "رايديينت سكوير": "Radiant Square",
  "رايديينت مارينا تاورز": "Radiant Marina Towers",
  "رفلكشن تاور أي": "Reflection Tower A",
  "رفلكشن تاور بي": "Reflection Tower B",
  "رويال پارك": "Royal Park",
  "ريم إلڤن": "Reem Eleven",
  "ريم إيت": "Reem Eight",
  "ريم داونتاون (أراضي)": "Reem Downtown (Land)",
  "ريم فايڤ": "Reem Five",
  "ريم ناين": "Reem Nine",
  "ريم هلز - المرحلة ١ أي": "Reem Hills - Phase 1A",
  "ريم هلز - المرحلة ١ بي": "Reem Hills - Phase 1B",
  "ريم هلز - المرحلة ١ سي": "Reem Hills - Phase 1C",
  "ريم هلز - المرحلة ٢ أي": "Reem Hills - Phase 2A",
  "ريم هلز - المرحلة ٢ بي": "Reem Hills - Phase 2B",
  "ريم هلز - المرحلة ٢ دي": "Reem Hills - Phase 2D",
  "ريم هلز - المرحلة ٢ سي": "Reem Hills - Phase 2C",
  "ريمان جاردن ١": "Reeman Garden 1",
  "ريمان ليڤينج": "Reeman Living",
  "ريمان ليڤينج ٢": "Reeman Living 2",
  "ريڤاج": "Rivage",
  "رپورتاج ڤيلدج": "Reportage Village",
  
  // S
  "ساس هايتس": "SAS Heights",
  "سان ڤالي (أراضي)": "Sun Valley (Land)",
  "سرايا (أراضي)": "Saraya (Land)",
  "سعديات بيتش دستركت (أراضي)": "Saadiyat Beach District (Land)",
  "سعديات بيتش رزيدنسس - المبنى الخامس": "Saadiyat Beach Residences - Building 5",
  "سعديات بيتش رزيدنسس - المبنى الرابع": "Saadiyat Beach Residences - Building 4",
  "سعديات بيتش رزيدنسس - المبنى السادس": "Saadiyat Beach Residences - Building 6",
  "سعديات بيتش ڤيلاز": "Saadiyat Beach Villas",
  "سعديات جروڤ - ذا آرتهاوس": "Saadiyat Grove - The Arthouse",
  "سعديات جروڤ - ذا سورس": "Saadiyat Grove - The Source",
  "سعديات جروڤ - ذا سورس تراسز": "Saadiyat Grove - The Source Terraces",
  "سعديات جروڤ - ذا سورس رزيدنسز": "Saadiyat Grove - The Source Residences",
  "سعديات جروڤ - ذا هارت": "Saadiyat Grove - The Heart",
  "سعديات ريزرڤ (أراضي)": "Saadiyat Reserve (Land)",
  "سعديات ريزرڤ - ذا ديونز": "Saadiyat Reserve - The Dunes",
  "سعديات لاجونز - المرحلة الثانية - أثير": "Saadiyat Lagoons - Phase 2 - Athir",
  "سعديات لاجونز - المرحلة الثانية - السدر": "Saadiyat Lagoons - Phase 2 - Al Sidr",
  "سعديات لاجونز - وايلدز - المرحلة الأولى": "Saadiyat Lagoons - Wilds - Phase 1",
  "سعديات لاجونز - وايلدز - المرحلة الثانية": "Saadiyat Lagoons - Wilds - Phase 2",
  "سكاي جاردنز تاور": "Sky Gardens Tower",
  "سكن عمال اللولو جروپ": "Lulu Group Workers Residence",
  "سلينا باي": "Selina Bay",
  "سما ياس": "Sama Yas",
  "سن أند سكاي، بوتيك مول": "Sun and Sky, Boutique Mall",
  "سوليا": "Solia",
  "سي لا ڤي": "C La Vie",
  "سي ٣ جاردن": "C3 Garden",
  "سيجما تاورز (مدينة الأضواء)": "Sigma Towers (City of Lights)",
  "سيشور ڤيلاز": "Seashore Villas",
  "سيمونت رزيدنسز من ماريوت": "Simont Residences by Marriott",
  "شاطئ الراحة (أراضي)": "Al Raha Beach (Land)",
  "شمس أبو ظبي (أراضي)": "Shams Abu Dhabi (Land)",
  
  // T continued
  "طموح (أراضي)": "Tumouh (Land)",
  
  // A (Ain)
  "عين الفايضة - المرحلة الأولى (أراضي)": "Ain Al Faydah - Phase 1 (Land)",
  "عين الفايضة - المرحلة الثانية (أراضي)": "Ain Al Faydah - Phase 2 (Land)",
  
  // G
  "غزال پاركڤيو (أراضي)": "Ghazal Parkview (Land)",
  
  // F
  "فاهد بيتش تراسز": "Fahid Beach Terraces",
  "فاهد بيتش رزيدنس": "Fahid Beach Residence",
  "فايا السعديات": "Faya Al Saadiyat",
  "فلل شاطئ الندرة": "Al Nadra Beach Villas",
  "فندق فور سيزنز": "Four Seasons Hotel",
  "فندق، منتجع، ومساكن السينت ريدجس": "St. Regis Hotel, Resort, and Residences",
  "فيرمونت رزيدنسز، ريكسوس مارينا": "Fairmont Residences, Rixos Marina",
  
  // Q
  "قرية الحد - جاردن رزيدنس ٦": "Al Had Village - Garden Residence 6",
  "قرية الفرسان (ڤلل)": "Al Forsan Village (Villas)",
  "قرية الفلاح": "Al Falah Village",
  "قرية المانغروڤ": "Mangrove Village",
  "قرية ليوا": "Liwa Village",
  
  // K
  "كانال رزيدنس": "Canal Residence",
  "كانال من إم": "Canal from M",
  "كاپتال سنتر (أراضي)": "Capital Center (Land)",
  
  // L
  "لامار رزيدنس": "Lamar Residence",
  "لوڤر رزيدنسس": "Louvre Residences",
  "ليا (أراضي)": "Lea (Land)",
  "ليوناردو  رزيدنسس": "Leonardo Residences",
  
  // M
  "مارينا باي تاورز (مدينة الأضواء)": "Marina Bay Towers (City of Lights)",
  "مارينا باي من داماك": "Marina Bay by Damac",
  "مارينا سكوير، پاراجون باي مول": "Marina Square, Paragon Bay Mall",
  "مارينا سنست باي (ڤلل)": "Marina Sunset Bay (Villas)",
  "مانجرووڤ پليس": "Mangrove Place",
  "مايان": "Mayan",
  "مبنى الكورنيش، المركزية غرب": "Corniche Building, Western Central",
  "مجمّع المارينا الملكي": "Royal Marina Complex",
  "مدينة آيكاد السكنية": "ICAD Residential City",
  "مدينة الرزين للعمال": "Al Razeen Workers City",
  "مدينة زايد الرياضية، ريحان هايتس": "Zayed Sports City, Rehan Heights",
  "مدينة مصدر - المرحلة الأولى (أراضي)": "Masdar City - Phase 1 (Land)",
  "مدينة مصدر - المرحلة الثانية (أراضي)": "Masdar City - Phase 2 (Land)",
  "مرجان السعديات": "Murjan Al Saadiyat",
  "مرسى الجبيل": "Marsa Al Jubail",
  "مشروع المبزرة الخضراء للإسكان الوطني": "Al Mbazzara Al Khadra National Housing Project",
  "مشروع جزيرة ياس للإسكان الوطني": "Yas Island National Housing Project",
  "مشروع غنيمة للإسكان الوطني": "Ghunaima National Housing Project",
  "ممشى السعديات - أزور": "Saadiyat Promenade - Azure",
  "ممشى السعديات - تُركويز": "Saadiyat Promenade - Turquoise",
  "ممشى السعديات - لايلاك": "Saadiyat Promenade - Lilac",
  "ممشى جاردنز أي": "Mamsha Gardens A",
  "ممشى جاردنز بي": "Mamsha Gardens B",
  "ممشى پالم": "Palm Walk",
  "منارة ليڤينج ١": "Manarat Living 1",
  "منارة ليڤينج ٢": "Manarat Living 2",
  "منارة ليڤينج ٣": "Manarat Living 3",
  "منتجع جزيرة نوراي": "Nurai Island Resort",
  "مهيرة أي": "Muhairah A",
  "موتور ورلد أبو ظبي": "Motor World Abu Dhabi",
  "ميار": "Mayar",
  "مياس آت ذا باي": "Myas at The Bay",
  "ميريتو": "Merito",
  
  // N
  "نجمة أبو ظبي - المرحلة الأولى (أراضي)": "Najmat Abu Dhabi - Phase 1 (Land)",
  "نجمة أبو ظبي - المرحلة الثالثة (أراضي)": "Najmat Abu Dhabi - Phase 3 (Land)",
  "نخيل أويسس (أراضي)": "Nakheel Oasis (Land)",
  "نوايف إيست بي": "Nawayef East B",
  "نوايف وست - المنطقة أي": "Nawayef West - Zone A",
  "نوايف وست هايتس - المنطقة بي": "Nawayef West Heights - Zone B",
  "نوايف پارك ڤيوز": "Nawayef Park Views",
  "نوبو رزيدنسز ١": "Nobu Residences 1",
  "نوبو رزيدنسز ٢": "Nobu Residences 2",
  "نور وطن": "Noor Watan",
  "نوران ليڤينج": "Nuran Living",
  "نويا - المرحلة الأولى": "Noya - Phase 1",
  "نويا - المرحلة الثالثة - لوما": "Noya - Phase 3 - Luma",
  "نويا - المرحلة الثانية - ڤيڤا": "Noya - Phase 2 - Viva",
  "نويا - المرحلة الخامسة - ياس پارك ڤيوز": "Noya - Phase 5 - Yas Park Views",
  "نويا - المرحلة الرابعة - ياس پارك جيت": "Noya - Phase 4 - Yas Park Gate",
  
  // H
  "هايدرا أڤنيو (أبراج هايدرا)": "Hydra Avenue (Hydra Towers)",
  "هلز أبو ظبي": "Hills Abu Dhabi",
  "هنج رزيدنسز": "Hang Residences",
  "هورايزن تاورز": "Horizon Towers",
  
  // W
  "واحة الزاوية": "Al Zawiya Oasis",
  "واحة ياس (أراضي)": "Yas Oasis (Land)",
  "وديم (أراضي)": "Wadeem (Land)",
  "وست ياس - الحي آر (أراضي)": "West Yas - District R (Land)",
  "وست ياس - الحي آي": "West Yas - District I",
  "وست ياس - الحي أو (أراضي)": "West Yas - District O (Land)",
  "وست ياس - الحي أي": "West Yas - District A",
  "وست ياس - الحي أيتش": "West Yas - District H",
  "وست ياس - الحي إل": "West Yas - District L",
  "وست ياس - الحي إم (أراضي)": "West Yas - District M (Land)",
  "وست ياس - الحي إن (أراضي)": "West Yas - District N (Land)",
  "وست ياس - الحي إي": "West Yas - District E",
  "وست ياس - الحي جاي": "West Yas - District J",
  "وست ياس - الحي جي": "West Yas - District G",
  "وست ياس - الحي دي": "West Yas - District D",
  "وست ياس - الحي سي": "West Yas - District C",
  "وست ياس - الحي كاي": "West Yas - District K",
  "وست ياس - الحي كيو (أراضي)": "West Yas - District Q (Land)",
  "وست ياس - تجزئة (أراضي)": "West Yas - Subdivision (Land)",
  "وطني": "Watani",
  "ون ريم أيلند": "One Reem Island",
  "ووترز إدج - الحي أي": "Waters Edge - District A",
  "ووترز إدج - الحي بي": "Waters Edge - District B",
  
  // Y
  "ياس إيكرز - الحي الثامن": "Yas Acres - District 8",
  "ياس إيكرز - ذا آسپنز": "Yas Acres - The Aspens",
  "ياس إيكرز - ذا دالياز": "Yas Acres - The Dahlias",
  "ياس إيكرز - ذا دالياز ٢": "Yas Acres - The Dahlias 2",
  "ياس إيكرز - ذا ردوودز": "Yas Acres - The Redwoods",
  "ياس إيكرز - ذا سيدارز": "Yas Acres - The Cedars",
  "ياس إيكرز - ذا ماجنولياز": "Yas Acres - The Magnolias",
  "ياس باي (أراضي)": "Yas Bay (Land)",
  "ياس بيتش رزيدنس": "Yas Beach Residence",
  "ياس ريڤا": "Yas Riva",
  "ياس لنكس لكشري ليڤينج": "Yas Links Luxury Living",
  "ياس ليڤينج": "Yas Living",
  "ياس ووترفرونت ساوث (أراضي)": "Yas Waterfront South (Land)",
  "ياسمينة رزيدنس": "Yasmina Residence",
  
  // P (with پ)
  "پارك ڤيستا (أراضي)": "Park Vista (Land)",
  "پارك ڤيو رزيدنس، جزيرة السعديات": "Park View Residence, Saadiyat Island",
  "پاركسايد رزيدنس أي": "Parkside Residence A",
  "پاركسايد رزيدنس بي": "Parkside Residence B",
  "پرلا ١": "Perla 1",
  "پرلا ٢": "Perla 2",
  "پكسل": "Pixel",
  "پلازا حدائق البطين": "Al Bateen Gardens Plaza",
  "پلازا ١": "Plaza 1",
  "پلازا ٢": "Plaza 2",
  "پي يو دي رزيدنس ١": "PUD Residence 1",
  
  // V (with ڤ)
  "ڤلل أوهانا": "Ohana Villas",
  "ڤيستا دل مار": "Vista Del Mar",
  "ڤيستا ١": "Vista 1",
  "ڤيستا ٢": "Vista 2",
  "ڤيستا ٣": "Vista 3",
  "ڤيل ١١": "Ville 11",
  "ڤيل ١٢": "Ville 12",
};

// =============================================================================
// PROJECT NAME PREFIX TRANSLATIONS (for partial translations)
// =============================================================================
export const PROJECT_PREFIXES: Record<string, string> = {
  // Developers
  "بلووم ليڤينج": "Bloom Living",
  "بلووم جاردنز": "Bloom Gardens",
  "بلووم سوهو": "Bloom Soho",
  "بلووم": "Bloom",
  "الدار": "Aldar",
  "إعمار": "Emaar",
  "داماك": "Damac",
  "منازل": "Manazil",
  "هايدرا": "Hydra",
  "ريپورتاج": "Reportage",
  "رپورتاج": "Reportage",
  "إيجل هيلز": "Eagle Hills",
  "طلعت مصطفى": "Talaat Moustafa",
  "إمكان": "Imkan",
  "أرادَ": "Arada",
  "الغرير": "Al Ghurair",
  "الفطيم": "Al Futtaim",
  
  // Common Project Terms
  "أبراج": "Towers",
  "برج": "Tower",
  "شاطئ": "Beach",
  "حدائق": "Gardens",
  "حديقة": "Garden",
  "مارينا": "Marina",
  "رزيدنسز": "Residences",
  "رزيدنس": "Residence",
  "رزيدنسس": "Residences",
  "ريزيدنس": "Residence",
  "ريزيدنسز": "Residences",
  "سنترال": "Central",
  "پارك": "Park",
  "بارك": "Park",
  "سكوير": "Square",
  "تراس": "Terrace",
  "تراسز": "Terraces",
  "تيراسز": "Terraces",
  "بوابة": "Gate",
  "واحة": "Oasis",
  "منتجع": "Resort",
  "قرية": "Village",
  "مدينة": "City",
  "جزيرة": "Island",
  "كورنيش": "Corniche",
  "بلازا": "Plaza",
  "پلازا": "Plaza",
  "مول": "Mall",
  "سوق": "Souq",
  "خليج": "Bay",
  "ميناء": "Port",
  "نادي": "Club",
  "ڤيلا": "Villa",
  "ڤيلات": "Villas",
  "ڤلل": "Villas",
  "فلل": "Villas",
  "شقق": "Apartments",
  "تاونهاوس": "Townhouse",
  "تاونهاوسات": "Townhouses",
  "دوپلكس": "Duplex",
  "پنتهاوس": "Penthouse",
  "لوفتس": "Lofts",
  "هايتس": "Heights",
  "ڤيوز": "Views",
  "ڤيو": "View",
  "ليڤينج": "Living",
  "أويسس": "Oasis",
  "جروڤ": "Grove",
  "ممشى": "Promenade",
  "مرسى": "Marina",
  "إيكرز": "Acres",
  "هلز": "Hills",
  
  // Spanish Names (Bloom Living)
  "غرناطة": "Granada",
  "توليدو": "Toledo",
  "كازارس": "Casares",
  "كوردوبا": "Cordoba",
  "إشبيلية": "Seville",
  "كارمونا": "Carmona",
  "أولڤيرا": "Olvera",
  "ألميريا": "Almeria",
  "ماربيا": "Marbella",
  "فالنسيا": "Valencia",
  
  // Phases
  "المرحلة الأولى": "Phase 1",
  "المرحلة الثانية": "Phase 2",
  "المرحلة الثالثة": "Phase 3",
  "المرحلة الرابعة": "Phase 4",
  "المرحلة الخامسة": "Phase 5",
  
  // Arabic Numbers
  "١": "1",
  "٢": "2",
  "٣": "3",
  "٤": "4",
  "٥": "5",
  "٦": "6",
  "٧": "7",
  "٨": "8",
  "٩": "9",
  "٠": "0",
  "١٠": "10",
  
  // Other Common Terms
  "أراضي": "Land",
  "خصوصي": "Private",
  "الحي": "District",
  "المبنى": "Building",
};

// =============================================================================
// COMBINED TRANSLATIONS OBJECT
// =============================================================================
export const TRANSLATIONS = {
  regions: REGIONS,
  propertyTypes: PROPERTY_TYPES,
  propertyTypesShort: PROPERTY_TYPES_SHORT,
  bedrooms: BEDROOMS,
  bedroomsShort: BEDROOMS_SHORT,
  saleTypes: SALE_TYPES,
  marketTypes: MARKET_TYPES,
  assetCategories: ASSET_CATEGORIES,
  projects: PROJECTS,
  projectPrefixes: PROJECT_PREFIXES,
} as const;

// =============================================================================
// TRANSLATION HELPER FUNCTIONS
// =============================================================================

export type TranslationType = 
  | 'region' 
  | 'propertyType' 
  | 'bedroom' 
  | 'saleType' 
  | 'marketType' 
  | 'assetCategory'
  | 'project';

/**
 * Translate an Arabic value to English
 * @param value - The Arabic value to translate
 * @param type - The type of translation (region, propertyType, etc.)
 * @returns English translation or original value if not found
 */
export function translate(value: string | undefined | null, type: TranslationType): string {
  if (!value) return '';
  
  switch (type) {
    case 'region':
      return REGIONS[value] || value;
    case 'propertyType':
      return PROPERTY_TYPES[value] || value;
    case 'bedroom':
      return BEDROOMS[value] || value;
    case 'saleType':
      return SALE_TYPES[value] || value;
    case 'marketType':
      return MARKET_TYPES[value] || value;
    case 'assetCategory':
      return ASSET_CATEGORIES[value] || value;
    case 'project':
      return PROJECTS[value] || translateProject(value);
    default:
      return value;
  }
}

/**
 * Translate with short code (for badges, compact UI)
 */
export function translateShort(value: string | undefined | null, type: 'propertyType' | 'bedroom'): string {
  if (!value) return '';
  
  switch (type) {
    case 'propertyType':
      return PROPERTY_TYPES_SHORT[value] || PROPERTY_TYPES[value] || value;
    case 'bedroom':
      return BEDROOMS_SHORT[value] || BEDROOMS[value] || value;
    default:
      return value;
  }
}

/**
 * Translate project names by replacing Arabic prefixes with English
 * Handles partial translations (developer name + location)
 * @param projectName - The Arabic project name
 * @returns Translated project name (fully or partially)
 */
export function translateProject(projectName: string | undefined | null): string {
  if (!projectName) return '';
  
  // First check if we have a direct translation
  if (PROJECTS[projectName]) {
    return PROJECTS[projectName];
  }
  
  let result = projectName;
  
  // Sort prefixes by length (longest first) to avoid partial matches
  const sortedPrefixes = Object.entries(PROJECT_PREFIXES)
    .sort((a, b) => b[0].length - a[0].length);
  
  // Replace all matching prefixes
  for (const [ar, en] of sortedPrefixes) {
    if (result.includes(ar)) {
      result = result.replace(new RegExp(ar, 'g'), en);
    }
  }
  
  // Clean up any double spaces and trim
  result = result.replace(/\s+/g, ' ').trim();
  
  return result;
}

/**
 * Get display label (English or Arabic based on preference)
 * For now returns English, but can be extended for language switching
 */
export function getLabel(value: string | undefined | null, type: TranslationType): string {
  return translate(value, type);
}

/**
 * Check if a value has a translation
 */
export function hasTranslation(value: string, type: TranslationType): boolean {
  switch (type) {
    case 'region':
      return value in REGIONS;
    case 'propertyType':
      return value in PROPERTY_TYPES;
    case 'bedroom':
      return value in BEDROOMS;
    case 'saleType':
      return value in SALE_TYPES;
    case 'marketType':
      return value in MARKET_TYPES;
    case 'assetCategory':
      return value in ASSET_CATEGORIES;
    case 'project':
      return value in PROJECTS;
    default:
      return false;
  }
}

/**
 * Get all translations for a type (useful for dropdowns)
 */
export function getTranslations(type: TranslationType): Record<string, string> {
  switch (type) {
    case 'region':
      return REGIONS;
    case 'propertyType':
      return PROPERTY_TYPES;
    case 'bedroom':
      return BEDROOMS;
    case 'saleType':
      return SALE_TYPES;
    case 'marketType':
      return MARKET_TYPES;
    case 'assetCategory':
      return ASSET_CATEGORIES;
    case 'project':
      return PROJECTS;
    default:
      return {};
  }
}

// =============================================================================
// REVERSE TRANSLATIONS (English -> Arabic)
// =============================================================================

function createReverseMap(map: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(map).map(([ar, en]) => [en, ar])
  );
}

export const REGIONS_REVERSE = createReverseMap(REGIONS);
export const PROPERTY_TYPES_REVERSE = createReverseMap(PROPERTY_TYPES);
export const SALE_TYPES_REVERSE = createReverseMap(SALE_TYPES);

/**
 * Translate from English to Arabic
 */
export function translateToArabic(value: string, type: TranslationType): string {
  if (!value) return '';
  
  switch (type) {
    case 'region':
      return REGIONS_REVERSE[value] || value;
    case 'propertyType':
      return PROPERTY_TYPES_REVERSE[value] || value;
    case 'saleType':
      return SALE_TYPES_REVERSE[value] || value;
    default:
      return value;
  }
}

// =============================================================================
// TRANSLATION COVERAGE TRACKER
// =============================================================================

/**
 * Check translation coverage for a list of values
 * @param values - Array of Arabic values
 * @param type - Type of translation
 * @returns Coverage report
 */
export function checkTranslationCoverage(values: string[], type: TranslationType): {
  total: number;
  translated: number;
  missing: string[];
  coverage: number;
} {
  const missing: string[] = [];
  let translated = 0;
  
  for (const value of values) {
    if (hasTranslation(value, type)) {
      translated++;
    } else {
      missing.push(value);
    }
  }
  
  return {
    total: values.length,
    translated,
    missing,
    coverage: values.length > 0 ? (translated / values.length) * 100 : 100,
  };
}

/**
 * Get a short/clean version of project name for display
 */
export function getProjectDisplayName(projectName: string | undefined | null): string {
  if (!projectName) return '';
  
  const translated = translateProject(projectName);
  
  // Clean up extra spaces and dashes
  return translated
    .replace(/\s+/g, ' ')
    .replace(/\s*-\s*/g, ' - ')
    .trim();
}
