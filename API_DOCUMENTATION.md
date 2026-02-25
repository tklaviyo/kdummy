# K:Dummy API Documentation

Mock API endpoints for the K:Dummy application. These endpoints simulate the Klaviyo Client API behavior.

**Payload rules:** When sending profiles or events, only include properties that have a value. Do not pass `null`, empty string, or omit keys when the value is absent. See `docs/klaviyo-client-api.md` § **Payload rules (omit empty / null)** for full details.

## Base URL

All endpoints are available at: `http://localhost:3000/api`

## Endpoints

### 1. Profiles API

#### Create Profile
**POST** `/api/profiles`

Creates a new profile with identifiers, Klaviyo properties, location, and custom properties.

**Request Body:**
```json
{
  "data": {
    "type": "profile",
    "attributes": {
      "email": "sarah.mason@klaviyo-demo.com",
      "phone_number": "+15005550006",
      "external_id": "1234",
      "first_name": "Sarah",
      "last_name": "Mason",
      "locale": "en-US",
      "location": {
        "address1": "89 E 42nd St",
        "address2": "1st floor",
        "city": "New York",
        "country": "United States",
        "region": "NY",
        "zip": "10017"
      },
      "properties": {
        "gender": "female",
        "birthday": "1990-05-15",
        "loyalty_member": true,
        "loyalty_points": 1250
      }
    }
  }
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "type": "profile",
    "id": "01J...",
    "attributes": {
      "email": "sarah.mason@klaviyo-demo.com",
      "phone_number": "+15005550006",
      "external_id": "1234",
      "first_name": "Sarah",
      "last_name": "Mason",
      "locale": "en-US",
      "location": { ... },
      "properties": {
        "gender": "female",
        "birthday": "1990-05-15",
        "loyalty_member": true,
        "loyalty_points": 1250,
        "kd_generated_at": "2024-01-15T10:30:00Z"
      },
      "created": "2024-01-15T10:30:00Z",
      "updated": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Validation:**
- At least one identifier (email, phone_number, or external_id) is required

#### Get Profiles
**GET** `/api/profiles?page=1&page_size=10`

Retrieves a paginated list of profiles.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `page_size` (optional): Items per page (default: 10)

---

### 2. Events API

#### Create Event
**POST** `/api/events`

Creates a new event by forwarding the request to the Klaviyo Client API (`/client/events`). The event is also stored locally for listing via GET. Requires metric, profile (with at least one identifier), properties, time, and optional value.

**Request Body:**
```json
{
  "data": {
    "type": "event",
    "attributes": {
      "properties": {
        "ProductName": "Wireless Headphones",
        "ProductID": "PROD-123",
        "SKU": "WH-001",
        "Price": 99.99
      },
      "metric": {
        "data": {
          "type": "metric",
          "attributes": {
            "name": "Viewed Product"
          }
        }
      },
      "profile": {
        "data": {
          "type": "profile",
          "attributes": {
            "email": "sarah.mason@klaviyo-demo.com"
          }
        }
      },
      "time": "2024-01-15T10:30:00Z",
      "value": 99.99,
      "value_currency": "USD"
    }
  }
}
```

**Response:** `201 Created`
```json
{
  "data": {
    "type": "event",
    "id": "01E...",
    "attributes": {
      "properties": { ... },
      "metric": {
        "data": {
          "type": "metric",
          "attributes": {
            "name": "Viewed Product (KD)"
          }
        }
      },
      "profile": { ... },
      "time": "2024-01-15T10:30:00Z",
      "value": 99.99,
      "value_currency": "USD",
      "datetime": "2024-01-15T10:30:00Z"
    }
  }
}
```

**Notes:**
- Events are sent to Klaviyo's Client API; metric names from the app's event generator end with ` (KD)` (e.g. "Placed Order (KD)").
- If `time` is not provided, current timestamp is used.
- `value` is optional but recommended for revenue-related events.

**Validation:**
- Metric is required
- Profile with at least one identifier is required

#### Get Events
**GET** `/api/events?page=1&page_size=10`

Retrieves a paginated list of events.

---

### 3. Subscribe API

#### Subscribe Profile
**POST** `/api/subscribe`

Subscribes a profile to one or more channels (email, SMS, WhatsApp).

**Request Body:**
```json
{
  "data": {
    "type": "subscription",
    "attributes": {
      "channels": ["email", "sms"],
      "email": "sarah.mason@klaviyo-demo.com",
      "phone_number": "+15005550006",
      "profile_id": "01J...",
      "list_id": "LIST-123"
    }
  }
}
```

**Response:** `201 Created`
```json
{
  "data": [
    {
      "type": "subscription",
      "id": "01S...",
      "attributes": {
        "channel": "email",
        "profile_id": "01J...",
        "email": "sarah.mason@klaviyo-demo.com",
        "status": "subscribed",
        "subscribed_at": "2024-01-15T10:30:00Z"
      }
    },
    {
      "type": "subscription",
      "id": "01S...",
      "attributes": {
        "channel": "sms",
        "profile_id": "01J...",
        "phone_number": "+15005550006",
        "status": "subscribed",
        "subscribed_at": "2024-01-15T10:30:00Z"
      }
    }
  ]
}
```

**Validation:**
- At least one channel is required
- Valid channels: `email`, `sms`, `whatsapp`
- Email is required when subscribing to email channel
- Phone number is required when subscribing to SMS or WhatsApp channels
- At least one profile identifier is required

#### Get Subscriptions
**GET** `/api/subscribe?page=1&page_size=10&profile_id=...&email=...&channel=...`

Retrieves subscriptions with optional filters.

**Query Parameters:**
- `page` (optional): Page number
- `page_size` (optional): Items per page
- `profile_id` (optional): Filter by profile ID
- `email` (optional): Filter by email
- `channel` (optional): Filter by channel (email, sms, whatsapp)

---

### 4. Metrics API

#### Get Metric Templates
**GET** `/api/metrics`

Returns available metric templates for event creation.

**Response:** `200 OK`
```json
{
  "data": [
    {
      "name": "TEST Viewed Product",
      "category": "ecommerce",
      "default_properties": {
        "ProductName": "string",
        "ProductID": "string",
        "SKU": "string",
        "Categories": "array",
        "ImageURL": "string",
        "URL": "string",
        "Price": "decimal"
      }
    },
    ...
  ]
}
```

---

### 5. Health Check

#### Health Check
**GET** `/api/health`

Returns API status and available endpoints.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "service": "K:Dummy API",
  "version": "0.1.0",
  "endpoints": {
    "profiles": "/api/profiles",
    "events": "/api/events",
    "subscribe": "/api/subscribe",
    "metrics": "/api/metrics"
  }
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "errors": [
    {
      "detail": "Error message description"
    }
  ]
}
```

**Status Codes:**
- `400` - Bad Request (validation errors)
- `500` - Internal Server Error

---

## Notes

- All data is stored in-memory and will be lost on server restart
- Profile IDs, Event IDs, and Subscription IDs are auto-generated
- All profiles created through this API include `kd_generated_at` (ISO timestamp) in their properties
- Metric names are automatically prefixed with "TEST " if not already present
- All timestamps are in ISO 8601 format

