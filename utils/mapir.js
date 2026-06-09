const MAPIR_BASE = 'https://map.ir';
const MAPIR_WMS_URL = `${MAPIR_BASE}/shiveh/wms`;
const MAPIR_WMS_LAYER = 'Shiveh:Shiveh';

export const DEFAULT_MAP_CENTER = {
  lat: 33.733,
  lng: 59.188,
  label: 'قائن',
  address: 'قائن، بلوار بسیج، خیابان بصیرت — رستوران لاویز',
};

export function getMapirApiKey() {
  return process.env.MAP_IR_API_KEY || process.env.VUE_APP_MAP_IR_API_KEY || '';
}

export function mapirHeaders() {
  const key = getMapirApiKey();
  return key ? { 'x-api-key': key } : {};
}

export function createMapirTileLayer(L, apiKey) {
  if (!apiKey) {
    return L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    });
  }

  const MapirWmsLayer = L.TileLayer.WMS.extend({
    createTile(coords, done) {
      const tile = document.createElement('img');
      tile.alt = '';
      tile.setAttribute('role', 'presentation');

      const url = this.getTileUrl(coords);

      fetch(url, { headers: { 'x-api-key': apiKey } })
        .then((res) => {
          if (!res.ok) throw new Error(`tile ${res.status}`);
          const type = res.headers.get('content-type') || '';
          if (!type.includes('image')) throw new Error('not-image');
          return res.blob();
        })
        .then((blob) => {
          tile.onload = () => URL.revokeObjectURL(tile.src);
          tile.src = URL.createObjectURL(blob);
          done(null, tile);
        })
        .catch(() => {
          tile.src = '';
          done(null, tile);
        });

      return tile;
    },
  });

  return new MapirWmsLayer(MAPIR_WMS_URL, {
    layers: MAPIR_WMS_LAYER,
    format: 'image/png',
    transparent: true,
    maxZoom: 18,
    attribution: '© <a href="https://map.ir" target="_blank" rel="noopener">map.ir</a>',
  });
}

export async function mapirReverse(lat, lng) {
  const key = getMapirApiKey();
  if (!key) return null;

  const url = `${MAPIR_BASE}/reverse/?lat=${lat}&lon=${lng}`;
  const res = await fetch(url, { headers: { 'x-api-key': key } });
  if (!res.ok) return null;
  const data = await res.json();
  return data.address || data.formatted_address || null;
}

export async function mapirSearch(text, lat, lng) {
  const key = getMapirApiKey();
  if (!key || !text || text.trim().length < 2) return [];

  const params = new URLSearchParams({ text: text.trim() });
  if (lat != null && lng != null) {
    params.set('lat', String(lat));
    params.set('lon', String(lng));
  }

  const url = `${MAPIR_BASE}/search/v2/?${params.toString()}`;
  const res = await fetch(url, { headers: { 'x-api-key': key } });
  if (!res.ok) return [];

  const data = await res.json();
  const items = data.value || data.results || [];
  return items.map((item) => {
    let itemLat = item.lat;
    let itemLng = item.lon;
    if (item.geom && item.geom.coordinates) {
      itemLng = item.geom.coordinates[0];
      itemLat = item.geom.coordinates[1];
    } else if (item.location) {
      itemLat = item.location.y ?? item.location.lat;
      itemLng = item.location.x ?? item.location.lon;
    }
    return {
      title: item.title || item.address || '',
      address: item.address || item.title || '',
      lat: itemLat,
      lng: itemLng,
    };
  }).filter((x) => x.lat != null && x.lng != null);
}

export function formatSearchLabel(item) {
  return item.title && item.address && item.title !== item.address
    ? `${item.title} — ${item.address}`
    : (item.address || item.title);
}
