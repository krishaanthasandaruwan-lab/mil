#!/usr/bin/env node
/**
 * Builds docs/Privacy_Policy.docx and public/privacy.html from src/content/privacy.json,
 * the same text the game shows in Settings → Privacy Policy.
 *   node tools/build_privacy.cjs
 */
const fs = require('fs');
const path = require('path');
const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  ShadingType,
  TextRun,
} = require('docx');

const ROOT = path.resolve(__dirname, '..');
const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/content/privacy.json'), 'utf8'));
const { developer, email } = policy.placeholders;

/** Splits text around the {developer}/{email} tokens so placeholders can be highlighted for the owner to fill in. */
const pieces = (text) =>
  text
    .split(/(\{developer\}|\{email\})/)
    .filter(Boolean)
    .map((part) => (part === '{developer}' ? { text: developer, placeholder: true } : part === '{email}' ? { text: email, placeholder: true } : { text: part }));

const runs = (text, extra = {}) =>
  pieces(text).map(
    (p) =>
      new TextRun({
        text: p.text,
        ...extra,
        ...(p.placeholder ? { bold: true, shading: { type: ShadingType.CLEAR, fill: 'FFE066', color: 'auto' } } : {}),
      }),
  );

const buildDocx = async () => {
  const children = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun(policy.title)] }),
    new Paragraph({
      spacing: { after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: '2E9BFF', space: 6 } },
      children: [new TextRun({ text: `Effective date: ${policy.effectiveDate}`, italics: true, color: '555555' })],
    }),
    new Paragraph({ spacing: { after: 200 }, children: runs(policy.intro) }),
  ];
  policy.sections.forEach((section) => {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(section.heading)] }));
    section.paragraphs.forEach((p) => children.push(new Paragraph({ spacing: { after: 140 }, children: runs(p) })));
  });

  const doc = new Document({
    creator: 'Fold Warfare',
    title: policy.title,
    description: 'Privacy Policy for the Fold Warfare mobile game',
    styles: {
      default: { document: { run: { font: 'Calibri', size: 22 }, paragraph: { spacing: { line: 300 } } } },
      paragraphStyles: [
        { id: 'Title', name: 'Title', basedOn: 'Normal', run: { font: 'Calibri', size: 40, bold: true, color: '0B1220' }, paragraph: { spacing: { after: 120 } } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', run: { font: 'Calibri', size: 26, bold: true, color: '1F4E8C' }, paragraph: { spacing: { before: 280, after: 100 }, outlineLevel: 1 } },
      ],
    },
    sections: [
      {
        properties: { page: { margin: { top: 1300, bottom: 1300, left: 1300, right: 1300 } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Fold Warfare Privacy Policy · Page ', color: '777777', size: 18 }),
                  new TextRun({ children: [PageNumber.CURRENT], color: '777777', size: 18 }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
  const out = path.join(ROOT, 'docs/Privacy_Policy.docx');
  fs.writeFileSync(out, await Packer.toBuffer(doc));
  return out;
};

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const htmlText = (text) =>
  pieces(text)
    .map((p) => (p.placeholder ? `<mark>${escapeHtml(p.text)}</mark>` : escapeHtml(p.text)))
    .join('');

const buildHtml = () => {
  const body = policy.sections
    .map((s) => `<h2>${escapeHtml(s.heading)}</h2>\n${s.paragraphs.map((p) => `<p>${htmlText(p)}</p>`).join('\n')}`)
    .join('\n');
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fold Warfare Privacy Policy</title>
<style>
:root { color-scheme: light dark; --bg:#ffffff; --text:#1b2230; --muted:#5a6676; --accent:#1f6fd1; }
@media (prefers-color-scheme: dark) { :root { --bg:#0b1018; --text:#e6edf7; --muted:#8fa3bf; --accent:#5fb0ff; } }
body { margin:0; background:var(--bg); color:var(--text); font:16px/1.65 -apple-system, system-ui, "Segoe UI", sans-serif; }
main { max-width: 760px; margin: 0 auto; padding: 32px 20px 64px; }
h1 { font-size: 28px; margin: 0 0 4px; } h2 { font-size: 19px; margin: 28px 0 6px; color: var(--accent); }
.date { color: var(--muted); border-bottom: 2px solid var(--accent); padding-bottom: 12px; margin-bottom: 20px; }
mark { background: #ffe066; color: #000; padding: 0 3px; border-radius: 3px; }
</style></head><body><main>
<h1>${escapeHtml(policy.title)}</h1>
<p class="date">Effective date: ${escapeHtml(policy.effectiveDate)}</p>
<p>${htmlText(policy.intro)}</p>
${body}
</main></body></html>
`;
  const out = path.join(ROOT, 'public/privacy.html');
  fs.writeFileSync(out, html);
  return out;
};

buildDocx().then((docx) => {
  const html = buildHtml();
  console.log(`Wrote ${path.relative(ROOT, docx)} and ${path.relative(ROOT, html)}`);
});
