import dns from 'node:dns';
import { Resolver } from 'node:dns';
import { promisify } from 'node:util';
import https from 'node:https';
import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Dev OTP delivery endpoint.
 * POST /api/otp/send { to, channel, code, message }
 * - email → FormSubmit (real inbox with the 6-digit code)
 * - sms → Twilio → Textbelt → OTP_WEBHOOK_URL (real SMS to the phone)
 */
function otpSendPlugin(opts: {
  webhookUrl: string;
  textbeltKey: string;
  twilioAccountSid: string;
  twilioAuthToken: string;
  twilioFrom: string;
}): Plugin {
  const {
    webhookUrl,
    textbeltKey,
    twilioAccountSid,
    twilioAuthToken,
    twilioFrom
  } = opts;

  async function sendSmsRemote(
    to: string,
    code: string,
    message: string
  ): Promise<{ ok: boolean; message: string }> {
    const smsBody =
      message || `Mkash Travel code: ${code}. Valid 10 min.`;

    if (twilioAccountSid && twilioAuthToken && twilioFrom) {
      try {
        const auth = Buffer.from(
          `${twilioAccountSid}:${twilioAuthToken}`
        ).toString('base64');
        const params = new URLSearchParams({
          To: to,
          From: twilioFrom,
          Body: smsBody
        });
        const upstream = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${auth}`,
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
          }
        );
        const twilioBody = (await upstream.json().catch(() => null)) as {
          sid?: string;
          message?: string;
          error_message?: string;
        } | null;
        if (upstream.ok && twilioBody?.sid) {
          return { ok: true, message: `SMS sent to ${to}` };
        }
        return {
          ok: false,
          message:
            twilioBody?.error_message ||
            twilioBody?.message ||
            `Twilio failed (HTTP ${upstream.status})`
        };
      } catch (err) {
        return {
          ok: false,
          message:
            err instanceof Error ? err.message : 'Twilio unreachable'
        };
      }
    }

    const key = textbeltKey || 'textbelt';
    try {
      const params = new URLSearchParams({
        phone: to,
        message: smsBody,
        key
      });
      const upstream = await fetch('https://textbelt.com/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });
      const textbeltBody = (await upstream.json().catch(() => null)) as {
        success?: boolean;
        error?: string;
        quotaRemaining?: number;
      } | null;
      if (textbeltBody?.success) {
        return { ok: true, message: `SMS sent to ${to}` };
      }
      return {
        ok: false,
        message:
          textbeltBody?.error ||
          `Textbelt failed (HTTP ${upstream.status})`
      };
    } catch (err) {
      return {
        ok: false,
        message:
          err instanceof Error ? err.message : 'Textbelt unreachable'
      };
    }
  }

  return {
    name: 'mkash-otp-send',
    configureServer(server) {
      server.middlewares.use(
        '/api/otp/send',
        (req: IncomingMessage, res: ServerResponse, next) => {
          if (req.method !== 'POST') {
            next();
            return;
          }

          const chunks: Buffer[] = [];
          req.on('data', (chunk: Buffer) => chunks.push(chunk));
          req.on('end', () => {
            void (async () => {
              const json = (status: number, payload: Record<string, unknown>) => {
                res.statusCode = status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(payload));
              };

              let body: {
                to?: string;
                channel?: string;
                code?: string;
                message?: string;
              } = {};
              try {
                body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
              } catch {
                json(400, { ok: false, message: 'Invalid JSON' });
                return;
              }

              const to = String(body.to || '').trim();
              const channel = body.channel === 'email' ? 'email' : 'sms';
              const code = String(body.code || '').trim();
              if (!to) {
                json(400, { ok: false, message: 'Missing destination' });
                return;
              }

              if (channel === 'email') {
                if (!code || !/^\d{6}$/.test(code)) {
                  json(400, { ok: false, message: 'Missing 6-digit code' });
                  return;
                }
                try {
                  const upstream = await fetch(
                    `https://formsubmit.co/ajax/${encodeURIComponent(to)}`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Accept: 'application/json',
                        Origin: 'http://127.0.0.1:5174',
                        Referer: 'http://127.0.0.1:5174/'
                      },
                      body: JSON.stringify({
                        _subject: `Mkash Travel verification code: ${code}`,
                        _template: 'box',
                        _captcha: 'false',
                        _honey: '',
                        name: 'Mkash Travel',
                        email: to,
                        code,
                        message: [
                          'Your Mkash Travel verification code is:',
                          '',
                          code,
                          '',
                          'This code expires in 10 minutes.',
                          'If you did not request this, you can ignore this email.'
                        ].join('\n')
                      })
                    }
                  );
                  const upstreamBody = (await upstream.json().catch(() => null)) as {
                    success?: string | boolean;
                    message?: string;
                  } | null;
                  const successFlag = upstreamBody?.success;
                  const activated =
                    successFlag === true ||
                    successFlag === 'true' ||
                    /submitted successfully/i.test(
                      String(upstreamBody?.message || '')
                    );
                  const needsActivation = /activation/i.test(
                    String(upstreamBody?.message || '')
                  );

                  if (!upstream.ok || (!activated && !needsActivation)) {
                    json(502, {
                      ok: false,
                      message:
                        upstreamBody?.message ||
                        `Could not send email (HTTP ${upstream.status})`
                    });
                    return;
                  }

                  if (needsActivation) {
                    console.info(
                      `[otp] email → ${to} (FormSubmit activation required)`
                    );
                    json(200, {
                      ok: true,
                      mode: 'remote',
                      message: `Check ${to}: open the FormSubmit “Activate Form” email once, then tap Resend code to get your 6-digit OTP.`
                    });
                    return;
                  }

                  console.info(`[otp] email → ${to} (FormSubmit ok)`);
                  json(200, {
                    ok: true,
                    mode: 'remote',
                    message: `Code sent to ${to}. Check your inbox and spam folder.`
                  });
                  return;
                } catch (err) {
                  json(502, {
                    ok: false,
                    message:
                      err instanceof Error ?
                        err.message :
                        'Could not reach email delivery service'
                  });
                  return;
                }
              }

              // SMS channel
              if (!code || !/^\d{6}$/.test(code)) {
                json(400, { ok: false, message: 'Missing 6-digit code' });
                return;
              }

              if (webhookUrl) {
                try {
                  const upstream = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Accept: 'application/json'
                    },
                    body: JSON.stringify({
                      to,
                      channel: 'sms',
                      code,
                      message: body.message
                    })
                  });
                  if (upstream.ok) {
                    console.info(`[otp] sms → ${to} (webhook ok)`);
                    json(200, {
                      ok: true,
                      mode: 'remote',
                      message: `SMS sent to ${to}`
                    });
                    return;
                  }
                } catch {
                  // Fall through to Textbelt / Twilio
                }
              }

              const sms = await sendSmsRemote(
                to,
                code,
                String(body.message || '')
              );
              if (sms.ok) {
                console.info(`[otp] sms → ${to} (ok)`);
                json(200, {
                  ok: true,
                  mode: 'remote',
                  message: sms.message
                });
                return;
              }

              console.warn(`[otp] sms → ${to} failed: ${sms.message}`);
              json(502, {
                ok: false,
                message: sms.message
              });
            })();
          });
        }
      );
    }
  };
}

dns.setDefaultResultOrder('ipv4first');

const GUEST_API_HOST = 'apitravel.afonestop.com';
const DEFAULT_GUEST_API_ORIGIN = `https://${GUEST_API_HOST}`;
/** Last-resort resolvers when macOS/ISP DNS returns SERVFAIL. */
const PUBLIC_DNS = ['8.8.8.8', '1.1.1.1', '8.8.4.4'];

const resolve4System = promisify(dns.resolve4);
const guestApiResolver = new Resolver();
guestApiResolver.setServers(PUBLIC_DNS);
const resolve4Public = promisify(guestApiResolver.resolve4.bind(guestApiResolver));

type LookupCallback = (
  err: NodeJS.ErrnoException | null,
  address: string | dns.LookupAddress[],
  family?: number
) => void;

/**
 * Prefer system DNS (working Cloudflare edge for this network: 104.21 / 172.67).
 * Google/Cloudflare public DNS often returns a different anycast pair (188.114.*)
 * that times out from some ISPs — that was causing every GuestAPI proxy call to hang.
 */
async function resolveGuestApiIpv4(): Promise<string[]> {
  try {
    const system = await resolve4System(GUEST_API_HOST);
    if (system.length > 0) return system;
  } catch {
    // Fall through to public DNS.
  }
  return resolve4Public(GUEST_API_HOST);
}

function guestApiLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: LookupCallback
): void {
  if (hostname !== GUEST_API_HOST) {
    dns.lookup(hostname, options, callback);
    return;
  }

  resolveGuestApiIpv4()
    .then((addresses) => {
      const address = addresses[0];
      if (!address) {
        callback(new Error(`No IPv4 address for ${hostname}`), '', 4);
        return;
      }
      if (options.all) {
        callback(
          null,
          addresses.map((addr) => ({ address: addr, family: 4 as const }))
        );
        return;
      }
      callback(null, address, 4);
    })
    .catch((err: NodeJS.ErrnoException) => {
      callback(err, '', 4);
    });
}

function createGuestProxyAgent(): https.Agent {
  return new https.Agent({
    keepAlive: true,
    family: 4,
    lookup: guestApiLookup
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const guestApiOrigin = env.VITE_GUEST_API_ORIGIN || DEFAULT_GUEST_API_ORIGIN;
  const otpWebhookUrl = (
    env.OTP_WEBHOOK_URL ||
    env.VITE_OTP_WEBHOOK_URL ||
    ''
  ).trim();
  const textbeltKey = (
    env.TEXTBELT_API_KEY ||
    env.VITE_TEXTBELT_API_KEY ||
    'textbelt'
  ).trim();
  const twilioAccountSid = (env.TWILIO_ACCOUNT_SID || '').trim();
  const twilioAuthToken = (env.TWILIO_AUTH_TOKEN || '').trim();
  const twilioFrom = (env.TWILIO_FROM_NUMBER || '').trim();

  return {
    base: './',
    plugins: [
      react(),
      otpSendPlugin({
        webhookUrl: otpWebhookUrl,
        textbeltKey,
        twilioAccountSid,
        twilioAuthToken,
        twilioFrom
      })
    ],
    optimizeDeps: {
      entries: ['index.html']
    },
    server: {
      host: true,
      port: 5174,
      strictPort: false,
      proxy: {
        '/api/guest': {
          target: guestApiOrigin,
          changeOrigin: true,
          secure: true,
          agent: createGuestProxyAgent(),
          timeout: 120_000,
          proxyTimeout: 120_000,
          // Operation name in the browser URL is for Network-tab labelling only.
          // SOAP POST must always hit the ASMX service root.
          rewrite: () => '/GuestAPI.asmx'
        },
        // TourGetList returns `../Images/Tour/...` — served from travel portal.
        // Missing files 302 → /NotFound.aspx; don't follow so fetch sees non-image.
        '/api/tour-images': {
          target: 'https://travel.afonestop.com',
          changeOrigin: true,
          secure: true,
          timeout: 12_000,
          proxyTimeout: 12_000,
          followRedirects: false,
          rewrite: (path) => path.replace(/^\/api\/tour-images/, '')
        }
      }
    }
  };
});
