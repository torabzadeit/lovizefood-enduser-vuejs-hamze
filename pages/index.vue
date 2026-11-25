<template>
  <div class="laviz-storefront-shell">
  <!-- Ambient background: a soft glow, two slow drifting lights and a few
       rising sparks. Only transform and opacity animate, so it stays on the
       GPU and costs next to nothing; see .laviz-ambient in main.scss. -->
  <div class="laviz-ambient" aria-hidden="true">
    <span class="laviz-ambient__glow"></span>
    <span class="laviz-ambient__blob laviz-ambient__blob--a"></span>
    <span class="laviz-ambient__blob laviz-ambient__blob--b"></span>
    <span v-for="(style, i) in emberStyles" :key="'ember-' + i" class="laviz-ambient__ember" :style="style"></span>
  </div>
  <div class="laviz-storefront-overlay" :aria-busy="loading ? 'true' : 'false'">

    <div class="main-fixed-header laviz-app-header"
         :class="{ 'laviz-app-header--collapsed': headerCollapsed, 'laviz-app-header--hidden': headerHidden }"
         :style="{ top: headerHidden ? (-headerHideOffset) + 'px' : '0px' }">
      <div class="container">
        <div class="row">

          <div class="col-md-12">
            <!-- One row: brand on the start side, the two actions on the end side.
                 Same in the expanded and collapsed header, so nothing jumps on scroll. -->
            <div class="laviz-topbar">
              <div class="laviz-topbar__brand">
                <img src="@/assets/media/logo-laviz.png" class="laviz-topbar__logo laviz-topbar__logo--light" alt="لاویز"/>
                <img src="@/assets/media/logo-laviz-dark.png" class="laviz-topbar__logo laviz-topbar__logo--dark" alt="" aria-hidden="true"/>
                <!-- The logo already says the name; the heading stays for screen readers and search engines. -->
                <h1 class="laviz-topbar__title sr-only">{{ shopInfo.name }}</h1>
              </div>
              <div class="laviz-topbar__actions">
                <button type="button" class="laviz-icon-btn" aria-label="منوی تصویری" title="منوی تصویری" @click="$router.push('/immersive-menu')">
                  <img src="@/assets/immersive-icons/grid-2.svg" alt="" width="22" height="22" :style="theme === 'dark' ? { filter: 'invert(1)' } : null" />
                </button>
                <button
                  type="button"
                  class="laviz-icon-btn"
                  :aria-label="theme === 'dark' ? 'تغییر به حالت روشن' : 'تغییر به حالت تاریک'"
                  :title="theme === 'dark' ? 'حالت روشن' : 'حالت تاریک'"
                  @click="toggleTheme"
                >
                  <svg v-if="theme === 'dark'" :key="'sun'" class="laviz-icon-btn__theme" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round">
                    <circle cx="12" cy="12" r="4.2" /><path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M18.7 5.3l-1.6 1.6M6.9 17.1l-1.6 1.6" />
                  </svg>
                  <svg v-else :key="'moon'" class="laviz-icon-btn__theme" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 14.2A8 8 0 0 1 9.8 4a8 8 0 1 0 10.2 10.2z" />
                  </svg>
                </button>
                <button
                  type="button"
                  class="laviz-icon-btn"
                  aria-label="مسیریابی به رستوران"
                  title="مسیریابی به رستوران"
                  @click="openNavigation"
                >
                  <svg class="laviz-icon-btn__arrow" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                    <path d="M12 2.5 4.5 20.2c-.2.5.4 1 .9.7L12 17l6.6 3.9c.5.3 1.1-.2.9-.7L12 2.5z"
                          fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                  </svg>
                </button>
                <!-- Signed in: one solid saffron icon button opens the profile (sign-out lives there). -->
                <button
                  v-if="auth.is_login"
                  type="button"
                  class="laviz-icon-btn laviz-icon-btn--saffron"
                  aria-label="پروفایل"
                  title="پروفایل"
                  @click="$router.push('/profile')"
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="8" r="4" /><path d="M4.5 20.5c.9-3.6 3.9-5.5 7.5-5.5s6.6 1.9 7.5 5.5" />
                  </svg>
                </button>
                <button v-else type="button" class="laviz-user-bar__login" @click="openProfileLogin">ورود</button>
              </div>
            </div>
            <div v-if="mode === 0 && !headerCollapsed" class="laviz-topbar__ramadan">
              <span class="laviz-mode-ribbon">🌙 ماه مبارک رمضان</span>
              <p class="laviz-app-header__subtitle">سفارش آنلاین شله و حلیم ویژه ماه مبارک رمضان</p>
            </div>
          </div>

          <!-- Only worth a row when it has something to say (an ETA); the shipping
               cost is shown in the basket, not on the first page. -->
          <div v-if="!headerCollapsed && Number(etaMinutes) > 0" class="col-12">
            <delivery-type-bar
              v-model="delivery_type"
              :options="deliveryTypeOptions"
              :showSwitch="false"
              :shippingCost="shippingCost"
              :etaMinutes="etaMinutes"
              :deliveryEtaLabel="labels.deliveryEta"
              :pickupEtaLabel="labels.pickupEta"
              :shippingChipLabel="labels.shippingChip"
            />
          </div>

          <div class="col-12 laviz-tabs laviz-tabs--bleed">
            <!-- ROLLBACK[b-tabs-strip]: the previous b-tabs strip switched the
                 content area one category at a time. The menu is now a single
                 continuous scroll, so the strip only reflects/drives scroll
                 position. Restore by reverting this block and the
                 `menu-section` loop below. -->
            <menu-category-nav
              v-if="showCategoryTabs"
              :categories="menuNavCategories"
              :activeId="currentActiveTabId"
              @select="scrollToCategory"
              @open-sheet="menuSheetVisible = true"
              @open-search="openSearch"
            />
            <div v-else-if="loading && !products.length" class="skeleton-tabs" aria-hidden="true">
              <span v-for="n in 4" :key="n"></span>
            </div>

            <div v-if="searchOpen" class="laviz-menu-search">
              <input
                ref="menuSearch"
                v-model="menuSearch"
                type="search"
                class="laviz-menu-search__input"
                placeholder="جستجوی غذا…"
                @keyup.esc="closeSearch"
              />
              <button type="button" class="laviz-menu-search__close" aria-label="بستن جستجو" @click="closeSearch">✕</button>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="container">

      <!-- Reserves exactly the header's current height: it collapses on
           scroll, so a fixed value left a gap under the tab strip. -->
      <div class="header-spacer" :style="{ height: headerHeight + 'px' }"></div>

      <management-message-banner
        v-if="auth.is_login && auth.token"
        :key="auth.token"
        ref="managementMessages"
        :token="auth.token"
      />

      <!-- ROLLBACK[weekly-plan-table]: replaced by the "غذای روز سرآشپز" tab
           (chefDailyTab.vue). To go back to the old weekly table, delete the
           `false &&` below and remove the chef-daily tab from the tab strip. -->
      <section v-if="false && weeklyPlan.length" class="laviz-section laviz-weekly-plan mb-3">
        <div class="laviz-weekly-plan__header">
          <h2 class="laviz-weekly-plan__title">برنامه غذایی هفته</h2>
          <p class="laviz-weekly-plan__hint">منوی هر روز — غذاهای ثابت به‌اضافهٔ ویژهٔ همان روز</p>
        </div>
        <div class="laviz-weekly-plan__table">
          <div class="laviz-weekly-plan__table-head">
            <span>روز</span>
            <span>منوی سرویس</span>
          </div>
          <div
            v-for="(day, dayIndex) in weeklyPlan"
            :key="day.name"
            class="laviz-weekly-plan__table-row"
            :class="{ 'laviz-weekly-plan__table-row--today': dayIndex === todayWeekIndex }"
          >
            <div class="laviz-weekly-plan__table-day">
              <span>{{ day.name }}</span>
              <span v-if="dayIndex === todayWeekIndex" class="laviz-weekly-plan__today-badge">امروز</span>
            </div>
            <div class="laviz-weekly-plan__table-menu">
              <template v-if="day.products.length">
                <span
                  v-for="productName in day.products"
                  :key="`${day.name}-${productName}`"
                  class="laviz-weekly-plan__product"
                >{{ productName }}</span>
              </template>
              <span v-else class="laviz-weekly-plan__empty">بدون سرویس</span>
            </div>
          </div>
        </div>
      </section>

      <div class="row">

        <div class="col-12">
          <div v-if="!loading && loadError && !products.length" class="alert alert-warning text-center my-3" role="alert">
            <p>دریافت منو انجام نشد. لطفاً دوباره تلاش کنید.</p>
            <button type="button" class="btn btn-outline-dark" @click="initialize">تلاش دوباره</button>
          </div>
          <div v-else-if="!loading && !loadError && products.length === 0" class="alert alert-warning text-center my-3">
            در حال حاضر محصولی برای این حالت ({{ mode === 0 ? 'رمضان' : 'عادی' }}) تعریف نشده است.
            لطفاً از پنل مدیریت، منوی {{ mode === 0 ? 'رمضان' : 'عادی' }} را تکمیل کنید.
          </div>
          <!-- The order still on its way: where it is, when it is due, call/details.
               It sits in the page flow (not the fixed header) so it scrolls away
               and never eats the screen while the menu is being browsed. -->
          <active-order-card
            v-if="currentOrder"
            :order="currentOrder"
            :items="currentOrderItems"
            :phone="shopInfo.phone || supportPhone || ''"
            :delivery-text="currentOrderDeliveryText"
            :downloading="downloadingReceiptId === currentOrder.id"
            :bank-card-number="refundCardOwner === refundCustomerKey ? refundCardNumber : ''"
            @receipt="downloadReceipt"
            @acknowledge="acknowledgeRejectedOrder"
            @navigate="openNavigation"
          />

          <!-- The latest delivered order sits at the top of the first page with a
               review button, until it is reviewed or closed. -->
          <last-order-review-card
            v-if="reviewOrder"
            :order="reviewOrder"
            :downloading="downloadingReceiptId === reviewOrder.id"
            @review="openReview"
            @receipt="downloadReceipt"
            @dismiss="dismissReviewOrder"
          />

          <!-- ROLLBACK[first-page-offers]: the offers strip was removed from the
               first page on request; codes are chosen in the basket now. To bring
               it back, restore a discount-section here with
               :personalCodes="myActiveCodes" :publicOffers="publicOffers". -->

          <div class="product-content-wrapper">

            <!-- First load: shimmering placeholders hold the menu's shape until the data lands. -->
            <div v-if="loading && !products.length" role="status" aria-label="در حال بارگذاری منو">
              <div class="skeleton-menu" aria-hidden="true">
                <div class="skeleton-title"></div>
                <div v-for="n in 5" :key="n" class="skeleton-item">
                  <div class="skeleton-item__lines">
                    <span></span><span></span><span></span>
                  </div>
                  <div class="skeleton-item__img"></div>
                </div>
              </div>
            </div>
            <section
              v-if="hasChefDaily"
              :id="'menu-cat-' + CHEF_TAB_ID"
              class="menu-section menu-section--chef-daily"
            >
              <chef-daily-tab
                :products="chefDailyProducts"
                :product-data="productData"
                @increase="addChefDailyProduct"
                @decrease="subChefDailyProduct"
                @imageClick="showImageModal"
              />
            </section>

            <!-- Every category is rendered as its own section in one long
                 scroll (Snappfood layout); the strip above follows the scroll
                 position rather than swapping the content. -->
            <template v-for="productCategoryItem in visibleCategories">
              <section
                :id="'menu-cat-' + productCategoryItem.id"
                :ref="'section-' + productCategoryItem.id"
                :key="'content-' + productCategoryItem.id"
                class="menu-section"
              >
                <h2 v-reveal class="menu-section__title section-heading">{{ productCategoryItem.text }}</h2>
                <div
                  v-for="product of categoryProducts(productCategoryItem.id)"
                  v-reveal
                  class="order-item"
                  :key="product.name"
                >
                  <template v-if="productData[product.key]">
                    <product-item
                      :discount_percent="productData[product.key].discount_percent"
                      :name="productData[product.key].name"
                      :price="productData[product.key].price"
                      :count="productData[product.key].count"
                      :isOutOfStock="productData[product.key].isOutOfStock"
                      :unit_name="productData[product.key].unit_name"
                      :image="productData[product.key].image"
                      :fullImage="productData[product.key].imageFull || ''"
                      :hasPhoto="!!productData[product.key].imageFull"
                      :description="productData[product.key].description"
                      :isSpecial="productData[product.key].isSpecial"
                      :specialDaysText="productData[product.key].specialDaysText"
                      :ratingAverage="productData[product.key].ratingAverage"
                      :ratingCount="productData[product.key].ratingCount"
                      :showRating="showProductRating"
                      @decrease="subProductCount(product.key,productData[product.key].add_unit)"
                      @increase="onProductAdd(product.key)"
                      @imageClick="showImageModal"
                    />
                  </template>
                </div>
              </section>
            </template>
          </div>
        </div>


        <!-- Step 2: a full-screen sheet opened from the basket button. It holds
             the same delivery / address / invoice sections as before, so the
             information collected from the customer is unchanged. -->
        <div class="laviz-cart-modal" v-if="cartOpen">
        <div class="laviz-cart-modal__bar">
          <button type="button" class="laviz-cart-modal__close" aria-label="بستن" @click="closeCart">✕</button>
          <h2 class="laviz-cart-modal__title">سبد خرید</h2>
          <span class="laviz-cart-modal__count">{{ selectedProducts.length }} قلم</span>
        </div>

        <div class="laviz-cart-modal__scroll">
        <section class="laviz-section laviz-cart-items">
          <div class="laviz-cart-items__head">
            <h3 class="laviz-section__title">خرید شما</h3>
            <!-- Back to the menu to pick more; the basket keeps its items. -->
            <button type="button" class="laviz-cart-items__add" @click="closeCart">اضافه کردن</button>
          </div>
          <!-- Rows slide into and out of place instead of jumping, and every
               column has a fixed width so a changing number never moves its
               neighbours. -->
          <transition-group name="cart-line" tag="div" class="laviz-cart-lines">
            <div v-for="item in selectedProducts" :key="item.key" class="laviz-cart-line">
              <div class="laviz-cart-line__info">
                <span class="laviz-cart-line__name">{{ item.name }}</span>
                <small class="laviz-cart-line__unit">{{ item.count }} {{ item.unit_name }}</small>
                <span class="laviz-cart-line__price"><span :key="item.total" class="laviz-cart-line__price-num">{{ formatNum(item.total) }}</span> تومان</span>
              </div>
              <div class="laviz-cart-line__stepper">
                <button type="button" @click="onCartStep(item.key, -1)" aria-label="کم کردن">−</button>
                <transition :name="'count-' + countDir" mode="out-in">
                  <span :key="item.count" class="laviz-cart-line__count">{{ item.count }}</span>
                </transition>
                <button type="button" @click="onCartStep(item.key, 1)" aria-label="افزودن">+</button>
              </div>
            </div>
          </transition-group>
          <p v-if="!selectedProducts.length" class="laviz-cart-items__empty">سبد خرید خالی است.</p>
        </section>

        <div class="laviz-checkout-details">
        <div class="col-md-12 mt-2">
          <section class="laviz-section">
            <h2 class="laviz-section__title">
              <span class="laviz-section__title-num">۱</span>
              زمان و نحوه تحویل
            </h2>
            <div class="d-flex flex-column position-relative">
              <p v-if="mode === 0 && deliveryItems.length" class="text-muted small mb-2">
                {{ 'سفارش امروز فقط تا قبل از ساعت ' + '15:30' }}
              </p>
              <!-- Three day buttons. The chosen one also names the weekday
                   ("امروز سه‌شنبه"); the others stay short ("فردا"). -->
              <div v-if="deliveryItems && deliveryItems.length" class="laviz-day-switch" role="radiogroup" aria-label="روز تحویل">
                <button
                  v-for="(deliveryItem, deliveryIndex) in deliveryItems"
                  :key="deliveryIndex"
                  type="button"
                  role="radio"
                  class="laviz-day"
                  :class="{
                    'laviz-day--active': delivery_date === deliveryIndex,
                    'laviz-day--disabled': !deliveryItem.status
                  }"
                  :aria-checked="delivery_date === deliveryIndex"
                  :disabled="!deliveryItem.status"
                  @click="dateSelection(deliveryIndex)"
                >
                  <span class="laviz-day__label">{{
                    delivery_date === deliveryIndex
                      ? getDeliveryItemText(deliveryIndex) + ' ' + jalaliDate(deliveryItem.date, 'dddd')
                      : getDeliveryItemText(deliveryIndex)
                  }}</span>
                  <small v-if="!deliveryItem.status" class="laviz-day__note">
                    {{ deliveryIndex === 0 ? 'پایان سفارش' : 'تعطیل' }}
                  </small>
                  <small v-else-if="deliveryItem.discount_special_day" class="laviz-day__note laviz-day__note--discount">
                    تخفیف ویژه {{ Number(deliveryItem.discount_special_day) + Number(deliveryItem.discount_percent) }}٪
                  </small>
                  <small v-else-if="deliveryItem.discount_percent" class="laviz-day__note laviz-day__note--discount">
                    {{ deliveryItem.discount_percent }}٪ تخفیف
                  </small>
                </button>
              </div>

              <div v-if="delivery_date !== -1 && deliveryTimes.length" class="mt-3">
                <label class="laviz-field-label">ساعت تحویل</label>
                <div class="laviz-day-switch laviz-day-switch--two" role="radiogroup" aria-label="ساعت تحویل">
                  <button
                    type="button"
                    role="radio"
                    class="laviz-day"
                    :class="{ 'laviz-day--active': timeMode === 'asap' }"
                    :aria-checked="timeMode === 'asap'"
                    @click="chooseAsapTime"
                  >
                    <span class="laviz-day__label">تحویل فوری</span>
                    <small class="laviz-day__note">۳۰ تا ۴۵ دقیقه از زمان تأیید سفارش</small>
                  </button>
                  <button
                    type="button"
                    role="radio"
                    class="laviz-day"
                    :class="{ 'laviz-day--active': timeMode === 'scheduled' }"
                    :aria-checked="timeMode === 'scheduled'"
                    @click="timeSheetOpen = true"
                  >
                    <span class="laviz-day__label">{{
                      timeMode === 'scheduled' && delivery_time
                        ? 'تحویل ساعت ' + faTime(delivery_time)
                        : 'تحویل در ساعت انتخابی'
                    }}</span>
                    <small v-if="timeMode === 'scheduled'" class="laviz-day__note">تغییر ساعت</small>
                  </button>
                </div>
                <!-- Plain note from the restaurant, last thing in the time section. -->
                <p v-if="delivery_description && delivery_type == 'sendToMe'" class="laviz-choice-note">
                  {{ delivery_description }}
                </p>
              </div>

              <div class="mt-3">
                <label class="laviz-field-label">نحوه دریافت سفارش</label>
                <div class="laviz-choice-list" role="radiogroup" aria-label="نحوه دریافت سفارش">
                  <label
                    v-for="opt in deliveryTypeOptions"
                    :key="opt.value"
                    class="laviz-choice"
                    :class="{ 'laviz-choice--active': delivery_type === opt.value }"
                  >
                    <input
                      type="radio"
                      class="laviz-choice__input"
                      name="delivery_type"
                      v-model="delivery_type"
                      :value="opt.value"
                    />
                    <span class="laviz-choice__text">{{ opt.text }}</span>
                  </label>
                </div>
                <!-- Delivery fee note sits right under the send option it belongs to. -->
                <p v-if="delivery_type == 'sendToMe'" class="laviz-choice-note">
                  هزینه ارسال {{ formatNum(shippingCost) }} تومان به فاکتور اضافه می‌شود. ارسال فقط در محدوده شهر.
                </p>
              </div>


              <div class="mt-3" v-if="isPickupLike">
                <label class="form-label font-weight-bold">{{ delivery_type === 'snapp' ? 'موقعیت رستوران (برای سفارش اسنپ)' : 'موقعیت رستوران (تحویل حضوری)' }}</label>
                <p v-if="delivery_type === 'snapp'" class="laviz-choice-note">
                  اسنپ را خودتان سفارش می‌دهید. هزینه‌ی ارسال به فاکتور اضافه نمی‌شود.
                </p>
                <p class="text-muted small mb-2">{{ in_person_description || mapCenter.address }}</p>
                <client-only>
                  <map-picker
                    ref="restaurantMap"
                    readonly
                    :center-lat="mapCenter.lat"
                    :center-lng="mapCenter.lng"
                    :restaurant-name="mapCenter.name || 'رستوران لاویز'"
                    :restaurant-address="mapCenter.address || in_person_description"
                    @navigate="openNavigation"
                  />
                </client-only>
              </div>


              <div
                class="mt-3 position-relative"
                v-if="delivery_type == 'sendToMe'"
              >
                <label class="form-label font-weight-bold">آدرس تحویل</label>
                <div v-if="savedAddresses.length" class="form-group laviz-saved-addresses">
                  <label class="small d-block mb-2">آدرس‌های ذخیره‌شده</label>
                  <div class="laviz-saved-address-list">
                    <button
                      v-for="a in savedAddresses"
                      :key="a.id"
                      type="button"
                      class="laviz-saved-address"
                      :class="{ 'laviz-saved-address--active': selectedAddressId === a.id }"
                      :aria-pressed="selectedAddressId === a.id ? 'true' : 'false'"
                      @click="pickSavedAddress(a)"
                    >
                      <!-- Title only: choosing a card fills the address box and the
                           map below with that address. -->
                      <span class="laviz-saved-address__title">{{ a.title || 'آدرس ذخیره‌شده' }}</span>
                    </button>
                  </div>
                </div>
                <textarea
                  class="form-control"
                  rows="3"
                  v-model="delivery_address"
                  @input="onManualAddressInput"
                  aria-label="آدرس تحویل"
                  placeholder="شهر، خیابان، کوچه ..."
                ></textarea>

                <!-- Title and field share one row. -->
                <div class="laviz-inline-field mt-3">
                  <label class="laviz-inline-field__label" for="delivery-plaque">
                    پلاک <span class="laviz-inline-field__hint">(اختیاری)</span>
                  </label>
                  <input
                    id="delivery-plaque"
                    type="text"
                    class="form-control"
                    v-model.trim="plaque"
                    @input="onManualAddressInput"
                    maxlength="20"
                    autocomplete="off"
                    placeholder="مثلا ۱۲"
                  />
                </div>

                <map-preview
                  v-if="delivery_lat != null && delivery_lng != null"
                  class="mt-3"
                  :lat="Number(delivery_lat)"
                  :lng="Number(delivery_lng)"
                  @edit="mapModalOpen = true"
                />
                <template v-else>
                  <p class="laviz-map-hint">برای تسریع در زمان دریافت موقعیت، آدرس خود را روی نقشه نیز وارد نمایید.</p>
                  <button type="button" class="laviz-map-trigger" @click="mapModalOpen = true">
                    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
                      <path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>
                      <circle cx="12" cy="10" r="2.3" fill="currentColor"/>
                    </svg>
                    <span>تعیین آدرس روی نقشه</span>
                  </button>
                </template>
              </div>
            </div>
          </section>
        </div>
        
        <div class="col-md-12 mt-2">
          <section class="laviz-section">
            <h2 class="laviz-section__title">
              <span class="laviz-section__title-num">۲</span>
              کد تخفیف
            </h2>
            <!-- Codes already issued to this customer, as the same ticket cards as on
                 the first page, each with "apply" and "details". Only one code can
                 be on an invoice: once one is applied the others wait until it is
                 cancelled. The field below still takes a code typed by hand. -->
            <div v-if="myActiveCodes.length" class="laviz-my-codes">
              <p class="laviz-my-codes__hint">کدهای تخفیف فعال شما:</p>
              <discount-section
                mode="basket"
                :personalCodes="myActiveCodes"
                :publicOffers="[]"
                :applied-code="discountCode.code_valid_status ? String(discountCode.code || '') : ''"
                :locked="discountCode.code_valid_status"
                @apply="applyOffer"
              />
            </div>

            <p v-else class="laviz-discount-hint mb-2">
              اگر کد تخفیف دارید اینجا وارد کنید.
            </p>
            <div v-if="!discountCode.code_valid_status" class="laviz-discount-row">
              <input
                type="text"
                class="form-control"
                v-model="discountCode.code"
                placeholder="کد تخفیف"
                v-validate="{ required: true }"
                name="code"
                data-vv-as="کد تخفیف"
                autocomplete="off"
                data-vv-scope="discountCode"
                :class="{ 'is-invalid': errors.has('discountCode.code') }"
              />
              <button
                type="button"
                class="btn btn-primary laviz-btn-apply"
                @click="approveDiscountCode()">
                اعمال
              </button>
            </div>
            <div
              class="d-flex align-items-center justify-content-between mt-2"
              v-if="discountCode.code_valid_status"
            >
              <span class="text-success small" style="font-weight: 700">{{ formatNum(Math.round(bill.discount_amount)) }} تومان تخفیف اعمال شد</span>
              <button type="button" class="btn btn-outline-secondary" @click="cancelDiscountCode()">لغو</button>
            </div>
          </section>
        </div>
        <!-- ✅ نمایش محصولات انتخاب شده -->
  <!-- <div class="col-md-12 mt-2" v-if="selectedProducts.length > 0">
    <div class="content-box p-3 bg-light">
      <div class="d-flex justify-content-between align-items-center mb-2">
        <strong>خرید شما:</strong>
        <b-badge variant="primary">{{ selectedProducts.length }} مورد</b-badge>
      </div>
      
      <div 
        v-for="item in selectedProducts" 
        :key="item.name"
        class="d-flex justify-content-between align-items-center py-1 border-bottom"
      >
        <div class="text-right">
          <div class="font-weight-bold">{{ item.name }}</div>
          <small class="text-muted">
            {{ item.count }} {{ item.unit_name }} × {{ formatNum(item.price) }} تومان
          </small>
        </div>
        <div class="text-left font-weight-bold text-success">
          {{ formatNum(item.total) }} تومان
        </div>
      </div>
      
      <div class="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
        <small class="text-muted">جمع جزئی:</small>
        <strong>{{ formatNum(selectedItemsTotal) }} تومان</strong>
      </div>
    </div>
  </div>  -->
        <!-- HIDDEN[invoice-summary]: switched off on request. Delete the
             `false &&` below to bring the card back. -->
        <div v-if="false" class="col-md-12 mt-2">
          <section class="laviz-section">
            <h2 class="laviz-section__title">
              <span class="laviz-section__title-num">۳</span>
              خلاصه فاکتور
            </h2>
            <div class="laviz-checkout-summary">
              <div v-if="!selectedProducts.length" class="laviz-checkout-summary__empty text-muted text-center py-3">
                هنوز غذایی انتخاب نشده است.
              </div>

              <template v-else>
                <div class="laviz-checkout-summary__items">
                  <div
                    v-for="item in selectedProducts"
                    :key="item.key"
                    class="laviz-checkout-summary__item"
                  >
                    <div class="laviz-checkout-summary__item-name">
                      {{ item.name }}
                      <small class="text-muted d-block">
                        {{ item.count }} {{ item.unit_name }} × {{ formatNum(item.price) }} تومان
                      </small>
                    </div>
                    <div class="laviz-checkout-summary__item-price">
                      {{ formatNum(item.total) }} تومان
                    </div>
                  </div>
                </div>

                <div class="laviz-checkout-summary__row">
                  <span>جمع اقلام</span>
                  <span>{{ formatNum(bill.total_amount) }} تومان</span>
                </div>

                <div
                  class="laviz-checkout-summary__row"
                  v-if="delivery_type === 'sendToMe' && bill.shipping_amount > 0"
                >
                  <span>هزینه ارسال (پیک)</span>
                  <span>+ {{ formatNum(bill.shipping_amount) }} تومان</span>
                </div>

                <div
                  class="laviz-checkout-summary__row"
                  v-if="delivery_type === 'sendToMe' && bill.shipping_amount === 0"
                >
                  <span>هزینه ارسال (پیک)</span>
                  <span class="text-muted">رایگان</span>
                </div>

                <div
                  class="laviz-checkout-summary__row"
                  v-if="bill.tax_amount > 0"
                >
                  <span>مالیات{{ taxPercent ? ` (${taxPercent}٪)` : '' }}</span>
                  <span>+ {{ formatNum(bill.tax_amount) }} تومان</span>
                </div>

                <div
                  class="laviz-checkout-summary__row"
                  v-if="bill.discount_amount > 0"
                >
                  <span>تخفیف{{ discountCode.code ? ` (${discountCode.code})` : '' }}</span>
                  <span class="text-danger">− {{ formatNum(bill.discount_amount) }} تومان</span>
                </div>

                <div class="laviz-checkout-summary__row laviz-checkout-summary__total">
                  <span>مبلغ قابل پرداخت</span>
                  <span>{{ formatNum(bill.payment_amount) }} تومان</span>
                </div>
              </template>
            </div>
          </section>
        </div>
        </div><!-- /laviz-checkout-details -->

        </div><!-- /laviz-cart-modal__scroll -->

        <!-- Payment is only offered once we know who the customer is; guests
             are sent to the phone/OTP modal first and land back here. -->
        <div class="laviz-cart-modal__cta">
          <div class="laviz-cart-modal__total">
            <small>مبلغ قابل پرداخت</small>
            <strong :key="bill.payment_amount" class="laviz-total-tick">{{ formatNum(bill.payment_amount) }} تومان</strong>
          </div>
          <!-- Says why the pay button is off: a warning between the amount and the
               pay button, which sits at the left edge. -->
          <span v-if="auth.is_login && addressMissing" class="laviz-cart-modal__warn" role="status">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
              <path d="M12 3.5 2.8 19.5h18.4L12 3.5z" /><path d="M12 10v4.2M12 17.2v.1" />
            </svg>
            <span>آدرس تحویل را وارد کنید</span>
          </span>
          <button
            v-if="auth.is_login"
            type="button"
            class="laviz-btn-pay"
            :disabled="addressMissing"
            @click="order()"
          >پرداخت و ثبت سفارش</button>
          <button
            v-else
            type="button"
            class="laviz-btn-pay"
            @click="startLoginFromCart"
          >ورود یا ثبت‌نام</button>
        </div>
        </div><!-- /laviz-cart-modal -->

      </div>

      <!-- ROLLBACK[sticky-pay-cta]: the old always-on pay bar. The new flow
           uses stickyContinueBar.vue (menu step) and shows this pay bar only
           once the customer is in the details step. To restore the previous
           behaviour, drop the v-if below and remove <sticky-continue-bar>. -->
      <div class="laviz-sticky-cta" v-if="false">
        <div class="laviz-sticky-cta__inner">
          <div class="laviz-sticky-cta__price">
            <small>مبلغ قابل پرداخت</small>
            <strong>{{ formatNum(bill.payment_amount) }} تومان</strong>
          </div>
          <button type="button" class="laviz-btn-pay" @click="order()">
            پرداخت و ثبت سفارش
          </button>
        </div>
      </div>

      <menu-sheet
        :visible.sync="menuSheetVisible"
        :categories="sheetCategories"
        @select="scrollToCategory"
      />

      <sticky-continue-bar
        v-if="!cartOpen"
        :itemCount="selectedProducts.length"
        :total="selectedItemsTotal"
        :isLoggedIn="auth.is_login"
        @continue="openCart"
      />

      <!-- Every line comes from the settings panel; the address and phone
           numbers used to be three hardcoded copies across two pages. -->
      <footer class="laviz-footer container">
        <p>{{ shopInfo.address }}</p>
        <p v-if="shopInfo.managerName" class="small">مدیریت: {{ shopInfo.managerName }}</p>
        <p v-if="shopInfo.phone">تلفن: <a :href="'tel:' + shopInfo.phone">{{ shopInfo.phone }}</a></p>
        <p>پشتیبانی: <a :href="'tel:' + supportPhone">{{ supportPhone }}</a></p>
        <a
          v-if="enamad.id && enamad.code"
          class="laviz-footer__seal d-inline-block mt-2"
          referrerpolicy="origin"
          target="_blank"
          :href="'https://trustseal.enamad.ir/?id=' + enamad.id + '&Code=' + enamad.code"
        >
          <img
            referrerpolicy="origin"
            :src="'https://Trustseal.eNamad.ir/logo.aspx?id=' + enamad.id + '&Code=' + enamad.code"
            alt="نماد اعتماد الکترونیک"
            style="cursor: pointer;"
            :id="enamad.code"
          />
        </a>
      </footer>
      <delivery-time-sheet
        :visible.sync="timeSheetOpen"
        :times="(deliveryItems[delivery_date] && deliveryItems[delivery_date].deliveryTimes) || []"
        :value="timeMode === 'scheduled' ? delivery_time : null"
        :day-label="timeSheetDayLabel"
        @select="onTimePicked"
      />
      <map-picker-modal
        :open="mapModalOpen"
        :lat="delivery_lat"
        :lng="delivery_lng"
        :center-lat="Number(mapCenter.lat)"
        :center-lng="Number(mapCenter.lng)"
        :restaurant-name="shopInfo.name"
        :restaurant-address="shopInfo.address"
        @confirm="onMapConfirm"
        @close="mapModalOpen = false"
      />
      <review-modal ref="reviewModal" @submitted="onReviewSubmitted" />
      <!-- A new discount code, shown once (see showNewCodesOnce). -->
      <offer-sheet :offer="autoOffer" :show-basket-note="true" :show-code="false" @close="closeAutoOffer" />
      <success-login-modal
        @order="order"
        :auth="auth"/>
      <register-modal
        @onRegister="registerSuccess"
        @onLogin="loginSuccess"
        @closed="onLoginModalClosed"
        @order="order"
        :auth="auth"/>
      <bill-modal
        :display_product="display_product"
        :product-data="productData"
        :products="products"
        :bill-data="billData"
        :delivery_date="deliveryItems[delivery_date]? deliveryItems[delivery_date].date: null"
        :day-label="delivery_date === -1 ? '' : getDeliveryItemText(delivery_date)"
        :delivery_time="delivery_time"
        :check_one="check_one"
        :delivery_address="fullDeliveryAddress"
        :delivery-address-title="selectedAddressTitle"
        :shipping-cost="shippingCost"
        :discount-code="discountCode"
        :delivery_type="delivery_type"
        :delivery-lat="delivery_lat"
        :delivery-lng="delivery_lng"
        :address-id="selectedAddressId"
        :order-comment="orderComment"
        :auth="auth"/>
      <profile-modal
        ref="profileModal"
        :support-phone="supportPhone"
        :map-center="mapCenter"
        @addresses-changed="refreshSavedAddresses"
      />
      <image-details-modal :visible.sync="imageOpen" :src="modal.image" :name="modal.name" :description="modal.description"/>
      <pwa-call-out :text="pwaCallOutText"/>
    </div>

  </div>
  </div>
</template>

<script>
import moment from "moment-jalaali";
// import moment from 'moment/min/moment-with-locales'
// moment.locale('fa')
import 'moment/locale/fa'  // برای فارسی
moment.locale('fa')
import PwaCallOut from "../components/pwa-call-out.vue";
import SuccessLoginModal from "./index/components/successLoginModal.vue";
import MapPickerModal from "~/components/MapPickerModal.vue";
import MapPreview from "~/components/MapPreview.vue";
import ActiveOrderCard from "./index/components/activeOrderCard.vue";
import { confirmedBankCard } from '~/utils/bankCard.cjs';
import LastOrderReviewCard from "./index/components/lastOrderReviewCard.vue";
import ReviewModal from "./profile/components/reviewModal.vue";
import reveal from "../utils/reveal";
import { trackTaps, flyToCart, reducedMotion } from "../utils/motion";
import DeliveryTimeSheet from "./index/components/deliveryTimeSheet.vue";
import RegisterModal from "./index/components/registerModal.vue";
import BillModal from "./index/components/billModal.vue";
import Vue from "vue";
import ProductItem from "~/pages/index/components/productItem.vue";
import ImageDetailsModal from "@/pages/index/components/image-details-modal.vue";
import ProfileModal from "./index/components/profileModal.vue";
import MapPicker from "~/components/MapPicker.vue";
import MenuCategoryNav from "./index/components/menuCategoryNav.vue";
import DeliveryTypeBar from "./index/components/deliveryTypeBar.vue";
import MenuSheet from "./index/components/menuSheet.vue";
import DiscountSection from "./index/components/discountSection.vue";
import OfferSheet from "./index/components/offerSheet.vue";
import ManagementMessageBanner from "~/components/ManagementMessageBanner.vue";

// How often the order card asks the server for the order's new status (see
// refreshOrderStatus).
const ORDER_POLL_MS = 3 * 60 * 1000;
import { personalOffer, readSeenIds, rememberSeenId, isUnseen } from "~/utils/offers";
import { isAcknowledged, rememberAckedOrderId } from "~/utils/orderAck";
import { takeReorder } from "~/utils/reorder";
import ChefDailyTab from "./index/components/chefDailyTab.vue";
import StickyContinueBar from "./index/components/stickyContinueBar.vue";
import { applyAppModeTheme } from "~/utils/appModeTheme";
import { DEFAULT_MAP_CENTER } from "~/utils/mapir";
import { openOrderReceiptForPrint } from "~/utils/orderReceipt";
import { formatJalaliDate } from "~/utils/persianDate";
import { isOrderScheduledForTodayOrLater } from "~/utils/orderScheduleDate";
import restoreCustomerSession from "~/utils/customerSession.cjs";
import checkoutDraft from "~/utils/checkoutDraft.cjs";
import { visibleDeliveryOptions, deliveryDayLabel } from "~/utils/deliveryOptions";

// Sentinel id for the synthetic "غذای روز سرآشپز" tab. It is not a real
// product_category row, so it must never collide with a uuid.
const CHEF_TAB_ID = '__chef_daily__';

moment.loadPersian(true, {dialect: "persian-modern"});

export default {
  name: "index",
  directives: {reveal},
  components: {ManagementMessageBanner, OfferSheet, ActiveOrderCard, LastOrderReviewCard, ReviewModal, DeliveryTimeSheet, MapPickerModal, MapPreview, ImageDetailsModal, ProductItem, ChefDailyTab, BillModal, RegisterModal, SuccessLoginModal, PwaCallOut, ProfileModal, MapPicker, MenuCategoryNav, DeliveryTypeBar, MenuSheet, DiscountSection, StickyContinueBar},
  data() {
    return {
      modal: {
        image: null,
        name: '',
        description: '',
      },
      loading: true,
      loadError: false,
      shippingCost: 0,
      tax_amount: 0,
      taxEnabled: false,
      taxPercent: 0,
      delivery_lat: null,
      plaque: '',
      timeMode: 'asap', // 'asap' = earliest slot, 'scheduled' = picked in the sheet
      timeSheetOpen: false,
      mapModalOpen: false,
      imageOpen: false,
      countDir: 'up', // direction of the last quantity change, for the number roll
      theme: 'light', // 'light' | 'dark'; mirrors <html data-theme>, set before paint by app.html
      delivery_lng: null,
      selectedAddressId: null,
      addressOverridden: false,
      addressesRequest: 0,
      addressesLoaded: false,
      addressesInitialized: false,
      orderComment: '',
      currentOrder: null,
      refundCardNumber: '',
      refundCardOwner: '',
      refundCardRequest: 0,
      currentOrderItems: [],
      // The latest delivered order, offered for a review at the top of the page.
      reviewOrder: null,
      downloadingReceiptId: null,
      showCurrentOrderDetails: false,
      supportPhone: '09155611540',
      // Overwritten from /core/initialize; these are only what shows before
      // the first response lands.
      enamad: { id: '8159726', code: 'BPjiYd4x54ASb7bcPXYqLLO7EyG86QNC' },
      pwaCallOutText: 'اپ لاویز را به صفحه اصلی گوشی خود اضافه نمایید.',
      shopInfo: {
        name: 'رستوران لاویز',
        address: 'بلوار بسیج، بعد از سالن آزادی، میدان شهدا، خیابان بصیرت',
        phone: '05632499000',
        managerName: 'تراب‌زاده مقدم',
        supportPhone: '09155611540',
      },
      mapCenter: {
        lat: DEFAULT_MAP_CENTER.lat,
        lng: DEFAULT_MAP_CENTER.lng,
        address: DEFAULT_MAP_CENTER.address,
        name: 'رستوران لاویز',
      },
      savedAddresses: [],
      mode: null,
      auth: {
        is_login: false,
        token: null,
        user: {},
        discountCodeRequest: false,
      },
      display_product: false,
      deliveryItems: [],
      deliveryTimes: [],
      deliveryTypeOptions: [
        { text: "حضوری میام", value: "iWillCome" },
        { text: "برام ارسال کنید", value: "sendToMe" },
      ],
      discountCode: {
        code: null,
        code_valid_status: false,
        discount_percent: 0,
        // The most the code can take off (toman), from the server; 0 = no cap.
        max_amount: 0,
      },
      bill: {
        discount_amount: 0,
        total_amount: 0,
        shipping_amount: 0,
        tax_amount: 0,
        decreased_amount: 0,
        payment_amount: 0,
      },
      // Pickup is the default order method unless settings hide it.
      delivery_type: 'iWillCome',
      delivery_date: -1,
      delivery_time: null,
      check_one: false,
      delivery_address: null,
      delivery_description: null,
      in_person_description: null,
      loading_payment: false,
      billData: {
        total_amount: null,
        discount_amount: null,
        payment_amount: null,
        is_first_order: null,
      },
      menuTypeOrder: null,
      sumInCurrentMenu: 0,
      tabIndex: 0,
      currentActiveTabId: null,
      CHEF_TAB_ID,
      // The basket sheet covers the screen; the menu stays mounted behind it.
      cartOpen: false,
      // Set when a guest pressed "ادامه" and still has to authenticate.
      pendingContinue: false,
      profileLoginPending: false,
      // Scrollspy bookkeeping (not reactive UI state, but kept here so the
      // component instance owns them and they are torn down with it).
      menuSheetVisible: false,
      headerCollapsed: false,
      // Scroll down hides everything above the category tabs; the first scroll
      // up brings it back. The tabs stay pinned either way.
      headerHidden: false,
      headerHideOffset: 0,
      lastScrollY: 0,
      headerHeight: 264,
      searchOpen: false,
      menuSearch: '',
      etaMinutes: 0,
      showProductRating: false,
      labels: {
        deliveryEta: 'تحویل فوری تا {value} دقیقه',
        pickupEta: 'آماده‌سازی تا {value} دقیقه',
        shippingChip: 'ارسال: {value}',
      },
      myActiveCodes: [],
      // A freshly issued code the customer has not seen yet, shown once by itself
      // on the first page (see showNewCodesOnce), and the ones still waiting.
      autoOffer: null,
      autoOfferQueue: [],
      publicOffers: [],
      suppressScrollSpy: false,
      scrollSpyTimer: null,
      scrollSpyFrame: null,
    };
  },
  created() {
    Vue.prototype.formatNum = (n) => {
      var n = ("" + n).split(".");
      var num = n[0];
      var dec = n[1];
      var r, s, t;

      if (num.length > 3) {
        s = num.length % 3;

        if (s) {
          t = num.substring(0, s);
          num = t + num.substring(s).replace(/(\d{3})/g, ",$1");
        } else {
          num = num
            .substring(s)
            .replace(/(\d{3})/g, ",$1")
            .substring(1);
        }
      }

      if (dec && dec.length > 3) {
        dec = dec.replace(/(\d{3})/g, "$1 ");
      }

      return num + (dec ? "." + dec : "");
    };
  },
  mounted() {


    const deviceCredential = this.$restaurantMock && this.$restaurantMock.isDeviceCredential();
    const session = deviceCredential ? null : restoreCustomerSession(localStorage, this.$axios);
    if (session) {
      this.auth.token = session.token;
      this.auth.user = session.user;
      this.auth.is_login = true;
      this.loadCurrentOrder();
      this.loadReviewOrder();
    }
    const draft = checkoutDraft.takeCheckoutDraft(this.$store, session && session.token);
    if (draft) Object.assign(this, draft);
    this.checkoutDraftRestored = !!draft;
    this.initialize();

    trackTaps();
    this.theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
    this.syncThemeColor();
    this.$nextTick(this.syncHeaderHeight);
    // The header changes height as data arrives (chips, banners) and when the
    // viewport changes; keep the spacer under it in step so no content hides.
    const headerEl = document.querySelector('.main-fixed-header');
    if (headerEl && window.ResizeObserver) {
      this.headerObserver = new ResizeObserver(() => this.syncHeaderHeight());
      this.headerObserver.observe(headerEl);
    }
    window.addEventListener('scroll', this.onMenuScroll, { passive: true });
    window.addEventListener('resize', this.onMenuScroll, { passive: true });
    // One shared timer: messages refresh even when there is no current order.
    this.syncCustomerPoll();
    document.addEventListener('visibilitychange', this.onVisibilityForOrder);
    window.addEventListener('storage', this.onRefundSessionStorage);
  },

  beforeRouteLeave(to, from, next) {
    if (to.path === '/immersive-menu' && (localStorage.getItem('token') || null) === (this.auth.token || null)) {
      checkoutDraft.saveCheckoutDraft(this.$store, this.auth.token, this);
    } else checkoutDraft.clearCheckoutDraft(this.$store);
    next();
  },
  beforeDestroy() {
    this.clearRefundCard();
    window.removeEventListener('storage', this.onRefundSessionStorage);
    clearInterval(this.orderPollTimer);
    document.removeEventListener('visibilitychange', this.onVisibilityForOrder);
    if (this.headerObserver) this.headerObserver.disconnect();
    if (process.client) document.body.style.overflow = '';
    window.removeEventListener('scroll', this.onMenuScroll);
    window.removeEventListener('resize', this.onMenuScroll);
    clearTimeout(this.scrollSpyTimer);
    if (this.scrollSpyFrame) cancelAnimationFrame(this.scrollSpyFrame);
  },
  methods: {
    clearRefundCard() {
      this.refundCardRequest++;
      this.refundCardNumber = '';
      this.refundCardOwner = '';
    },
    onRefundSessionStorage(event) {
      if (event.key === null || event.key === 'token' || event.key === 'user') {
        this.clearRefundCard();
        checkoutDraft.clearCheckoutDraft(this.$store);
      }
    },
    async loadRefundCard(token) {
      this.clearRefundCard();
      if (!token || localStorage.getItem('token') !== token) return;
      const request = this.refundCardRequest;
      try {
        // BACKEND: proposed bankCardNumber on authenticated GET /profile, §14.
        // One read per rejected-order/session mount, never cached in auth.user/storage.
        const response = await this.$axios.get('/api/enduser/profile', { privateBankCard: true });
        if (this._isDestroyed || this._isBeingDestroyed || request !== this.refundCardRequest ||
            this.refundCustomerKey !== token || localStorage.getItem('token') !== token) return;
        this.refundCardNumber = confirmedBankCard(response.data?.bankCardNumber);
        this.refundCardOwner = token;
      } catch (_) {
        // No prior customer's number survives a failed or unauthenticated read.
        if (request === this.refundCardRequest) this.clearRefundCard();
      }
    },
    syncCustomerPoll() {
      clearInterval(this.orderPollTimer);
      this.orderPollTimer = null;
      if (this.auth.is_login) this.orderPollTimer = setInterval(this.pollOrderStatus, ORDER_POLL_MS);
    },
    openProfileLogin() {
      if (this.auth.is_login) {
        this.$router.push('/profile');
        return;
      }
      this.profileLoginPending = true;
      this.$bvModal.show('modal-login');
    },
    onLoginModalClosed() {
      // Closing the dialog must not turn a later login into a profile redirect
      // or an unexpected basket.
      this.profileLoginPending = false;
      this.pendingContinue = false;
    },
    pickSavedAddress(addr, automatic = false) {
      if (!automatic) this.addressOverridden = true;
      this.selectedAddressId = addr.id;
      this.plaque = ''; // a saved address already carries its plaque in the text
      this.delivery_address = addr.address;
      this.delivery_lat = addr.lat;
      this.delivery_lng = addr.lng;
      this.recalcShippingPreview();
    },
    onManualAddressInput() {
      this.addressOverridden = true;
      this.selectedAddressId = null;
    },
    applyDefaultAddress() {
      if (!this.addressesInitialized || this.addressOverridden || !this.auth.is_login) return;
      // BACKEND: use the existing profile address isDefault flag; no new field is sent.
      const address = this.savedAddresses.find(a => a.isDefault);
      if (address) this.pickSavedAddress(address, true);
    },
    /** Light/dark switch. The choice is kept on this device (localStorage, with a
     *  cookie as a fallback) and read back by the script in app.html on the next load. */
    toggleTheme(event) {
      const next = this.theme === 'dark' ? 'light' : 'dark';
      const root = document.documentElement;
      const apply = () => {
        root.setAttribute('data-theme', next);
        this.theme = next;
        try { localStorage.setItem('laviz_theme', next); } catch (e) { /* private mode */ }
        document.cookie = `laviz_theme=${next}; max-age=31536000; path=/; SameSite=Lax`;
        this.syncThemeColor();
      };

      // Transitioning each element's colours separately made borders and
      // backgrounds change at different moments. Instead the browser takes a
      // picture of the old page and the new theme grows over it from the
      // button, so every line and fill changes together. Browsers without the
      // View Transitions API simply switch at once.
      if (typeof document.startViewTransition !== 'function' || reducedMotion()) {
        apply();
        return;
      }
      const button = event && event.currentTarget && event.currentTarget.getBoundingClientRect
        ? event.currentTarget.getBoundingClientRect()
        : null;
      const x = button ? button.left + button.width / 2 : window.innerWidth / 2;
      const y = button ? button.top + button.height / 2 : 0;
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
      const transition = document.startViewTransition(async () => {
        apply();
        await this.$nextTick();
      });
      transition.ready.then(() => {
        root.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 560, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', pseudoElement: '::view-transition-new(root)' },
        );
      }).catch(() => { /* a skipped transition still ends in the new theme */ });
    },
    /** Browser chrome (status bar / address bar) follows the theme. */
    syncThemeColor() {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', this.theme === 'dark' ? '#17181a' : '#ffffff');
    },
    /** + / − in the basket: a light tap on phones that support it, and a rolling number. */
    onCartStep(key, direction) {
      const item = this.productData[key];
      if (!item) return;
      this.countDir = direction > 0 ? 'up' : 'down';
      if (navigator.vibrate) { try { navigator.vibrate(8); } catch (e) { /* not allowed */ } }
      if (direction > 0) this.addProductCount(key, item.add_unit);
      else this.subProductCount(key, item.add_unit);
    },
    /** Adds one unit from the menu and, if it took, lets a dot fly to the basket. */
    onProductAdd(key) {
      const item = this.productData[key];
      if (!item) return;
      const before = item.count;
      this.addProductCount(key, item.add_unit);
      if (this.productData[key].count > before) this.$nextTick(() => { if (!this.cartOpen) flyToCart(); });
    },
    /** Opens the phone's own navigation to the restaurant: on Android the
     *  system offers every installed map app, on iOS Apple Maps opens, and on a
     *  computer Google Maps opens in a new tab. */
    openNavigation() {
      const lat = Number(this.mapCenter.lat);
      const lng = Number(this.mapCenter.lng);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
      const name = encodeURIComponent(this.shopInfo.name || '');
      const ua = navigator.userAgent || '';
      const isIOS = /iPhone|iPad|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      if (/android/i.test(ua)) {
        window.location.href = `geo:${lat},${lng}?q=${lat},${lng}(${name})`;
      } else if (isIOS) {
        window.location.href = `https://maps.apple.com/?daddr=${lat},${lng}&dirflg=d&q=${name}`;
      } else {
        window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`, '_blank', 'noopener');
      }
    },
    /** The customer confirmed a spot on the full-screen map. */
    onMapConfirm({ lat, lng }) {
      this.addressOverridden = true;
      this.delivery_lat = lat;
      this.delivery_lng = lng;
      this.selectedAddressId = null; // the position no longer matches a saved address
      // The typed address is the customer's own words: the map never edits it.
      this.mapModalOpen = false;
      this.recalcShippingPreview();
    },
    async refreshSavedAddresses() {
      if (!this.auth.is_login) return;
      const token = this.auth.token;
      const request = ++this.addressesRequest;
      try {
        const res = await this.$axios.get('/api/enduser/profile/addresses');
        if (request !== this.addressesRequest || !this.auth.is_login || this.auth.token !== token) return;
        this.savedAddresses = Array.isArray(res.data) ? res.data : [];
        this.addressesLoaded = true;
        this.applyDefaultAddress();
      } catch (e) {
      }
    },
    async recalcShippingPreview() {
      if (this.delivery_type !== 'sendToMe' || !this.delivery_lat) return;
      try {
        const products = [];
        for (const product of this.products) {
          if (this.productData[product.key]?.count) {
            products.push({ product_id: product.key, count: this.productData[product.key].count });
          }
        }
        if (!products.length) return;
        const res = await this.$axios.post('/api/enduser/order/preview', {
          products,
          delivery_type: 'sendToMe',
          delivery_lat: this.delivery_lat,
          delivery_lng: this.delivery_lng,
          discount_code: this.discountCode.code,
        });
        this.shippingCost = res.data.shipping_cost ?? this.shippingCost;
        this.calcBill();
      } catch (e) {
      }
    },
    /**
     * The order that is still on its way, for the card at the top of the page.
     * `keepOnError`: a refresh that fails (no network for a moment) leaves the card
     * as it is instead of hiding it.
     */
    async loadCurrentOrder({ keepOnError = false } = {}) {
      this.lastOrderPoll = Date.now();
      try {
        const res = await this.$axios.get('/api/enduser/profile/orders/current', {
          params: { _refresh: Date.now() },
          headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
        });
        // An order the restaurant did not accept stays until the customer taps
        // «متوجه شدم» (see acknowledgeRejectedOrder); after that it is history.
        if (res.data?.order && !isAcknowledged(res.data.order) && isOrderScheduledForTodayOrLater(res.data.order)) {
          this.currentOrder = res.data.order;
          this.currentOrderItems = (res.data.items || []).map((i) => ({
            title: i.productTitle || 'محصول',
            count: i.count,
            lineTotal: Number(i.amount) * Number(i.count),
          }));
        } else {
          this.currentOrder = null;
          this.currentOrderItems = [];
        }
      } catch (e) {
        if (keepOnError) return;
        this.currentOrder = null;
        this.currentOrderItems = [];
      }
    },
    /**
     * HOW THE ORDER'S STATUS REACHES THE PAGE
     *
     * Today: polling. While an order is on its way and the page is visible, the app
     * asks GET /profile/orders/current every ORDER_POLL_MS (3 minutes), and again
     * when the customer comes back to the tab after that long. When the order is no
     * longer current (delivered), the delivered-order review card takes its place.
     *
     * Ready for something faster: whatever the server can push instead (server-sent
     * events, a WebSocket, a web-push message) only has to call
     * onOrderStatusChanged(); the page then fetches the new state the same way. The
     * answer of /profile/orders/current stays the single source of truth.
     *
     * FOR THE BACKEND: keep /profile/orders/current cheap (it is called every few
     * minutes per open page). An ETag / If-None-Match (or a 304 when nothing changed)
     * would make a poll almost free. A push channel is welcome later; it needs no
     * app change beyond the call above.
     */
    async refreshOrderStatus() {
      if (!this.auth.is_login) return;
      const hadOrder = !!this.currentOrder;
      await this.loadCurrentOrder({ keepOnError: true });
      // The order is over: its review card appears.
      if (hadOrder && !this.currentOrder) this.loadReviewOrder();
    },
    onOrderStatusChanged() {
      return this.refreshOrderStatus();
    },
    /**
     * «متوجه شدم» on the orange card of an order the restaurant did not accept: the
     * card is gone (it has already faded out), the server and this device are told,
     * and the order lives on in the profile's order history. See utils/orderAck.js.
     */
    acknowledgeRejectedOrder(order) {
      rememberAckedOrderId(order.id);
      this.$axios
        .put(`/api/enduser/profile/orders/${order.id}/acknowledge`)
        .catch(() => { /* this device already remembers it */ });
      this.currentOrder = null;
      this.currentOrderItems = [];
      this.$bvToast.toast('این سفارش به سوابق سفارش‌ها در پروفایل رفت.', { variant: 'warning', solid: true });
    },
    pollOrderStatus() {
      if (!this.auth.is_login || document.visibilityState !== 'visible') return;
      this.$refs.managementMessages?.refresh();
      if (this.currentOrder) this.refreshOrderStatus();
    },
    onVisibilityForOrder() {
      if (!this.auth.is_login || document.visibilityState !== 'visible') return;
      this.$refs.managementMessages?.refresh();
      if (this.currentOrder && Date.now() - this.lastOrderPoll >= ORDER_POLL_MS) this.refreshOrderStatus();
    },
    /**
     * The newest delivered order (status 4 or 20), unless the customer already
     * reviewed or closed it. Orders that are still on their way are the status
     * card's business (loadCurrentOrder).
     */
    async loadReviewOrder() {
      this.reviewOrder = null;
      if (!process.client) return;
      try {
        const { data } = await this.$axios.get('/api/enduser/profile/orders');
        const hidden = this.hiddenReviewIds();
        const delivered = (Array.isArray(data) ? data : [])
          .filter((o) => [4, 20].includes(Number(o.status)))
          .sort((a, b) => new Date(b.createDate) - new Date(a.createDate));
        const latest = delivered[0];
        this.reviewOrder = latest && !hidden.includes(latest.id) ? latest : null;
      } catch (e) {
        this.reviewOrder = null;
      }
    },
    hiddenReviewIds() {
      try {
        const ids = JSON.parse(localStorage.getItem('laviz_review_dismissed') || '[]');
        return Array.isArray(ids) ? ids : [];
      } catch (e) {
        return [];
      }
    },
    /** Remembers an order as handled (reviewed or closed) so its card stays away. */
    hideReviewOrder(orderId) {
      try {
        const ids = [orderId, ...this.hiddenReviewIds().filter((id) => id !== orderId)].slice(0, 20);
        localStorage.setItem('laviz_review_dismissed', JSON.stringify(ids));
      } catch (e) { /* storage blocked: the card simply returns next visit */ }
      if (this.reviewOrder && this.reviewOrder.id === orderId) this.reviewOrder = null;
    },
    dismissReviewOrder() {
      if (this.reviewOrder) this.hideReviewOrder(this.reviewOrder.id);
    },
    // `rating` is set when a star on the first page's review card was tapped.
    openReview(order, rating) {
      this.$refs.reviewModal.open(order, rating);
    },
    onReviewSubmitted(orderId) {
      this.hideReviewOrder(orderId);
    },
    async downloadReceipt(order) {
      if (!order?.id) return;
      this.downloadingReceiptId = order.id;
      try {
        await openOrderReceiptForPrint(this.$axios, order);
        this.$bvToast.toast('از پنجرهٔ چاپ، گزینهٔ «ذخیره به‌صورت PDF» را انتخاب کنید.', { variant: 'info' });
      } catch (e) {
        const message = e.code === 'POPUP_BLOCKED'
          ? 'برای نمایش رسید، بازشدن پنجرهٔ جدید را در مرورگر مجاز کنید.'
          : e.response?.data?.message || 'خطا در آماده‌سازی رسید';
        this.$bvToast.toast(typeof message === 'string' ? message : 'خطا در آماده‌سازی رسید', { variant: 'danger' });
      } finally {
        this.downloadingReceiptId = null;
      }
    },
    dateSelection(index) {
      if (!this.deliveryItems[index].status)
        return;
      this.delivery_date = index;
    },
    openSearch() {
      this.searchOpen = true;
      this.$nextTick(() => this.$refs.menuSearch && this.$refs.menuSearch.focus());
    },
    closeSearch() {
      this.searchOpen = false;
      this.menuSearch = '';
    },

    // Chef's-daily foods live in their own weekly section, not in categories.
    categoryProducts(categoryId) {
      return this.$store.getters['basket/categoryProducts'](categoryId, this.menuSearch || '');
    },
    addChefDailyProduct(productKey) {
      const product = this.productData[productKey];
      if (product) this.onProductAdd(productKey);
    },
    subChefDailyProduct(productKey) {
      const product = this.productData[productKey];
      if (product) this.subProductCount(productKey, product.add_unit);
    },
    async loadMyDiscountCodes() {
      if (!this.auth.is_login) { this.myActiveCodes = []; return; }
      try {
        const { data } = await this.$axios.get('/api/enduser/profile/active-discount-codes');
        this.myActiveCodes = data || [];
      } catch (e) {
        this.myActiveCodes = [];
        return;
      }
      this.showNewCodesOnce();
    },
    /**
     * A code issued to the customer that they have not been shown yet opens its
     * details sheet by itself, once, on the first page. Each code is marked as seen
     * the moment it is shown (on the server and on this device; see utils/offers.js),
     * so it never comes back; if there are several, they show one after another.
     */
    showNewCodesOnce() {
      if (this.autoOffer) return;
      const seen = readSeenIds();
      const fresh = (this.myActiveCodes || []).filter((code) => isUnseen(code, seen));
      if (!fresh.length) return;
      this.autoOfferQueue = fresh;
      this.showNextAutoOffer();
    },
    showNextAutoOffer() {
      const code = this.autoOfferQueue.shift();
      if (!code) return;
      this.autoOffer = personalOffer(code);
      rememberSeenId(code.id);
      this.$axios
        .put(`/api/enduser/profile/active-discount-codes/${code.id}/seen`)
        .catch(() => { /* the device already remembers it */ });
    },
    closeAutoOffer() {
      this.autoOffer = null;
      // Let the sheet slide away before the next code slides in.
      if (this.autoOfferQueue.length) setTimeout(() => this.showNextAutoOffer(), 400);
    },
    pickMyCode(c) {
      this.discountCode.code = c.code;
      this.approveDiscountCode();
    },
    /** "Apply" on a code card in the basket: fills the field and checks the code. */
    applyOffer(code) {
      this.discountCode.code = code;
      this.approveDiscountCode();
    },
    remainingLabel(c) {
      if (c.remainingDays === null || c.remainingDays === undefined) return 'بدون محدودیت';
      if (c.remainingDays === 0) return 'امروز آخرین مهلت';
      if (c.remainingDays === 1) return 'یک روز مانده';
      return `${c.remainingDays} روز مانده`;
    },
    openCart() {
      if (!this.selectedProducts.length) return;
      // A guest signs in first; the basket opens by itself right after
      // (advanceToDetails), without the "welcome" dialog in between.
      if (!this.auth.is_login) { this.startLoginFromCart(); return; }
      this.cartOpen = true;
      this.loadMyDiscountCodes();
      if (process.client) document.body.style.overflow = 'hidden';
    },
    closeCart() {
      this.cartOpen = false;
      if (process.client) document.body.style.overflow = '';
    },
    /** Guests: collect the phone number and OTP, then come back to the sheet. */
    startLoginFromCart() {
      this.pendingContinue = true;
      this.$bvModal.show('modal-login');
    },
    advanceToDetails() {
      // Called after a successful login/register: the basket sheet stays open
      // and now shows the payment button instead of the login one.
      this.pendingContinue = false;
      this.cartOpen = true;
      this.loadMyDiscountCodes();
      if (process.client) document.body.style.overflow = 'hidden';
    },
    handleTabChange(newTabIndex) {
      const activeCategories = this.menuNavCategories;
      if (activeCategories[newTabIndex]) {
        this.currentActiveTabId = activeCategories[newTabIndex].id;
      } else if (activeCategories[0]) {
        this.currentActiveTabId = activeCategories[0].id;
      }
    },

    // The fixed header covers the top of the viewport, so the "current"
    // section is judged against a line just below it rather than against 0.
    headerOffset(goingDown) {
      const header = document.querySelector('.main-fixed-header');
      if (!header) return 12;
      const full = header.offsetHeight;
      // `goingDown` is passed for programmatic scrolls: the header is about to
      // hide (or show), so aim for the line it will have, not the current one.
      const hidden = goingDown === undefined ? this.headerHidden : goingDown;
      return (hidden ? full - this.headerHideOffset : full) + 12;
    },

    /** Keeps the spacer in step with the header as it collapses and expands. */
    syncHeaderHeight() {
      const header = document.querySelector('.main-fixed-header');
      if (!header) return;
      // Everything above the category tabs is what slides away.
      const tabs = header.querySelector('.laviz-tabs');
      this.headerHideOffset = tabs ? tabs.offsetTop : 0;
      if (header.offsetHeight !== this.headerHeight) {
        this.headerHeight = header.offsetHeight;
      }
    },

    scrollToCategory(categoryId) {
      const el = document.getElementById('menu-cat-' + categoryId);
      if (!el) return;
      // Highlight immediately, then let the scroll settle before the scroll
      // handler takes over again — otherwise it fights the smooth animation.
      this.currentActiveTabId = categoryId;
      this.suppressScrollSpy = true;
      const target = el.getBoundingClientRect().top + window.pageYOffset;
      const goingDown = target > window.pageYOffset + this.headerOffset();
      const top = target - this.headerOffset(goingDown);
      window.scrollTo({ top, behavior: 'smooth' });
      clearTimeout(this.scrollSpyTimer);
      this.scrollSpyTimer = setTimeout(() => {
        this.suppressScrollSpy = false;
      }, 700);
    },

    // Picks the last section whose top has passed under the header. Cheap and
    // predictable; no observer thresholds to tune for short trailing sections.
    updateActiveCategoryFromScroll() {
      if (this.suppressScrollSpy || !this.menuNavCategories.length) return;

      // getBoundingClientRect().top is fractional, so a section scrolled exactly
      // to the line lands a fraction below it and would otherwise be skipped —
      // leaving the strip one section behind. A small tolerance absorbs that.
      const TOLERANCE_PX = 2;
      const line = this.headerOffset() + TOLERANCE_PX;
      let activeId = this.menuNavCategories[0].id;

      for (const cat of this.menuNavCategories) {
        const el = document.getElementById('menu-cat-' + cat.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top - line <= 0) activeId = cat.id;
      }

      // At the very bottom the last section may never reach the line, so make
      // sure it still wins once the page is scrolled all the way down.
      const atBottom =
        window.innerHeight + window.pageYOffset >= document.body.scrollHeight - 2;
      if (atBottom) activeId = this.menuNavCategories[this.menuNavCategories.length - 1].id;

      if (activeId !== this.currentActiveTabId) this.currentActiveTabId = activeId;
    },

    onMenuScroll() {
      if (this.scrollSpyFrame) return;
      this.scrollSpyFrame = requestAnimationFrame(() => {
        this.scrollSpyFrame = null;
        this.updateActiveCategoryFromScroll();
        this.updateHeaderCollapse();
        this.$nextTick(this.syncHeaderHeight);
      });
    },

    /** Hide the header on the way down, show it again on the first move up.
     *  Small deadbands (6px down / 4px up) keep touch jitter from flickering it. */
    updateHeaderCollapse() {
      const y = Math.max(0, window.pageYOffset);
      const dy = y - this.lastScrollY;
      if (y <= 10) {
        this.headerHidden = false;
        this.lastScrollY = y;
      } else if (dy > 6 && y > this.headerHideOffset) {
        this.headerHidden = true;
        this.lastScrollY = y;
      } else if (dy < -4) {
        this.headerHidden = false;
        this.lastScrollY = y;
      }
    },
    async initialize() {
      const request = this.initializeRequest = (this.initializeRequest || 0) + 1;
      const owner = this.auth.token;
      this.$bvToast.hide('menu-initialize-error');
      this.loading = true;
      this.loadError = false;
      try {
        // BACKEND: §18. A device is never an ordinary customer. If the API is
        // unavailable keep its grant and retry; only a confirmed invalid mock
        // grant is cleared by authorize(), before loading the public menu.
        if (this.$restaurantMock && this.$restaurantMock.isDeviceCredential()) {
          const deviceSession = await this.$restaurantMock.authorize();
          if (this._isDestroyed || this._isBeingDestroyed || request !== this.initializeRequest) return;
          if (deviceSession) { await this.$router.replace('/restaurant-mock'); return; }
          if (this.$restaurantMock.isDeviceCredential()) throw new Error('Device session unavailable');
        }
        const result = await this.$store.dispatch('basket/bootstrap', { force: true });
        if (!result.applied || this._isDestroyed || this._isBeingDestroyed || request !== this.initializeRequest) return;
        if (owner !== this.auth.token) { this.initialize(); return; }
        const resp = { data: result.data };
        this.deliveryItems = visibleDeliveryOptions(resp.data.schedule.activeDays);
        if (Array.isArray(resp.data.deliveryTypeOptions) && resp.data.deliveryTypeOptions.length) {
          this.deliveryTypeOptions = resp.data.deliveryTypeOptions;
        }
        if (!this.deliveryTypeOptions.some(option => option.value === this.delivery_type)) {
          this.delivery_type = this.deliveryTypeOptions[0].value;
        }
        // Defaults on entry: delivery ("برام ارسال کنید") and the first day that
        // can still take orders (today when it is open), so the basket opens
        // with both choices already made.
        if (!this.checkoutDraftRestored && this.deliveryTypeOptions.some(option => option.value === 'sendToMe')) {
          this.delivery_type = 'sendToMe';
        }
        if (this.delivery_date === -1) {
          const firstOpenDay = this.deliveryItems.findIndex(day => day.status);
          if (firstOpenDay !== -1) this.delivery_date = firstOpenDay;
        }
        this.shippingCost = resp.data.shippingCost;
        if (!this.addressOverridden && !this.selectedAddressId) this.delivery_address = resp.data.address;
        if (resp.data.mapCenter) this.mapCenter = resp.data.mapCenter;
        if (resp.data.supportPhone) this.supportPhone = resp.data.supportPhone;
        if (resp.data.pwaCallOutText) this.pwaCallOutText = resp.data.pwaCallOutText;
        if (resp.data.shopInfo) {
          this.shopInfo = { ...this.shopInfo, ...resp.data.shopInfo };
          // Kept in localStorage so the result page, which the gateway loads
          // directly without a menu request, can show the same details.
          try {
            localStorage.setItem('shopInfo', JSON.stringify(this.shopInfo));
          } catch (e) { /* private mode — the page falls back to defaults */ }
        }
        if (!this.addressesLoaded) this.savedAddresses = resp.data.savedAddresses || [];
        this.delivery_description = resp.data.delivery_description;
        this.in_person_description = resp.data.in_person_description;
        this.mode = resp.data.mode;
        this.taxEnabled = !!resp.data.taxEnabled;
        this.taxPercent = Number(resp.data.taxPercent) || 0;
        this.etaMinutes = Number(resp.data.deliveryEtaMinutes) || 0;
        this.showProductRating = !!resp.data.showProductRating;
        if (resp.data.deliveryEtaLabel) this.labels.deliveryEta = resp.data.deliveryEtaLabel;
        if (resp.data.pickupEtaLabel) this.labels.pickupEta = resp.data.pickupEtaLabel;
        if (resp.data.shippingChipLabel) this.labels.shippingChip = resp.data.shippingChipLabel;
        applyAppModeTheme(this.mode);
        this.publicOffers = resp.data.publicOffers || [];
        this.setProduct();
        // "Order again" from the profile: build that order's basket and open it.
        this.applyPendingReorder();
        this.addressesInitialized = true;
        this.applyDefaultAddress();
        if (this.auth.is_login) this.refreshSavedAddresses();
        // The offers row sits above the menu, so personal codes have to be
        // fetched at load rather than when the basket opens.
        this.loadMyDiscountCodes();
        if (await this.$store.dispatch('basket/consumeCheckoutIntent')) this.$nextTick(() => this.openCart());

        if (this.productCategories.length > 0) {
          this.$nextTick(() => {
            this.handleTabChange(this.tabIndex);
            if (!this.currentActiveTabId) {
              const first = this.menuNavCategories[0];
              if (first) this.currentActiveTabId = first.id;
            }
          });
        }
      } catch (e) {
        if (this._isDestroyed || this._isBeingDestroyed || request !== this.initializeRequest) return;
        this.loadError = true;
        this.$bvToast.toast('خطا در اتصال به سرور. لطفاً دوباره تلاش کنید.', { id: 'menu-initialize-error', variant: 'danger', noAutoHide: true });
      } finally {
        if (request === this.initializeRequest) this.loading = false;
      }
    },
    /**
     * «سفارش مجدد» in the profile's order history leaves the old order's lines
     * behind (utils/reorder.js). Here they become the basket, exactly: the foods
     * and quantities of that order replace whatever was in the basket, the delivery
     * type and address come along when the order had them, and the basket opens.
     * A food that is off the menu or out of stock today is skipped, and said so.
     */
    applyPendingReorder() {
      const pending = takeReorder();
      if (!pending) return;
      this.$store.commit('basket/reorder', pending.lines);
      if (pending.deliveryType && this.deliveryTypeOptions.some(o => o.value === pending.deliveryType)) {
        this.delivery_type = pending.deliveryType;
      }
      if (pending.deliveryType === 'sendToMe' && pending.deliveryAddress) {
        this.addressOverridden = true;
        this.selectedAddressId = null;
        this.delivery_address = pending.deliveryAddress;
      }
      this.showBasketIssues();
      this.calcBill();
      if (this.selectedProducts.length) this.$nextTick(() => this.openCart());
    },
    setProduct() {
      this.display_product = true;
      this.showBasketIssues();
      this.calcBill();
    },
    showBasketIssues() {
      const issues = this.$store.getters['basket/issues'];
      if (!issues.length) return;
      const special = issues.some(issue => issue.reason === 'special-day');
      this.$bvToast.toast(special
        ? 'این غذا در روز انتخاب شده سرو نمی‌شود.'
        : 'برخی غذاها موجود نیستند یا مقدار انتخاب‌شده معتبر نیست؛ سبد را بررسی کنید.',
        { variant: 'warning', solid: true });
    },
    addProductCount(pKey, unit) {
      let dayIndex;
      const delivery = this.deliveryItems[this.delivery_date];
      if (this.delivery_date !== -1 && delivery) {
        const day = moment(delivery.date, "YYYY/M/D").day();
        dayIndex = day === 6 ? 0 : day + 1;
      }
      this.$store.commit('basket/increment', { key: pKey, dayIndex });
      this.showBasketIssues();
      this.calcBill();
    },
    subProductCount(pKey, unit) {
      this.$store.commit('basket/decrement', { key: pKey });
      this.calcBill();
    },
    calcBill() {
      Object.assign(this.bill, this.$store.getters['basket/billFor']({
        delivery_type: this.delivery_type, shippingCost: this.shippingCost,
        taxEnabled: this.taxEnabled, taxPercent: this.taxPercent,
        discountCode: this.discountCode,
      }));
    },
    async order() {
      let selected_product = false;
      for (let product of this.products) {
        if (this.productData[product.key].count > 0) {
          selected_product = true;

          if (this.productData[product.key].menu_type === 'specialDay') {
            if (this.delivery_date === -1) {
              this.$bvToast.toast("لطفاً تاریخ تحویل را انتخاب کنید", {
                variant: "danger",
              });
              return false;
            }

            const selectedDeliveryDate = this.deliveryItems[this.delivery_date].date;
            const dayOfWeek = moment(selectedDeliveryDate, "YYYY/M/D").day();
            const adjustedDay = dayOfWeek === 6 ? 0 : dayOfWeek + 1;

            const productInList = this.products.find(p => p.key === product.key);
            if (productInList && productInList.specialDay) {
              const allowedDays = JSON.parse(productInList.specialDay);
              if (!allowedDays.includes(adjustedDay)) {
                this.$bvToast.toast(`غذا "${this.productData[product.key].name}" برای روز انتخاب شده مجاز نیست.`, {
                  variant: "danger",
                });
                return false;
              }
            }
          }
        }
      }

      if (!selected_product) {
        this.$bvToast.toast("حداقل یک محصول را انتخاب کنید", {
          variant: "danger",
        });
        return false;
      }

      let sumKG = 0;
      for (let product of this.products) {
        sumKG = Number(sumKG) + Number(this.productData[product.key].count);
      }

      if (sumKG <= 0.5) {
        this.$bvToast.toast("حداقل سفارش یک کیلوگرم می باشد", {
          variant: "danger",
        });
        return false;
      }

      if (!this.delivery_type) {
        this.$bvToast.toast("لطفا نحوه دریافت خود را انتخاب کنید", {
          variant: "danger",
        });
        return false;
      }

      if (this.delivery_date === -1) {
        this.$bvToast.toast("تاریخ تحویل خود را انتخاب کنید", {
          variant: "danger",
        });
        return false;
      }

      if (this.delivery_type == "sendToMe" && !this.delivery_address) {
        this.$bvToast.toast("لطفا آدرس محل تحویل خود را وارد کنید", {
          variant: "danger",
        });
        return false;
      }


      if (this.isPickupLike && !this.delivery_time) {
        if (this.deliveryTimes.length > 1) {
          this.$bvToast.toast("لطفاً ساعت تحویل را انتخاب کنید", { variant: "danger" });
          return false;
        }
      }

      if (this.delivery_type == "sendToMe" && this.deliveryTimes.length > 1 && !this.delivery_time) {
        this.$bvToast.toast("لطفاً ساعت تحویل را انتخاب کنید", { variant: "danger" });
        return false;
      }

      if (!this.auth.is_login) {
        this.$bvModal.show("modal-login");
        return;
      }

      this.loading_payment = true;

      try {
        let data = {
          products: [],
          delivery_date: this.delivery_date !== -1 ? this.deliveryItems[this.delivery_date].date : null,
          delivery_type: this.delivery_type,
          delivery_time: this.delivery_time,
          check_one: this.check_one,
          delivery_address: this.fullDeliveryAddress,
          delivery_lat: this.delivery_lat,
          delivery_lng: this.delivery_lng,
          discount_code: this.discountCode.code,
        };

        for (let product of this.products) {
          if (this.productData[product.key].count) {
            data.products.push({
              product_id: product.key,
              count: this.productData[product.key].count,
            });
          }
        }

        let resp = await this.$axios.post("/api/enduser/order/preview", data);

        this.billData.total_amount = resp.data.total_amount;
        this.billData.discount_amount = resp.data.discount_amount;
        this.billData.payment_amount = resp.data.payment_amount;
        this.billData.shipping_cost = resp.data.shipping_cost;
        this.billData.tax_amount = resp.data.tax_amount || 0;
        this.shippingCost = resp.data.shipping_cost || this.shippingCost;
        this.billData.is_first_order = resp.data.is_first_order;
        this.$bvModal.show("modal-bill");
      } catch (error) {
        if (error.response && error.response.status == 401) {
          this.auth.is_login = false;
          this.auth.token = null;
          this.auth.user = null;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          delete this.$axios.defaults.headers.common["Authorization"];
          this.$bvModal.show("modal-login");
          return;
        }
        this.loading_payment = false;
        if (error.response) {
          this.$bvToast.toast(error.response.data.message, {
            variant: "danger",
          });
        }
      }
    },
    async approveDiscountCode() {

      if (!this.auth.is_login) {
        this.auth.discountCodeRequest = true;
        this.$bvModal.show("modal-login");
        return;
      }

      try {
        let res = await this.$validator.validateAll("discountCode");
        if (!res) throw "فرم زیر را تکمیل کنید";

        let resp = await this.$axios.get("/api/enduser/core/check-discount-code/" + encodeURIComponent(String(this.discountCode.code || '').trim()) + `?basketAmount=${this.bill.payment_amount}`);
        this.discountCode.code_valid_status = true;
        const discountValue = Number(resp.data.value)

        this.discountCode.discount_percent = discountValue;
        // FOR THE BACKEND: check-discount-code may send `maxAmount` (toman). If it
        // does not, the cap on the customer's own code list is used.
        const own = (this.myActiveCodes || []).find(
          (c) => String(c.code).toLowerCase() === String(this.discountCode.code || '').trim().toLowerCase()
        );
        this.discountCode.max_amount = Number(
          resp.data.maxAmount ?? resp.data.max_amount ?? (own && (own.maxAmount ?? own.max_amount)) ?? 0
        ) || 0;

        this.bill.decreased_amount = this.bill.total_amount * (discountValue / 100);
        this.bill.discount_amount = this.bill.total_amount - this.bill.decreased_amount;


      } catch (error) {
        const body = error && error.response && error.response.data;
        let message = body && (body.message || body.error || body.detail);
        if (Array.isArray(message)) message = message.join('، ');
        if (typeof message !== 'string' || !message.trim()) {
          message = error && !error.response
            ? 'ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.'
            : 'اعتبارسنجی کد تخفیف انجام نشد. دوباره تلاش کنید.';
        }
        this.$bvToast.toast(message, { variant: "danger" });
      }
    },
    async cancelDiscountCode() {
      this.discountCode.code = null;
      this.discountCode.code_valid_status = false;
      this.discountCode.discount_percent = 0;
      this.discountCode.max_amount = 0;
    },
    registerSuccess() {
      this.$bvModal.hide("modal-login");
      if (this.profileLoginPending) {
        this.profileLoginPending = false;
        this.$router.push('/profile');
        return;
      }
      if (!this.pendingContinue) this.$bvModal.show("success-login");
      if (this.pendingContinue) this.advanceToDetails();

      this.loginForm = {
        step: "checkMobile",
        new_user: true,
        data: {
          mobile: null,
          first_name: null,
          last_name: null,
          verify_code: null,
        },
      };
    },
    async loginSuccess() {
      this.$bvModal.hide("modal-login");
      // BACKEND: §18 only the dev-only mock client can authorize this lane.
      if (this.$restaurantMock && await this.$restaurantMock.authorize()) {
        this.profileLoginPending = false;
        this.pendingContinue = false;
        this.$router.replace('/restaurant-mock');
        return;
      }
      this.loadCurrentOrder();
      this.loadReviewOrder();
      if (this.profileLoginPending) {
        this.profileLoginPending = false;
        this.$router.push('/profile');
        return;
      }
      if (this.auth.discountCodeRequest == true) {
        this.approveDiscountCode();
        this.auth.discountCodeRequest = false;
      } else if (!this.pendingContinue) {
        this.$bvModal.show("success-login");
      }
      if (this.pendingContinue) this.advanceToDetails();
    },
    async logout() {
      try {
        if (!this.auth.is_login) return false;

        const result = await this.$bvModal.msgBoxConfirm(
          "آیا برای خروج اطمینان دارید؟",
          {
            title: "خروج",
            size: "sm",
            buttonSize: "sm",
            okVariant: "success",
            headerClass: "p-2 border-bottom-0",
            footerClass: "p-2 border-top-0",
            centered: true,
            okTitle: "بله",
            cancelTitle: "خیر",
            cancelVariant: "danger",
          }
        );

        if (result === true) {
          this.auth.is_login = false;
          this.auth.token = null;
          this.auth.user = null;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          delete this.$axios.defaults.headers.common["Authorization"];
        }
      } catch {
      }
    },
    jalaliDate(date, format = "jYYYY/jM/jD") {
      const result = moment(date, "YYYY/M/D").format(format);
      return result.replaceAll('آدینه', 'جمعه');
    },
    formatJalaliDate,
    getDeliveryItemText(index) {
      return deliveryDayLabel(index);
    },
    setDeliveryTimeItems(index) {
      this.delivery_time = null;
      this.timeMode = 'asap';
      const times = this.deliveryItems[index]?.deliveryTimes || [];
      this.deliveryTimes = times.map((f) => ({ value: f, text: f }));
      // "Delivery as soon as possible" is the default: the earliest slot of the
      // day (the list arrives in time order). A day's hours can differ from the
      // next day's, so a chosen time never carries over to another day.
      if (this.deliveryTimes.length >= 1) {
        this.delivery_time = this.deliveryTimes[0].value;
      }
    },
    chooseAsapTime() {
      this.timeMode = 'asap';
      if (this.deliveryTimes.length) this.delivery_time = this.deliveryTimes[0].value;
    },
    onTimePicked(time) {
      this.delivery_time = time;
      this.timeMode = 'scheduled';
    },
    faTime(value) {
      return String(value || '').replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
    },
    // Accepts the product card's { src, name, description } (or just a URL).
    showImageModal(payload) {
      const info = typeof payload === 'string' ? { src: payload } : (payload || {});
      if (!info.src) return;
      this.modal.image = info.src;
      this.modal.name = info.name || '';
      this.modal.description = info.description || '';
      this.imageOpen = true;
    },
    removeProduct(pKey) {
      this.$store.commit('basket/setCount', { key: pKey, count: 0 });
      this.calcBill();
    },
  },
  watch: {
    refundCustomerKey(token) { this.loadRefundCard(token); },
    'auth.token'(token, previous) {
      if (token !== previous) checkoutDraft.clearCheckoutDraft(this.$store);
      if (previous && token !== previous) {
        this.cancelDiscountCode();
      }
      if (previous && token && previous !== token) {
        this.addressesRequest++;
        this.addressesLoaded = false;
        this.savedAddresses = [];
        this.addressOverridden = false;
        this.selectedAddressId = null;
        this.delivery_address = null;
        this.plaque = '';
        this.delivery_lat = null;
        this.delivery_lng = null;
        if (this.auth.is_login) this.refreshSavedAddresses();
      }
    },
    'auth.is_login'() {
      this.syncCustomerPoll();
      if (this.auth.is_login) this.refreshSavedAddresses();
      else {
        checkoutDraft.clearCheckoutDraft(this.$store);
        this.cancelDiscountCode();
        this.addressesRequest++;
        this.addressesLoaded = false;
        this.savedAddresses = [];
        this.addressOverridden = false;
        this.selectedAddressId = null;
        this.delivery_address = null;
        this.plaque = '';
        this.delivery_lat = null;
        this.delivery_lng = null;
      }
    },
    selectedProducts(value, previous) {
      if (previous && previous.length && !value.length) {
        this.addressOverridden = false;
        this.applyDefaultAddress();
      }
    },
    mode(value) {
      applyAppModeTheme(value);
    },
    delivery_date(value) {
      this.calcBill();
      if (value !== -1) {
        this.setDeliveryTimeItems(value);
      }
    },
    delivery_type(value) {
      this.calcBill();
      if (value === 'sendToMe') {
        this.$nextTick(() => this.$refs.deliveryMap?.refreshMap());
      } else if (value === 'iWillCome' || value === 'snapp') {
        this.$nextTick(() => this.$refs.restaurantMap?.refreshMap());
      }
    },
    "discountCode.code_valid_status"() {
      this.calcBill();
    },
    tabIndex(newIndex) {
      this.handleTabChange(newIndex);
    }
  },
  computed: {
    products() { return this.$store.getters['basket/products']; },
    productCategories() { return this.$store.state.basket.categories; },
    productData() { return this.$store.getters['basket/productData'](this.$axios.defaults.baseURL); },
    refundCustomerKey() {
      return this.auth.is_login && Number(this.currentOrder?.status) === 11 ? (this.auth.token || '') : '';
    },
    // Positions, sizes and timings of the sparks. Fixed numbers (no randomness)
    // so the layout is the same on every load.
    emberStyles() {
      return Array.from({ length: 14 }, (_, n) => ({
        '--ex': ((n * 53 + 11) % 96) + 2 + '%',
        '--es': 2 + (n % 3) + 'px',
        '--ed': 18 + ((n * 7) % 14) + 's',
        '--edl': -(n * 3.1) + 's',
        '--esw': ((n * 11) % 44) - 22 + 'px',
      }));
    },
    // The customer collects (or sends their own Snapp for) the order: no
    // address, no shipping cost, and the restaurant's location is what matters.
    isPickupLike() {
      return this.delivery_type === 'iWillCome' || this.delivery_type === 'snapp';
    },
    // Delivery needs an address; pick-up does not.
    addressMissing() {
      return this.delivery_type === 'sendToMe' && !(this.delivery_address || '').trim();
    },
    timeSheetDayLabel() {
      const item = this.deliveryItems[this.delivery_date];
      if (!item) return '';
      return `${this.getDeliveryItemText(this.delivery_date)} ${this.jalaliDate(item.date, 'dddd')}`;
    },
    // The API has a single address string, so the plaque is appended to it.
    selectedAddressTitle() {
      const address = this.savedAddresses.find(a => a.id === this.selectedAddressId);
      return address && address.address === this.delivery_address ? (address.title || '') : '';
    },
    fullDeliveryAddress() {
      const text = (this.delivery_address || '').trim();
      const plaque = (this.plaque || '').trim();
      return plaque ? `${text}، پلاک ${plaque}` : text;
    },
    showCategoryTabs() {
      const cats = this.menuNavCategories;
      return cats.length > 1;
    },
    hasChefDaily() {
      return this.chefDailyProducts.length > 0;
    },
    chefDailyProducts() {
      return this.$store.getters['basket/categoryProducts'](CHEF_TAB_ID, this.menuSearch || '');
    },
    // Categories that still have at least one non-chef-daily product. Chef's
    // daily foods live in their own leading tab, so they are not repeated here.
    realVisibleCategories() {
      return this.productCategories.filter(
        (cat) => this.categoryProducts(cat.id).length > 0
      );
    },
    visibleCategories() {
      return this.realVisibleCategories;
    },
    menuNavCategories() {
      return this.$store.getters['basket/menuCategories'].filter(category =>
        this.$store.getters['basket/categoryProducts'](category.id, this.menuSearch || '').length);
    },
    sheetCategories() {
      return this.menuNavCategories.map((cat) => ({
        ...cat,
        count: cat.id === CHEF_TAB_ID ? this.chefDailyProducts.length : this.categoryProducts(cat.id).length,
      }));
    },
    weeklyPlan() {
      const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه'];
      const dailyProducts = this.products
        .filter((p) => p.menu_type !== 'specialDay')
        .map((p) => p.name);
      return dayNames.map((name, dayIndex) => {
        const specialProducts = this.products.filter((p) => {
          if (p.menu_type !== 'specialDay' || !p.specialDay) return false;
          try {
            const allowed = JSON.parse(p.specialDay);
            return Array.isArray(allowed) && allowed.includes(dayIndex);
          } catch {
            return false;
          }
        }).map((p) => p.name);
        const products = [...dailyProducts, ...specialProducts];
        return { name, products: [...new Set(products)] };
      });
    },
    todayWeekIndex() {
      const map = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
      return map[new Date().getDay()] ?? 0;
    },
    // "امروز ساعت ۱۳:۳۰" for an order due today, otherwise the date and the time.
    currentOrderDeliveryText() {
      const order = this.currentOrder;
      if (!order) return '';
      const due = order.deliveryDate ? new Date(order.deliveryDate) : null;
      const isToday = !!due && !Number.isNaN(due.getTime()) && due.toDateString() === new Date().toDateString();
      const day = isToday ? 'امروز' : this.formatJalaliDate(order.deliveryDate);
      return [day, order.deliveryTime ? `ساعت ${order.deliveryTime}` : ''].filter(Boolean).join(' ');
    },
    selectedProducts() {
      return this.$store.getters['basket/selectedProducts'];
    },
    selectedItemsTotal() {
      return this.$store.getters['basket/itemsTotal'];
    },
  }
};
</script>

<style>
/* صفحه اصلی — جزئیات در assets/scss/main.scss */
</style>
