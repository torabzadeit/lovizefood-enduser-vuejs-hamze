/**
 * Environment-agnostic mock logic (works in Node and in the browser).
 * createMock(sample) -> { handle(method, pathname, body), image(pathname) }
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.createMock = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  return function createMock(sample) {
    const snapshot = sample.responses['GET /api/enduser/core/initialize'].body;
    const manifest = (sample.responses['GET /api/enduser/core/manifest.webmanifest'] || {}).body || {};

    // The snapshot has fixed dates. Shift them so the first active day is
    // always today (Tehran), keeping each day's slots and discounts.
    function tehranToday() {
      const p = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tehran' }).format(new Date()).split('-').map(Number);
      return Date.UTC(p[0], p[1] - 1, p[2]);
    }
    function initialize() {
      const body = JSON.parse(JSON.stringify(snapshot));
      body.schedule.activeDays.forEach((d, i) => {
        const t = new Date(tehranToday() + i * 864e5);
        d.date = `${t.getUTCFullYear()}/${t.getUTCMonth() + 1}/${t.getUTCDate()}`;
      });
      // Not in the real API yet: the backend has to define this delivery type
      // ("snapp", the customer books their own Snapp) before it can show up there.
      if (Array.isArray(body.deliveryTypeOptions) && !body.deliveryTypeOptions.some((o) => o.value === 'snapp')) {
        body.deliveryTypeOptions.push({ text: 'خودم اسنپ می‌گیرم', value: 'snapp' });
      }
      // The real API returns the signed-in customer's saved addresses here; the
      // snapshot was taken signed out, so it has none.
      if (!body.savedAddresses) body.savedAddresses = sampleAddresses();
      return body;
    }

    const imagePaths = new Set();
    snapshot.products.forEach((p) => { [p.thumbnail, p.image].forEach((x) => { if (x) imagePaths.add(x); }); });
    const colors = ['#e8a33d', '#c0392b', '#8e5a2b', '#6b8e23', '#d35400', '#7d3c98', '#2e86c1'];
    // Only products that have an image in the snapshot get one; the rest 404 on
    // purpose so the "no photo" state is exercised with real data.
    function image(pathname) {
      if (!imagePaths.has(pathname)) return null;
      const hash = [...pathname].reduce((a, c) => (a * 31 + c.charCodeAt(0)) | 0, 7);
      const prod = snapshot.products.find((x) => x.thumbnail === pathname || x.image === pathname);
      const label = (prod ? prod.name : 'food').replace(/[<&>]/g, '');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="600" height="600" fill="${colors[Math.abs(hash) % colors.length]}"/><text x="300" y="310" font-size="44" fill="#fff" text-anchor="middle" font-family="sans-serif">${label}</text></svg>`;
    }

    // Sample personal discount codes (fixed amounts in toman), as the API would
    // return them for a signed-in customer.
    // `description` is the per-customer terms of a code. The real API has to send
    // it for each code of each customer (see personalCodes in discountSection.vue).
    // `maxAmount` (toman) is the most a percentage code can take off; a code with no
    // cap simply has none (dc-3). The real API sends it on these codes and in the
    // check-discount-code answer.
    // `seenDate`: null while the customer has not been shown the code (the app then
    // opens its details sheet by itself, once, and PUTs .../{id}/seen). dc-3 is the
    // new one here; clear localStorage "laviz:seen-discount-codes" to see it again.
    const sampleCodes = [
      { id: 'dc-1', code: 'LAVIZ50', title: 'هدیه خوش‌آمد', amount: 50000, percent: 10, maxAmount: 60000, remainingDays: 6, seenDate: '2026-11-08T10:00:00.000Z', description: 'فقط یک‌بار تا پایان ماه امکان استفاده از این کد تخفیف را دارید.' },
      { id: 'dc-2', code: 'QAEN20', title: 'تخفیف قائن', amount: 20000, percent: 5, maxAmount: 30000, remainingDays: 1, seenDate: '2026-11-09T10:00:00.000Z', description: 'این کد تخفیف فقط برای یک سفارش و تا پایان فردا قابل استفاده است.' },
      { id: 'dc-3', code: 'FRIDAY100', title: 'جمعه خانوادگی', amount: 100000, percent: 15, remainingDays: null, seenDate: null, description: 'هر هفته می‌توانید یک‌بار از این کد تخفیف استفاده کنید.' },
    ];
    const usedCodes = [{ id: 'dc-0', code: 'WELCOME', title: 'اولین سفارش', amount: 30000, expTime: null }];
    const findCode = (code) => sampleCodes.find((c) => c.code.toLowerCase() === String(code || '').trim().toLowerCase());

    // The status of the order that is on its way (the first sample order). In the
    // BROWSER PREVIEW it moves on with time since the page opened, so the app's
    // 3-minute polling of /profile/orders/current can be watched: preparing (12) for
    // 2 minutes, then "ready / with the courier" (13), then from 5 minutes on
    // delivered (20): the card goes and the order's review card takes its place. In
    // the Node dev server it stays 12, so a long-running server does not drift.
    const startedAt = Date.now();
    // Also in the BROWSER PREVIEW only: every other page load shows the order the
    // restaurant did NOT accept (status 11, with a reason), the loads in between show
    // the normal flow above. A counter in localStorage alternates them: reload to
    // see the other one. Tapping «متوجه شدم» on the orange card is remembered by the
    // app itself (utils/orderAck.js), so that card stays gone until the next run.
    const rejectedRun = (() => {
      if (typeof window === 'undefined') return false;
      try {
        // The mock code is evaluated twice per page load: count one load once.
        if (window.__lavizMockRun === undefined) {
          const key = 'laviz:mock-order-run';
          window.__lavizMockRun = Number(localStorage.getItem(key) || 0);
          localStorage.setItem(key, String(window.__lavizMockRun + 1));
        }
        return window.__lavizMockRun % 2 === 0;
      } catch (e) {
        return false;
      }
    })();
    const activeStatus = () => {
      if (typeof window === 'undefined') return 12;
      if (rejectedRun) return 11;
      const elapsed = Date.now() - startedAt;
      return elapsed >= 5 * 60 * 1000 ? 20 : elapsed >= 2 * 60 * 1000 ? 13 : 12;
    };

    // Made-up order history for the profile page. Dates are counted back from
    // today so the list always looks recent. Statuses: 12 being prepared,
    // 20 delivered (see statusLabel in orderHistory.vue).
    // Every line of an order carries `productId`, the menu's own id for the food, so
    // "order again" can find it on today's menu (see utils/reorder.js). The sample
    // lines are written by name; the id is looked up in the menu snapshot.
    function sampleOrders() {
      return rawSampleOrders().map((order) => ({
        ...order,
        items: (order.items || []).map((line) => {
          const product = snapshot.products.find((p) => String(p.name).trim() === String(line.productTitle).trim());
          // `thumbnail`: the menu's own photo path for the food (null when it has none).
          return {
            ...line,
            productId: product ? product.key : null,
            thumbnail: (product && (product.thumbnail || product.image)) || null,
          };
        }),
      }));
    }

    function rawSampleOrders() {
      const day = 864e5;
      const at = (daysAgo, hour, minute) => {
        const d = new Date(Date.now() - daysAgo * day);
        d.setHours(hour, minute, 0, 0);
        return d.toISOString();
      };
      // Lines use the same fields as the current-order endpoint: productTitle,
      // count, amount (unit price). Names and prices come from the menu snapshot.
      return [
        {
          // The one being prepared is a pickup order (deliveryType 'iWillCome'), so the
          // card's last stage reads «آماده دریافت». The other two were delivered by courier.
          id: 'a1f3c9d2-7b41-4e0a-9c55-1d2e3f4a5b61', orderNumber: '10482', status: activeStatus(), deliveryType: 'iWillCome',
          // The restaurant's own words; the app shows it only for status 11.
          rejectReason: 'به دلیل اتمام موجودی چلو کباب ویژه لاویز در امروز، رستوران نتوانست این سفارش را بپذیرد. برای پیگیری می‌توانید با پشتیبانی تماس بگیرید.', createDate: at(0, 12, 41), deliveryDate: at(0, 13, 30), deliveryTime: '13:30', totalAmount: 1240000,
          items: [
            { id: 'i-1', productTitle: 'چلو کباب ویژه لاویز', count: 1, amount: 600000 },
            { id: 'i-2', productTitle: 'چلو جوجه کباب', count: 1, amount: 460000 },
            { id: 'i-3', productTitle: 'نوشابه قوطی کوکاکولا', count: 2, amount: 90000 },
          ],
        },
        {
          id: 'b7d20e84-3c96-4a1f-8e07-6a5b4c3d2e10', orderNumber: '10431', status: 20, deliveryType: 'sendToMe', createDate: at(3, 19, 5), deliveryDate: at(3, 20, 0), deliveryTime: '20:00', totalAmount: 1150000,
          items: [
            { id: 'i-4', productTitle: 'چلو وزیری', count: 1, amount: 700000 },
            { id: 'i-5', productTitle: 'چلو مرغ سرخ شده', count: 1, amount: 450000 },
          ],
        },
        {
          // `rating` (0-5): the stars the customer already gave this order; the first
          // delivered order (10431) has none, so its stars show empty.
          id: 'c5e81a37-9d02-4b6c-a3f4-0e1d2c3b4a59', orderNumber: '10377', status: 20, deliveryType: 'sendToMe', rating: 4, createDate: at(9, 13, 18), deliveryDate: at(9, 14, 15), deliveryTime: '14:15', totalAmount: 475000,
          items: [
            // `review` on a line: what this customer wrote for that food, and the
            // restaurant's answer (see orderHistory.vue). The average of 5 and 3 is
            // the order's `rating` of 4.
            { id: 'i-6', productTitle: 'چلو جوجه کباب', count: 1, amount: 460000,
              review: { rating: 5, comment: 'عالی بود.', adminReply: 'خوشحالیم که چلو جوجه کباب را پسندیدید. منتظر دیدار دوبارهٔ شما در لاویز هستیم.' } },
            { id: 'i-7', productTitle: 'سس مایونز رعنا', count: 1, amount: 15000,
              review: { rating: 3, comment: 'مقدارش کم بود.', adminReply: 'ممنون از بازخوردتان. مقدار سس را در سفارش‌های بعدی بیشتر می‌کنیم.' } },
          ],
        },
      ];
    }

    // Made-up saved addresses, a few streets from the restaurant (mapCenter in
    // the snapshot). Same fields the profile page and the basket read.
    function sampleAddresses() {
      return [
        { id: 'ad-1', title: 'خانه', address: 'قائن، بلوار بسیج، کوچه ۱۲، منزل آقای نمونه', isDefault: true, plateNumber: '۲۴', unitNumber: '', lat: 33.7289, lng: 59.1856 },
        { id: 'ad-2', title: 'محل کار', address: 'قائن، خیابان امام خمینی، نبش کوچه ۸، طبقه دوم', isDefault: false, plateNumber: '۱۱۰', unitNumber: '۳', lat: 33.7351, lng: 59.1801 },
        { id: 'ad-3', title: 'منزل پدری', address: 'قائن، خیابان بصیرت، کوچه ۴، بن‌بست گل‌ها', isDefault: false, plateNumber: '۷', unitNumber: '', lat: 33.7312, lng: 59.1894 },
      ];
    }

    const user = { id: 'mock-user', first_name: 'کاربر', last_name: 'نمونه', mobile: '09120000000' };
    const json = (body, status = 200) => ({ status, body });
    const routes = {
      'GET /api/enduser/core/initialize': () => json(initialize()),
      'GET /api/enduser/core/manifest.webmanifest': () => json(manifest),
      'POST /api/auth/check-mobile': () => json({ is_new_user: false, verify_code: '12345' }),
      'POST /api/auth/login': () => json({ token: 'mock-token', user }),
      'POST /api/auth/register': () => json({ token: 'mock-token', user }),
      'GET /api/enduser/profile': () => json(Object.assign({}, user, { addresses: sampleAddresses() })),
      'PUT /api/enduser/profile': () => json(user),
      'GET /api/enduser/profile/addresses': () => json(sampleAddresses()),
      'GET /api/enduser/profile/orders': () => json(sampleOrders()),
      // The order still being prepared (the first sample), so the "active order"
      // card shows on the first page. Its lines are the same fields the real
      // endpoint sends (productTitle, count, amount).
      'GET /api/enduser/profile/orders/current': () => {
        const active = sampleOrders()[0];
        // Delivered: nothing is on its way any more.
        if ([4, 20].includes(active.status)) return json({ order: null, items: [] });
        return json({ order: active, items: active.items });
      },
      'GET /api/enduser/profile/password-status': () => json({ hasPassword: false }),
      'GET /api/enduser/profile/discount-codes': () => json({ available: sampleCodes, used: usedCodes }),
      'GET /api/enduser/profile/active-discount-codes': () => json(sampleCodes),
      // Messages from the restaurant. Two answers from management to reviews the
      // customer wrote (type 'review_reply', see the contract at the top of
      // pages/profile/components/notificationList.vue): one not yet seen, one
      // already read and acknowledged.
      'GET /api/enduser/profile/notifications': () => {
        const hoursAgo = (h) => new Date(Date.now() - h * 36e5).toISOString();
        const items = [
          {
            id: 'n-1', type: 'review_reply', title: 'پاسخ مدیریت به نظر شما',
            body: 'از لطف و وقتی که گذاشتید سپاسگزاریم. موضوع دیر رسیدن برنج را با آشپزخانه در میان گذاشتیم و در سفارش‌های بعدی دقت بیشتری خواهیم کرد. امیدواریم به‌زودی دوباره میزبان شما باشیم.',
            createDate: hoursAgo(3), seenDate: null, ackDate: null, linkUrl: null,
            data: { productTitle: 'چلو وزیری', rating: 4, comment: 'خوب بود، فقط برنج کمی دیر رسید.', orderNumber: '10431' },
          },
          {
            id: 'n-2', type: 'review_reply', title: 'پاسخ مدیریت به نظر شما',
            body: 'خوشحالیم که چلو جوجه کباب را پسندیدید. منتظر دیدار دوبارهٔ شما در لاویز هستیم.',
            createDate: hoursAgo(80), seenDate: hoursAgo(70), ackDate: hoursAgo(70), linkUrl: null,
            data: { productTitle: 'چلو جوجه کباب', rating: 5, comment: 'عالی بود.', orderNumber: '10377' },
          },
        ];
        return json({ items, unseenCount: items.filter((n) => !n.seenDate).length });
      },
      'PUT /api/enduser/profile/notifications/seen': () => json({ ok: true }),
      'POST /api/enduser/order/preview': (body) => {
        let total = 0;
        (body.products || []).forEach((i) => {
          const p = snapshot.products.find((x) => x.key === i.product_id);
          if (p) total += p.price * (1 - (p.discount_percent || 0) / 100) * i.count;
        });
        total = Math.round(total);
        const shipping = body.delivery_type === 'sendToMe' ? snapshot.shippingCost : 0;
        const found = findCode(body.discount_code);
        let discount = found ? Math.min(found.percent ? Math.round((total * found.percent) / 100) : found.amount, total) : 0;
        if (found && found.maxAmount) discount = Math.min(discount, found.maxAmount);
        const tax = snapshot.taxEnabled ? Math.round((total - discount) * snapshot.taxPercent / 100) : 0;
        return json({ total_amount: total, discount_amount: discount, shipping_cost: shipping, tax_amount: tax, payment_amount: total - discount + shipping + tax, is_first_order: false });
      },
      'POST /api/enduser/order/create': () => json({ statusCode: 501, message: 'ثبت سفارش در mock پشتیبانی نمی‌شود' }, 501),
    };

    function handle(method, pathname, body, query) {
      // GET /api/enduser/core/check-discount-code/{code}?basketAmount=...
      // Answers with the discount as a percentage of the basket, like the real API.
      const m = method === 'GET' && pathname.match(/^\/api\/enduser\/core\/check-discount-code\/(.+)$/);
      if (m) {
        const found = findCode(decodeURIComponent(m[1]));
        if (!found) return json({ statusCode: 400, message: 'کد تخفیف معتبر نیست یا منقضی شده است.' }, 400);
        const basket = Number((query && query.get && query.get('basketAmount')) || 0);
        const percent = found.percent || (basket > 0 ? Math.min(100, (found.amount / basket) * 100) : 0);
        return json({ value: Number(percent.toFixed(4)), amount: found.amount, maxAmount: found.maxAmount || null });
      }
      // GET/POST /api/enduser/profile/orders/{id}/review: the lines of an order
      // that can be rated, and saving the ratings. Only delivered orders are
      // rateable, like the real API; saving is accepted and not stored.
      const rv = pathname.match(/^\/api\/enduser\/profile\/orders\/([^/]+)\/review$/);
      if (rv && (method === 'GET' || method === 'POST')) {
        if (method === 'POST') return json({ ok: true });
        const order = sampleOrders().find((o) => o.id === decodeURIComponent(rv[1]));
        return json({
          rateable: !!order && [4, 20].includes(order.status),
          // Like the real API will: each line carries the product's `thumbnail`
          // path (null when the product has no photo). Looked up by name in the
          // menu snapshot here because the sample lines have no product id.
          items: ((order && order.items) || []).map((i) => {
            const product = snapshot.products.find((p) => String(p.name).trim() === String(i.productTitle).trim());
            return {
              productId: i.id, title: i.productTitle, reviewEnabled: true,
              rating: (i.review && i.review.rating) || 0,
              comment: (i.review && i.review.comment) || '',
              adminReply: (i.review && i.review.adminReply) || '',
              thumbnail: (product && (product.thumbnail || product.image)) || null,
            };
          }),
        });
      }
      // PUT /api/enduser/profile/notifications/{id}/ack: «تأیید دریافت». Accepted,
      // not stored (the sample list always starts as above).
      if (method === 'PUT' && /^\/api\/enduser\/profile\/notifications\/[^/]+\/ack$/.test(pathname)) {
        return json({ ok: true });
      }
      // PUT /api/enduser/profile/active-discount-codes/{id}/seen: the app has shown
      // this code's details sheet. Accepted, not stored.
      if (method === 'PUT' && /^\/api\/enduser\/profile\/active-discount-codes\/[^/]+\/seen$/.test(pathname)) {
        return json({ ok: true });
      }
      const h = routes[`${method} ${pathname}`];
      return h ? h(body || {}) : null; // null = not mocked
    }
    return { handle, image };
  };
});
