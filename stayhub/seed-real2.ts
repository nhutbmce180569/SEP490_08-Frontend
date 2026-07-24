import * as fs from 'fs';
import * as path from 'path';

// Assume these imports work if we run via tsx in the stayhub root
import { privacySectionsVi } from './src/pages/legal/privacyContentVi';
import { privacySections } from './src/pages/legal/privacyContent';
import { termsSectionsVi } from './src/pages/legal/termsContentVi';
import { termsSections } from './src/pages/legal/termsContent';
import { bookingTermsSectionsVi } from './src/pages/legal/bookingTermsContentVi';
import { bookingTermsSections } from './src/pages/legal/bookingTermsContent';

function generateHtml(sections: any[], startIdx = 0, length = -1): string {
  let html = '';
  const slice = length > -1 ? sections.slice(startIdx, startIdx + length) : sections.slice(startIdx);
  slice.forEach((section: any, idx: number) => {
    html += `<h2>${startIdx + idx + 1}. ${section.title}</h2>`;
    if (section.paragraphs) {
      section.paragraphs.forEach((p: string) => {
        html += `<p>${p}</p>`;
      });
    }
    if (section.bullets && section.bullets.length > 0) {
      html += `<ul>`;
      section.bullets.forEach((b: string) => {
        html += `<li>${b}</li>`;
      });
      html += `</ul>`;
    }
    if (section.closingParagraphs) {
      section.closingParagraphs.forEach((p: string) => {
        html += `<p>${p}</p>`;
      });
    }
  });
  return html.replace(/'/g, "''"); // escape for SQL
}

// Data Policy and Cookie Policy were separated in my previous work, but now I will just dump them as HTML too
// I'll grab them from privacySections by ID or index. Cookie is 'cookies', Data is 'data-collection' etc.
const cookieVi = generateHtml(privacySectionsVi.filter((s: any) => s.id === 'cookies'), 0);
const cookieEn = generateHtml(privacySections.filter((s: any) => s.id === 'cookies'), 0);

const dataVi = generateHtml(privacySectionsVi.filter((s: any) => s.id !== 'cookies' && s.id !== 'introduction' && s.id !== 'data-controller'), 0);
const dataEn = generateHtml(privacySections.filter((s: any) => s.id !== 'cookies' && s.id !== 'introduction' && s.id !== 'data-controller'), 0);

const sql = `
-- Update base keys (Vietnamese)
UPDATE SystemSettings SET SettingValue = N'${generateHtml(privacySectionsVi)}' WHERE SettingKey = 'PrivacyPolicy';
UPDATE SystemSettings SET SettingValue = N'${generateHtml(termsSectionsVi)}' WHERE SettingKey = 'TermsAndConditions';
UPDATE SystemSettings SET SettingValue = N'${generateHtml(bookingTermsSectionsVi)}' WHERE SettingKey = 'BookingRegulations';
UPDATE SystemSettings SET SettingValue = N'${dataVi}' WHERE SettingKey = 'DataPolicy';
UPDATE SystemSettings SET SettingValue = N'${cookieVi}' WHERE SettingKey = 'CookiePolicy';

-- Update _en keys (English)
UPDATE SystemSettings SET SettingValue = N'${generateHtml(privacySections)}' WHERE SettingKey = 'PrivacyPolicy_en';
UPDATE SystemSettings SET SettingValue = N'${generateHtml(termsSections)}' WHERE SettingKey = 'TermsAndConditions_en';
UPDATE SystemSettings SET SettingValue = N'${generateHtml(bookingTermsSections)}' WHERE SettingKey = 'BookingRegulations_en';
UPDATE SystemSettings SET SettingValue = N'${dataEn}' WHERE SettingKey = 'DataPolicy_en';
UPDATE SystemSettings SET SettingValue = N'${cookieEn}' WHERE SettingKey = 'CookiePolicy_en';
`;

fs.writeFileSync('./seed-real.sql', sql, 'utf8');
console.log('SQL generated successfully.');
