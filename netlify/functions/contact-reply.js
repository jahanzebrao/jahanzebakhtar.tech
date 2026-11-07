/* Auto-reply to people who send the contact form.
   Netlify calls this through a signed outgoing webhook (event: new form submission) and the
   reply goes out from the Hostinger mailbox over SMTP. No npm packages, Node built-ins only.
   Env vars (Netlify → Environment variables): SMTP_PASS (mailbox password), HOOK_SECRET (webhook JWS secret). */
const tls = require('tls');
const crypto = require('crypto');

const SMTP = { host: 'smtp.hostinger.com', port: 465, user: 'jahanzeb@jahanzebakhtar.tech' };
const FROM_NAME = 'Jahanzeb Akhtar';

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'POST only' };
  const { SMTP_PASS, HOOK_SECRET } = process.env;
  if (!SMTP_PASS || !HOOK_SECRET) return { statusCode: 500, body: 'Not configured' };

  const raw = event.isBase64Encoded ? Buffer.from(event.body || '', 'base64').toString('utf8') : (event.body || '');
  const headers = Object.fromEntries(Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v]));
  if (!validSignature(headers['x-webhook-signature'], raw, HOOK_SECRET)) return { statusCode: 401, body: 'Bad signature' };

  let d;
  try { d = JSON.parse(raw).data || {}; } catch (e) { return { statusCode: 400, body: 'Bad JSON' }; }
  const email = String(d.email || '').trim();
  if (!/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(email) || email.length > 200) return { statusCode: 200, body: 'No valid email, skipped' };

  const f = {
    name: clip(d.name, 80) || 'there',
    project: clip(d.project, 80) || 'your project',
    company: clip(d.company, 120) || '-',
    message: clip(d.message, 4000),
  };
  try {
    await smtpSend({ ...SMTP, pass: SMTP_PASS }, email, buildMessage(email, f));
    return { statusCode: 200, body: 'Sent' };
  } catch (e) {
    console.error('Auto-reply failed:', e.message);
    return { statusCode: 502, body: 'Send failed: ' + e.message }; // only signed callers get here; SMTP replies never echo the password
  }
};

/* Netlify signs webhooks with a JWS (HS256): claims { iss: "netlify", sha256: hex sha256 of the body } */
function validSignature(sig, body, secret) {
  if (!sig || sig.split('.').length !== 3) return false;
  const [h, p, s] = sig.split('.');
  const want = crypto.createHmac('sha256', secret).update(h + '.' + p).digest('base64url');
  if (want.length !== s.length || !crypto.timingSafeEqual(Buffer.from(want), Buffer.from(s))) return false;
  try {
    const claims = JSON.parse(Buffer.from(p, 'base64url').toString('utf8'));
    return claims.iss === 'netlify' && claims.sha256 === crypto.createHash('sha256').update(body).digest('hex');
  } catch (e) { return false; }
}

const clip = (v, n) => String(v || '').replace(/\s+$/, '').slice(0, n);
const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const word = (v) => '=?UTF-8?B?' + Buffer.from(v, 'utf8').toString('base64') + '?=';
const b64 = (v) => Buffer.from(v, 'utf8').toString('base64').replace(/.{76}/g, '$&\r\n');

function buildMessage(to, f) {
  const boundary = 'b' + crypto.randomBytes(12).toString('hex');
  return [
    `From: ${word(FROM_NAME)} <${SMTP.user}>`,
    `To: <${to}>`,
    `Reply-To: ${SMTP.user}`,
    `Subject: ${word(`Thanks ${f.name}, your enquiry is in`)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@jahanzebakhtar.tech>`,
    'Auto-Submitted: auto-replied',
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(textBody(f)),
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: base64',
    '',
    b64(htmlBody(f)),
    `--${boundary}--`,
    '',
  ].join('\r\n');
}

/* Minimal SMTP client over implicit TLS (port 465): EHLO, AUTH LOGIN, one recipient, DATA */
function smtpSend(cfg, rcpt, data) {
  return new Promise((resolve, reject) => {
    const sock = tls.connect({ host: cfg.host, port: cfg.port, servername: cfg.host });
    let partial = '', lines = [], replies = [], waiter = null, done = false;
    const fail = (e) => { if (done) return; done = true; sock.destroy(); reject(e); };
    sock.setEncoding('utf8');
    sock.setTimeout(15000, () => fail(new Error('SMTP timeout')));
    sock.on('error', fail);
    sock.on('data', (chunk) => {
      partial += chunk;
      let i;
      while ((i = partial.indexOf('\r\n')) >= 0) {
        const line = partial.slice(0, i);
        partial = partial.slice(i + 2);
        lines.push(line);
        if (/^\d{3}(?: |$)/.test(line)) {
          const reply = lines; lines = [];
          if (waiter) { const w = waiter; waiter = null; w(reply); } else replies.push(reply);
        }
      }
    });
    const next = () => new Promise((res) => (replies.length ? res(replies.shift()) : (waiter = res)));
    const expect = async (ok) => { const r = await next(), last = r[r.length - 1]; if (!ok.test(last)) throw new Error('SMTP: ' + last); };
    const send = (line, ok) => { sock.write(line + '\r\n'); return expect(ok); };
    (async () => {
      await expect(/^220/);
      await send('EHLO jahanzebakhtar.tech', /^250/);
      await send('AUTH LOGIN', /^334/);
      await send(Buffer.from(cfg.user).toString('base64'), /^334/);
      await send(Buffer.from(cfg.pass).toString('base64'), /^235/);
      await send(`MAIL FROM:<${cfg.user}>`, /^250/);
      await send(`RCPT TO:<${rcpt}>`, /^25[01]/);
      await send('DATA', /^354/);
      await send(data.replace(/^\./gm, '..') + '\r\n.', /^250/);
      done = true;
      sock.end('QUIT\r\n');
      resolve();
    })().catch(fail);
  });
}

function textBody(f) {
  return `Thanks, ${f.name}. Your enquiry is in.

I've received your message about ${f.project}. I read every enquiry myself and will reply within 24 hours, usually sooner.

What happens next
01 Discovery call (free, 30 min): we map your workflow, the pain points and what success looks like.
02 Clickable demo (week 1): your own system, with your business name, before you commit.
03 Build in sprints (weeks 2 to 6): weekly updates on a live test link, with your feedback built in.
04 Launch and support: data import, team training, hosting, backups and ongoing care.

What I build: Custom ERP, CRM & sales pipelines, SaaS products, FBR digital invoicing, websites, security & hosting.

OnePackERP, my flagship product, is a complete ERP for packaging and corrugation manufacturers: https://onepackerp.com

Want to talk sooner? WhatsApp me at +92 315 8105115, or just reply to this email.

A copy of your message
Project: ${f.project}
Company: ${f.company}
${f.message}

Jahanzeb Akhtar
Founder, ZebCore Systems · Karachi, Pakistan
+92 315 8105115 · jahanzeb@jahanzebakhtar.tech
https://jahanzebakhtar.tech · https://zebcoresystem.com

You're receiving this because an enquiry was sent from jahanzebakhtar.tech with this email address. If that wasn't you, you can ignore this email.
`;
}

function htmlBody(f) {
  const n = esc(f.name), p = esc(f.project), c = esc(f.company), m = esc(f.message);
  const step = (num, bg, title, text) => `<tr><td style="width:36px;vertical-align:top;padding:8px 0"><div style="width:28px;height:28px;border-radius:14px;background:${bg};color:#ffffff;font:bold 12px/28px Arial,Helvetica,sans-serif;text-align:center">${num}</div></td>
        <td style="padding:8px 0;font:14px/1.5 Arial,Helvetica,sans-serif;color:#4b5263"><b style="color:#0a0c10">${title}</b> ${text}</td></tr>`;
  const pill = (t) => `<span style="display:inline-block;padding:2px 12px;margin:0 4px 6px 0;border:1px solid #e3e6eb;border-radius:999px">${t}</span>`;
  return `<!doctype html><html><body style="margin:0;padding:0">
<div style="margin:0;padding:24px 12px;background:#f4f5f7;font-family:Arial,Helvetica,sans-serif;color:#0a0c10">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e3e6eb;border-radius:16px;overflow:hidden">
  <tr><td style="padding:24px 28px;border-bottom:1px solid #e3e6eb">
    <table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="width:40px;height:40px;background:#0a0c10;border-radius:10px;color:#ffffff;font:bold 15px Arial,Helvetica,sans-serif;text-align:center;vertical-align:middle">JA</td>
      <td style="padding-left:12px">
        <div style="font:bold 16px Arial,Helvetica,sans-serif;color:#0a0c10">Jahanzeb Akhtar</div>
        <div style="font:13px Arial,Helvetica,sans-serif;color:#646b7a">Laravel developer · Founder, ZebCore Systems</div>
      </td>
    </tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 8px">
    <h1 style="margin:0;font:bold 26px/1.2 Arial,Helvetica,sans-serif;color:#0a0c10">Thanks, ${n}. <span style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:normal;color:#ff5a1f">Your enquiry is in.</span></h1>
    <p style="margin:16px 0 0;font:15px/1.6 Arial,Helvetica,sans-serif;color:#4b5263">I've received your message about <b style="color:#0a0c10">${p}</b>. I read every enquiry myself and will reply within 24 hours, usually sooner.</p>
  </td></tr>
  <tr><td style="padding:24px 28px 0">
    <div style="font:bold 12px Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#646b7a">What happens next</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px">
      ${step('01', '#ff5a1f', 'Discovery call', '(free, 30 min): we map your workflow, the pain points and what success looks like.')}
      ${step('02', '#0a0c10', 'Clickable demo', '(week 1): your own system, with your business name, before you commit.')}
      ${step('03', '#0a0c10', 'Build in sprints', '(weeks 2 to 6): weekly updates on a live test link, with your feedback built in.')}
      ${step('04', '#0a0c10', 'Launch and support:', 'data import, team training, hosting, backups and ongoing care.')}
    </table>
  </td></tr>
  <tr><td style="padding:24px 28px 0">
    <div style="font:bold 12px Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#646b7a">What I build</div>
    <p style="margin:10px 0 0;font:14px/2 Arial,Helvetica,sans-serif;color:#0a0c10">${['Custom ERP', 'CRM &amp; sales pipelines', 'SaaS products', 'FBR digital invoicing', 'Websites', 'Security &amp; hosting'].map(pill).join('\n      ')}</p>
  </td></tr>
  <tr><td style="padding:20px 28px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0c10;border-radius:14px"><tr><td style="padding:22px">
      <div style="font:bold 11px Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#ff5a1f">Flagship product · Live</div>
      <div style="margin-top:6px;font:bold 22px Arial,Helvetica,sans-serif;color:#ffffff">OnePackERP</div>
      <p style="margin:8px 0 16px;font:14px/1.55 Arial,Helvetica,sans-serif;color:#a9afbd">A complete ERP for packaging and corrugation manufacturers, built inside my own factory: orders, challans, FBR invoices, ledgers and reel stock.</p>
      <a href="https://onepackerp.com" style="display:inline-block;padding:10px 18px;background:#ffffff;color:#0a0c10;border-radius:999px;font:bold 13px Arial,Helvetica,sans-serif;text-decoration:none">Visit onepackerp.com &#8599;</a>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:28px 28px 0;text-align:center">
    <p style="margin:0 0 14px;font:15px/1.5 Arial,Helvetica,sans-serif;color:#4b5263">Want to talk sooner? Message me on WhatsApp, or just reply to this email.</p>
    <a href="https://wa.me/923158105115?text=Hi%20Jahanzeb%2C%20I%20just%20sent%20an%20enquiry%20from%20your%20website." style="display:inline-block;padding:13px 26px;background:#ff5a1f;color:#ffffff;border-radius:999px;font:bold 15px Arial,Helvetica,sans-serif;text-decoration:none">Chat on WhatsApp</a>
    &nbsp;
    <a href="https://jahanzebakhtar.tech/#work" style="display:inline-block;padding:12px 24px;border:1px solid #e3e6eb;color:#0a0c10;border-radius:999px;font:bold 15px Arial,Helvetica,sans-serif;text-decoration:none">See my work</a>
  </td></tr>
  <tr><td style="padding:28px 28px 0">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;border-radius:12px"><tr><td style="padding:18px 20px;font:13px/1.6 Arial,Helvetica,sans-serif;color:#4b5263">
      <div style="font:bold 11px Arial,Helvetica,sans-serif;letter-spacing:1.5px;text-transform:uppercase;color:#646b7a;margin-bottom:8px">A copy of your message</div>
      <b style="color:#0a0c10">Project:</b> ${p}<br>
      <b style="color:#0a0c10">Company:</b> ${c}<br>
      <div style="margin-top:8px;white-space:pre-wrap;color:#0a0c10">${m}</div>
    </td></tr></table>
  </td></tr>
  <tr><td style="padding:28px">
    <div style="font:bold 15px Arial,Helvetica,sans-serif;color:#0a0c10">Jahanzeb Akhtar</div>
    <div style="font:13px/1.7 Arial,Helvetica,sans-serif;color:#646b7a">
      Founder, ZebCore Systems · Karachi, Pakistan<br>
      <a href="tel:+923158105115" style="color:#0a0c10;text-decoration:none">+92 315 8105115</a> ·
      <a href="mailto:jahanzeb@jahanzebakhtar.tech" style="color:#0a0c10;text-decoration:none">jahanzeb@jahanzebakhtar.tech</a><br>
      <a href="https://jahanzebakhtar.tech" style="color:#ff5a1f;text-decoration:none">jahanzebakhtar.tech</a> ·
      <a href="https://zebcoresystem.com" style="color:#ff5a1f;text-decoration:none">zebcoresystem.com</a>
    </div>
  </td></tr>
  <tr><td style="padding:16px 28px;border-top:1px solid #e3e6eb;font:12px/1.5 Arial,Helvetica,sans-serif;color:#646b7a">
    You're receiving this because an enquiry was sent from jahanzebakhtar.tech with this email address. If that wasn't you, you can ignore this email.
  </td></tr>
</table>
</div>
</body></html>`;
}
