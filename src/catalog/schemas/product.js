/**
 * Product catalog template — source of truth.
 * Mandatory field order: id, name, price, description, categories, url, imageUrl
 * Toggles and conditional fields only. No industry-specific fields.
 */

export const productTemplate = {
  type: 'product',
  mandatoryFields: [
    { key: 'id', type: 'string', label: 'ID', required: true },
    { key: 'name', type: 'string', label: 'Name', required: true },
    { key: 'price', type: 'number', label: 'Price', required: true },
    { key: 'description', type: 'string', label: 'Description', required: false },
    { key: 'categories', type: 'stringArray', label: 'Categories', required: false },
    { key: 'url', type: 'string', label: 'URL', required: false },
    { key: 'imageUrl', type: 'string', label: 'Image URL', required: false },
  ],
  toggles: [
    { key: 'hasOptions', label: 'Has options' },
  ],
  conditionalFields: [
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
