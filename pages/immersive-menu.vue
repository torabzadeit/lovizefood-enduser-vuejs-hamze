<template>
  <main class="story" :class="{ 'story--settling': motionPhase === 'settling' }" dir="rtl" tabindex="-1" @keydown="onKey">
    <div v-show="!exploreOpen" class="story__view" :aria-hidden="exploreOpen ? 'true' : null" :inert="exploreOpen ? '' : null">
    <div class="story__photo" aria-hidden="true">
      <img v-if="photoSrc" :key="photoSrc" :src="photoSrc" alt="" :class="{ 'story__photo--paused': !visible || exploreOpen }" @error="clearPhoto" />
    </div>
    <div v-if="incomingProduct" class="story__incoming-photo" aria-hidden="true"><explore-photo ref="incomingPhoto" :src="incomingProduct.imageFull || incomingProduct.image || ''" /></div>
    <div class="story__shade" aria-hidden="true"></div>
    <div class="story__top">
      <img class="story__logo" src="@/assets/media/logo-laviz-dark.png" alt="لاویز" />
      <span v-if="selectedCategoryText" class="story__category-title" :title="selectedCategoryText" :aria-label="selectedCategoryText" aria-live="polite">{{ selectedCategoryText }}</span>
      <button v-if="!restaurantMode" class="story__circle story__back" type="button" aria-label="بازگشت به منوی اصلی" @click="back">
        <img :src="icons.back" alt="" />
      </button>
    </div>
    <nav v-if="categories.length" class="story__category-sidebar" aria-label="دسته‌های منو">
      <button ref="exploreTrigger" type="button" class="story__circle story__category story__explore-trigger" aria-label="نمایش همهٔ غذاها" @click="openExplore"><img :src="icons.grid" alt="" /></button>
      <div ref="categoryRail" class="story__categories">
      <button v-for="(category, categoryIndex) in categories" :key="category.id" type="button" class="story__circle story__category"
        :class="{ 'story__category--active': category.id === categoryId }" :aria-label="category.text"
        :aria-pressed="category.id === categoryId ? 'true' : 'false'" @click="selectCategory(category.id)">
        <img v-if="categoryIcon(category)" :src="categoryIcon(category)" alt="" />
        <span v-else class="story__category-index" aria-hidden="true">{{ number(categoryIndex + 1) }}</span>
      </button>
      </div>
    </nav>
    <div v-if="loading && !products.length" class="story__skeleton" role="status" aria-label="در حال بارگذاری منو">
      <div class="story__skeleton-tabs"><i v-for="n in 4" :key="n"></i></div>
      <div class="story__skeleton-panel"><i></i><i></i><i></i></div>
    </div>
    <div v-else-if="error && !products.length" class="story__state" role="alert">دریافت منو ممکن نشد <button type="button" @click="load(true)">تلاش دوباره</button></div>
    <div v-else-if="!products.length" class="story__state">محصولی برای نمایش وجود ندارد</div>
    <template v-else-if="product">
      <div class="story__swipe" @pointerdown="pointerDown" @pointermove="pointerMove" @pointerup="pointerUp" @pointercancel="cancelDrag" @lostpointercapture="cancelDrag" @click.capture="suppressDragClick">
        <button type="button" class="story__direction story__direction--previous" aria-label="محصول قبلی" :disabled="index === 0" @click="move(-1)"><img :src="icons.back" alt="" /></button>
        <button type="button" class="story__direction story__direction--next" aria-label="محصول بعدی" :disabled="index === products.length - 1" @click="move(1)"><img :src="icons.back" alt="" /></button>
      </div>
      <section ref="details" class="story__details" aria-live="polite">
        <h1>{{ product.name }}</h1>
        <p v-if="product.description">{{ product.description }}</p>
        <div class="story__details-bottom">
          <div class="story__quantity">
            <span v-if="product.isOutOfStock" class="story__unavailable">اتمام موجودی امروز</span>
            <button v-else-if="!count" type="button" class="story__add" @click="change(1)">افزودن</button>
            <template v-else>
              <button type="button" aria-label="افزودن" @click="change(1)">+</button>
              <span>{{ number(count) }}</span>
              <button type="button" aria-label="کم کردن" @click="change(-1)">−</button>
            </template>
          </div>
          <strong class="story__price">{{ number(displayPrice) }} تومان</strong>
        </div>
      </section>
      <section v-if="incomingProduct" class="story__details story__incoming-details" aria-hidden="true" inert>
        <h2>{{ incomingProduct.name }}</h2><p v-if="incomingProduct.description">{{ incomingProduct.description }}</p>
        <div class="story__details-bottom"><div class="story__quantity"><span class="story__preview-quantity">{{ incomingProduct.isOutOfStock ? 'اتمام موجودی امروز' : incomingProduct.count ? '−  ' + number(incomingProduct.count) + '  +' : 'افزودن' }}</span></div><strong class="story__price">{{ number(priceFor(incomingProduct)) }} تومان</strong></div>
      </section>
    </template>
    <button class="story__cart" type="button" :disabled="!selected.length" @click="checkout">
      <span class="story__cart-total"><small>جمع مبلغ</small><strong>{{ number(itemsTotal) }} تومان</strong></span>
      <span class="story__cart-label">سبد خرید ({{ number(selected.length) }}) <img :src="icons.back" alt="" /></span>
    </button>
    </div>
    <section v-if="exploreOpen" class="story-explore" role="dialog" aria-modal="true" aria-label="همهٔ غذاها">
      <div ref="exploreScroll" class="story-explore__scroll">
        <div class="story-explore__top"><button ref="exploreBack" class="story__circle story__back" type="button" aria-label="بازگشت به محصول" @click="closeExplore"><img :src="icons.back" alt="" /></button></div>
        <div class="story-explore__grid">
          <button v-for="item in products" :key="item.key" type="button" class="story-explore__tile" :aria-label="item.name + '، ' + number(priceFor(item)) + ' تومان'" @click="chooseExplore(item)">
            <explore-photo :src="dataByKey[item.key] ? dataByKey[item.key].image : ''" />
            <span class="story-explore__price">{{ number(priceFor(item)) }} تومان</span>
          </button>
        </div>
      </div>
    </section>
    <mock-restaurant-checkout v-if="restaurantMode && mockCheckoutOpen" @close="mockCheckoutOpen = false" />
  </main>
</template>

<script>
import kebab from '@/assets/immersive-icons/shish-kebab.svg';
import pizza from '@/assets/immersive-icons/pizza-slice.svg';
import plate from '@/assets/immersive-icons/plate-utensils.svg';
import drink from '@/assets/immersive-icons/cup-straw.svg';
import chef from '@/assets/immersive-icons/hat-chef.svg';
import backIcon from '@/assets/immersive-icons/arrow-left.svg';
import grid from '@/assets/immersive-icons/grid-2.svg';
import ExplorePhoto from '@/components/immersive-menu/ExplorePhoto.vue';
import MockRestaurantCheckout from '@/components/immersive-menu/MockRestaurantCheckout.vue';
import wholePizza from '@/assets/immersive-icons/pizza.svg';
import sandwich from '@/assets/immersive-icons/sandwich.svg';
import burger from '@/assets/immersive-icons/burger.svg';
import bowl from '@/assets/immersive-icons/bowl-food.svg';
import bottle from '@/assets/immersive-icons/bottle-water.svg';
import bread from '@/assets/immersive-icons/bread-slice.svg';
import pepper from '@/assets/immersive-icons/pepper-hot.svg';

const CATEGORY_ICON_SOURCES = Object.freeze({ 'shish-kebab': kebab, 'pizza-slice': pizza, 'plate-utensils': plate, 'cup-straw': drink, 'hat-chef': chef,
  pizza: wholePizza, sandwich, burger, 'bowl-food': bowl, 'bottle-water': bottle, 'bread-slice': bread, 'pepper-hot': pepper });

export default {
  components: { ExplorePhoto, MockRestaurantCheckout },
  props: { restaurantMode: { type: Boolean, default: false } },
  data() { return { mockCheckoutOpen: false, categoryId: null, productKey: null, photoSrc: '', objectUrl: '', photoRequest: 0, visible: true, exploreOpen: false, drag: null, suppressClick: false, incomingKey: null, motionPhase: 'idle', icons: { kebab, pizza, plate, drink, chef, grid, back: backIcon } }; },
  computed: {
    basketNamespace() { return this.restaurantMode ? 'restaurantMockBasket' : 'basket'; },
    basket() { return this.$store.state[this.basketNamespace]; },
    categories() { return this.$store.getters[this.basketNamespace + '/menuCategories']; },
    selectedCategoryText() { const category = this.categories.find(item => item.id === this.categoryId); return category ? category.text : ''; },
    products() { return this.$store.getters[this.basketNamespace + '/menuProducts']; },
    dataByKey() { return this.$store.getters[this.basketNamespace + '/productData'](this.$axios.defaults.baseURL); },
    product() { return this.dataByKey[this.productKey] || null; },
    incomingProduct() { return this.dataByKey[this.incomingKey] || null; },
    index() { return this.products.findIndex(item => item.key === this.productKey); },
    count() { return this.product ? Number(this.product.count) || 0 : 0; },
    displayPrice() { return this.product ? this.priceFor(this.product) : 0; },
    selected() { return this.$store.getters[this.basketNamespace + '/selectedProducts']; },
    itemsTotal() { return this.$store.getters[this.basketNamespace + '/itemsTotal']; },
    loading() { return this.basket.loading; },
    error() { return this.basket.error; },
    imageUrl() { return this.product ? (this.product.imageFull || this.product.image || '') : ''; },
  },
  watch: {
    imageUrl: { handler(value) { this.loadPhoto(value); }, immediate: true },
    products() { this.ensurePosition(); },
    categoryId() { this.$nextTick(this.revealCategory); },
    productKey() { this.$nextTick(this.observeCompactCard); },
    incomingKey() { this.$nextTick(this.observeCompactCard); },
  },
  mounted() {
    this.compactObserver = new ResizeObserver(() => this.fitCompactRail()); this.$nextTick(this.observeCompactCard);
    this.visible = !document.hidden; document.addEventListener('visibilitychange', this.onVisibility);
    this.load();
  },
  beforeRouteLeave(to, from, next) { this.remember(); next(); },
  beforeDestroy() { if (this.compactObserver) this.compactObserver.disconnect(); document.removeEventListener('visibilitychange', this.onVisibility); this.resetMotion(); this.photoRequest++; this.clearPhoto(); },
  methods: {
    observeCompactCard() { if (!this.compactObserver) return; this.compactObserver.disconnect(); this.$el.querySelectorAll('.story__details').forEach(el => this.compactObserver.observe(el)); this.fitCompactRail(); },
    fitCompactRail() {
      const rail = this.$el.querySelector('.story__category-sidebar'); const cards = [...this.$el.querySelectorAll('.story__details')];
      if (!rail || !cards.length) return;
      const button = rail.querySelector('button').getBoundingClientRect();
      const overlaps = cards.map(el => el.getBoundingClientRect()).filter(r => r.right > button.left && r.left < button.right);
      if (!overlaps.length) { rail.style.maxHeight = ''; return; }
      const top = rail.getBoundingClientRect().top; const cardTop = Math.min(...overlaps.map(r => r.top));
      const available = cardTop - top - 12;
      const rows = Math.max(1, Math.min(this.categories.length, Math.floor((available - 70) / 47)));
      // 48px grid + full connected rows + bottom padding and border reserve.
      const height = 70 + rows * 47 + 'px';
      if (rail.style.maxHeight !== height) { rail.style.maxHeight = height; this.$nextTick(this.revealCategory); }
    },
    async load(force = false) {
      try { await this.$store.dispatch(this.basketNamespace + '/bootstrap', { force }); this.ensurePosition(); } catch (_) { /* Store exposes retry state. */ }
    },
    ensurePosition() {
      if (!this.products.length) { this.productKey = null; this.categoryId = null; return; }
      const saved = this.basket.storyPosition;
      const item = this.products.find(p => p.key === this.productKey) || this.products.find(p => p.key === saved.productKey) || this.products[0];
      this.setProduct(item);
    },
    setProduct(item) {
      if (!item) return;
      this.resetMotion();
      this.productKey = item.key;
      const category = this.categories.find(cat => this.$store.getters[this.basketNamespace + '/categoryProducts'](cat.id).some(p => p.key === item.key));
      this.categoryId = category ? category.id : null;
    },
    selectCategory(id) { this.setProduct(this.$store.getters[this.basketNamespace + '/categoryProducts'](id)[0]); },
    revealCategory() {
      const rail = this.$refs.categoryRail;
      const active = rail && rail.querySelector('[aria-pressed="true"]');
      if (!active) return;
      const bounds = rail.getBoundingClientRect(); const item = active.getBoundingClientRect();
      const delta = item.top < bounds.top ? item.top - bounds.top : item.bottom > bounds.bottom - 16 ? item.bottom - bounds.bottom + 16 : 0;
      if (delta) rail.scrollBy({ top: delta, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    },
    move(delta) {
      if (this.exploreOpen || this.motionPhase === 'settling') return;
      const next = this.products[this.index + delta];
      if (!next) return;
      this.incomingKey = next.key; this.$el.style.setProperty('--story-incoming-side', delta > 0 ? '1' : '-1');
      this.$nextTick(() => { this.$el.getBoundingClientRect(); this.settle(delta); });
    },
    motionX(x) { this.$el.style.setProperty('--story-drag-x', x + 'px'); },
    resetMotion() {
      clearTimeout(this.motionTimer); this.motionPhase = 'idle'; this.incomingKey = null; this.drag = null;
      if (this.$el) this.motionX(0);
    },
    settle(delta) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const target = delta ? this.products[this.index + delta] : null;
      this.motionPhase = 'settling';
      const finish = () => {
        const preview = this.$refs.incomingPhoto && this.$refs.incomingPhoto.verifiedSrc;
        if (target) { this.setProduct(target); if (preview) this.$nextTick(() => { if (!this.photoSrc) this.photoSrc = preview; }); }
        else this.resetMotion();
        this.$nextTick(() => { if (document.activeElement === document.body) this.$el.focus({ preventScroll: true }); });
      };
      if (reduced) finish(); else this.$nextTick(() => {
        this.$el.getBoundingClientRect(); this.motionX(target ? (delta > 0 ? 1 : -1) * this.$el.clientWidth : 0);
        this.motionTimer = setTimeout(finish, 180);
      });
    },
    pointerDown(event) {
      if (!event.isPrimary || event.button !== 0) return;
      this.suppressClick = false;
      if (event.target.closest('button') || this.motionPhase === 'settling') return;
      this.drag = { id: event.pointerId, x: event.clientX, y: event.clientY };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    pointerMove(event) {
      if (!this.drag || this.drag.id !== event.pointerId) return;
      const dx = event.clientX - this.drag.x; const dy = event.clientY - this.drag.y;
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) { this.cancelDrag(); return; }
      if (Math.abs(dx) <= 3) return;
      event.preventDefault();
      const delta = dx > 0 ? 1 : -1; const next = this.products[this.index + delta];
      this.incomingKey = next ? next.key : null;
      this.$el.style.setProperty('--story-incoming-side', String(delta));
      this.motionX(next ? dx : Math.max(-70, Math.min(70, dx * .18)));
    },
    pointerUp(event) {
      if (!this.drag || this.drag.id !== event.pointerId) return;
      const dx = event.clientX - this.drag.x; const dy = event.clientY - this.drag.y; this.drag = null;
      const commit = Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.2;
      this.suppressClick = Math.abs(dx) > 8;
      this.settle(commit ? (dx > 0 ? 1 : -1) : 0);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    },
    cancelDrag() { if (this.drag) { this.drag = null; this.settle(0); } },
    suppressDragClick(event) { if (this.suppressClick && event.detail !== 0) { event.preventDefault(); event.stopPropagation(); } this.suppressClick = false; },
    onKey(event) {
      if (this.exploreOpen) {
        if (event.key === 'Escape') { event.preventDefault(); this.closeExplore(); }
        if (event.key === 'Tab') {
          const buttons = this.$el.querySelectorAll('.story-explore button'); const first = buttons[0]; const last = buttons[buttons.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }
        return;
      }
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); this.move(event.key === 'ArrowLeft' ? 1 : -1); }
    },
    openExplore() { this.resetMotion(); this.exploreOpen = true; this.$nextTick(() => this.$refs.exploreBack.focus()); },
    closeExplore() { this.exploreOpen = false; this.$nextTick(() => { this.revealCategory(); this.$refs.exploreTrigger.focus({ preventScroll: true }); }); },
    chooseExplore(item) { this.setProduct(item); this.closeExplore(); },
    priceFor(item) { return item.price * (1 - (Number(item.discount_percent) || 0) / 100); },
    change(direction) { if (this.product) this.$store.commit(this.basketNamespace + (direction > 0 ? '/increment' : '/decrement'), { key: this.product.key }); },
    number(value) { return Number(value || 0).toLocaleString('fa-IR'); },
    categoryIcon(category) {
      // BACKEND: §17 iconKey is proposed optional server/admin data. Missing,
      // invalid or duplicate keys show an honest local ordinal, never a guessed food icon.
      const key = category.iconKey;
      if (!Object.prototype.hasOwnProperty.call(CATEGORY_ICON_SOURCES, key)) return '';
      return this.categories.find(item => item.iconKey === key).id === category.id ? CATEGORY_ICON_SOURCES[key] : '';
    },
    remember() { this.$store.commit(this.basketNamespace + '/rememberStoryPosition', { categoryId: this.categoryId, productKey: this.productKey }); },
    back() { if (this.restaurantMode) return; this.remember(); this.$router.push('/'); },
    async checkout() {
      if (this.restaurantMode) { this.mockCheckoutOpen = true; return; }
      await this.$store.dispatch('basket/requestCheckout', { categoryId: this.categoryId, productKey: this.productKey }); this.$router.push('/');
    },
    onVisibility() { this.visible = !document.hidden; },
    clearPhoto() { if (this.objectUrl) URL.revokeObjectURL(this.objectUrl); this.objectUrl = ''; this.photoSrc = ''; },
    async loadPhoto(url) {
      const request = ++this.photoRequest; this.clearPhoto();
      if (!url || typeof window === 'undefined') return;
      try {
        const response = await fetch(url, { credentials: 'omit' });
        if (!response.ok || !/^image\/(jpeg|png|webp|avif|gif)$/i.test((response.headers.get('content-type') || '').split(';')[0].trim())) return;
        const blob = await response.blob();
        if (request !== this.photoRequest) return;
        this.objectUrl = URL.createObjectURL(blob); this.photoSrc = this.objectUrl;
      } catch (error) {
        // An image host can allow <img> while denying CORS reads. Only obvious
        // raster URLs use that fallback; successfully fetched SVGs stay blank.
        if (error instanceof TypeError && request === this.photoRequest && /\.(?:jpe?g|png|webp|avif)(?:[?#]|$)/i.test(url)) this.photoSrc = url;
      }
    },
  },
};
</script>

<style scoped>
.story { position: fixed; inset: 0; z-index: 1000; height: 100vh; height: 100dvh; overflow: hidden; background: #252525; color: #fff; font-family: var(--lz-font); }
.story__view { position: absolute; inset: 0; }
.story__photo, .story__shade { position: absolute; inset: 0; overflow: hidden; pointer-events: none; }
.story__photo, .story__details { transform: translate3d(var(--story-drag-x, 0px), 0, 0); }
.story__incoming-photo { position: absolute; inset: 0; overflow: hidden; background: #252525; pointer-events: none; }
.story__incoming-photo, .story__incoming-details { transform: translate3d(calc(var(--story-drag-x, 0px) - var(--story-incoming-side, 1) * 100vw), 0, 0); }
.story--settling .story__photo, .story--settling .story__details, .story--settling .story__incoming-photo { transition: transform 180ms cubic-bezier(.2,.7,.2,1); }
.story__photo img { width: 100%; height: 100%; object-fit: cover; animation: story-zoom 18s ease-out forwards; }
.story__photo img.story__photo--paused { animation-play-state: paused; }
.story__shade { background: linear-gradient(to bottom, rgba(0,0,0,.32), transparent 28%, transparent 48%, rgba(0,0,0,.62)); }
.story__top { position: absolute; z-index: 3; top: max(16px, env(safe-area-inset-top)); right: 20px; left: 20px; display: flex; direction: ltr; justify-content: space-between; align-items: center; }
.story__logo { width: 92px; max-height: 48px; object-fit: contain; filter: drop-shadow(0 2px 5px #000) drop-shadow(0 0 13px rgba(0,0,0,.9)); }
.story__category-title { position: absolute; left: 50%; transform: translateX(-50%); max-width: calc(100% - 216px); padding: 6px 12px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; direction: rtl; font-size: 12px; line-height: 1.5; color: #fff; border: 1px solid rgba(255,255,255,.25); border-radius: 999px; background: rgba(20,20,20,.48); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); }
.story__circle { display: grid; place-items: center; flex: 0 0 auto; border: 1px solid rgba(255,255,255,.4); color: #fff; background: rgba(30,22,19,.55); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); border-radius: 50%; }
.story__circle img { width: 25px; height: 25px; filter: brightness(0) invert(1); }
.story__back { width: 46px; height: 46px; }
.story__back img { width: 19px; height: 19px; }
.story__top .story__back img { transform: rotate(180deg); }
.story__category-sidebar { position: absolute; z-index: 2; top: calc(max(16px, env(safe-area-inset-top)) + 66px); right: 0; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 67px); width: 96px; display: flex; flex-direction: column; align-items: center; }
.story__categories { flex: 1; min-height: 0; width: 96px; display: flex; flex-direction: column; align-items: center; padding: 0 24px 20px; overflow-y: auto; overflow-x: hidden; overscroll-behavior: contain; scrollbar-width: none; }
.story__categories::-webkit-scrollbar { display: none; }
.story__categories { border-radius: 0 0 12px 12px; }
.story__categories .story__category:last-child { border-radius: 0 0 10px 10px; }
.story__category { width: 48px; height: 48px; border-radius: 0; margin-top: -1px; transition: transform 160ms cubic-bezier(.2,.7,.2,1), opacity 160ms ease-out; }
.story__category:active { transform: scale(.96); opacity: .9; }
.story__explore-trigger { flex: 0 0 48px; margin: 0; border-radius: 10px 10px 0 0; }
.story__category--active { position: relative; z-index: 1; color: #8a1318; background: #fff0cf; border-color: rgba(255,218,137,.72); box-shadow: inset 0 0 12px rgba(246,185,55,.22), 0 0 18px 2px rgba(246,185,55,.35); }
.story__category-index { font-size: 17px; font-weight: 600; }
.story__category--active img { filter: invert(12%) sepia(88%) saturate(3258%) hue-rotate(346deg) brightness(79%); }
.story__swipe { position: absolute; inset: 140px 112px 220px 16px; display: flex; align-items: center; justify-content: space-between; touch-action: pan-y; cursor: grab; user-select: none; }
.story__swipe:active { cursor: grabbing; }
.story__direction { width: 44px; height: 48px; color: #fff; font-size: 30px; border: 0; background: rgba(0,0,0,.08); border-radius: 24px; }
.story__direction:disabled { opacity: .25; }
.story__direction img { width: 18px; height: 18px; opacity: .5; filter: brightness(0) invert(1); }
.story__direction:focus-visible { background: rgba(0,0,0,.45); }
.story__direction:focus-visible img { opacity: 1; }
.story__direction--previous img { transform: rotate(180deg); }
.story__details { position: absolute; right: 16px; left: 16px; max-width: 400px; margin-inline: auto; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 67px); padding: 11px 13px; border: 1px solid rgba(255,255,255,.32); border-radius: 20px; background: rgba(20,20,20,.46); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); text-shadow: 0 1px 3px rgba(0,0,0,.6); }
.story__details h1, .story__details h2 { margin: 0; font-size: clamp(18px, 3vw, 20px); line-height: 1.4; font-weight: 700; }
.story__details h1, .story__details h2 { display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; overflow: hidden; overflow-wrap: anywhere; }
.story__incoming-details { pointer-events: none; }
.story__preview-quantity { padding: 10px 14px; font-size: 14px; }
.story__details p { margin: 4px 0 0; color: rgba(255,255,255,.9); font-size: 12px; line-height: 1.45; max-height: 2.9em; overflow: auto; }
.story__details-bottom { display: flex; flex-wrap: wrap; direction: ltr; justify-content: space-between; align-items: center; gap: 6px; margin-top: 7px; padding-top: 7px; border-top: 1px solid rgba(255,255,255,.25); }
.story__details-bottom .story__price { direction: rtl; }
.story__price { color: #ffc453; font-size: clamp(15px, 2.6vw, 17px); white-space: nowrap; }
.story__quantity { min-height: 44px; display: flex; direction: ltr; align-items: center; border: 1px solid rgba(255,255,255,.45); border-radius: 999px; }
.story__quantity button { min-width: 44px; height: 44px; border: 0; background: transparent; color: white; font-size: 24px; }
.story__quantity span { min-width: 26px; text-align: center; }
.story__quantity .story__add { padding: 0 10px; font-size: 15px; background: #8a1318; color: #fff; border-radius: inherit; }
.story__quantity .story__unavailable { padding: 0 12px; font-size: 12px; }
.story__cart { position: absolute; right: 12px; left: 12px; bottom: max(12px, env(safe-area-inset-bottom)); width: calc(100% - 24px); min-height: 55px; display: flex; align-items: center; color: white; background: linear-gradient(#ac101b, #7d0810); border: 1px solid #d44c4c; border-radius: 999px; }
.story__cart-total, .story__cart-label { width: 50%; display: flex; align-items: center; justify-content: center; }
.story__cart-total { flex-direction: column; border-left: 1px solid rgba(255,255,255,.5); line-height: 1.4; }
.story__cart-total small { font-size: 11px; }
.story__cart-total strong { font-size: 15px; }
.story__cart-label { gap: 12px; font-size: 18px; font-weight: 700; }
.story__cart-label img { width: 19px; height: 19px; filter: brightness(0) invert(1); transform: none; }
.story__cart:disabled { opacity: .7; cursor: default; }
.story__skeleton-tabs { position: absolute; top: calc(max(16px, env(safe-area-inset-top)) + 71px); right: 20px; display: flex; gap: 12px; }
.story__skeleton-tabs i, .story__skeleton-panel i { display: block; background: rgba(255,255,255,.13); }
.story__skeleton-tabs i { width: 54px; height: 54px; border-radius: 50%; }
.story__skeleton-panel { position: absolute; right: 16px; left: 16px; bottom: calc(max(12px, env(safe-area-inset-bottom)) + 67px); height: 150px; padding: 20px; border: 1px solid rgba(255,255,255,.2); border-radius: 24px; background: rgba(30,30,30,.7); }
.story__skeleton-panel i { height: 15px; width: 70%; margin-bottom: 14px; border-radius: 8px; }
.story__skeleton-panel i:nth-child(2) { width: 90%; }
.story__skeleton-panel i:nth-child(3) { width: 40%; }
.story__state { position: absolute; top: 46%; right: 20px; left: 20px; text-align: center; }
.story__state button { min-height: 44px; padding: 0 15px; border: 1px solid white; border-radius: 22px; background: #6b0e13; color: white; }
.story button:focus-visible { outline: 3px solid #ffca5e; outline-offset: 3px; }
@keyframes story-zoom { from { transform: scale(1); } to { transform: scale(1.04); } }
@media (prefers-reduced-motion: reduce) { .story__photo img { animation: none; } .story--settling .story__photo, .story--settling .story__details, .story--settling .story__incoming-photo, .story__category { transition: none; } .story__category:active { transform: none; } }
.story-explore { position: absolute; inset: 0; z-index: 5; background: var(--lz-canvas); color: var(--lz-ink); }
.story-explore__scroll { height: 100%; overflow-y: auto; overscroll-behavior: contain; padding-bottom: env(safe-area-inset-bottom); }
.story-explore__top { position: sticky; top: 0; z-index: 2; padding: max(12px, env(safe-area-inset-top)) 16px 12px; display: flex; justify-content: flex-end; background: var(--lz-canvas); }
.story-explore__grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 3px; }
.story-explore__tile { position: relative; display: block; aspect-ratio: 1; min-width: 0; overflow: hidden; padding: 0; border: 0; background: var(--lz-surface-soft); color: #fff; }
.story-explore__price { position: absolute; bottom: 0; right: 0; left: 0; padding: 18px 4px 7px; background: linear-gradient(transparent, rgba(0,0,0,.8)); font-size: clamp(11px, 2.8vw, 16px); text-align: center; white-space: nowrap; }
@media (max-height: 600px) { .story__category-sidebar { top: calc(max(8px, env(safe-area-inset-top)) + 56px); } .story__top { top: max(8px, env(safe-area-inset-top)); } .story__details { padding: 8px 14px; } .story__details p { max-height: 3.1em; } .story__details-bottom { margin-top: 5px; padding-top: 5px; } }
</style>

<style>
html[data-theme='dark'] .story .story__details { background: rgba(14,14,14,.5); }
html[data-theme='dark'] .story .story__circle:not(.story__category--active) { background: rgba(28,28,28,.65); }
</style>
