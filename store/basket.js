import adapter from '../utils/basket.cjs';

const CHEF = '__chef_daily__';
const CATEGORY_ICONS = new Set(['shish-kebab', 'pizza-slice', 'plate-utensils', 'cup-straw', 'hat-chef', 'pizza', 'sandwich', 'burger', 'bowl-food', 'bottle-water', 'bread-slice', 'pepper-hot']);
const text = value => value == null ? '' : String(value);
const imageUrl = (base, path) => !path ? '' : /^https?:\/\//i.test(path) ? path
  : `${text(base).replace(/\/$/, '')}/${text(path).replace(/^\//, '')}`;

export const namespaced = true;
export const state = () => ({
  basket: adapter.createBasket(), categories: [], initialized: false,
  loading: false, error: false, requestId: 0,
  pricing: { taxEnabled: false, taxPercent: 0 },
  checkoutIntent: false, storyPosition: { categoryId: null, productKey: null },
});

export const getters = {
  products: state => state.basket.products,
  counts: state => state.basket.counts,
  issues: state => state.basket.issues,
  selectedProducts: state => adapter.selectedProducts(state.basket),
  orderProducts: state => adapter.orderProducts(state.basket),
  itemsTotal: state => adapter.calculateBill(state.basket).total_amount,
  // Public estimate only. Root passes shipping/personal discount transiently to
  // billFor; the existing server preview remains authoritative at checkout.
  estimatedBill: state => adapter.calculateBill(state.basket, state.pricing),
  billFor: state => options => adapter.calculateBill(state.basket, options),
  productData: state => baseURL => Object.fromEntries(state.basket.products.map(product => [product.key, {
    ...product, count: state.basket.counts[product.key],
    image: imageUrl(baseURL, product.thumbnail || product.image),
    imageFull: imageUrl(baseURL, product.image) || null,
  }])),
  categoryProducts: state => (id, search = '') => {
    const query = search.trim();
    return state.basket.products.filter(product =>
      (id === CHEF ? product.menu_type === 'specialDay'
        : product.menu_type !== 'specialDay' && text(product.categoryId) === text(id))
      && (!query || text(product.name).includes(query) || text(product.description).includes(query)));
  },
  menuCategories: (state, getters) => {
    const categories = state.categories.filter(category => getters.categoryProducts(category.id).length);
    const chef = getters.categoryProducts(CHEF);
    return chef.length ? [{ id: CHEF, text: 'غذای روز', iconKey: 'hat-chef', count: chef.length }, ...categories] : categories;
  },
  menuProducts: (state, getters) => getters.menuCategories.flatMap(category => getters.categoryProducts(category.id)),
};

export const mutations = {
  begin(state) { state.requestId++; state.loading = true; state.error = false; },
  loaded(state, data) {
    // Reconcile against counts at RESPONSE time, not the request's old state.
    state.basket = adapter.reconcileCatalog(state.basket, data.products);
    // BACKEND: §17, proposed categories[].iconKey is a bundled-asset enum, not
    // SVG/HTML, CSS or a URL. Current API/admin omit it; null uses a local index.
    state.categories = data.categories.map(category => ({ id: text(category.id), text: text(category.text),
      iconKey: typeof category.iconKey === 'string' && CATEGORY_ICONS.has(category.iconKey) ? category.iconKey : null }));
    state.pricing = { taxEnabled: !!data.taxEnabled, taxPercent: Number(data.taxPercent) || 0 };
    state.initialized = true; state.loading = false; state.error = false;
  },
  failed(state) { state.loading = false; state.error = true; },
  increment(state, payload) { state.basket = adapter.increment(state.basket, payload.key, payload); },
  decrement(state, payload) { state.basket = adapter.decrement(state.basket, payload.key, payload); },
  setCount(state, payload) { state.basket = adapter.setCount(state.basket, payload.key, payload.count, payload); },
  reorder(state, lines) { state.basket = adapter.replaceFromReorder(state.basket, lines); },
  checkoutIntent(state, value) { state.checkoutIntent = value; },
  rememberStoryPosition(state, position = {}) {
    state.storyPosition = {
      categoryId: position.categoryId === CHEF || state.categories.some(cat => cat.id === text(position.categoryId))
        ? text(position.categoryId) : null,
      productKey: state.basket.products.some(product => product.key === text(position.productKey))
        ? text(position.productKey) : null,
    };
  },
};

export const actions = {
  // Direct story entry and root use this same loader. Raw private fields are
  // returned to root only and never copied into public state.
  async bootstrap({ state, commit }, { force = false } = {}) {
    if (state.initialized && !force) return { applied: true, cached: true, data: null };
    commit('begin');
    const request = state.requestId;
    try {
      const response = await this.$axios.get('/api/enduser/core/initialize');
      if (request !== state.requestId) return { applied: false, data: null };
      const data = response.data;
      if (!data || !Array.isArray(data.products) || !Array.isArray(data.categories)) throw new Error('Invalid catalog');
      commit('loaded', data);
      return { applied: true, cached: false, data };
    } catch (error) {
      if (request === state.requestId) commit('failed');
      throw error;
    }
  },
  requestCheckout({ commit }, position) {
    if (position) commit('rememberStoryPosition', position);
    commit('checkoutIntent', true);
  },
  consumeCheckoutIntent({ state, commit }) {
    const pending = state.checkoutIntent;
    commit('checkoutIntent', false);
    return pending;
  },
};
