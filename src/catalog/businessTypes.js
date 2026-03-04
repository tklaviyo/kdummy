/**
 * Business types define groups of templates (up to 5 per type).
 * Each business type has a label (e.g. "Apparel products", "Flight tickets") and
 * a templates array: each item is { defaults } for one product/service/subscription.
 * User selects a business type and how many items to create (1–5); each item is
 * pre-filled from that business type's templates[0], templates[1], etc.
 */

import { getEventPropertySchema } from '@/src/lib/events/eventPropertiesSchema'
import { getBusinessTypeIdsForEvent } from '@/src/lib/events/eventPropertiesByBusinessType'

export const BUSINESS_TYPES = [
  // ——— Products ———
  {
    id: 'apparel',
    label: 'Apparel',
    templateKey: 'product',
    templates: [
      { defaults: { name: 'Classic Tee', price: 29.99, currency: 'USD', description: 'Premium cotton tee.', categories: ['Apparel', 'Tops'], brand: 'Acme Apparel', url: 'https://example.com/products/classic-tee', imageUrl: 'https://picsum.photos/400/400?random=1', hasOptions: true, isBundle: false, isDigital: false, hasGender: true, gender: 'unisex', options: [{ name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] }, { name: 'Color', values: ['Black', 'White', 'Navy'] }] } },
      { defaults: { name: 'Hoodie', price: 49.99, currency: 'USD', description: 'Fleece hoodie.', categories: ['Apparel', 'Tops'], brand: 'Acme Apparel', url: 'https://example.com/products/hoodie', imageUrl: 'https://picsum.photos/400/400?random=2', hasOptions: true, isBundle: false, isDigital: false, hasGender: true, gender: 'unisex', options: [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }, { name: 'Color', values: ['Gray', 'Black', 'Navy'] }] } },
      { defaults: { name: 'Tank Top', price: 19.99, currency: 'USD', description: 'Lightweight tank.', categories: ['Apparel', 'Tops'], brand: 'Acme Apparel', url: 'https://example.com/products/tank', imageUrl: 'https://picsum.photos/400/400?random=3', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Size', values: ['XS', 'S', 'M', 'L'] }, { name: 'Color', values: ['White', 'Black'] }] } },
      { defaults: { name: 'Long Sleeve', price: 34.99, currency: 'USD', description: 'Long sleeve crew.', categories: ['Apparel', 'Tops'], brand: 'Acme Apparel', url: 'https://example.com/products/long-sleeve', imageUrl: 'https://picsum.photos/400/400?random=4', hasOptions: false, isBundle: false, isDigital: false, hasGender: false } },
      { defaults: { name: 'Polo', price: 39.99, currency: 'USD', description: 'Classic polo.', categories: ['Apparel', 'Tops'], brand: 'Acme Apparel', url: 'https://example.com/products/polo', imageUrl: 'https://picsum.photos/400/400?random=5', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Size', values: ['S', 'M', 'L'] }, { name: 'Color', values: ['White', 'Navy', 'Red'] }] } },
    ],
  },
  {
    id: 'footwear',
    label: 'Footwear',
    templateKey: 'product',
    templates: [
      { defaults: { name: 'Running Sneakers', price: 89.99, currency: 'USD', description: 'Lightweight running shoes with cushioning.', categories: ['Footwear', 'Athletic'], brand: 'RunFast', url: 'https://example.com/footwear/sneakers', imageUrl: 'https://picsum.photos/400/400?random=ft1', hasOptions: true, isBundle: false, isDigital: false, hasGender: true, gender: 'unisex', options: [{ name: 'Size', values: ['7', '8', '9', '10', '11', '12'] }, { name: 'Color', values: ['White', 'Black', 'Navy', 'Gray'] }] } },
      { defaults: { name: 'Canvas Loafers', price: 59.99, currency: 'USD', description: 'Classic canvas loafers.', categories: ['Footwear', 'Casual'], brand: 'Coastal', url: 'https://example.com/footwear/loafers', imageUrl: 'https://picsum.photos/400/400?random=ft2', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Size', values: ['7', '8', '9', '10', '11'] }, { name: 'Color', values: ['Tan', 'Navy', 'Black'] }] } },
      { defaults: { name: 'Ankle Boots', price: 129.99, currency: 'USD', description: 'Leather ankle boots.', categories: ['Footwear', 'Boots'], brand: 'Leather & Co', url: 'https://example.com/footwear/boots', imageUrl: 'https://picsum.photos/400/400?random=ft3', hasOptions: true, isBundle: false, isDigital: false, hasGender: true, gender: 'women', options: [{ name: 'Size', values: ['6', '7', '8', '9', '10'] }, { name: 'Color', values: ['Black', 'Brown', 'Taupe'] }] } },
      { defaults: { name: 'Slides', price: 34.99, currency: 'USD', description: 'Comfortable slide sandals.', categories: ['Footwear', 'Sandals'], brand: 'Coastal', url: 'https://example.com/footwear/slides', imageUrl: 'https://picsum.photos/400/400?random=ft4', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Size', values: ['S', 'M', 'L'] }, { name: 'Color', values: ['Black', 'White', 'Gray'] }] } },
      { defaults: { name: 'Dress Oxfords', price: 149.99, currency: 'USD', description: 'Leather oxford dress shoes.', categories: ['Footwear', 'Formal'], brand: 'Leather & Co', url: 'https://example.com/footwear/oxfords', imageUrl: 'https://picsum.photos/400/400?random=ft5', hasOptions: true, isBundle: false, isDigital: false, hasGender: true, gender: 'men', options: [{ name: 'Size', values: ['8', '9', '10', '11', '12'] }, { name: 'Color', values: ['Black', 'Brown'] }] } },
    ],
  },
  {
    id: 'swimwear',
    label: 'Swimwear',
    templateKey: 'product',
    templates: [
      { defaults: { name: 'One-Piece Swimsuit', price: 64.99, currency: 'USD', description: 'Chlorine-resistant one-piece.', categories: ['Swimwear', 'Women'], brand: 'Wave Swim', url: 'https://example.com/swimwear/one-piece', imageUrl: 'https://picsum.photos/400/400?random=sw1', hasOptions: true, isBundle: false, isDigital: false, hasGender: true, gender: 'women', options: [{ name: 'Size', values: ['XS', 'S', 'M', 'L'] }, { name: 'Color', values: ['Black', 'Navy', 'Red', 'Teal'] }] } },
      { defaults: { name: 'Bikini Set', price: 49.99, currency: 'USD', description: 'Two-piece bikini set.', categories: ['Swimwear', 'Women'], brand: 'Wave Swim', url: 'https://example.com/swimwear/bikini', imageUrl: 'https://picsum.photos/400/400?random=sw2', hasOptions: true, isBundle: false, isDigital: false, hasGender: true, gender: 'women', options: [{ name: 'Size', values: ['XS', 'S', 'M', 'L'] }, { name: 'Color', values: ['Black', 'White', 'Coral', 'Blue'] }] } },
      { defaults: { name: 'Swim Trunks', price: 39.99, currency: 'USD', description: 'Quick-dry swim trunks.', categories: ['Swimwear', 'Men'], brand: 'Wave Swim', url: 'https://example.com/swimwear/trunks', imageUrl: 'https://picsum.photos/400/400?random=sw3', hasOptions: true, isBundle: false, isDigital: false, hasGender: true, gender: 'men', options: [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }, { name: 'Color', values: ['Navy', 'Black', 'Teal', 'Red'] }] } },
      { defaults: { name: 'Rash Guard', price: 44.99, currency: 'USD', description: 'UPF 50+ rash guard.', categories: ['Swimwear', 'Active'], brand: 'Wave Swim', url: 'https://example.com/swimwear/rashguard', imageUrl: 'https://picsum.photos/400/400?random=sw4', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] }, { name: 'Color', values: ['Navy', 'Black', 'Blue'] }] } },
      { defaults: { name: 'Cover-Up Dress', price: 34.99, currency: 'USD', description: 'Lightweight cover-up.', categories: ['Swimwear', 'Accessories'], brand: 'Wave Swim', url: 'https://example.com/swimwear/coverup', imageUrl: 'https://picsum.photos/400/400?random=sw5', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Size', values: ['S', 'M', 'L'] }, { name: 'Color', values: ['White', 'Black', 'Coral'] }] } },
    ],
  },
  {
    id: 'activewear',
    label: 'Activewear',
    templateKey: 'product',
    templates: [
      { defaults: { name: 'Leggings', price: 54.99, currency: 'USD', description: 'High-waist moisture-wicking leggings.', categories: ['Activewear', 'Bottoms'], brand: 'FitMove', url: 'https://example.com/activewear/leggings', imageUrl: 'https://picsum.photos/400/400?random=aw1', hasOptions: true, isBundle: false, isDigital: false, hasGender: true, gender: 'women', options: [{ name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] }, { name: 'Color', values: ['Black', 'Navy', 'Gray', 'Burgundy'] }] } },
      { defaults: { name: 'Sports Bra', price: 32.99, currency: 'USD', description: 'Supportive sports bra.', categories: ['Activewear', 'Tops'], brand: 'FitMove', url: 'https://example.com/activewear/sports-bra', imageUrl: 'https://picsum.photos/400/400?random=aw2', hasOptions: true, isBundle: false, isDigital: false, hasGender: true, gender: 'women', options: [{ name: 'Size', values: ['XS', 'S', 'M', 'L'] }, { name: 'Color', values: ['Black', 'White', 'Gray'] }] } },
      { defaults: { name: 'Running Shorts', price: 36.99, currency: 'USD', description: 'Lightweight running shorts with liner.', categories: ['Activewear', 'Bottoms'], brand: 'FitMove', url: 'https://example.com/activewear/shorts', imageUrl: 'https://picsum.photos/400/400?random=aw3', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }, { name: 'Color', values: ['Black', 'Navy', 'Gray', 'Red'] }] } },
      { defaults: { name: 'Performance Tee', price: 29.99, currency: 'USD', description: 'Breathable performance tee.', categories: ['Activewear', 'Tops'], brand: 'FitMove', url: 'https://example.com/activewear/perf-tee', imageUrl: 'https://picsum.photos/400/400?random=aw4', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Size', values: ['XS', 'S', 'M', 'L', 'XL'] }, { name: 'Color', values: ['White', 'Black', 'Gray'] }] } },
      { defaults: { name: 'Zip Hoodie', price: 69.99, currency: 'USD', description: 'Full-zip training hoodie.', categories: ['Activewear', 'Tops'], brand: 'FitMove', url: 'https://example.com/activewear/zip-hoodie', imageUrl: 'https://picsum.photos/400/400?random=aw5', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }, { name: 'Color', values: ['Black', 'Gray', 'Navy'] }] } },
    ],
  },
  {
    id: 'beauty-skincare',
    label: 'Beauty & skincare',
    templateKey: 'product',
    templates: [
      { defaults: { name: 'Face Moisturizer', price: 28.99, currency: 'USD', description: 'Daily hydrating face moisturizer SPF 30.', categories: ['Beauty', 'Skincare'], brand: 'Glow Skin', url: 'https://example.com/beauty/moisturizer', imageUrl: 'https://picsum.photos/400/400?random=bs1', hasOptions: false, isBundle: false, isDigital: false, hasGender: false } },
      { defaults: { name: 'Serum Set', price: 52.99, currency: 'USD', description: 'Vitamin C and hyaluronic acid serums.', categories: ['Beauty', 'Skincare'], brand: 'Glow Skin', url: 'https://example.com/beauty/serum-set', imageUrl: 'https://picsum.photos/400/400?random=bs2', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Skin Type', values: ['Normal', 'Dry', 'Oily', 'Combination'] }] } },
      { defaults: { name: 'Lipstick', price: 18.99, currency: 'USD', description: 'Long-wear lipstick.', categories: ['Beauty', 'Makeup'], brand: 'Glow Skin', url: 'https://example.com/beauty/lipstick', imageUrl: 'https://picsum.photos/400/400?random=bs3', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Shade', values: ['Nude', 'Red', 'Berry', 'Pink', 'Coral'] }] } },
      { defaults: { name: 'Cleanser', price: 22.99, currency: 'USD', description: 'Gentle daily cleanser.', categories: ['Beauty', 'Skincare'], brand: 'Glow Skin', url: 'https://example.com/beauty/cleanser', imageUrl: 'https://picsum.photos/400/400?random=bs4', hasOptions: false, isBundle: false, isDigital: false, hasGender: false } },
      { defaults: { name: 'Eye Cream', price: 38.99, currency: 'USD', description: 'Anti-aging eye cream.', categories: ['Beauty', 'Skincare'], brand: 'Glow Skin', url: 'https://example.com/beauty/eye-cream', imageUrl: 'https://picsum.photos/400/400?random=bs5', hasOptions: false, isBundle: false, isDigital: false, hasGender: false } },
    ],
  },
  {
    id: 'food-beverage-products',
    label: 'Food & beverage products',
    templateKey: 'product',
    templates: [
      { defaults: { name: 'Organic Granola', price: 8.99, currency: 'USD', description: 'Organic granola 12 oz.', categories: ['Food', 'Pantry'], url: 'https://example.com/food/granola', imageUrl: 'https://picsum.photos/400/400?random=fb1', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Flavor', values: ['Original', 'Honey Almond', 'Coconut'] }] } },
      { defaults: { name: 'Cold Brew Coffee', price: 4.99, currency: 'USD', description: 'Cold brew 12 oz can.', categories: ['Beverage', 'Coffee'], url: 'https://example.com/food/cold-brew', imageUrl: 'https://picsum.photos/400/400?random=fb2', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Variety', values: ['Original', 'Oat Milk', 'Black'] }] } },
      { defaults: { name: 'Protein Bar Box', price: 24.99, currency: 'USD', description: 'Box of 12 protein bars.', categories: ['Food', 'Snacks'], url: 'https://example.com/food/protein-bar', imageUrl: 'https://picsum.photos/400/400?random=fb3', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Flavor', values: ['Chocolate', 'Peanut Butter', 'Cookie Dough'] }] } },
      { defaults: { name: 'Sparkling Water 24-Pack', price: 14.99, currency: 'USD', description: '24 cans sparkling water.', categories: ['Beverage', 'Water'], url: 'https://example.com/food/sparkling', imageUrl: 'https://picsum.photos/400/400?random=fb4', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Flavor', values: ['Lime', 'Lemon', 'Grapefruit', 'Unflavored'] }] } },
      { defaults: { name: 'Gourmet Chocolate Box', price: 29.99, currency: 'USD', description: 'Assorted dark chocolate box.', categories: ['Food', 'Confection'], url: 'https://example.com/food/chocolate', imageUrl: 'https://picsum.photos/400/400?random=fb5', hasOptions: false, isBundle: false, isDigital: false, hasGender: false } },
    ],
  },
  {
    id: 'electronics-accessories',
    label: 'Electronics and accessories',
    templateKey: 'product',
    templates: [
      { defaults: { name: 'Wireless Earbuds', price: 79.99, currency: 'USD', description: 'Bluetooth 5.0 wireless earbuds.', categories: ['Electronics', 'Audio'], brand: 'TechSound', url: 'https://example.com/electronics/earbuds', imageUrl: 'https://picsum.photos/400/400?random=el1', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Color', values: ['Black', 'White', 'Navy'] }] } },
      { defaults: { name: 'Phone Case', price: 24.99, currency: 'USD', description: 'Protective phone case.', categories: ['Electronics', 'Accessories'], brand: 'TechGear', url: 'https://example.com/electronics/phone-case', imageUrl: 'https://picsum.photos/400/400?random=el2', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Model', values: ['iPhone 15', 'iPhone 15 Pro', 'Samsung S24'] }, { name: 'Color', values: ['Clear', 'Black', 'Navy'] }] } },
      { defaults: { name: 'USB-C Hub', price: 49.99, currency: 'USD', description: '7-in-1 USB-C hub.', categories: ['Electronics', 'Accessories'], brand: 'TechGear', url: 'https://example.com/electronics/hub', imageUrl: 'https://picsum.photos/400/400?random=el3', hasOptions: false, isBundle: false, isDigital: false, hasGender: false } },
      { defaults: { name: 'Portable Charger', price: 39.99, currency: 'USD', description: '20,000 mAh portable power bank.', categories: ['Electronics', 'Accessories'], brand: 'TechGear', url: 'https://example.com/electronics/charger', imageUrl: 'https://picsum.photos/400/400?random=el4', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Color', values: ['Black', 'White', 'Blue'] }] } },
      { defaults: { name: 'Screen Protector Pack', price: 14.99, currency: 'USD', description: '2-pack tempered glass screen protectors.', categories: ['Electronics', 'Accessories'], brand: 'TechGear', url: 'https://example.com/electronics/screen', imageUrl: 'https://picsum.photos/400/400?random=el5', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Model', values: ['iPhone 15', 'iPhone 15 Pro'] }] } },
    ],
  },
  {
    id: 'home-goods-decor',
    label: 'Home goods & décor',
    templateKey: 'product',
    templates: [
      { defaults: { name: 'Throw Pillow', price: 34.99, currency: 'USD', description: 'Decorative throw pillow 18x18 in.', categories: ['Home', 'Décor'], url: 'https://example.com/home/pillow', imageUrl: 'https://picsum.photos/400/400?random=hg1', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Color', values: ['Gray', 'Navy', 'Sage', 'Terracotta'] }] } },
      { defaults: { name: 'Ceramic Vase', price: 44.99, currency: 'USD', description: 'Handcrafted ceramic vase.', categories: ['Home', 'Décor'], url: 'https://example.com/home/vase', imageUrl: 'https://picsum.photos/400/400?random=hg2', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Color', values: ['White', 'Black', 'Speckled'] }] } },
      { defaults: { name: 'Table Lamp', price: 69.99, currency: 'USD', description: 'Modern table lamp.', categories: ['Home', 'Lighting'], url: 'https://example.com/home/lamp', imageUrl: 'https://picsum.photos/400/400?random=hg3', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Finish', values: ['Brass', 'Matte Black', 'White'] }] } },
      { defaults: { name: 'Cotton Towel Set', price: 49.99, currency: 'USD', description: 'Set of 4 bath towels.', categories: ['Home', 'Linens'], url: 'https://example.com/home/towels', imageUrl: 'https://picsum.photos/400/400?random=hg4', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Color', values: ['White', 'Gray', 'Navy', 'Sage'] }] } },
      { defaults: { name: 'Candle Trio', price: 28.99, currency: 'USD', description: 'Soy wax candle set, 3 scents.', categories: ['Home', 'Décor'], url: 'https://example.com/home/candles', imageUrl: 'https://picsum.photos/400/400?random=hg5', hasOptions: true, isBundle: false, isDigital: false, hasGender: false, options: [{ name: 'Scent', values: ['Lavender', 'Vanilla', 'Citrus'] }] } },
    ],
  },
  {
    id: 'digital-downloads',
    label: 'Digital downloads',
    templateKey: 'product',
    templates: [
      { defaults: { name: 'eBook — Fiction', price: 9.99, currency: 'USD', description: 'Digital ebook download.', categories: ['Digital', 'Books'], url: 'https://example.com/digital/ebook', imageUrl: 'https://picsum.photos/400/400?random=dd1', hasOptions: false, isBundle: false, isDigital: true, hasGender: false } },
      { defaults: { name: 'Photo Preset Pack', price: 19.99, currency: 'USD', description: '10 Lightroom presets.', categories: ['Digital', 'Creative'], url: 'https://example.com/digital/presets', imageUrl: 'https://picsum.photos/400/400?random=dd2', hasOptions: true, isBundle: false, isDigital: true, hasGender: false, options: [{ name: 'Style', values: ['Light & Airy', 'Moody', 'Vintage'] }] } },
      { defaults: { name: 'Music Album', price: 7.99, currency: 'USD', description: 'MP3 album download.', categories: ['Digital', 'Music'], url: 'https://example.com/digital/album', imageUrl: 'https://picsum.photos/400/400?random=dd3', hasOptions: false, isBundle: false, isDigital: true, hasGender: false } },
      { defaults: { name: 'Online Course', price: 49.99, currency: 'USD', description: 'Lifetime access video course.', categories: ['Digital', 'Education'], url: 'https://example.com/digital/course', imageUrl: 'https://picsum.photos/400/400?random=dd4', hasOptions: false, isBundle: false, isDigital: true, hasGender: false } },
      { defaults: { name: 'Stock Photo Bundle', price: 29.99, currency: 'USD', description: '50 high-res stock photos.', categories: ['Digital', 'Creative'], url: 'https://example.com/digital/stock', imageUrl: 'https://picsum.photos/400/400?random=dd5', hasOptions: true, isBundle: false, isDigital: true, hasGender: false, options: [{ name: 'Category', values: ['Nature', 'Business', 'Lifestyle'] }] } },
    ],
  },
  {
    id: 'restaurant-menu-items',
    label: 'Restaurant menu items',
    templateKey: 'product',
    templates: [
      { defaults: { name: 'Signature Burger', price: 18, currency: 'USD', description: 'House blend beef, brioche bun.', categories: ['Food & Beverage', 'Mains'], url: 'https://example.com/menu/burger', imageUrl: 'https://picsum.photos/400/400?random=m1', hasOptions: false, isBundle: false, isDigital: false, hasGender: false } },
      { defaults: { name: 'Caesar Salad', price: 12, currency: 'USD', description: 'Classic Caesar.', categories: ['Food & Beverage', 'Salads'], url: 'https://example.com/menu/caesar', imageUrl: 'https://picsum.photos/400/400?random=m2', hasOptions: false, isBundle: false, isDigital: false, hasGender: false } },
      { defaults: { name: 'Grilled Salmon', price: 26, currency: 'USD', description: 'Atlantic salmon, seasonal vegetables.', categories: ['Food & Beverage', 'Mains'], url: 'https://example.com/menu/salmon', imageUrl: 'https://picsum.photos/400/400?random=m3', hasOptions: false, isBundle: false, isDigital: false, hasGender: false } },
      { defaults: { name: 'Margherita Pizza', price: 16, currency: 'USD', description: 'Tomato, mozzarella, basil.', categories: ['Food & Beverage', 'Mains'], url: 'https://example.com/menu/pizza', imageUrl: 'https://picsum.photos/400/400?random=m4', hasOptions: false, isBundle: false, isDigital: false, hasGender: false } },
      { defaults: { name: 'Chocolate Cake', price: 9, currency: 'USD', description: 'Dessert of the day.', categories: ['Food & Beverage', 'Desserts'], url: 'https://example.com/menu/cake', imageUrl: 'https://picsum.photos/400/400?random=m5', hasOptions: false, isBundle: false, isDigital: false, hasGender: false } },
    ],
  },
  {
    id: 'event-tickets',
    label: 'Event tickets',
    templateKey: 'service',
    templates: [
      {
        defaults: {
          name: 'Concert General Admission',
          price: 75,
          description: 'General admission ticket for a dated concert.',
          categories: ['Events', 'Tickets'],
          url: 'https://example.com/events/concert',
          imageUrl: 'https://picsum.photos/400/400?random=e1',
          bookingDateType: 'single date',
          bookingType: ['concert'],
        },
      },
      {
        defaults: {
          name: 'Theater Standard',
          price: 55,
          description: 'Standard seat for a specific performance date.',
          categories: ['Events', 'Tickets'],
          url: 'https://example.com/events/theater',
          imageUrl: 'https://picsum.photos/400/400?random=e2',
          bookingDateType: 'single date',
          bookingType: ['theater'],
        },
      },
      {
        defaults: {
          name: 'Festival Pass',
          price: 199,
          description: 'Pass for a multi-day event.',
          categories: ['Events', 'Tickets'],
          url: 'https://example.com/events/festival',
          imageUrl: 'https://picsum.photos/400/400?random=e3',
          bookingDateType: 'date range',
          dateRangeMinDays: 1,
          dateRangeMaxDays: 3,
          bookingType: ['festival'],
        },
      },
      {
        defaults: {
          name: 'Comedy Show',
          price: 35,
          description: 'Ticket for a scheduled comedy show.',
          categories: ['Events', 'Tickets'],
          url: 'https://example.com/events/comedy',
          imageUrl: 'https://picsum.photos/400/400?random=e4',
          bookingDateType: 'single date',
          bookingType: ['comedy'],
        },
      },
      {
        defaults: {
          name: 'Workshop',
          price: 120,
          description: 'Workshop seat for a specific session date.',
          categories: ['Events', 'Tickets'],
          url: 'https://example.com/events/workshop',
          imageUrl: 'https://picsum.photos/400/400?random=e5',
          bookingDateType: 'single date',
          bookingType: ['workshop'],
        },
      },
    ],
  },
  {
    id: 'flight-tickets',
    label: 'Flight tickets',
    templateKey: 'product',
    templates: [
      { defaults: { name: 'One-way Economy', price: 199, currency: 'USD', description: 'One-way economy.', categories: ['Travel', 'Flights'], url: 'https://example.com/flights/economy', imageUrl: 'https://picsum.photos/400/400?random=f1', hasOptions: true, isBundle: false, isDigital: true, hasGender: false, options: [{ name: 'Class', values: ['Economy'] }, { name: 'Fare', values: ['Standard', 'Flex'] }] } },
      { defaults: { name: 'One-way Premium', price: 399, currency: 'USD', description: 'One-way premium economy.', categories: ['Travel', 'Flights'], url: 'https://example.com/flights/premium', imageUrl: 'https://picsum.photos/400/400?random=f2', hasOptions: true, isBundle: false, isDigital: true, hasGender: false, options: [{ name: 'Class', values: ['Premium Economy'] }, { name: 'Fare', values: ['Standard', 'Refundable'] }] } },
      { defaults: { name: 'One-way Business', price: 899, currency: 'USD', description: 'One-way business.', categories: ['Travel', 'Flights'], url: 'https://example.com/flights/business', imageUrl: 'https://picsum.photos/400/400?random=f3', hasOptions: true, isBundle: false, isDigital: true, hasGender: false, options: [{ name: 'Class', values: ['Business'] }, { name: 'Fare', values: ['Flex', 'Refundable'] }] } },
      { defaults: { name: 'Round-trip Economy', price: 350, currency: 'USD', description: 'Round-trip economy.', categories: ['Travel', 'Flights'], url: 'https://example.com/flights/rt-economy', imageUrl: 'https://picsum.photos/400/400?random=f4', hasOptions: false, isBundle: false, isDigital: true, hasGender: false } },
      { defaults: { name: 'Multi-city', price: 599, currency: 'USD', description: 'Multi-city fare.', categories: ['Travel', 'Flights'], url: 'https://example.com/flights/multi', imageUrl: 'https://picsum.photos/400/400?random=f5', hasOptions: true, isBundle: false, isDigital: true, hasGender: false, options: [{ name: 'Stops', values: ['Direct', '1 Stop'] }] } },
    ],
  },
  // ——— Services ———
  {
    id: 'restaurant-reservations',
    label: 'Restaurant reservations',
    templateKey: 'service',
    templates: [
      { defaults: { name: 'Dinner Reservation', price: 0, description: 'Reserve a table for dinner. 90 min.', categories: ['Dining', 'Reservations'], url: 'https://example.com/reservations/dinner', imageUrl: 'https://picsum.photos/400/400?random=rr1', bookingDateType: 'single date', bookingType: ['dinner'] } },
      { defaults: { name: 'Brunch Reservation', price: 0, description: 'Weekend brunch. 90 min.', categories: ['Dining', 'Reservations'], url: 'https://example.com/reservations/brunch', imageUrl: 'https://picsum.photos/400/400?random=rr2', bookingDateType: 'single date', bookingType: ['brunch'] } },
      { defaults: { name: "Chef's Counter", price: 185, description: 'Exclusive chef counter. 3 hours.', categories: ['Dining', 'Experience'], url: 'https://example.com/experiences/chef', imageUrl: 'https://picsum.photos/400/400?random=rr3', bookingDateType: 'single date', bookingType: ['chef counter'] } },
      { defaults: { name: 'Private Dining', price: 500, description: 'Private room, 10 guests.', categories: ['Dining', 'Reservations'], url: 'https://example.com/private-dining', imageUrl: 'https://picsum.photos/400/400?random=rr4', bookingDateType: 'single date', bookingType: ['private dining'] } },
      { defaults: { name: 'Tasting Menu', price: 95, description: '5-course tasting.', categories: ['Dining', 'Experience'], url: 'https://example.com/tasting', imageUrl: 'https://picsum.photos/400/400?random=rr5', bookingDateType: 'single date', bookingType: ['tasting'] } },
    ],
  },
  {
    id: 'bar-reservations',
    label: 'Bar reservations',
    templateKey: 'service',
    templates: [
      { defaults: { name: 'Booth Reservation', price: 0, description: 'Reserved booth, 2-hour slot.', categories: ['Bar', 'Reservations'], url: 'https://example.com/bar/booth', imageUrl: 'https://picsum.photos/400/400?random=br1', bookingDateType: 'single date', bookingType: ['booth'] } },
      { defaults: { name: 'Rooftop Table', price: 50, description: 'Rooftop table, min spend applied.', categories: ['Bar', 'Reservations'], url: 'https://example.com/bar/rooftop', imageUrl: 'https://picsum.photos/400/400?random=br2', bookingDateType: 'single date', bookingType: ['rooftop'] } },
      { defaults: { name: 'Private Bar Hire', price: 800, description: 'Private bar area, 3 hours.', categories: ['Bar', 'Events'], url: 'https://example.com/bar/private', imageUrl: 'https://picsum.photos/400/400?random=br3', bookingDateType: 'single date', bookingType: ['private'] } },
      { defaults: { name: 'Cocktail Masterclass', price: 65, description: '90-min cocktail masterclass.', categories: ['Bar', 'Experience'], url: 'https://example.com/bar/masterclass', imageUrl: 'https://picsum.photos/400/400?random=br4', bookingDateType: 'single date', bookingType: ['masterclass'] } },
      { defaults: { name: 'Wine Tasting — 4 glasses', price: 45, description: 'Guided wine tasting, 4 pours.', categories: ['Bar', 'Experience'], url: 'https://example.com/bar/wine', imageUrl: 'https://picsum.photos/400/400?random=br5', bookingDateType: 'single date', bookingType: ['tasting'] } },
    ],
  },
  {
    id: 'hotel-rooms',
    label: 'Hotel rooms',
    templateKey: 'service',
    templates: [
      { defaults: { name: 'Deluxe King — 1 Night', price: 249, description: 'Deluxe King room.', categories: ['Accommodation', 'Hotel'], url: 'https://example.com/rooms/king', imageUrl: 'https://picsum.photos/400/400?random=hr1', bookingDateType: 'date range', dateRangeMinDays: 1, dateRangeMaxDays: 3 } },
      { defaults: { name: 'Double Queen — 1 Night', price: 199, description: 'Double Queen room.', categories: ['Accommodation', 'Hotel'], url: 'https://example.com/rooms/queen', imageUrl: 'https://picsum.photos/400/400?random=hr2', bookingDateType: 'date range', dateRangeMinDays: 1, dateRangeMaxDays: 3 } },
      { defaults: { name: 'Suite — 1 Night', price: 449, description: 'One-bedroom suite.', categories: ['Accommodation', 'Hotel'], url: 'https://example.com/rooms/suite', imageUrl: 'https://picsum.photos/400/400?random=hr3', bookingDateType: 'date range', dateRangeMinDays: 1, dateRangeMaxDays: 5 } },
      { defaults: { name: 'Standard Twin', price: 159, description: 'Standard twin beds.', categories: ['Accommodation', 'Hotel'], url: 'https://example.com/rooms/twin', imageUrl: 'https://picsum.photos/400/400?random=hr4', bookingDateType: 'date range', dateRangeMinDays: 1, dateRangeMaxDays: 2 } },
      { defaults: { name: 'Family Room — 1 Night', price: 329, description: 'Family room, sleeps 4.', categories: ['Accommodation', 'Hotel'], url: 'https://example.com/rooms/family', imageUrl: 'https://picsum.photos/400/400?random=hr5', bookingDateType: 'date range', dateRangeMinDays: 1, dateRangeMaxDays: 5 } },
    ],
  },
  {
    id: 'dental-appointment',
    label: 'Dental appointment',
    templateKey: 'service',
    templates: [
      { defaults: { name: 'Check-up & Clean', price: 120, description: 'Routine check-up and clean.', categories: ['Dental', 'Preventive'], url: 'https://example.com/dental/checkup', imageUrl: 'https://picsum.photos/400/400?random=da1', bookingDateType: 'single date', bookingType: ['check-up'] } },
      { defaults: { name: 'Filling', price: 185, description: 'Single filling.', categories: ['Dental', 'Restorative'], url: 'https://example.com/dental/filling', imageUrl: 'https://picsum.photos/400/400?random=da2', bookingDateType: 'single date', bookingType: ['filling'] } },
      { defaults: { name: 'Root Canal', price: 950, description: 'Root canal treatment.', categories: ['Dental', 'Restorative'], url: 'https://example.com/dental/rootcanal', imageUrl: 'https://picsum.photos/400/400?random=da3', bookingDateType: 'single date', bookingType: ['root canal'] } },
      { defaults: { name: 'Whitening', price: 350, description: 'In-chair whitening.', categories: ['Dental', 'Cosmetic'], url: 'https://example.com/dental/whitening', imageUrl: 'https://picsum.photos/400/400?random=da4', bookingDateType: 'single date', bookingType: ['whitening'] } },
      { defaults: { name: 'Extraction', price: 150, description: 'Simple extraction.', categories: ['Dental', 'Oral Surgery'], url: 'https://example.com/dental/extraction', imageUrl: 'https://picsum.photos/400/400?random=da5', bookingDateType: 'single date', bookingType: ['extraction'] } },
    ],
  },
  {
    id: 'physio-appointment',
    label: 'Physio appointment',
    templateKey: 'service',
    templates: [
      { defaults: { name: 'Initial Assessment', price: 95, description: '60-min initial assessment.', categories: ['Physiotherapy', 'Assessment'], url: 'https://example.com/physio/assessment', imageUrl: 'https://picsum.photos/400/400?random=pa1', bookingDateType: 'single date', bookingType: ['initial'] } },
      { defaults: { name: 'Follow-up Session', price: 75, description: '45-min follow-up.', categories: ['Physiotherapy', 'Treatment'], url: 'https://example.com/physio/followup', imageUrl: 'https://picsum.photos/400/400?random=pa2', bookingDateType: 'single date', bookingType: ['follow-up'] } },
      { defaults: { name: 'Sports Injury', price: 110, description: 'Sports injury rehab session.', categories: ['Physiotherapy', 'Sports'], url: 'https://example.com/physio/sports', imageUrl: 'https://picsum.photos/400/400?random=pa3', bookingDateType: 'single date', bookingType: ['sports'] } },
      { defaults: { name: 'Back & Neck', price: 85, description: 'Back and neck treatment.', categories: ['Physiotherapy', 'Musculoskeletal'], url: 'https://example.com/physio/back', imageUrl: 'https://picsum.photos/400/400?random=pa4', bookingDateType: 'single date', bookingType: ['back & neck'] } },
      { defaults: { name: 'Dry Needling', price: 95, description: 'Dry needling session.', categories: ['Physiotherapy', 'Treatment'], url: 'https://example.com/physio/needling', imageUrl: 'https://picsum.photos/400/400?random=pa5', bookingDateType: 'single date', bookingType: ['dry needling'] } },
    ],
  },
  {
    id: 'yoga-gym-classes',
    label: 'Yoga and gym classes',
    templateKey: 'service',
    templates: [
      { defaults: { name: 'Yoga Class', price: 20, description: '60-min yoga.', categories: ['Fitness', 'Yoga'], url: 'https://example.com/classes/yoga', imageUrl: 'https://picsum.photos/400/400?random=yg1', bookingDateType: 'single date', bookingType: ['yoga'] } },
      { defaults: { name: 'HIIT Class', price: 25, description: '45-min HIIT.', categories: ['Fitness', 'Classes'], url: 'https://example.com/classes/hiit', imageUrl: 'https://picsum.photos/400/400?random=yg2', bookingDateType: 'single date', bookingType: ['hiit'] } },
      { defaults: { name: 'Personal Training — 1 hr', price: 80, description: 'One-on-one session.', categories: ['Fitness', 'Training'], url: 'https://example.com/pt', imageUrl: 'https://picsum.photos/400/400?random=yg3', bookingDateType: 'single date', bookingType: ['personal training'] } },
      { defaults: { name: 'Pilates Reformer', price: 35, description: '50-min reformer Pilates.', categories: ['Fitness', 'Pilates'], url: 'https://example.com/classes/pilates', imageUrl: 'https://picsum.photos/400/400?random=yg4', bookingDateType: 'single date', bookingType: ['pilates'] } },
      { defaults: { name: 'Spin Class', price: 22, description: '45-min spin.', categories: ['Fitness', 'Classes'], url: 'https://example.com/classes/spin', imageUrl: 'https://picsum.photos/400/400?random=yg5', bookingDateType: 'single date', bookingType: ['spin'] } },
    ],
  },
  {
    id: 'tutoring-education',
    label: 'Tutoring & education sessions',
    templateKey: 'service',
    templates: [
      { defaults: { name: 'Math Tutoring — 1 hr', price: 55, description: 'One-on-one math.', categories: ['Education', 'Tutoring'], url: 'https://example.com/tutoring/math', imageUrl: 'https://picsum.photos/400/400?random=te1', bookingDateType: 'single date', bookingType: ['math'] } },
      { defaults: { name: 'Language Lesson', price: 45, description: '60-min language lesson.', categories: ['Education', 'Languages'], url: 'https://example.com/tutoring/language', imageUrl: 'https://picsum.photos/400/400?random=te2', bookingDateType: 'single date', bookingType: ['language'] } },
      { defaults: { name: 'SAT Prep Session', price: 90, description: '90-min SAT prep.', categories: ['Education', 'Test Prep'], url: 'https://example.com/tutoring/sat', imageUrl: 'https://picsum.photos/400/400?random=te3', bookingDateType: 'single date', bookingType: ['sat prep'] } },
      { defaults: { name: 'Music Lesson', price: 60, description: '45-min music lesson.', categories: ['Education', 'Music'], url: 'https://example.com/tutoring/music', imageUrl: 'https://picsum.photos/400/400?random=te4', bookingDateType: 'single date', bookingType: ['music'] } },
      { defaults: { name: 'Coding Workshop', price: 75, description: '90-min coding workshop.', categories: ['Education', 'STEM'], url: 'https://example.com/tutoring/coding', imageUrl: 'https://picsum.photos/400/400?random=te5', bookingDateType: 'single date', bookingType: ['coding'] } },
    ],
  },
  {
    id: 'consulting-agency',
    label: 'Consulting & agency services',
    templateKey: 'service',
    templates: [
      { defaults: { name: 'Strategy Workshop', price: 500, description: 'Half-day strategy workshop.', categories: ['Consulting', 'Strategy'], url: 'https://example.com/consulting/workshop', imageUrl: 'https://picsum.photos/400/400?random=ca1', bookingDateType: 'single date', bookingType: ['workshop'] } },
      { defaults: { name: 'Brand Audit', price: 1200, description: 'Full brand audit and report.', categories: ['Agency', 'Brand'], url: 'https://example.com/agency/audit', imageUrl: 'https://picsum.photos/400/400?random=ca2', bookingDateType: 'single date', bookingType: ['audit'] } },
      { defaults: { name: 'Marketing Retainer — 1 day', price: 800, description: 'One-day marketing support.', categories: ['Agency', 'Marketing'], url: 'https://example.com/agency/retainer', imageUrl: 'https://picsum.photos/400/400?random=ca3', bookingDateType: 'single date', bookingType: ['retainer'] } },
      { defaults: { name: 'Executive Coaching — 1 hr', price: 250, description: 'One-on-one coaching.', categories: ['Consulting', 'Coaching'], url: 'https://example.com/consulting/coaching', imageUrl: 'https://picsum.photos/400/400?random=ca4', bookingDateType: 'single date', bookingType: ['coaching'] } },
      { defaults: { name: 'Discovery Call', price: 0, description: '30-min discovery call.', categories: ['Consulting', 'Sales'], url: 'https://example.com/consulting/discovery', imageUrl: 'https://picsum.photos/400/400?random=ca5', bookingDateType: 'single date', bookingType: ['discovery'] } },
    ],
  },
  {
    id: 'contractors-trades',
    label: 'Contractors & trades',
    templateKey: 'service',
    templates: [
      { defaults: { name: 'Plumbing — Call-out', price: 95, description: 'Call-out plus first hour.', categories: ['Trades', 'Plumbing'], url: 'https://example.com/trades/plumbing', imageUrl: 'https://picsum.photos/400/400?random=ct1', bookingDateType: 'single date', bookingType: ['plumbing'] } },
      { defaults: { name: 'Electrical Inspection', price: 150, description: 'Full electrical inspection.', categories: ['Trades', 'Electrical'], url: 'https://example.com/trades/electrical', imageUrl: 'https://picsum.photos/400/400?random=ct2', bookingDateType: 'single date', bookingType: ['electrical'] } },
      { defaults: { name: 'HVAC Service', price: 120, description: 'HVAC service and tune-up.', categories: ['Trades', 'HVAC'], url: 'https://example.com/trades/hvac', imageUrl: 'https://picsum.photos/400/400?random=ct3', bookingDateType: 'single date', bookingType: ['hvac'] } },
      { defaults: { name: 'Painting — Half day', price: 350, description: 'Half-day painting job.', categories: ['Trades', 'Painting'], url: 'https://example.com/trades/painting', imageUrl: 'https://picsum.photos/400/400?random=ct4', bookingDateType: 'single date', bookingType: ['painting'] } },
      { defaults: { name: 'Carpentry — 2 hrs', price: 180, description: '2-hour carpentry.', categories: ['Trades', 'Carpentry'], url: 'https://example.com/trades/carpentry', imageUrl: 'https://picsum.photos/400/400?random=ct5', bookingDateType: 'single date', bookingType: ['carpentry'] } },
    ],
  },
  {
    id: 'auto-services',
    label: 'Auto services',
    templateKey: 'service',
    templates: [
      { defaults: { name: 'Oil Change', price: 65, description: 'Full synthetic oil change.', categories: ['Auto', 'Maintenance'], url: 'https://example.com/auto/oil', imageUrl: 'https://picsum.photos/400/400?random=as1', bookingDateType: 'single date', bookingType: ['oil change'] } },
      { defaults: { name: 'Brake Inspection', price: 0, description: 'Free brake check.', categories: ['Auto', 'Safety'], url: 'https://example.com/auto/brakes', imageUrl: 'https://picsum.photos/400/400?random=as2', bookingDateType: 'single date', bookingType: ['inspection'] } },
      { defaults: { name: 'Tire Rotation', price: 35, description: 'Tire rotation and balance.', categories: ['Auto', 'Maintenance'], url: 'https://example.com/auto/tires', imageUrl: 'https://picsum.photos/400/400?random=as3', bookingDateType: 'single date', bookingType: ['tires'] } },
      { defaults: { name: 'Full Service', price: 199, description: 'Full vehicle service.', categories: ['Auto', 'Maintenance'], url: 'https://example.com/auto/full', imageUrl: 'https://picsum.photos/400/400?random=as4', bookingDateType: 'single date', bookingType: ['full service'] } },
      { defaults: { name: 'Diagnostic', price: 85, description: 'Diagnostic scan and report.', categories: ['Auto', 'Repair'], url: 'https://example.com/auto/diagnostic', imageUrl: 'https://picsum.photos/400/400?random=as5', bookingDateType: 'single date', bookingType: ['diagnostic'] } },
    ],
  },
  {
    id: 'tours-experiences',
    label: 'Tours & experiences',
    templateKey: 'service',
    templates: [
      { defaults: { name: 'City Walking Tour', price: 45, description: '2-hour city walking tour.', categories: ['Tours', 'Walking'], url: 'https://example.com/tours/city', imageUrl: 'https://picsum.photos/400/400?random=tx1', bookingDateType: 'single date', bookingType: ['walking tour'] } },
      { defaults: { name: 'Wine Country Tour', price: 125, description: 'Full-day wine tour.', categories: ['Tours', 'Food & Drink'], url: 'https://example.com/tours/wine', imageUrl: 'https://picsum.photos/400/400?random=tx2', bookingDateType: 'single date', bookingType: ['wine tour'] } },
      { defaults: { name: 'Cooking Class', price: 95, description: '3-hour hands-on cooking.', categories: ['Experiences', 'Food'], url: 'https://example.com/experiences/cooking', imageUrl: 'https://picsum.photos/400/400?random=tx3', bookingDateType: 'single date', bookingType: ['cooking'] } },
      { defaults: { name: 'Kayak Rental — 2 hrs', price: 55, description: '2-hour kayak rental.', categories: ['Experiences', 'Outdoor'], url: 'https://example.com/experiences/kayak', imageUrl: 'https://picsum.photos/400/400?random=tx4', bookingDateType: 'single date', bookingType: ['kayak'] } },
      { defaults: { name: 'Photography Workshop', price: 150, description: 'Half-day photography workshop.', categories: ['Experiences', 'Creative'], url: 'https://example.com/experiences/photo', imageUrl: 'https://picsum.photos/400/400?random=tx5', bookingDateType: 'single date', bookingType: ['photography'] } },
    ],
  },
  // ——— Subscriptions ———
  {
    id: 'saas-plans',
    label: 'SaaS plans',
    templateKey: 'subscription',
    templates: [
      { defaults: { name: 'Starter Plan', price: 19, currency: 'USD', description: 'Starter: up to 3 seats.', categories: ['SaaS', 'Software'], url: 'https://example.com/pricing/starter', imageUrl: 'https://picsum.photos/400/400?random=sp1', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Pro Plan', price: 49, currency: 'USD', description: 'Pro: up to 10 seats.', categories: ['SaaS', 'Software'], url: 'https://example.com/pricing/pro', imageUrl: 'https://picsum.photos/400/400?random=sp2', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Team Plan', price: 99, currency: 'USD', description: 'Team: up to 25 seats.', categories: ['SaaS', 'Software'], url: 'https://example.com/pricing/team', imageUrl: 'https://picsum.photos/400/400?random=sp3', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Enterprise Plan', price: 299, currency: 'USD', description: 'Enterprise: unlimited.', categories: ['SaaS', 'Software'], url: 'https://example.com/pricing/enterprise', imageUrl: 'https://picsum.photos/400/400?random=sp4', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Annual Pro', price: 470, currency: 'USD', description: 'Pro, billed annually.', categories: ['SaaS', 'Software'], url: 'https://example.com/pricing/pro-annual', imageUrl: 'https://picsum.photos/400/400?random=sp5', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
    ],
  },
  {
    id: 'gym-studio-memberships',
    label: 'Gym & studio memberships',
    templateKey: 'subscription',
    templates: [
      { defaults: { name: 'Monthly Gym', price: 59, currency: 'USD', description: 'Full gym access.', categories: ['Fitness', 'Membership'], url: 'https://example.com/gym/monthly', imageUrl: 'https://picsum.photos/400/400?random=gsm1', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Annual Gym', price: 550, currency: 'USD', description: 'Full gym, annual.', categories: ['Fitness', 'Membership'], url: 'https://example.com/gym/annual', imageUrl: 'https://picsum.photos/400/400?random=gsm2', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
      { defaults: { name: 'Yoga Studio — Monthly', price: 89, currency: 'USD', description: 'Unlimited yoga classes.', categories: ['Fitness', 'Yoga'], url: 'https://example.com/yoga/monthly', imageUrl: 'https://picsum.photos/400/400?random=gsm3', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Pilates — 8 classes', price: 120, currency: 'USD', description: '8 reformer classes per month.', categories: ['Fitness', 'Pilates'], url: 'https://example.com/pilates/8pack', imageUrl: 'https://picsum.photos/400/400?random=gsm4', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'CrossFit Box', price: 149, currency: 'USD', description: 'Unlimited CrossFit.', categories: ['Fitness', 'Membership'], url: 'https://example.com/crossfit/monthly', imageUrl: 'https://picsum.photos/400/400?random=gsm5', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
    ],
  },
  {
    id: 'loyalty-vip-programs',
    label: 'Loyalty / VIP programs',
    templateKey: 'subscription',
    templates: [
      { defaults: { name: 'VIP Silver', price: 0, currency: 'USD', description: 'Free VIP tier.', categories: ['Loyalty', 'VIP'], url: 'https://example.com/vip/silver', imageUrl: 'https://picsum.photos/400/400?random=lvp1', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
      { defaults: { name: 'VIP Gold', price: 99, currency: 'USD', description: 'Gold benefits and perks.', categories: ['Loyalty', 'VIP'], url: 'https://example.com/vip/gold', imageUrl: 'https://picsum.photos/400/400?random=lvp2', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
      { defaults: { name: 'VIP Platinum', price: 249, currency: 'USD', description: 'Platinum: best perks.', categories: ['Loyalty', 'VIP'], url: 'https://example.com/vip/platinum', imageUrl: 'https://picsum.photos/400/400?random=lvp3', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
      { defaults: { name: 'Rewards Plus', price: 49, currency: 'USD', description: 'Extra points and rewards.', categories: ['Loyalty', 'Rewards'], url: 'https://example.com/rewards/plus', imageUrl: 'https://picsum.photos/400/400?random=lvp4', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
      { defaults: { name: 'Concierge Tier', price: 499, currency: 'USD', description: 'Dedicated concierge.', categories: ['Loyalty', 'VIP'], url: 'https://example.com/vip/concierge', imageUrl: 'https://picsum.photos/400/400?random=lvp5', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
    ],
  },
  {
    id: 'donor-subscriptions',
    label: 'Donor subscriptions',
    templateKey: 'subscription',
    templates: [
      { defaults: { name: 'Friend — Monthly', price: 10, currency: 'USD', description: 'Monthly supporter.', categories: ['Donor', 'Giving'], url: 'https://example.com/donate/friend', imageUrl: 'https://picsum.photos/400/400?random=don1', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Supporter — Monthly', price: 25, currency: 'USD', description: 'Regular supporter.', categories: ['Donor', 'Giving'], url: 'https://example.com/donate/supporter', imageUrl: 'https://picsum.photos/400/400?random=don2', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Patron — Annual', price: 500, currency: 'USD', description: 'Annual patron.', categories: ['Donor', 'Giving'], url: 'https://example.com/donate/patron', imageUrl: 'https://picsum.photos/400/400?random=don3', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
      { defaults: { name: 'Benefactor — Annual', price: 1200, currency: 'USD', description: 'Benefactor tier.', categories: ['Donor', 'Giving'], url: 'https://example.com/donate/benefactor', imageUrl: 'https://picsum.photos/400/400?random=don4', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
      { defaults: { name: 'Founding Member', price: 5000, currency: 'USD', description: 'Founding member.', categories: ['Donor', 'Giving'], url: 'https://example.com/donate/founding', imageUrl: 'https://picsum.photos/400/400?random=don5', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
    ],
  },
  {
    id: 'subscription-boxes',
    label: 'Subscription boxes',
    templateKey: 'subscription',
    templates: [
      { defaults: { name: 'Snack Box — Monthly', price: 29, currency: 'USD', description: 'Curated snacks each month.', categories: ['Subscription', 'Food'], url: 'https://example.com/box/snack', imageUrl: 'https://picsum.photos/400/400?random=sbx1', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Beauty Box', price: 24, currency: 'USD', description: '5 beauty samples monthly.', categories: ['Subscription', 'Beauty'], url: 'https://example.com/box/beauty', imageUrl: 'https://picsum.photos/400/400?random=sbx2', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Coffee — Every 2 weeks', price: 18, currency: 'USD', description: 'Fresh coffee every 2 weeks.', categories: ['Subscription', 'Beverage'], url: 'https://example.com/box/coffee', imageUrl: 'https://picsum.photos/400/400?random=sbx3', subscriptionInterval: 'monthly', paymentInterval: 'weekly' } },
      { defaults: { name: 'Book Club', price: 16, currency: 'USD', description: 'One book per month.', categories: ['Subscription', 'Books'], url: 'https://example.com/box/books', imageUrl: 'https://picsum.photos/400/400?random=sbx4', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Kids Activity Box', price: 34, currency: 'USD', description: 'Monthly kids activities.', categories: ['Subscription', 'Kids'], url: 'https://example.com/box/kids', imageUrl: 'https://picsum.photos/400/400?random=sbx5', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
    ],
  },
  {
    id: 'telecom-isp-plans',
    label: 'Telecom / ISP plans',
    templateKey: 'subscription',
    templates: [
      { defaults: { name: 'Basic Internet', price: 49, currency: 'USD', description: '100 Mbps, 12-month term.', categories: ['Telecom', 'Internet'], url: 'https://example.com/isp/basic', imageUrl: 'https://picsum.photos/400/400?random=tel1', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Unlimited Mobile', price: 65, currency: 'USD', description: 'Unlimited data and talk.', categories: ['Telecom', 'Mobile'], url: 'https://example.com/mobile/unlimited', imageUrl: 'https://picsum.photos/400/400?random=tel2', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Fiber 500', price: 79, currency: 'USD', description: '500 Mbps fiber.', categories: ['Telecom', 'Internet'], url: 'https://example.com/isp/fiber', imageUrl: 'https://picsum.photos/400/400?random=tel3', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Family Plan — 4 lines', price: 120, currency: 'USD', description: '4 lines, shared data.', categories: ['Telecom', 'Mobile'], url: 'https://example.com/mobile/family', imageUrl: 'https://picsum.photos/400/400?random=tel4', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Business Internet', price: 149, currency: 'USD', description: 'Business-grade fiber.', categories: ['Telecom', 'Business'], url: 'https://example.com/isp/business', imageUrl: 'https://picsum.photos/400/400?random=tel5', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
    ],
  },
  {
    id: 'service-contracts',
    label: 'Service contracts',
    templateKey: 'subscription',
    templates: [
      { defaults: { name: 'HVAC Maintenance — Annual', price: 199, currency: 'USD', description: '2 tune-ups per year.', categories: ['Service', 'HVAC'], url: 'https://example.com/contracts/hvac', imageUrl: 'https://picsum.photos/400/400?random=sco1', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
      { defaults: { name: 'Lawn Care — Monthly', price: 45, currency: 'USD', description: 'Monthly mow and edge.', categories: ['Service', 'Lawn'], url: 'https://example.com/contracts/lawn', imageUrl: 'https://picsum.photos/400/400?random=sco2', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'IT Support — Monthly', price: 299, currency: 'USD', description: 'Helpdesk and support.', categories: ['Service', 'IT'], url: 'https://example.com/contracts/it', imageUrl: 'https://picsum.photos/400/400?random=sco3', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Security Monitoring', price: 39, currency: 'USD', description: '24/7 alarm monitoring.', categories: ['Service', 'Security'], url: 'https://example.com/contracts/security', imageUrl: 'https://picsum.photos/400/400?random=sco4', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Pest Control — Quarterly', price: 89, currency: 'USD', description: 'Quarterly pest treatment.', categories: ['Service', 'Pest'], url: 'https://example.com/contracts/pest', imageUrl: 'https://picsum.photos/400/400?random=sco5', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
    ],
  },
  {
    id: 'hotel-loyalty-memberships',
    label: 'Hotel loyalty memberships',
    templateKey: 'subscription',
    templates: [
      { defaults: { name: 'Free Tier', price: 0, currency: 'USD', description: 'Free loyalty tier.', categories: ['Hotel', 'Loyalty'], url: 'https://example.com/hotel/loyalty', imageUrl: 'https://picsum.photos/400/400?random=hlm1', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
      { defaults: { name: 'Silver Member', price: 0, currency: 'USD', description: 'Silver status, earn points.', categories: ['Hotel', 'Loyalty'], url: 'https://example.com/hotel/silver', imageUrl: 'https://picsum.photos/400/400?random=hlm2', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
      { defaults: { name: 'Gold Member', price: 99, currency: 'USD', description: 'Gold: late checkout, upgrades.', categories: ['Hotel', 'Loyalty'], url: 'https://example.com/hotel/gold', imageUrl: 'https://picsum.photos/400/400?random=hlm3', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
      { defaults: { name: 'Platinum Member', price: 299, currency: 'USD', description: 'Platinum: lounge, suite upgrades.', categories: ['Hotel', 'Loyalty'], url: 'https://example.com/hotel/platinum', imageUrl: 'https://picsum.photos/400/400?random=hlm4', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
      { defaults: { name: 'Lifetime Diamond', price: 999, currency: 'USD', description: 'Lifetime top tier.', categories: ['Hotel', 'Loyalty'], url: 'https://example.com/hotel/diamond', imageUrl: 'https://picsum.photos/400/400?random=hlm5', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
    ],
  },
  {
    id: 'restaurant-memberships',
    label: 'Restaurant memberships',
    templateKey: 'subscription',
    templates: [
      { defaults: { name: 'VIP Dining — Monthly', price: 49, currency: 'USD', description: 'Priority reservations, perks.', categories: ['Dining', 'Membership'], url: 'https://example.com/restaurant/vip', imageUrl: 'https://picsum.photos/400/400?random=rem1', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Wine Club', price: 79, currency: 'USD', description: '2 bottles per month, discount.', categories: ['Dining', 'Wine'], url: 'https://example.com/restaurant/wineclub', imageUrl: 'https://picsum.photos/400/400?random=rem2', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Chef\'s Table — Annual', price: 499, currency: 'USD', description: 'Exclusive chef events.', categories: ['Dining', 'Membership'], url: 'https://example.com/restaurant/chefs', imageUrl: 'https://picsum.photos/400/400?random=rem3', subscriptionInterval: 'yearly', paymentInterval: 'yearly' } },
      { defaults: { name: 'Brunch Pass', price: 199, currency: 'USD', description: 'Unlimited brunch, 6 months.', categories: ['Dining', 'Membership'], url: 'https://example.com/restaurant/brunch', imageUrl: 'https://picsum.photos/400/400?random=rem4', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
      { defaults: { name: 'Coffee Subscription', price: 25, currency: 'USD', description: 'Daily coffee, 20% off food.', categories: ['Dining', 'Coffee'], url: 'https://example.com/restaurant/coffee', imageUrl: 'https://picsum.photos/400/400?random=rem5', subscriptionInterval: 'monthly', paymentInterval: 'monthly' } },
    ],
  },
]

const MAX_TEMPLATES_PER_TYPE = 5

/**
 * @param {string} id - Business type id
 * @returns {object|undefined}
 */
export function getBusinessTypeById(id) {
  return BUSINESS_TYPES.find((bt) => bt.id === id)
}

/**
 * @param {string} templateKey - 'product' | 'service' | 'subscription'
 * @returns {object[]} Business types for that template
 */
export function getBusinessTypesByTemplate(templateKey) {
  return BUSINESS_TYPES.filter((bt) => bt.templateKey === templateKey)
}

/**
 * @param {object} businessType - From getBusinessTypeById or getBusinessTypesByTemplate
 * @returns {number} Max number of items (1–5) for this business type
 */
export function getMaxTemplatesForBusinessType(businessType) {
  if (!businessType || !Array.isArray(businessType.templates)) return 0
  return Math.min(MAX_TEMPLATES_PER_TYPE, businessType.templates.length)
}

/**
 * Turn a business type's templates into catalog-like items (id, name, price, currency, etc.).
 * Used by event generator when "industry template" is selected instead of stored catalog.
 * @param {object} businessType - From getBusinessTypeById
 * @returns {object[]} Items shaped like catalog items
 */
export function getCatalogItemsFromBusinessType(businessType) {
  if (!businessType || !Array.isArray(businessType.templates)) return []
  return businessType.templates.map((t, i) => {
    const d = t.defaults || {}
    return {
      id: `${businessType.id}-${i}`,
      name: d.name ?? 'Item',
      price: d.price ?? 0,
      currency: d.currency ?? 'USD',
      ...d,
    }
  })
}

/**
 * Get all business type ids relevant to an event (for Events > Configure dropdown).
 * Returns business types whose catalog matches the event (product/service/subscription)
 * plus any that have property overrides for this event.
 */
export function getRelevantBusinessTypeIdsForEvent(eventName) {
  if (!eventName) return []
  const schema = getEventPropertySchema(eventName)
  const catalogItemType = schema?.catalogItemType ?? null
  const byCatalog = catalogItemType
    ? BUSINESS_TYPES.filter((bt) => bt.templateKey === catalogItemType).map((bt) => bt.id)
    : BUSINESS_TYPES.map((bt) => bt.id)
  const byOverrides = getBusinessTypeIdsForEvent(eventName)
  return [...new Set([...byCatalog, ...byOverrides])].sort()
}
