import * as fs from 'fs';
import { privacySectionsVi } from './src/pages/legal/privacyContentVi';
import { privacySections } from './src/pages/legal/privacyContent';
import { termsSectionsVi } from './src/pages/legal/termsContentVi';
import { termsSections } from './src/pages/legal/termsContent';
import { bookingTermsSectionsVi } from './src/pages/legal/bookingTermsContentVi';
import { bookingTermsSections } from './src/pages/legal/bookingTermsContent';

function generateHtml(sections: any[], startIdx = 0, length = -1): string {
  let html = '<div class="space-y-10">';
  const slice = length > -1 ? sections.slice(startIdx, startIdx + length) : sections.slice(startIdx);
  slice.forEach((section: any, idx: number) => {
    html += `<section id="${section.id}" class="scroll-mt-28 border-b border-slate-100 pb-10 last:border-b-0 last:pb-0">`;
    html += `<h2 class="travel-heading mb-4 text-xl text-navy md:text-2xl">${startIdx + idx + 1}. ${section.title}</h2>`;
    html += `<div class="space-y-4 text-slate-600 leading-relaxed">`;

    if (section.paragraphs) {
      section.paragraphs.forEach((p: string) => {
        html += `<p>${p}</p>`;
      });
    }
    if (section.bullets && section.bullets.length > 0) {
      html += `<ul class="list-disc pl-5 space-y-2">`;
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
    html += `</div></section>`;
  });
  html += '</div>';
  return html.replace(/'/g, "''"); // escape for SQL
}

const cookieVi = generateHtml(privacySectionsVi.filter((s: any) => s.id === 'cookies'), 0);
const cookieEn = generateHtml(privacySections.filter((s: any) => s.id === 'cookies'), 0);
const dataVi = generateHtml(privacySectionsVi.filter((s: any) => s.id !== 'cookies' && s.id !== 'introduction' && s.id !== 'data-controller'), 0);
const dataEn = generateHtml(privacySections.filter((s: any) => s.id !== 'cookies' && s.id !== 'introduction' && s.id !== 'data-controller'), 0);

function upsert(key: string, val: string) {
  return `IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = '${key}') INSERT INTO SystemSettings (SettingKey, SettingValue, Description, UpdatedAt) VALUES ('${key}', N'${val}', '${key}', GETDATE()); ELSE UPDATE SystemSettings SET SettingValue = N'${val}' WHERE SettingKey = '${key}';\n`;
}

const sql = `
-- Update base keys (Vietnamese)
${upsert('PrivacyPolicy', generateHtml(privacySectionsVi))}
${upsert('TermsAndConditions', generateHtml(termsSectionsVi))}
${upsert('BookingRegulations', generateHtml(bookingTermsSectionsVi))}
${upsert('DataPolicy', dataVi)}
${upsert('CookiePolicy', cookieVi)}

-- Update _en keys (English)
${upsert('PrivacyPolicy_en', generateHtml(privacySections))}
${upsert('TermsAndConditions_en', generateHtml(termsSections))}
${upsert('BookingRegulations_en', generateHtml(bookingTermsSections))}
${upsert('DataPolicy_en', dataEn)}
${upsert('CookiePolicy_en', cookieEn)}
`;

fs.writeFileSync('./seed-real-upsert-with-layout.sql', sql, 'utf8');
console.log('SQL generated successfully.');
