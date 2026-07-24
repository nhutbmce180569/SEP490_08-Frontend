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
  return html; 
}

const cookieVi = generateHtml(privacySectionsVi.filter((s: any) => s.id === 'cookies'), 0);
const cookieEn = generateHtml(privacySections.filter((s: any) => s.id === 'cookies'), 0);
const dataVi = generateHtml(privacySectionsVi.filter((s: any) => s.id !== 'cookies' && s.id !== 'introduction' && s.id !== 'data-controller'), 0);
const dataEn = generateHtml(privacySections.filter((s: any) => s.id !== 'cookies' && s.id !== 'introduction' && s.id !== 'data-controller'), 0);

function upsert(key: string, val: string) {
  const safeVal = val.replace(/'/g, "''");
  return `IF NOT EXISTS (SELECT 1 FROM SystemSettings WHERE SettingKey = '${key}') INSERT INTO SystemSettings (SettingKey, SettingValue, Description, UpdatedAt) VALUES ('${key}', N'${safeVal}', '${key}', GETDATE()); ELSE UPDATE SystemSettings SET SettingValue = N'${safeVal}' WHERE SettingKey = '${key}';\r\n`;
}

// B64 decode helper
const b64 = (str: string) => Buffer.from(str, 'base64').toString('utf8');

const refundVi = b64('PHAgY2xhc3M9ImZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS04MDAiPkNow61uaCBzw6FjaCBob8BuIHRp4buBbiB0aGVvIG5nw6B5IGto4bufaSBow6BuaDo8L3A+PHVsIGNsYXNzPSJsaXN0LWRpc2MgcGwtNSBzcGFjZS15LTIiPjxsaT5I4buneSB0csOqbiA3IG5nw6B5IHRyxrDhu5tjIGtoaSBraOG7n2kgaMOgbmhiOiBIb8BuIHRp4buBbiAxMDAlIChLaMO0bmcgdMOtbmggcGjDrSkuPC9saT48bGk+SOG7p3kgdOG7qyAzIMSR4bq/biA3IG5nw6B5IHRyxrDhu5tjIGtoaSBraOG7n2kgaMOgbmhiOiBIb8BuIHRp4buBbiA1MCUgKFBow60gaOG7p3kgNTAlKS48L2xpPjxsaT5I4buneSBkxrHhu5tpIDMgbmfDoHkgdHLGsOG7m2Mga2hpIGto4bufaSBow6BuaGg6IEhvw6BuIHRp4buBbiAwJSAoUGjDrSBo4buneSAxMDAlKS48L2xpPjwvdWw+PGRpdiBjbGFzcz0icm91bmRlZC14bCBib3JkZXIgYm9yZGVyLWFtYmVyLTIwMCBiZy1hbWJlci01MC81MCBwLTMuNSB0ZXh0LXhzIHRleHQtYW1iZXItODAwIG10LTQiPjxwIGNsYXNzPSJtYi0xIGZvbnQtYm9sZCI+TMawdSDDvSB24buBIHZvdWNoZXI6PC9wPjx1bCBjbGFzcz0ibGlzdC1kaXNjIHBsLTQgc3BhY2UteS0xIj48bGk+Vm91Y2hlciBraMO0bmcgxJHGsOG7oWMgaG/DoG4gbOG6oWkgdHJvbmcgbOG7jWkgdHLGsOG7nW5nIGjhu6NwIGjhu6d5IHRvdXIuPC9saT48bGk+VOG7lW5nIHRp4buBbiBob8BuIGzhuqFpIHPhur0gdMOtbmggdHLDqm4gZ2nDoSB0cuG7iyB0aGFuaCB0b8OhbiB0aOG7sWMgdOG6vyAoc2F1IGtoaSDEkcOjIHRy4burIHZvdWNoZXIpLjwvbGk+PC91bD48L2Rpdj4=');
const refundEn = b64('PHAgY2xhc3M9ImZvbnQtc2VtaWJvbGQgdGV4dC1zbGF0ZS04MDAiPlJlZnVuZCBwb2xpY3kgYnkgZGVwYXJ0dXJlIGRhdGU6PC9wPjx1bCBjbGFzcz0ibGlzdC1kaXNjIHBsLTUgc3BhY2UteS0yIj48bGk+Q2FuY2VsbGF0aW9uIG1vcmUgdGhhbiA3IGRheXMgYmVmb3JlIGRlcGFydHVyZTogMTAwJSByZWZ1bmQgKE5vIGZlZSkuPC9saT48bGk+Q2FuY2VsbGF0aW9uIDMgdG8gNyBkYXlzIGJlZm9yZSBkZXBhcnR1cmU6IDUwJSByZWZ1bmQgKDUwJSBmZWUpLjwvbGk+PGxpPkNhbmNlbGxhdGlvbiBsZXNzIHRoYW4gMyBkYXlzIGJlZm9yZSBkZXBhcnR1cmU6IDAlIHJlZnVuZCAoMTAwJSBmZWUpLjwvbGk+PC91bD48ZGl2IGNsYXNzPSJyb3VuZGVkLXhsIGJvcmRlciBib3JkZXItYW1iZXItMjAwIGJnLWFtYmVyLTUwLzUwIHAtMy41IHRleHQteHMgdGV4dC1hbWJlci04MDAgbXQtNCI+PHAgY2xhc3M9Im1iLTEgZm9udC1ib2xkIj5Ob3RlIG9uIHZvdWNoZXJzOjwvcD48dWwgY2xhc3M9Imxpc3QtZGlzYyBwbC00IHNwYWNlLXktMSI+PGxpPlZvdWNoZXJzIGFyZSBub24tcmVmdW5kYWJsZSBpbiBhbGwgY2FzZXMgb2YgdG91ciBjYW5jZWxsYXRpb24uPC9saT48bGk+VG90YWwgcmVmdW5kIGFtb3VudCB3aWxsIGJlIGNhbGN1bGF0ZWQgYmFzZWQgb24gdGhlIGFjdHVhbCBwYXltZW50IHZhbHVlIChhZnRlciBkZWR1Y3Rpbmcgdm91Y2hlcikuPC9saT48L3VsPjwvZGl2Pg==');

const aboutVi = b64('SG/huqF0IMSR4buZbmcgbmjGsCBt4buZdCAiSOG7hyB0aOG7kW5nIFF14bqjbiBsw70gVG91ciBUaMO0bmcgbWluaCIsIFN0YXlIdWIgxJHGsOG7oWMgdGhp4bq/dCBr4bq/IMSR4buDIMOhYyBjw7RuZyB0eSBkdSBs4buLY2ggcXXhuqNuIGzDvSBoaeG7h3UgcXXhuqMgdG91ciwgbOG7i2NoIHRyw6xuaCwgxJHhurd0IGNo4buXLCB0xrDGoW5nIHRow6FjIGtow6FjaCBow6BuZyB2w6Agbm+G6oWkgZHVuZyBkdSBs4buLY2ggdHJvbmcgbcO0dCBo4buHIHNpbmggdGjDoWkgdGjhu5FuZyBuaOG6pXQuIEjhu4cgdGjhu5FuZyB0w61jaCBo4bujcCB0w61uaCBuxINuZyDEkeG7gSB4deG6pXQgdG91ciBi4bqxbmcgQUksIHF14bqjbiBsw70gbOG7i2NoIHRyw6xuaCB0aMO0bmcgbWluaCwgbcOhbmcgeMOjIGjhu5lpIHbDoCB24bqtbiBow6BuaCDEkWEgdmFpIHRyw7IgbmjhurFtIHThuqFvIHJhIG3hu5l0IHRy4bqjaSBuZ2hp4buHbSBkdSBs4buLY2ggdG/DoG4gZGnhu4duIHbDoCBsaeG7gW4gbeG6oWNoLiBTdGF5SHViIGPFqW5nIGNobyBwaMOpcCBjw6FjIGRvYW5oIG5naGnhu4dwIHF14bqjbiBsw70gdGjDtG5nIHRpbiDEkWnhu4NtIMSR4bq/biBuaMawIGRpIHPhuqNuIHbEg24gaMOzYSwgxJHhurdjIHPhuqNuIMSR4buLYSBwaMawxqFuZywg4bqpbSB0aOG7sWMgdHJ1eeG7gW4gdGjhu5FuZyB2w6AgY8OhYyDEkWnhu4NtIGR1IGzhu4tjaCDEkeG7gyBjdW5nIGPhuqVwIG7hu5lpIGR1bmcgcGhvbmcgcGjDuiB2w6AgxJHDoW5nIHRpbiBj4bqteSBoxqFuIGNobyBraMOhY2ggaMOgbmcu');
const aboutEn = b64('T3BlcmF0aW5nIGFzIGFuICJJbnRlbGxpZ2VudCBUb3VyIE1hbmFnZW1lbnQgU3lzdGVtIiwgU3RheUh1YiBpcyBkZXNpZ25lZCBmb3IgdHJhdmVsIGNvbXBhbmllcyB0byBlZmZpY2llbnRseSBtYW5hZ2UgdG91cnMsIHNjaGVkdWxlcywgYm9va2luZ3MsIGN1c3RvbWVyIGludGVyYWN0aW9ucywgYW5kIHRvdXJpc20tcmVsYXRlZCBjb250ZW50IHdpdGhpbiBhIHVuaWZpZWQgZWNvc3lzdGVtLiBUaGUgc3lzdGVtIGludGVncmF0ZXMgQUktcG93ZXJlZCB0b3VyIHJlY29tbWVuZGF0aW9ucywgc21hcnQgaXRpbmVyYXJ5IG1hbmFnZW1lbnQsIHNvY2lhbCBpbnRlcmFjdGlvbiBmZWF0dXJlcywgYW5kIG11bHRpLXJvbGUgb3BlcmF0aW9ucyB0byBjcmVhdGUgYSBjb21wcmVoZW5zaXZlIGFuZCBzZWFtbGVzcyB0cmF2ZWwgZXhwZXJpZW5jZS4gU3RheUh1YiBhbHNvIGVuYWJsZXMgYnVzaW5lc3NlcyB0byBtYW5hZ2UgZGVzdGluYXRpb24gaW5mb3JtYXRpb24gc3VjaCBhcyBjdWx0dXJhbCBoZXJpdGFnZSBzaXRlcywgbG9jYWwgc3BlY2lhbHRpZXMsIHRyYWRpdGlvbmFsIGZvb2RzLCBhbmQgdG91cmlzdCBhdHRyYWN0aW9ucyB0byBwcm92aWRlIHJpY2hlciBhbmQgbW9yZSByZWxpYWJsZSB0cmF2ZWwgY29udGVudCBmb3IgY3VzdG9tZXJzLg==');

const sql = `
-- ====== i18n Real Legal Data Seed (with Tailwind Layout) ======
${upsert('PrivacyPolicy', generateHtml(privacySectionsVi))}
${upsert('TermsAndConditions', generateHtml(termsSectionsVi))}
${upsert('BookingRegulations', generateHtml(bookingTermsSectionsVi))}
${upsert('DataPolicy', dataVi)}
${upsert('CookiePolicy', cookieVi)}

${upsert('PrivacyPolicy_en', generateHtml(privacySections))}
${upsert('TermsAndConditions_en', generateHtml(termsSections))}
${upsert('BookingRegulations_en', generateHtml(bookingTermsSections))}
${upsert('DataPolicy_en', dataEn)}
${upsert('CookiePolicy_en', cookieEn)}

-- ====== i18n Refund Regulations ======
${upsert('RefundRegulations', refundVi)}
${upsert('RefundRegulations_en', refundEn)}

-- ====== i18n About Us ======
${upsert('AboutUs', aboutVi)}
${upsert('AboutUs_en', aboutEn)}
`;

fs.writeFileSync('D:/HocDeKiCuoi/DoAn/SEP490_08-Backend/append.sql', sql, { encoding: 'utf8' });
console.log('Successfully wrote append.sql');