# Klaviyo Client API — Request reference

**Use only this Client API reference and the payload builders in this repo for profiles, events, and subscriptions. Do not use Klaviyo server-side REST API documentation for these flows.**

Base URL for Client API: `https://a.klaviyo.com/client`

**Common headers for all requests:**
- `accept`: `application/vnd.api+json`
- `content-type`: `application/vnd.api+json`
- `revision`: `2026-01-15`

**Authentication:** Append `?company_id=PUBLIC_API_KEY` to the request URL (use your Klaviyo public/company API key).

**App conventions:**
- **Profiles — email:** When generating **multiple** profiles, emails use the domain `@klaviyo-dummy.com`. When generating **one** profile, you can specify any email (or leave blank to auto-generate).
- **Profile properties:** All **custom** profile properties (non–built-in) are sent to Klaviyo with a `kd_` prefix (e.g. `favorite_store` → `kd_favorite_store`). Built-in property names (e.g. `gender`, `birthday`, `signup_date`) are not prefixed.
- **Event metrics:** All event metric names sent to Klaviyo end with ` (KD)` (e.g. `"Added to Cart (KD)"`).
- **Events flow:** "Send events to API" on the Events job detail page sends each generated event to the Klaviyo Client API via the app's `POST /api/events` route, which forwards the request to `https://a.klaviyo.com/client/events`.

---

## 1. Create or update profile

The `/client/profiles` endpoint creates a profile or updates an existing one (upsert by identifier).

**URL:** `https://a.klaviyo.com/client/profiles?company_id=PUBLIC_API_KEY`

**Request body:**
- `data.type`: `"profile"`
- `data.attributes`:
  - **Identifiers:** `email`, `phone_number`, `external_id` (at least one required)
  - **Klaviyo profile fields:** `first_name`, `last_name`, `locale`
  - **Location:** `location` — object with `address1`, `address2`, `city`, `country`, `region`, `zip`
  - **Custom properties:** `properties` — object; all custom profile properties go here (e.g. `favorite_store`, `loyalty_tier`)

---

## 2. Create Event

**URL:** `https://a.klaviyo.com/client/events?company_id=PUBLIC_API_KEY`

**Request body:**
- `data.type`: `"event"`
- `data.attributes`:
  - **Event properties:** `properties` — object; all event-specific data (order_id, value, items, product_id, location_id, etc.) go here. These are the “event properties” used for segmentation and analytics.
  - **Metric:** `metric.data.type`: `"metric"`, `metric.data.attributes.name`: metric name (e.g. "Placed Order")
  - **Profile at event time:** `profile.data` — `type`: `"profile"` and `attributes`: only the identifiers that are present (`email`, `phone_number`, `external_id`). Do not send the app’s profile `id`. Only include identifiers and `properties` when they have values.
  - **Time:** `time` — ISO 8601 datetime
  - **Value:** `value` — number (optional, for revenue)

**Mapping note:** Event-level custom data (order fields, product fields, location_id, etc.) → `attributes.properties`. Profile-related updates at event time → `attributes.profile.data.attributes.properties`.

---

## 3. Create Subscription (subscribe profile to list/channels)

**URL:** `https://a.klaviyo.com/client/subscriptions?company_id=PUBLIC_API_KEY`

**Request body:**
- `data.type`: `"subscription"`
- `data.attributes.profile.data`: `type`: `"profile"`, `attributes`:
  - **Identifiers:** `email`, `phone_number`, `external_id`
  - **Consent:** `subscriptions` — object with per-channel consent:
    - `email.marketing.consent`: `"SUBSCRIBED"` (or other consent value)
    - `sms.marketing.consent`, `sms.transactional.consent`
    - `whatsapp.marketing.consent`, `whatsapp.transactional.consent`
- `data.relationships.list.data`: `type`: `"list"`, `id`: list ID

---

See `lib/klaviyoPayloads.js` for the payload builders used by the app.

---

## Payload rules (omit empty / null)

**Apply to all Client API requests.** Only include a property in the request body when it has a value. Do not pass `null`, `undefined`, or empty string. This keeps payloads minimal and avoids sending app-internal or placeholder data.

### Profiles (Create/update profile)

- **Identifiers:** Include only `email`, `phone_number`, or `external_id` when that value is present (at least one is required). Omit any identifier that is null or empty.
- **Other attributes:** Include `first_name`, `last_name`, `locale` only when set. Omit when null/empty.
- **Location:** Include the `location` object only when at least one of `address1`, `address2`, `city`, `country`, `region`, `zip` is present. Inside `location`, include only those sub-keys that have values.
- **Custom properties:** Include only keys in `properties` that have a value. Omit the entire `properties` object if there are no custom properties to send (or only include key–value pairs that are set).

### Events (Create event)

- **Profile at event time:** Never send the app’s profile `id` (Klaviyo does not use our internal id). In `profile.data.attributes`, include only identifiers that are present: **external_id** (if set), **email** (if set), **phone_number** (if set). Omit any identifier that is null or empty. Include `properties` only when there are profile properties to set at event time.
- **Value:** Include `value` only when it is a real number (e.g. revenue). Do not send `value: null`. Omit the key when there is no value.
- **Other attributes:** Include `value_currency` only when set. Include `time` when set (otherwise omit or use a sensible default per implementation). In `attributes.properties`, include only event property keys that have values.

---

## Property mapping summary

### Profile (Create Profile)

| Where | Klaviyo location | Mapped from in app |
|-------|------------------|--------------------|
| **Identifiers** | `data.attributes.email`, `phone_number`, `external_id` | Generate profile: email, phone_number, external_id |
| **Name** | `data.attributes.first_name`, `last_name` | Generate profile: first_name, last_name |
| **Locale** | `data.attributes.locale` | Generate profile: locale (from location/country) |
| **Location** | `data.attributes.location` | Object with `address1`, `address2`, `city`, `country`, `region`, `zip` from generateAddressFromLocation / catalog locations |
| **Custom profile properties** | `data.attributes.properties` | All custom fields (e.g. favorite_store, last_purchase_location, loyalty_tier, gender, birthday) go here. Built by generateProfileProperties and any catalog-driven props. |

So: **Klaviyo profile properties** = everything in `data.attributes.properties` (custom and app-generated like `kd_generated_at`). Custom property names are prefixed with `kd_`. Core Klaviyo fields (email, phone_number, external_id, first_name, last_name, locale, location) are top-level under `data.attributes`.

### Event (Create Event)

| Where | Klaviyo location | Mapped from in app |
|-------|------------------|--------------------|
| **Event-level data** | `data.attributes.properties` | All event-specific fields: `order_id`, `value`, `value_currency`, `items`, `brands`, `item_names`, `categories`, `source`, `OrderType`, `location_id`, `location_name`, `location_address`, `product_id`, `product_name`, `price`, `quantity`, `booking_id`, `service_id`, etc. From generated event object (generateEvents). |
| **Metric name** | `data.attributes.metric.data.attributes.name` | `metric_name` from generated event (e.g. `Placed Order (KD)`) |
| **Profile at event time** | `data.attributes.profile.data` | Only present identifiers: `external_id`, `email`, `phone_number` (never send app profile `id`). Optional `properties` when set. |
| **Time** | `data.attributes.time` | `time` from generated event (ISO 8601) |
| **Value** | `data.attributes.value` | Only when present (numeric); omit when no value. |

So: **Klaviyo event properties** = everything in `data.attributes.properties` (order/product/booking/location fields used for segmentation and analytics). Profile identifiers and optional profile properties at event time live under `data.attributes.profile.data.attributes`.
