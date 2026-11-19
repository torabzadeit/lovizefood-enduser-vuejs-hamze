<template>
  <!-- Only shown when the customer actually has something to use: a personal
       code issued to them, or a shop-wide campaign. An empty section would be
       a dead row on the menu. -->
  <section v-if="offers.length" class="offers" :class="{ 'offers--basket': isBasket }">
    <h2 v-if="!isBasket" class="offers__title">تخفیف‌ها و کوپن‌ها</h2>

    <div v-drag-scroll class="offers__list">
      <!-- Ticket-style card: the amount on top, title and time left, a
           perforated divider with side notches, then the details link. -->
      <!-- The wrapper carries the shadow: the card itself is masked (the side
           notches are real holes), and a mask would also clip its own shadow. -->
      <div v-for="offer in offers" :key="offer.id" class="offer-card-wrap">
        <!-- On the menu the whole card is one button that opens the details. In the
             basket it holds two real buttons (apply, details), so the card itself is
             a plain container there: buttons cannot sit inside a button. -->
        <component
          :is="isBasket ? 'div' : 'button'"
          :type="isBasket ? null : 'button'"
          class="offer-card"
          :class="offer.personal ? 'offer-card--personal' : 'offer-card--public'"
          @click="isBasket ? null : open(offer)"
        >
          <span class="offer-card__top">
            <span class="offer-card__pill">{{ offer.pill }}</span>
            <span class="offer-card__title">{{ offer.title }}</span>
            <span class="offer-card__hint">{{ offer.hint }}</span>
          </span>
          <span class="offer-card__divider" aria-hidden="true"></span>
          <span v-if="!isBasket" class="offer-card__more">
            جزئیات
            <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true" focusable="false">
              <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </span>
          <span v-else class="offer-card__actions">
            <button
              type="button"
              class="offer-card__apply"
              :class="{ 'offer-card__apply--done': appliedCode && appliedCode === offer.code }"
              :disabled="locked"
              @click="$emit('apply', offer.code)"
            >{{ appliedCode && appliedCode === offer.code ? 'اعمال شد' : 'اعمال' }}</button>
            <button type="button" class="offer-card__details" @click="open(offer)">جزئیات</button>
          </span>
        </component>
      </div>
    </div>

    <!-- The details sheet (it moves itself to <body>, see offerSheet.vue). -->
    <offer-sheet :offer="selected" :show-basket-note="!isBasket" @close="close" />
  </section>
</template>

<script>
import dragScroll from '../../../utils/dragScroll';
import { personalOffer, publicOffer } from '../../../utils/offers';
import OfferSheet from './offerSheet.vue';

export default {
  name: 'DiscountSection',
  directives: { dragScroll },
  components: { OfferSheet },
  props: {
    /**
     * Codes issued to this customer, from /profile/active-discount-codes. What the
     * backend should send on each code (description, maxAmount, seenDate) is
     * documented in utils/offers.js.
     */
    personalCodes: { type: Array, default: () => [] },
    /** Shop-wide campaigns anyone can use. */
    publicOffers: { type: Array, default: () => [] },
    /**
     * "menu" (default): the band on the first page, each card opens its details.
     * "basket": the same cards inside the basket, each with an apply button and a
     * details button; the basket supplies its own title.
     */
    mode: { type: String, default: 'menu' },
    /** Basket: the code now on the invoice, shown as applied. */
    appliedCode: { type: String, default: '' },
    /** Basket: a code is already applied, so the others wait until it is cancelled. */
    locked: { type: Boolean, default: false },
  },
  data() {
    return { selected: null };
  },
  computed: {
    isBasket() {
      return this.mode === 'basket';
    },
    offers() {
      return [...this.personalCodes.map(personalOffer), ...this.publicOffers.map(publicOffer)];
    },
  },
  methods: {
    // The sheet locks the page behind it itself, and moves itself to <body>.
    open(offer) {
      this.selected = offer;
    },
    close() {
      this.selected = null;
    },
  },
};
</script>

<style scoped>
/* Full-width band, matching the menu sections: edge to edge, with the canvas
   showing only as the gap above and below. */
.offers {
  background: var(--lz-surface);
  padding: var(--lz-space-3) var(--lz-space-4);
  /* Same viewport-relative full bleed as the menu bands. */
  margin-inline: calc(50% - 50vw);
  margin-bottom: var(--lz-space-2);
}

@media (min-width: 768px) {
  .offers {
    margin-inline: 0;
  }
}

.offers__title {
  font-size: var(--lz-text-lg);
  font-weight: var(--lz-weight-semibold);
  letter-spacing: var(--lz-track-lg);
  color: var(--lz-ink);
  margin: 0 0 var(--lz-space-3);
}

.offers__list {
  display: flex;
  gap: var(--lz-space-2);
  overflow-x: auto;
  scrollbar-width: none;
  /* A scroll container clips what spills out of it, card shadows included.
     The padding gives the shadows room; the negative margins give the space
     back, so the layout does not change. The row also runs to the screen
     edges, so cards slide out instead of being cut at the section padding. */
  padding: 8px var(--lz-space-4) 32px;
  margin: -8px calc(-1 * var(--lz-space-4)) -24px;
}

.offers__list::-webkit-scrollbar { display: none; }

/* The shadow lives here, not on the card: drop-shadow follows the card's real
   outline, notches included, whereas a box-shadow would stay a plain rectangle. */
.offer-card-wrap {
  flex: 0 0 auto;
  width: 170px;
  display: flex;
  filter: drop-shadow(0 8px 10px rgba(30, 24, 25, 0.12));
  transition: transform 0.2s ease;
}

.offer-card-wrap:active { transform: scale(0.97); }

.offer-card {
  --offer-edge: var(--lz-border-hairline);
  /* The "details" row has a fixed height so the notches can be placed from the
     bottom edge: centre of the divider = row height + half the divider (8px). */
  --offer-more-h: 44px;
  --notch-r: 7px;
  --notch-y: calc(100% - var(--offer-more-h) - 8px);
  flex: 1 1 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0;
  border: 1px solid var(--offer-edge);
  border-radius: 20px;
  background: var(--lz-surface-raised);
  font-family: inherit;
  text-align: center;
  cursor: pointer;
  /* Real holes, not painted circles: a half-circle is cut out of each side, so
     whatever is behind the card shows through. Two layers, one per side. */
  -webkit-mask:
    radial-gradient(circle at 0 var(--notch-y), transparent calc(var(--notch-r) - 0.5px), #000 var(--notch-r)) left / 51% 100% no-repeat,
    radial-gradient(circle at 100% var(--notch-y), transparent calc(var(--notch-r) - 0.5px), #000 var(--notch-r)) right / 51% 100% no-repeat;
  mask:
    radial-gradient(circle at 0 var(--notch-y), transparent calc(var(--notch-r) - 0.5px), #000 var(--notch-r)) left / 51% 100% no-repeat,
    radial-gradient(circle at 100% var(--notch-y), transparent calc(var(--notch-r) - 0.5px), #000 var(--notch-r)) right / 51% 100% no-repeat;
}
.offer-card:focus-visible { outline: 2px solid var(--lz-accent); outline-offset: 2px; }

.offer-card__top {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 14px 10px;
}

/* The amount is the hero of the card. */
.offer-card__pill {
  padding: 3px 14px;
  border-radius: 999px;
  /* Green: a discount is good news. White text on the light theme's dark green,
     dark text on the dark theme's light green (same as the applied button). */
  background: var(--lz-success);
  color: #fff;
  font-size: var(--lz-text-sm);
  font-weight: 600;
  line-height: 1.8;
  box-shadow: 0 4px 10px color-mix(in srgb, var(--lz-success) 30%, transparent);
}

html[data-theme='dark'] .offer-card__pill { color: #0e0f10; }

.offer-card__title {
  max-width: 100%;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  font-size: var(--lz-text-body);
  font-weight: 600;
  line-height: 1.5;
  color: var(--lz-ink);
}

.offer-card__hint {
  margin-top: -6px;
  font-size: var(--lz-text-caption);
  color: var(--lz-ink-muted);
}

/* Perforated divider with a notch cut into each side, like a ticket. The
   notches take the colour of the band behind the cards. */
.offer-card__divider {
  position: relative;
  display: block;
  height: 16px;
  margin-top: auto;
}

.offer-card__divider::before {
  content: "";
  position: absolute;
  inset-inline: 14px;
  top: 50%;
  border-top: 2px dashed var(--lz-border-strong);
}

/* Only the thin edge line around each hole is drawn here; the hole itself is cut
   by the card's mask. */
.offer-card__divider::after {
  content: "";
  position: absolute;
  inset-block: 0;
  inset-inline: -1px;
  background:
    radial-gradient(circle at 0 50%, transparent 0 calc(var(--notch-r) - 0.5px), var(--offer-edge) calc(var(--notch-r) - 0.5px) calc(var(--notch-r) + 0.5px), transparent calc(var(--notch-r) + 0.5px)) left / 50% 100% no-repeat,
    radial-gradient(circle at 100% 50%, transparent 0 calc(var(--notch-r) - 0.5px), var(--offer-edge) calc(var(--notch-r) - 0.5px) calc(var(--notch-r) + 0.5px), transparent calc(var(--notch-r) + 0.5px)) right / 50% 100% no-repeat;
}

.offer-card__more {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  height: var(--offer-more-h);
  gap: 4px;
  padding: 0 14px;
  font-size: var(--lz-text-sm);
  font-weight: 600;
  color: var(--lz-accent-strong);
}

.offer-card--public .offer-card__more { color: var(--lz-ink); }

/* ---- basket variant ----
   The same ticket cards, but inside the basket's own section: no band, no title,
   and a row with two buttons instead of the single "details" link. The row is
   taller so both are easy to hit; the notches follow, because they are placed
   from the bottom edge by --offer-more-h. */
.offers--basket {
  background: transparent;
  padding: 0;
  margin: 0 0 var(--lz-space-3);
}

.offers--basket .offers__list {
  padding-inline: 8px;
  margin-inline: -8px;
}

.offers--basket .offer-card { --offer-more-h: 60px; cursor: default; }

.offers--basket .offer-card-wrap:active { transform: none; }

.offer-card__actions {
  display: flex;
  align-items: stretch;
  gap: 6px;
  box-sizing: border-box;
  height: var(--offer-more-h);
  padding: 8px 10px 12px;
}

.offer-card__apply,
.offer-card__details {
  flex: 1 1 0;
  min-width: 0;
  border: 0;
  border-radius: 999px;
  font-family: inherit;
  font-size: var(--lz-text-sm);
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
}

/* Brand button: solid, white text, in both themes. */
.offer-card__apply {
  background: var(--lz-accent);
  color: #fff;
}

.offer-card__apply:disabled { opacity: 0.45; cursor: default; }

/* The code on the invoice now. */
.offer-card__apply--done { background: var(--lz-success); opacity: 1 !important; }
html[data-theme='dark'] .offer-card__apply--done { color: #0e0f10; }

.offer-card__details {
  background: transparent;
  color: var(--lz-ink);
  border: 1px solid var(--lz-border);
}

.offer-card__apply:active,
.offer-card__details:active { transform: scale(0.95); }
</style>
