import "server-only";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://nooramodesty.com").replace(/\/$/, "");

export const EMAIL_COLORS = {
  background: "#f6f5f3",
  surface: "#ffffff",
  ink: "#1a1a1a",
  taupe: "#8B8378",
  border: "#e9e5df",
  muted: "#8a8a8a",
  danger: "#B21E1E",
  success: "#2F6B4A",
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderEyebrow(text: string): string {
  return `<p style="margin:0 0 12px;font-size:10px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:${EMAIL_COLORS.taupe};">${escapeHtml(text)}</p>`;
}

export function renderHeading(text: string): string {
  return `<h1 style="margin:0 0 20px;font-size:22px;font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:${EMAIL_COLORS.ink};">${escapeHtml(text)}</h1>`;
}

export function renderParagraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:13px;line-height:1.7;color:#4a4a4a;">${text}</p>`;
}

export function renderButton(label: string, href: string, backgroundColor: string = EMAIL_COLORS.ink): string {
  return `<a href="${href}" style="display:inline-block;background-color:${backgroundColor};color:#ffffff;text-decoration:none;font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;padding:14px 28px;">${escapeHtml(label)}</a>`;
}

export const WHATSAPP_GREEN = "#25D366";

export function renderSummaryRow(label: string, value: string, options: { bold?: boolean; accent?: string } = {}): string {
  const color = options.accent || (options.bold ? EMAIL_COLORS.ink : "#6b6b6b");
  const weight = options.bold ? "700" : "500";
  return `
    <tr>
      <td style="padding:6px 0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;font-weight:${weight};color:${color};">${escapeHtml(label)}</td>
      <td align="right" style="padding:6px 0;font-size:11px;letter-spacing:0.05em;font-weight:${weight};color:${color};">${escapeHtml(value)}</td>
    </tr>`;
}

export interface EmailLineItem {
  title: string;
  variant?: string;
  quantity: number;
  lineTotal: number;
}

export function renderItemRows(items: EmailLineItem[]): string {
  return items
    .map(
      (item) => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid ${EMAIL_COLORS.border};">
        <p style="margin:0 0 2px;font-size:12px;font-weight:700;color:${EMAIL_COLORS.ink};">${escapeHtml(item.title)}</p>
        <p style="margin:0;font-size:10px;letter-spacing:0.08em;text-transform:uppercase;color:${EMAIL_COLORS.muted};">${escapeHtml(
          [item.variant, `Qty ${item.quantity}`].filter(Boolean).join(" / "),
        )}</p>
      </td>
      <td align="right" style="padding:12px 0;border-bottom:1px solid ${EMAIL_COLORS.border};font-size:12px;font-weight:700;color:${EMAIL_COLORS.ink};">LKR ${item.lineTotal.toLocaleString()}</td>
    </tr>`,
    )
    .join("");
}

export function renderStatusPill(label: string, color: string): string {
  return `<span style="display:inline-block;padding:6px 14px;font-size:10px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#ffffff;background-color:${color};">${escapeHtml(label)}</span>`;
}

interface EmailLayoutOptions {
  previewText: string;
  bodyHtml: string;
}

export function renderEmailLayout({ previewText, bodyHtml }: EmailLayoutOptions): string {
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>Noora Modesty</title>
  </head>
  <body style="margin:0;padding:0;background-color:${EMAIL_COLORS.background};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(previewText)}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${EMAIL_COLORS.background};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${EMAIL_COLORS.surface};">
            <tr>
              <td align="center" bgcolor="${EMAIL_COLORS.ink}" style="background-color:${EMAIL_COLORS.ink};padding:28px 24px;">
                <img src="${SITE_URL}/noora-modesty-footer-logo.png" alt="Noora Modesty" width="150" style="display:block;max-width:150px;" />
              </td>
            </tr>
            <tr>
              <td style="padding:40px 32px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td bgcolor="${EMAIL_COLORS.ink}" style="background-color:${EMAIL_COLORS.ink};padding:24px 32px;" align="center">
                <p style="margin:0 0 8px;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:#ffffff;font-weight:700;">Noora Modesty</p>
                <p style="margin:0;font-size:11px;color:#c9c5bf;">
                  Need help? Email <a href="mailto:info@nooramodesty.com" style="color:#ffffff;">info@nooramodesty.com</a>
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}
