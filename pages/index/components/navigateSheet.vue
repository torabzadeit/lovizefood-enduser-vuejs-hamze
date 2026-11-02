<template>
  <b-modal :id="id" centered hide-footer title="مسیریابی به رستوران" dialog-class="nav-sheet">
    <p class="nav-sheet__address">{{ address }}</p>

    <ul class="nav-sheet__list">
      <!-- Android: a geo: link opens the system app chooser, which lists every
           installed map app (Neshan, Balad, Google Maps, ...). -->
      <li v-if="platform === 'android'">
        <a class="nav-sheet__item" :href="geoUrl" @click="$bvModal.hide(id)">
          <span>انتخاب از بین برنامه‌های مسیریاب</span>
          <small>نشان، بلد، گوگل مپ و ...</small>
        </a>
      </li>
      <li v-if="platform === 'ios'">
        <a class="nav-sheet__item" :href="appleUrl" @click="$bvModal.hide(id)">
          <span>Apple Maps</span>
        </a>
      </li>
      <li>
        <a class="nav-sheet__item" :href="googleUrl" target="_blank" rel="noopener" @click="$bvModal.hide(id)">
          <span>Google Maps</span>
        </a>
      </li>
      <li>
        <a class="nav-sheet__item" :href="wazeUrl" target="_blank" rel="noopener" @click="$bvModal.hide(id)">
          <span>Waze</span>
        </a>
      </li>
    </ul>

    <button type="button" class="nav-sheet__copy" @click="copyAddress">
      {{ copied ? 'آدرس کپی شد' : 'کپی آدرس' }}
    </button>
  </b-modal>
</template>

<script>
export default {
  name: 'NavigateSheet',
  props: {
    id: { type: String, default: 'modal-navigate' },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    name: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  data() {
    return { copied: false, platform: 'other' };
  },
  mounted() {
    // Detected on the client only: the app renders without SSR, but a stray
    // `navigator` access on the server would still break a future SSR build.
    const ua = (navigator.userAgent || '') + ' ' + (navigator.platform || '');
    if (/android/i.test(ua)) this.platform = 'android';
    else if (/iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) this.platform = 'ios';
  },
  computed: {
    coords() {
      return `${this.lat},${this.lng}`;
    },
    geoUrl() {
      return `geo:${this.coords}?q=${this.coords}(${encodeURIComponent(this.name)})`;
    },
    appleUrl() {
      return `https://maps.apple.com/?daddr=${this.coords}&dirflg=d&q=${encodeURIComponent(this.name)}`;
    },
    googleUrl() {
      return `https://www.google.com/maps/dir/?api=1&destination=${this.coords}&travelmode=driving`;
    },
    wazeUrl() {
      return `https://waze.com/ul?ll=${this.coords}&navigate=yes`;
    },
  },
  methods: {
    async copyAddress() {
      try {
        await navigator.clipboard.writeText(this.address);
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 2000);
      } catch (e) {
        // Clipboard can be refused (insecure context, in-app browsers); the
        // address is visible above for manual selection.
      }
    },
  },
};
</script>

<style scoped>
.nav-sheet__address {
  margin: 0 0 0.75rem;
  color: var(--laviz-muted);
  font-size: 0.9rem;
  line-height: 1.8;
}
.nav-sheet__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.nav-sheet__item {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 2px;
  min-height: 52px;
  padding: 0.6rem 1rem;
  border: 1px solid var(--laviz-border);
  border-radius: var(--laviz-radius-sm);
  color: var(--laviz-text);
  font-weight: 700;
  text-decoration: none;
}
.nav-sheet__item small {
  color: var(--laviz-muted);
  font-weight: 400;
}
.nav-sheet__item:hover,
.nav-sheet__item:focus-visible {
  border-color: var(--laviz-primary);
  color: var(--laviz-primary);
  text-decoration: none;
}
.nav-sheet__copy {
  margin-top: 0.75rem;
  width: 100%;
  min-height: 44px;
  border: 0;
  background: transparent;
  color: var(--laviz-primary);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
</style>
