/**
 * Product catalog template — source of truth.
 * Mandatory field order: id, name, price, currency, description, categories, url, imageUrl
 * Toggles and conditional fields only. No industry-specific fields.
 */

export const productTemplate = {
  type: 'product',
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
  toggles: [
    { key: 'hasOptions', label: 'Has options' },
    { key: 'isBundle', label: 'Is bundle' },
    { key: 'isDigital', label: 'Is digital' },
    { key: 'hasGender', label: 'Has gender' },
  ],
  conditionalFields: [
    {
      when: { hasGender: true },
      fields: [
        { key: 'gender', type: 'enum', label: 'Gender', enum: ['women', 'men', 'unisex', 'kids'], required: false },
      ],
    },
    {
      when: { isBundle: true },
      fields: [
        { key: 'bundleItems', type: 'stringArray', label: 'Bundle item IDs', required: false },
      ],
    },
    {
      when: { isDigital: true },
      fields: [
        { key: 'isDigital', type: 'boolean', label: 'Is digital', required: false, default: true },
      ],
    },
    {
      when: { hasOptions: true },
      fields: [
        { key: 'options', type: 'optionsArray', label: 'Options (name + values)', required: false },
        { key: 'variantMode', type: 'enum', label: 'Variant mode', enum: ['single', 'multiple'], required: false },
        { key: 'variantCount', type: 'number', label: 'Sample variant count (preview only)', required: false, previewOnly: true },
      ],
    },
  ],
}

export default productTemplate
