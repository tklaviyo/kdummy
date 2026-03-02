/**
 * Subscription catalog template — source of truth.
 * Mandatory field order: id, name, price, currency, description, categories, url, imageUrl
 * Additional required: subscriptionInterval, paymentInterval
 */

export const subscriptionTemplate = {
  type: 'subscription',
  mandatoryFields: [
    { key: 'id', type: 'string', label: 'ID', required: true },
    { key: 'name', type: 'string', label: 'Name', required: true },
    { key: 'price', type: 'number', label: 'Price', required: true },
    { key: 'currency', type: 'string', label: 'Currency', required: true, default: 'USD' },
    { key: 'description', type: 'string', label: 'Description', required: false },
    { key: 'categories', type: 'stringArray', label: 'Categories', required: false },
    { key: 'url', type: 'string', label: 'URL', required: false },
    { key: 'imageUrl', type: 'string', label: 'Image URL', required: false },
  ],
  additionalRequired: [
    { key: 'subscriptionInterval', type: 'enum', label: 'Subscription Interval', enum: ['weekly', 'monthly', 'yearly'], required: true },
    { key: 'paymentInterval', type: 'enum', label: 'Payment Interval', enum: ['weekly', 'monthly', 'yearly'], required: true },
  ],
  toggles: [],
  conditionalFields: [],
}

export default subscriptionTemplate
