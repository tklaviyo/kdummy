/**
 * Business types are PRESETS only.
 * Each preset chooses ONE template and pre-fills values.
 * Presets must never introduce new fields.
 * Product presets cover: simple, with variants (options), bundle, digital, with gender.
 */

export const catalogPresets = [
  // ——— Product presets (all example types) ———
  {
    id: 'product-sample',
    name: 'Sample Product (simple)',
    template: 'product',
    preset: {
      currency: 'USD',
      categories: ['General'],
      hasOptions: false,
      isBundle: false,
      isDigital: false,
      hasGender: false,
    },
  },
  {
    id: 'product-with-variants',
    name: 'Product with variants (Size + Color)',
    template: 'product',
    preset: {
      currency: 'USD',
      categories: ['Apparel', 'Tops'],
      brand: 'Acme',
      hasOptions: true,
      isBundle: false,
      isDigital: false,
      hasGender: false,
      options: [
        { name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] },
        { name: 'Color', values: ['Black', 'White', 'Navy'] },
      ],
    },
  },
  {
    id: 'product-with-gender',
    name: 'Product with gender (e.g. apparel)',
    template: 'product',
    preset: {
      currency: 'USD',
      categories: ['Apparel'],
      brand: 'Acme',
      hasOptions: true,
      isBundle: false,
      isDigital: false,
      hasGender: true,
      gender: 'unisex',
      options: [
        { name: 'Size', values: ['S', 'M', 'L'] },
        { name: 'Color', values: ['Black', 'White'] },
      ],
    },
  },
  {
    id: 'product-bundle',
    name: 'Product bundle (gift set)',
    template: 'product',
    preset: {
      currency: 'USD',
      categories: ['Gift', 'Beauty'],
      hasOptions: false,
      isBundle: true,
      isDigital: false,
      hasGender: false,
      bundleItems: ['Item A', 'Item B', 'Item C'],
    },
  },
  {
    id: 'product-digital',
    name: 'Digital product (e.g. download)',
    template: 'product',
    preset: {
      currency: 'USD',
      categories: ['Digital'],
      hasOptions: false,
      isBundle: false,
      isDigital: true,
      hasGender: false,
    },
  },
  {
    id: 'product-digital-with-options',
    name: 'Digital product with options',
    template: 'product',
    preset: {
      currency: 'USD',
      categories: ['Digital', 'Creative'],
      hasOptions: true,
      isBundle: false,
      isDigital: true,
      hasGender: false,
      options: [{ name: 'Format', values: ['PDF', 'EPUB', 'Bundle'] }],
    },
  },
  // ——— Service presets ———
  {
    id: 'service-sample',
    name: 'Sample Service',
    template: 'service',
    preset: { currency: 'USD', durationMinutes: 60 },
  },
  // ——— Subscription presets ———
  {
    id: 'subscription-monthly',
    name: 'Monthly Subscription',
    template: 'subscription',
    preset: { currency: 'USD', interval: 'month', intervalCount: 1 },
  },
  {
    id: 'subscription-yearly',
    name: 'Yearly Subscription',
    template: 'subscription',
    preset: { currency: 'USD', interval: 'year', intervalCount: 1 },
  },
]

export function getPresetById(id) {
  return catalogPresets.find((p) => p.id === id) || null
}

export function getPresetsByTemplate(templateType) {
  return catalogPresets.filter((p) => p.template === templateType)
}
