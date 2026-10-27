class ServiceUnavailable extends Error {
  constructor(message, code = 'SERVICE_NOT_CONFIGURED') {
    super(message);
    this.status = 503;
    this.code = code;
  }
}

function providers(settings, { fetcher = fetch, publicUrl = process.env.PUBLIC_SITE_URL || '' } = {}) {
  function resolveOrigin() {
    const candidate =
      publicUrl ||
      process.env.PUBLIC_SITE_URL ||
      (process.env.APP_ORIGINS || '').split(',')[0].trim() ||
      (process.env.NODE_ENV !== 'production' ? 'http://localhost:5173' : '');
    let parsed;
    try {
      parsed = new URL(candidate);
    } catch {
      throw new ServiceUnavailable('دامنهٔ بازگشت پرداخت توسط مدیر سرور تنظیم نشده است.');
    }
    return parsed;
  }

  function paymentConfig() {
    const value = settings.get('payment');
    const parsed = resolveOrigin();
    if (!value.config.enabled || !value.secrets.merchantId) {
      // In production, or if admin explicitly saved a disabled payment configuration (version > 0), fail closed.
      if (process.env.NODE_ENV === 'production' || value.version > 0) {
        throw new ServiceUnavailable('درگاه پرداخت فعال نیست؛ هیچ مبلغی برداشت یا رزروی تأیید نشد.');
      }
      return {
        provider: 'local_dev',
        sandbox: false,
        localDev: true,
        merchantId: 'local_dev_merchant',
        publicUrl: parsed.origin,
      };
    }
    if (process.env.NODE_ENV === 'production' && (parsed.protocol !== 'https:' || value.config.sandbox)) {
      throw new ServiceUnavailable('درگاه پرداخت تولیدی باید HTTPS و غیرآزمایشی باشد.');
    }
    return {
      provider: value.config.provider || 'zarinpal',
      sandbox: Boolean(value.config.sandbox),
      localDev: false,
      merchantId: value.secrets.merchantId,
      publicUrl: parsed.origin,
    };
  }

  function gatewayMode() {
    const value = settings.get('payment');
    if (value.config.enabled && value.secrets.merchantId) {
      return {
        configured: true,
        sandbox: Boolean(value.config.sandbox),
        provider: value.config.provider || 'zarinpal',
        mode: value.config.sandbox ? 'sandbox' : 'live',
      };
    }
    return {
      configured: false,
      sandbox: false,
      provider: process.env.NODE_ENV !== 'production' && value.version === 0 ? 'local_dev' : 'unconfigured',
      mode: process.env.NODE_ENV !== 'production' && value.version === 0 ? 'local_dev' : 'unconfigured',
    };
  }

  return {
    paymentConfig,
    gatewayMode,
    async sendOtp(mobile, code) {
      const value = settings.get('sms');
      if (!value.config.enabled) {
        if (process.env.NODE_ENV !== 'production') return; // UI explicitly labels development OTP.
        throw new ServiceUnavailable('سرویس پیامک فعال نیست.');
      }
      if (!value.secrets.apiKey || !value.config.template) throw new ServiceUnavailable('تنظیمات پیامک ناقص است.');
      const url = `https://api.kavenegar.com/v1/${encodeURIComponent(value.secrets.apiKey)}/verify/lookup.json`;
      const body = new URLSearchParams({ receptor: mobile, token: code, template: value.config.template });
      const res = await fetcher(url, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (!res.ok) throw new ServiceUnavailable('ارسال پیامک از سرویس‌دهنده ناموفق بود.');
    },
    async requestPayment(config, { id, amount, description, mobile }) {
      if (config.localDev || config.provider === 'local_dev') {
        const authority = `LOCALDEV_${id}`;
        return {
          authority,
          url: `/payment/result?id=${encodeURIComponent(id)}&devGateway=1&authority=${encodeURIComponent(authority)}`,
          mode: 'local_dev',
        };
      }
      const host = config.sandbox ? 'sandbox.zarinpal.com' : 'payment.zarinpal.com';
      const callback_url = `${config.publicUrl}/api/payments/callback/${encodeURIComponent(id)}`;
      const data = await jsonFetch(fetcher, `https://${host}/pg/v4/payment/request.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: config.merchantId, amount, description, callback_url, metadata: mobile ? { mobile } : {} }),
      });
      const authority = data?.data?.authority;
      if (data?.data?.code !== 100 || !authority) throw new ServiceUnavailable('درگاه پرداخت درخواست تراکنش را نپذیرفت.');
      return { authority, url: `https://${host}/pg/StartPay/${encodeURIComponent(authority)}`, mode: config.sandbox ? 'sandbox' : 'live' };
    },
    async verifyPayment(config, { authority, amount }) {
      if (config.localDev || config.provider === 'local_dev') {
        if (!authority || typeof authority !== 'string' || !authority.startsWith('LOCALDEV_')) {
          throw new ServiceUnavailable('تأیید تراکنش آزمایشی محیط توسعه ناموفق بود.');
        }
        return { reference: authority.replace(/^LOCALDEV_/, '') };
      }
      const host = config.sandbox ? 'sandbox.zarinpal.com' : 'payment.zarinpal.com';
      const data = await jsonFetch(fetcher, `https://${host}/pg/v4/payment/verify.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchant_id: config.merchantId, amount, authority }),
      });
      const code = data?.data?.code;
      if ((code !== 100 && code !== 101) || !data?.data?.ref_id) throw new ServiceUnavailable('تأیید تراکنش از درگاه ناموفق بود.');
      return { reference: String(data.data.ref_id) };
    },
  };
}

async function jsonFetch(fetcher, url, init) {
  let res;
  try {
    const timeoutSignal = typeof AbortSignal !== 'undefined' && AbortSignal.timeout ? { signal: AbortSignal.timeout(10000) } : {};
    res = await fetcher(url, { ...timeoutSignal, ...init });
  } catch {
    throw new ServiceUnavailable('ارتباط با درگاه پرداخت برقرار نشد یا مهلت پاسخ‌گویی به پایان رسید؛ هیچ مبلغی کسر نشد.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ServiceUnavailable('پاسخ درگاه پرداخت معتبر نبود.');
  return data;
}

module.exports = { providers, ServiceUnavailable };
