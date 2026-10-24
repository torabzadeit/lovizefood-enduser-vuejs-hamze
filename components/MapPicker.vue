<template>
  <div class="map-picker">
    <div class="map-picker__search" v-if="mapirEnabled && !readonly">
      <input
        v-model="searchQuery"
        type="text"
        class="form-control form-control-sm"
        placeholder="جستجوی آدرس (map.ir)..."
        @input="onSearchInput"
        @keydown.enter.prevent="searchNow"
      />
      <ul v-if="searchResults.length" class="map-picker__suggestions">
        <li
          v-for="(item, idx) in searchResults"
          :key="idx"
          @click="pickSearchResult(item)"
        >
          {{ formatLabel(item) }}
        </li>
      </ul>
    </div>

    <div v-if="loadError" class="map-picker__error alert alert-warning py-2 px-3 mb-2">
      نقشه بارگذاری نشد. اتصال اینترنت را بررسی کنید.
    </div>

    <div class="map-picker__hint small text-muted mb-2">
      <template v-if="readonly">
        📍 محل تحویل حضوری — {{ restaurantAddress || 'موقعیت رستوران روی نقشه' }}
      </template>
      <template v-else>
        🏪 پین نارنجی = {{ restaurantName }} — 📍 برای آدرس تحویل روی نقشه کلیک کنید یا جستجو کنید.
      </template>
    </div>

    <div ref="mapEl" class="map-picker__map">
      <div v-if="!mapReady && !loadError" class="map-picker__loading">
        <div class="spinner-border spinner-border-sm text-secondary" role="status"></div>
        <span class="mr-2">در حال بارگذاری نقشه...</span>
      </div>
    </div>

    <div class="map-picker__actions mt-2">
      <button v-if="!readonly" type="button" class="btn btn-outline-primary btn-sm" @click="useMyLocation">
        موقعیت من
      </button>
      <button type="button" class="btn btn-outline-secondary btn-sm" @click="focusRestaurant">
        نمایش رستوران
      </button>
      <small v-if="resolvedAddress" class="map-picker__address text-muted mr-2">
        {{ resolvedAddress }}
      </small>
      <small v-else-if="localLat != null" class="text-muted mr-2">
        {{ localLat.toFixed(5) }}, {{ localLng.toFixed(5) }}
      </small>
    </div>
  </div>
</template>

<script>
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  createMapirTileLayer,
  DEFAULT_MAP_CENTER,
  formatSearchLabel,
  getMapirApiKey,
  mapirReverse,
  mapirSearch,
} from '~/utils/mapir';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

export default {
  name: 'MapPicker',
  props: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
    centerLat: { type: Number, default: DEFAULT_MAP_CENTER.lat },
    centerLng: { type: Number, default: DEFAULT_MAP_CENTER.lng },
    zoom: { type: Number, default: 15 },
    restaurantName: { type: String, default: 'رستوران لاویز' },
    restaurantAddress: { type: String, default: DEFAULT_MAP_CENTER.address },
    readonly: { type: Boolean, default: false },
  },
  data() {
    return {
      map: null,
      marker: null,
      restaurantMarker: null,
      localLat: null,
      localLng: null,
      searchQuery: '',
      searchResults: [],
      resolvedAddress: '',
      searchTimer: null,
      mapirEnabled: false,
      mapReady: false,
      loadError: false,
      initAttempts: 0,
    };
  },
  watch: {
    lat(v) {
      if (v != null && this.map) this.setMarker(v, this.lng, false);
    },
    lng(v) {
      if (v != null && this.map) this.setMarker(this.lat, v, false);
    },
    centerLat(v) {
      this.syncRestaurantMarker();
    },
    centerLng(v) {
      this.syncRestaurantMarker();
    },
    restaurantAddress() {
      this.bindRestaurantPopup();
    },
    restaurantName() {
      this.bindRestaurantPopup();
    },
  },
  mounted() {
    if (process.server) return;
    this.mapirEnabled = !!getMapirApiKey();
    this.localLat = this.lat;
    this.localLng = this.lng;
    this.$nextTick(() => this.ensureMap());
  },
  beforeDestroy() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  },
  methods: {
    formatLabel: formatSearchLabel,
    restaurantPinHtml() {
      return (
        '<div style="display:flex;flex-direction:column;align-items:center;transform:translateY(-4px);">' +
        '<div style="background:#c17f24;color:#fff;font-size:18px;line-height:1;width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 8px rgba(0,0,0,0.35);border:2px solid #fff;">' +
        '<span style="transform:rotate(45deg);">🏪</span></div>' +
        '<div style="margin-top:4px;background:#fff;border:1px solid #c17f24;color:#9a6318;font:700 11px Tahoma;padding:2px 6px;border-radius:6px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,0.15);">رستوران</div>' +
        '</div>'
      );
    },
    bindRestaurantPopup() {
      if (!this.restaurantMarker) return;
      const addr = this.restaurantAddress || DEFAULT_MAP_CENTER.address;
      this.restaurantMarker.bindPopup(
        `<strong>${this.restaurantName}</strong><br>${addr}`,
      );
    },
    syncRestaurantMarker() {
      if (!this.map) return;
      const lat = Number(this.centerLat);
      const lng = Number(this.centerLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      if (!this.restaurantMarker) {
        const restaurantIcon = L.divIcon({
          className: 'map-picker__restaurant-icon',
          html: this.restaurantPinHtml(),
          iconSize: [80, 58],
          iconAnchor: [40, 52],
          popupAnchor: [0, -48],
        });
        this.restaurantMarker = L.marker([lat, lng], {
          draggable: false,
          interactive: true,
          icon: restaurantIcon,
          title: this.restaurantName,
          zIndexOffset: 1000,
        }).addTo(this.map);
        this.bindRestaurantPopup();
      } else {
        this.restaurantMarker.setLatLng([lat, lng]);
        this.bindRestaurantPopup();
      }
    },
    focusRestaurant() {
      if (!this.map) {
        this.ensureMap(true);
        return;
      }
      const lat = Number(this.centerLat);
      const lng = Number(this.centerLng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      this.map.setView([lat, lng], Math.max(this.zoom, 16));
      if (this.restaurantMarker) {
        this.restaurantMarker.openPopup();
      }
    },
    refreshMap() {
      this.ensureMap(true);
      if (this.map) {
        this.syncRestaurantMarker();
        setTimeout(() => {
          if (this.map) {
            this.map.invalidateSize();
            this.focusRestaurant();
          }
        }, 200);
      }
    },
    ensureMap(forceResize) {
      if (process.server) return;
      if (this.map) {
        if (forceResize) {
          setTimeout(() => this.map.invalidateSize(), 150);
        }
        return;
      }
      if (!this.$refs.mapEl) return;

      const el = this.$refs.mapEl;
      if (el.offsetWidth < 10 || el.offsetHeight < 10) {
        this.initAttempts += 1;
        if (this.initAttempts > 40) {
          this.loadError = true;
          return;
        }
        setTimeout(() => this.ensureMap(forceResize), 150);
        return;
      }

      try {
        this.initMap();
      } catch (e) {
        this.loadError = true;
      }
    },
    initMap() {
      if (this.map || !this.$refs.mapEl) return;

      const viewLat = this.localLat != null ? this.localLat : this.centerLat;
      const viewLng = this.localLng != null ? this.localLng : this.centerLng;

      this.map = L.map(this.$refs.mapEl, {
        preferCanvas: true,
        zoomControl: true,
      }).setView([viewLat, viewLng], this.zoom);

      createMapirTileLayer(L, getMapirApiKey()).addTo(this.map);

      this.syncRestaurantMarker();

      if (!this.readonly && this.localLat != null && this.localLng != null) {
        this.setMarker(this.localLat, this.localLng, false);
      }

      if (!this.readonly) {
        this.map.on('click', (e) => {
          this.setMarker(e.latlng.lat, e.latlng.lng, true);
          this.emitPosition(e.latlng.lat, e.latlng.lng);
          this.$bvToast.toast('موقعیت شما روی نقشه ثبت شد.', {
            variant: 'success',
            autoHideDelay: 1800,
          });
        });
      }

      this.mapReady = true;
      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          this.focusRestaurant();
        }
      }, 250);
    },
    async setMarker(lat, lng, reverseLookup) {
      if (!this.map || this.readonly) return;
      if (this.marker) {
        this.marker.setLatLng([lat, lng]);
      } else {
        this.marker = L.marker([lat, lng], { draggable: true }).addTo(this.map);
        this.marker.on('dragend', () => {
          const p = this.marker.getLatLng();
          this.emitPosition(p.lat, p.lng);
        });
      }
      this.localLat = lat;
      this.localLng = lng;

      if (reverseLookup && this.mapirEnabled) {
        await this.lookupAddress(lat, lng);
      }
    },
    async lookupAddress(lat, lng) {
      try {
        const address = await mapirReverse(lat, lng);
        if (address) {
          this.resolvedAddress = address;
          this.$emit('address', address);
        }
      } catch (e) {
        // ignore reverse failures
      }
    },
    emitPosition(lat, lng) {
      this.localLat = lat;
      this.localLng = lng;
      this.$emit('update:lat', lat);
      this.$emit('update:lng', lng);
      this.$emit('change', { lat, lng });
      if (this.mapirEnabled) {
        this.lookupAddress(lat, lng);
      }
    },
    onSearchInput() {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => this.searchNow(), 450);
    },
    async searchNow() {
      if (!this.mapirEnabled || !this.searchQuery.trim()) {
        this.searchResults = [];
        return;
      }
      const center = this.map ? this.map.getCenter() : { lat: this.centerLat, lng: this.centerLng };
      try {
        this.searchResults = await mapirSearch(this.searchQuery, center.lat, center.lng);
      } catch (e) {
        this.searchResults = [];
      }
    },
    pickSearchResult(item) {
      this.searchResults = [];
      this.searchQuery = formatSearchLabel(item);
      if (this.map) {
        this.map.setView([item.lat, item.lng], 16);
      }
      this.setMarker(item.lat, item.lng, false);
      this.resolvedAddress = item.address || item.title;
      this.$emit('address', this.resolvedAddress);
      this.emitPosition(item.lat, item.lng);
    },
    useCenterLocation(message) {
      if (this.map) {
        this.map.setView([this.centerLat, this.centerLng], this.zoom);
      }
      if (message) {
        this.$bvToast.toast(message, { variant: 'info', autoHideDelay: 6000 });
      } else {
        this.$bvToast.toast(`نقشه روی ${DEFAULT_MAP_CENTER.label} تنظیم شد.`, { variant: 'info', autoHideDelay: 4000 });
      }
    },
    geolocationHint() {
      return `دسترسی موقعیت فعال نیست. از تنظیمات مرورگر Location را برای این سایت Allow کنید. فعلاً نقشه روی ${DEFAULT_MAP_CENTER.label} است — محل دقیق را دستی انتخاب کنید.`;
    },
    useMyLocation() {
      if (!this.map) {
        this.ensureMap(true);
      }
      if (!navigator.geolocation) {
        this.useCenterLocation(`GPS در دسترس نیست. ${this.geolocationHint()}`);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          if (this.map) {
            this.map.setView([lat, lng], 16);
          }
          this.setMarker(lat, lng, true);
          this.emitPosition(lat, lng);
          this.$bvToast.toast('موقعیت شما روی نقشه ثبت شد.', { variant: 'success', autoHideDelay: 3000 });
        },
        (err) => {
          let msg = this.geolocationHint();
          if (err?.code === 1) {
            msg = `دسترسی موقعیت رد شد. ${this.geolocationHint()}`;
          } else if (err?.code === 3) {
            msg = `دریافت موقعیت طول کشید. ${this.geolocationHint()}`;
          }
          this.useCenterLocation(msg);
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 0,
        },
      );
    },
  },
};
</script>

<style scoped>
.map-picker__map {
  position: relative;
  height: 260px;
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(42, 35, 24, 0.1);
  z-index: 1;
  overflow: hidden;
  background: #f0ebe3;
}

.map-picker__loading {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  background: rgba(247, 243, 235, 0.92);
  font-size: 0.85rem;
  color: #7a6e62;
}

.map-picker__search {
  position: relative;
  margin-bottom: 0.5rem;
}

.map-picker__suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1050;
  list-style: none;
  margin: 0.25rem 0 0;
  padding: 0;
  background: #fff;
  border: 1px solid rgba(42, 35, 24, 0.12);
  border-radius: 10px;
  box-shadow: 0 8px 24px rgba(42, 35, 24, 0.12);
  max-height: 180px;
  overflow-y: auto;
}

.map-picker__suggestions li {
  padding: 0.55rem 0.75rem;
  font-size: 0.85rem;
  cursor: pointer;
  border-bottom: 1px solid rgba(42, 35, 24, 0.06);
}

.map-picker__suggestions li:hover {
  background: #f7f3eb;
}

.map-picker__suggestions li:last-child {
  border-bottom: none;
}

.map-picker__address {
  display: block;
  font-size: 0.78rem;
  line-height: 1.4;
  margin-top: 0.35rem;
}

.map-picker__error {
  font-size: 0.85rem;
  margin-bottom: 0.5rem;
}

.map-picker__restaurant-icon {
  background: transparent;
  border: none;
}

.map-picker__restaurant-pin {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 1.35rem;
  line-height: 1;
  filter: drop-shadow(0 2px 4px rgba(42, 35, 24, 0.35));
  pointer-events: none;
}
</style>
