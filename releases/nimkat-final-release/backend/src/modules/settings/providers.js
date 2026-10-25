class ServiceUnavailable extends Error {
  constructor(message = 'این سرویس هنوز توسط مدیر سایت پیکربندی نشده است.') { super(message); this.status = 503; this.code = 'SERVICE_NOT_CONFIGURED'; }
}
async function jsonRequest(url, options, fetcher = fetch) {
  const response = await fetcher(url, { ...options, signal: AbortSignal.timeout(15000), redirect: 'error' });
  if (!response.ok) throw new ServiceUnavailable('ارتباط با ارائه‌دهنده موفق نبود؛ بعداً تلاش کنید.');
  return response.json();
}
function providers(settings, { fetcher = fetch, publicUrl = process.env.PUBLIC_SITE_URL || '' } = {}) {
  function paymentConfig() {
    const value = settings.get('payment');
    if (!value.config.enabled || !value.secrets.merchantId) throw new ServiceUnavailable('درگاه پرداخت فعال نیست؛ هیچ مبلغی برداشت یا رزروی تأیید نشد.');
    let url;
    try { url = new URL(publicUrl); } catch { throw new ServiceUnavailable('دامنهٔ بازگشت پرداخت توسط مدیر سرور تنظیم نشده است.'); }
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')) throw new ServiceUnavailable('دامنهٔ بازگشت پرداخت امن نیست.');
    return { ...value.config, merchantId: value.secrets.merchantId, publicUrl: url.origin };
  }
  const root = (config) => `https://${config.sandbox ? 'sandbox' : 'payment'}.zarinpal.com/pg/v4/payment`;
  return {
    paymentConfig,
    async sendOtp(mobile, code) {
      const value = settings.get('sms');
      if (!value.config.enabled) {
        if (process.env.NODE_ENV !== 'production') return; // UI explicitly labels development OTP.
        throw new ServiceUnavailable('سرویس پیامک فعال نیست.');
      }
      if (!value.secrets.apiKey || !value.config.template) throw new ServiceUnavailable('تنظیمات پیامک کامل نیست.');
      const url = new URL(`https://api.kavenegar.com/v1/${encodeURIComponent(value.secrets.apiKey)}/verify/lookup.json`);
      url.search = new URLSearchParams({ receptor: mobile, token: code, template: value.config.template }).toString();
      const response = await jsonRequest(url, { method: 'GET' }, fetcher);
      if (response.return?.status !== 200) throw new ServiceUnavailable('ارسال پیامک توسط سرویس‌دهنده تأیید نشد.');
    },
    async requestPayment(config, { id, amount, description, mobile }) {
      const response = await jsonRequest(`${root(config)}/request.json`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ merchant_id: config.merchantId, amount, currency: 'IRR', callback_url: `${config.publicUrl}/api/payments/callback/${id}`, description, metadata: { mobile } }) }, fetcher);
      const authority = response.data?.authority;
      if (response.data?.code !== 100 || typeof authority !== 'string' || !/^[A-Za-z0-9_-]{10,128}$/.test(authority)) throw new ServiceUnavailable('ایجاد پرداخت توسط درگاه تأیید نشد.');
      return { authority, url: `https://${config.sandbox ? 'sandbox' : 'payment'}.zarinpal.com/pg/StartPay/${encodeURIComponent(authority)}` };
    },
    async verifyPayment(config, { authority, amount }) {
      const response = await jsonRequest(`${root(config)}/verify.json`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ merchant_id: config.merchantId, amount, authority }) }, fetcher);
      if (![100, 101].includes(response.data?.code) || !response.data?.ref_id) throw Object.assign(new Error('پرداخت توسط درگاه تأیید نشد.'), { status: 402 });
      return { reference: String(response.data.ref_id) };
    },
  };
}
module.exports = { providers, ServiceUnavailable };
