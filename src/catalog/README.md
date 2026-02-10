# Data Catalog

Catalog of **Product**, **Service**, and **Subscription** items used for profile/event generation. Exactly three templates; no new templates, no changing mandatory field order.

---

## Templates and mandatory field order

**Product** (in order): `id`, `name`, `price`, `currency`, `description`, `categories`, `url`, `imageUrl`, then toggles `hasOptions`, `isBundle`, `isDigital`, `hasGender`. Conditional fields (shown when toggles are on): `gender`, `bundleItems`, `options`, `variantMode`, `variantCount`, and the UI-only `variantPreview`.

**Service** (in order): `id`, `name`, `price`, `currency`, `description`, `categories`, `url`, `imageUrl`, `durationMinutes`.

**Subscription** (in order): `id`, `name`, `price`, `currency`, `description`, `categories`, `url`, `imageUrl`, `interval`, `intervalCount`.

Field order and conditionals are defined in `schema.js` and must not be reordered or broken.

---

## Schema vs business types

- **`schema.js` is immutable.** Do not add templates, change field order, or add industry-specific fields. It is the single source of truth for structure and validation.
- **`businessTypes.js` is additive.** Each **business type** has a label (e.g. "Apparel products", "Flight tickets") and a **`templates`** array of up to **5** items. Each item is `{ defaults }` — one product/service/subscription definition. The user selects a business type and how many items to create (1–5); each item is pre-filled from `templates[0]`, `templates[1]`, etc., and can be edited before generating.

---

## How the Data Catalog UI works

- **Catalog list** (`/catalog`, Products / Services tab): Tabs for Product | Service | Subscription; list from localStorage; **Create new** links to `/catalog/create?template=product` (or `service` / `subscription`). Edit opens a modal with the same schema-driven form.
- **Create page** (`/catalog/create?template=...`): Full-page wizard. **Step 1:** Create manually (one empty item) or Create from business type. **Step 2 (manual):** One form; **Create** saves and redirects to catalog. **Step 2 (business type):** Select business type and number of items (1–5). **Next** → **Step 3:** One screen per item (Item 1 of N … Item N of N), each pre-filled from that business type’s `templates[i]`; user can edit. **Next** / **Back** to move; **Finish** on the last item validates all, upserts all, redirects to `/catalog?tab=products&subtab=...`.
- **Form** — Visible fields from `getVisibleFields(templateKey, values)`; widget by type (string, number, boolean, enum, stringArray, optionsArray, variantPreview). Shared in modal and create page via `CatalogFormFields.js`.

---

## Adding a new business type

1. Open `businessTypes.js`.
2. Add one object to the `BUSINESS_TYPES` array with:
   - `id` — unique string (e.g. `'my-products'`).
   - `label` — display name (e.g. "My products", "My services").
   - `templateKey` — exactly one of `'product'`, `'service'`, `'subscription'`.
   - **`templates`** — array of **up to 5** items. Each item is `{ defaults: { ... } }`. **Only use keys that exist on that template in `schema.js`.** Omit `id` (generated on create). Each entry is one product/service/subscription the user can create (e.g. first product, second product, …).
3. For **product** items with **variants**: in that template’s `defaults` set `hasOptions: true`, `options`, `variantMode`, and if `variantMode === 'sample_n'` set **`variantCount`** (e.g. 5).

Example (business type with 2 product templates):

```js
{
  id: 'my-products',
  label: 'My products',
  templateKey: 'product',
  templates: [
    { defaults: { name: 'Item A', price: 19.99, currency: 'USD', description: '', categories: [], url: '', imageUrl: '', hasOptions: false, isBundle: false, isDigital: false, hasGender: false } },
    { defaults: { name: 'Item B', price: 29.99, currency: 'USD', description: '', categories: [], url: '', imageUrl: '', hasOptions: false, isBundle: false, isDigital: false, hasGender: false } },
  ],
},
```

---

## Booking details belong in events, not catalog

Catalog items describe **what is offered** (name, price, options, duration, interval). They do not describe **when** or **where** a specific occurrence happens. Dates, times, locations, and booking-specific data are **event** attributes. The catalog answers “what can be sold”; events answer “this instance at this time/place.” Keeping this split avoids mixing product/service definitions with instance data and keeps the schema stable.

---

## localStorage keys

- `catalog_product` — array of product items (JSON).
- `catalog_service` — array of service items (JSON).
- `catalog_subscription` — array of subscription items (JSON).

Keys are defined in `storage.js`. No other catalog keys are used. Variant preview data is never stored.

---

## Example presets (one per template)

**Product** — `apparel-product`: Classic Tee, USD 29.99, hasOptions with Size/Color, variantMode `all_combinations`.

**Service** — `restaurant-reservation-service`: Dinner Reservation, USD 0, durationMinutes 90.

**Subscription** — `saas-pro-subscription`: Pro Plan, USD 49/month, interval `month`, intervalCount 1.

These live in `businessTypes.js`. Each business type has a **`templates`** array (up to 5); the create wizard lets the user choose how many to create (1–5), then shows one editable form per item before generating and returning to the catalog list.
