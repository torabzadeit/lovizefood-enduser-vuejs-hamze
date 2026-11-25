<template>
  <!--
    Five glossy, faceted gold stars. Tapping one says "this many stars" and nothing
    else (the parent decides what happens). The star is drawn here as SVG, once, in a
    hidden <symbol> and reused five times: a gold body with a vertical gradient, ten
    facets (lit on the upper-left, shaded on the lower-right) that give it the look
    of a cut gem, a thin darker outline, a small gloss and a soft drop shadow.
  -->
  <div class="star3d" role="group" :aria-label="valueLabel" :style="{ '--star3d-size': size + 'px' }">
    <svg class="star3d__defs" width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient :id="ref('body')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffe98a" />
          <stop offset="0.5" stop-color="#f8bb1c" />
          <stop offset="1" stop-color="#d98700" />
        </linearGradient>
        <radialGradient :id="ref('gloss')" cx="0.35" cy="0.25" r="0.6">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.75" />
          <stop offset="1" stop-color="#ffffff" stop-opacity="0" />
        </radialGradient>
        <!-- The gloss may not spill past the star's own outline. -->
        <clipPath :id="ref('clip')">
          <path d="M12 2.8 14.53 9.32 21.51 9.71 16.09 14.13 17.88 20.89 12 17.1 6.12 20.89 7.91 14.13 2.49 9.71 9.47 9.32Z" />
        </clipPath>
      </defs>

      <!-- Not rated: the same star as an empty outline in the muted ink colour. -->
      <symbol :id="ref('empty')" viewBox="0 0 24 24">
        <path
          d="M12 2.8 14.53 9.32 21.51 9.71 16.09 14.13 17.88 20.89 12 17.1 6.12 20.89 7.91 14.13 2.49 9.71 9.47 9.32Z"
          fill="currentColor"
          fill-opacity="0.07"
          stroke="currentColor"
          stroke-width="1.3"
          stroke-linejoin="round"
        />
      </symbol>

      <symbol :id="ref('star')" viewBox="0 0 24 24">
        <!-- silhouette -->
        <path
          d="M12 2.8 14.53 9.32 21.51 9.71 16.09 14.13 17.88 20.89 12 17.1 6.12 20.89 7.91 14.13 2.49 9.71 9.47 9.32Z"
          :fill="'url(#' + ref('body') + ')'"
        />
        <!-- lit facets (upper-left of each point) -->
        <g fill="#ffffff" fill-opacity="0.42">
          <path d="M12 12.8 9.47 9.32 12 2.8Z" />
          <path d="M12 12.8 14.53 9.32 21.51 9.71Z" />
          <path d="M12 12.8 16.09 14.13 17.88 20.89Z" />
          <path d="M12 12.8 6.12 20.89 7.91 14.13Z" />
          <path d="M12 12.8 2.49 9.71 9.47 9.32Z" />
        </g>
        <!-- shaded facets (lower-right of each point) -->
        <g fill="#7a3f00" fill-opacity="0.2">
          <path d="M12 12.8 12 2.8 14.53 9.32Z" />
          <path d="M12 12.8 21.51 9.71 16.09 14.13Z" />
          <path d="M12 12.8 17.88 20.89 12 17.1Z" />
          <path d="M12 12.8 12 17.1 6.12 20.89Z" />
          <path d="M12 12.8 7.91 14.13 2.49 9.71Z" />
        </g>
        <!-- outline and gloss -->
        <path
          d="M12 2.8 14.53 9.32 21.51 9.71 16.09 14.13 17.88 20.89 12 17.1 6.12 20.89 7.91 14.13 2.49 9.71 9.47 9.32Z"
          fill="none"
          stroke="#a85f00"
          stroke-width="0.7"
          stroke-linejoin="round"
        />
        <ellipse
          cx="10.4"
          cy="8.6"
          rx="3.2"
          ry="3.4"
          :fill="'url(#' + ref('gloss') + ')'"
          :clip-path="'url(#' + ref('clip') + ')'"
        />
      </symbol>
    </svg>

    <button
      v-for="n in 5"
      :key="n"
      type="button"
      class="star3d__btn"
      :class="{ 'star3d__btn--empty': fill(n) === 0 }"
      :aria-label="n + ' ستاره'"
      @click="$emit('select', n)"
    >
      <svg :width="size" :height="size" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <defs>
          <!-- Fill from the right, matching the RTL order of the five buttons. -->
          <clipPath :id="ref('fill-' + n)">
            <rect :x="24 * (1 - fill(n))" y="0" :width="24 * fill(n)" height="24" />
          </clipPath>
        </defs>
        <use v-if="fill(n) < 1" :href="'#' + ref('empty')" />
        <use v-if="fill(n) > 0" :href="'#' + ref('star')" :clip-path="'url(#' + ref('fill-' + n) + ')'" />
      </svg>
    </button>
  </div>
</template>

<script>
export default {
  name: 'StarRating3d',
  props: {
    // Side of one star in px.
    size: { type: Number, default: 34 },
    label: { type: String, default: 'امتیاز شما' },
    // Saved average (1-5, including fractions); 0 leaves every star empty.
    value: { type: Number, default: 0 },
  },
  data() {
    // One set of ids per instance: several rows live on the same page.
    return { uid: `star3d-${this._uid}` };
  },
  computed: {
    displayValue() {
      return Number.isFinite(this.value) && this.value >= 1 && this.value <= 5 ? this.value : 0;
    },
    valueLabel() {
      return this.displayValue
        ? `${this.label}؛ ${this.displayValue.toLocaleString('fa-IR', { maximumFractionDigits: 2 })} از ۵`
        : `${this.label}؛ هنوز امتیازی ثبت نشده است`;
    },
  },
  methods: {
    fill(n) {
      return Math.max(0, Math.min(1, this.displayValue - n + 1));
    },
    ref(name) {
      return `${this.uid}-${name}`;
    },
  },
};
</script>

<style scoped>
/* The hidden svg only holds definitions: it must take no room. */
.star3d__defs {
  position: absolute;
  width: 0;
  height: 0;
  overflow: hidden;
}

/* The stars sit close together at the start of the row (not spread across it). */
.star3d {
  display: flex;
  align-items: center;
  justify-content: flex-start;
}

.star3d__btn {
  flex: 0 0 auto;
  /* A star plus a 6px margin: close, and still a thumb-sized target. */
  width: calc(var(--star3d-size, 34px) + 6px);
  min-height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  background: transparent;
  /* The empty star draws in this colour. */
  color: var(--lz-ink-muted, #8a8f98);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.star3d__btn svg {
  /* Lifts the star off the card, on both themes. */
  filter: drop-shadow(0 2px 2px rgba(122, 63, 0, 0.35));
  transition: transform 0.14s ease;
}

/* An empty star is flat: no shadow. */
.star3d__btn--empty svg { filter: none; }

.star3d__btn:active svg { transform: scale(0.82) rotate(-8deg); }

@media (prefers-reduced-motion: reduce) {
  .star3d__btn svg { transition: none; }
}
</style>
