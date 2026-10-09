/**
 * Demo catalog for local development, used by `npm run seed:demo`.
 *
 * Attribute values are keyed by the attribute label, or "Group > Label" for attributes inside
 * a tag's group. The seed script checks that every attribute required by a product's tags has
 * a value before writing anything.
 */
import type { Product, Tag } from '@/payload-types'

export const DEMO_PASSWORD = 'Password@123'

type TagAttribute = NonNullable<Tag['attributes']>[number]

const single = (label: string, validation: TagAttribute['validation'] = { type: 'text' }) =>
  ({ type: 'single', label, validation }) satisfies TagAttribute

const group = (
  groupName: string,
  items: { label: string; validation?: TagAttribute['validation'] }[],
) =>
  ({
    type: 'group',
    groupName,
    items: items.map((item) => ({
      label: item.label,
      validation: item.validation ?? { type: 'text' },
    })),
  }) satisfies TagAttribute

const num = (min: number, max: number) => ({ type: 'number', min, max }) as const
const bool = { type: 'boolean' } as const

/** New tags (created by the admin) that use grouped attributes. Existing tags are reused by name. */
export const demoTags: { name: string; category: string; attributes: TagAttribute[] }[] = [
  {
    name: 'Laptops',
    category: 'Tech',
    attributes: [
      group('Display', [
        { label: 'Screen Size (inches)', validation: num(10, 20) },
        { label: 'Resolution' },
        { label: 'Refresh Rate (Hz)', validation: num(30, 360) },
      ]),
      group('Performance', [
        { label: 'Processor' },
        { label: 'RAM (GB)', validation: num(2, 128) },
        { label: 'Storage (GB)', validation: num(64, 8192) },
      ]),
      single('Operating System'),
      single('Backlit Keyboard', bool),
    ],
  },
  {
    name: 'Sneakers',
    category: 'Fashion',
    attributes: [
      group('Fit & Size', [{ label: 'UK Size', validation: num(3, 13) }, { label: 'Width' }]),
      group('Materials', [{ label: 'Upper' }, { label: 'Outsole' }]),
      single('Waterproof', bool),
    ],
  },
  {
    name: 'Cookware',
    category: 'Home & Living',
    attributes: [
      group('Dimensions', [
        { label: 'Diameter (cm)', validation: num(10, 60) },
        { label: 'Depth (cm)', validation: num(1, 30) },
      ]),
      single('Induction Compatible', bool),
      single('Coating'),
    ],
  },
  {
    name: 'Hair Styling Tools',
    category: 'Beauty',
    attributes: [
      group('Heat Settings', [
        { label: 'Max Temperature (°C)', validation: num(80, 250) },
        { label: 'Heat Levels', validation: num(1, 30) },
      ]),
      single('Cordless', bool),
      single('Plate Material'),
    ],
  },
]

export type DemoProduct = {
  title: string
  sku: string
  tags: string[]
  status: Product['status']
  sellingPrice: number
  mrp: number
  stockStatus: NonNullable<Product['stockStatus']>
  stockQuantity: number
  attributes: Record<string, string>
}

export type DemoSeller = {
  email: string
  /** Each brand has one category; its products take that category and use its tags. */
  brands: { name: string; category: string; details: string; products: DemoProduct[] }[]
}

export const demoSellers: DemoSeller[] = [
  {
    email: 'user1@gmail.com',
    brands: [
      {
        name: 'Volt Audio',
        category: 'Tech',
        details: 'Wireless audio gear tuned for long commutes and late-night gaming.',
        products: [
          {
            title: 'Volt Pods Pro ANC Earbuds',
            sku: 'VOLT-PODS-PRO',
            tags: ['Audio'],
            status: 'active',
            sellingPrice: 3499,
            mrp: 5999,
            stockStatus: 'in_stock',
            stockQuantity: 140,
            attributes: {
              'Connectivity Type': 'Bluetooth 5.3',
              'Battery Life (Hours)': '32',
              'Noise Cancellation': 'Hybrid ANC up to 40 dB',
              'Driver Size (mm)': '11',
            },
          },
          {
            title: 'Volt Raptor 7.1 Gaming Headset',
            sku: 'VOLT-RAPTOR-71',
            tags: ['Gaming', 'Audio'],
            status: 'active',
            sellingPrice: 4299,
            mrp: 6499,
            stockStatus: 'in_stock',
            stockQuantity: 65,
            attributes: {
              'Headphones > RGB': 'true',
              'Headphones > Wired': 'false',
              'Headphones > Battery Life': '45 hours with RGB off',
              'DPI / Sensitivity': '100',
              'Connection Type': '2.4 GHz wireless dongle + Bluetooth',
              'RGB Lighting': 'Per-ear-cup, 16.8M colours',
              'Connectivity Type': 'Wireless (2.4 GHz) / USB-C wired',
              'Battery Life (Hours)': '45',
              'Noise Cancellation': 'Detachable noise-cancelling boom mic',
              'Driver Size (mm)': '50',
            },
          },
        ],
      },
      {
        name: 'Pixel Forge',
        category: 'Tech',
        details: 'Laptops and desk accessories for creators who live in their browser tabs.',
        products: [
          {
            title: 'Pixel Forge Aero 14 Laptop',
            sku: 'PF-AERO-14',
            tags: ['Laptops'],
            status: 'active',
            sellingPrice: 74990,
            mrp: 89990,
            stockStatus: 'in_stock',
            stockQuantity: 18,
            attributes: {
              'Display > Screen Size (inches)': '14',
              'Display > Resolution': '2880 x 1800 OLED',
              'Display > Refresh Rate (Hz)': '120',
              'Performance > Processor': 'Intel Core Ultra 7 155H',
              'Performance > RAM (GB)': '16',
              'Performance > Storage (GB)': '1024',
              'Operating System': 'Windows 11 Home',
              'Backlit Keyboard': 'true',
            },
          },
          {
            title: 'Pixel Forge TKL Mechanical Keyboard',
            sku: 'PF-TKL-MECH',
            tags: ['Computer Accessories'],
            status: 'draft',
            sellingPrice: 5499,
            mrp: 6999,
            stockStatus: 'preorder',
            stockQuantity: 0,
            attributes: {
              'Interface / Connection': 'USB-C, Bluetooth 5.1',
              'Operating System Support': 'Windows, macOS, Linux',
              'Weight (g)': '820',
              'Form Factor': 'Tenkeyless (87 keys)',
            },
          },
        ],
      },
    ],
  },
  {
    email: 'user2@gmail.com',
    brands: [
      {
        name: 'Urban Threads',
        category: 'Fashion',
        details: 'Everyday cotton and linen basics, cut and stitched in Jaipur.',
        products: [
          {
            title: 'Urban Threads Relaxed Linen Shirt',
            sku: 'UT-LINEN-SHIRT',
            tags: ['Tops'],
            status: 'active',
            sellingPrice: 1799,
            mrp: 2499,
            stockStatus: 'in_stock',
            stockQuantity: 210,
            attributes: {
              Size: 'S, M, L, XL',
              'Fabric Material': '100% linen',
              'Sleeve Length': 'Full sleeve',
              'Neckline Style': 'Cuban collar',
            },
          },
          {
            title: 'Urban Threads Slim Fit Stretch Jeans',
            sku: 'UT-SLIM-JEANS',
            tags: ['Bottoms'],
            status: 'active',
            sellingPrice: 2199,
            mrp: 2999,
            stockStatus: 'in_stock',
            stockQuantity: 160,
            attributes: {
              'Waist Size (Inches)': '32',
              'Fit Type': 'Slim fit',
              'Fabric Material': '98% cotton, 2% elastane',
              'Closure Type': 'Zip fly with button',
            },
          },
        ],
      },
      {
        name: 'Stride Co.',
        category: 'Fashion',
        details: 'Sneakers and bags built for city walking.',
        products: [
          {
            title: 'Stride Co. Cloudrun Sneakers',
            sku: 'STRIDE-CLOUDRUN',
            tags: ['Sneakers', 'Footwear'],
            status: 'active',
            sellingPrice: 3999,
            mrp: 5499,
            stockStatus: 'in_stock',
            stockQuantity: 95,
            attributes: {
              'Fit & Size > UK Size': '9',
              'Fit & Size > Width': 'Regular',
              'Materials > Upper': 'Engineered knit mesh',
              'Materials > Outsole': 'Rubber with EVA midsole',
              Waterproof: 'false',
              'Shoe Size (UK/India)': '9',
              'Upper Material': 'Engineered knit mesh',
              'Sole Material': 'Rubber',
              'Toe Style': 'Round toe',
            },
          },
          {
            title: 'Stride Co. Commuter Backpack 24L',
            sku: 'STRIDE-COMMUTER-24',
            tags: ['Bags'],
            status: 'draft',
            sellingPrice: 2799,
            mrp: 3499,
            stockStatus: 'out_of_stock',
            stockQuantity: 0,
            attributes: {
              'Capacity (Litres)': '24',
              Material: 'Water-resistant recycled polyester',
              'Number of Compartments': '4',
              'Strap Type': 'Padded shoulder straps with sternum strap',
            },
          },
        ],
      },
    ],
  },
  {
    email: 'user3@gmail.com',
    brands: [
      {
        name: 'Hearth & Home',
        category: 'Home & Living',
        details: 'Cast iron, cotton and warm light for slow homes.',
        products: [
          {
            title: 'Hearth & Home Pre-Seasoned Cast Iron Skillet',
            sku: 'HH-SKILLET-26',
            tags: ['Cookware', 'Kitchen & Dining'],
            status: 'active',
            sellingPrice: 1899,
            mrp: 2599,
            stockStatus: 'in_stock',
            stockQuantity: 75,
            attributes: {
              'Dimensions > Diameter (cm)': '26',
              'Dimensions > Depth (cm)': '5',
              'Induction Compatible': 'true',
              Coating: 'Pre-seasoned vegetable oil',
              'Capacity / Volume': '2.2 L',
              Material: 'Cast iron',
              'Dishwasher Safe': 'No, hand wash only',
              'Microwave Safe': 'No',
            },
          },
          {
            title: 'Hearth & Home Ceramic Table Lamp',
            sku: 'HH-LAMP-CERAMIC',
            tags: ['Lighting'],
            status: 'active',
            sellingPrice: 2499,
            mrp: 3299,
            stockStatus: 'in_stock',
            stockQuantity: 40,
            attributes: {
              'Bulb Base Type': 'E27',
              'Wattage (W)': '9',
              'Light Color / Temperature': 'Warm white, 2700K',
              Dimmable: 'Yes, with inline dimmer',
            },
          },
          {
            title: 'Hearth & Home 400TC Cotton Bedsheet Set',
            sku: 'HH-BEDSHEET-400',
            tags: ['Bedding'],
            status: 'draft',
            sellingPrice: 2299,
            mrp: 2999,
            stockStatus: 'preorder',
            stockQuantity: 0,
            attributes: {
              'Bed Size': 'King (108 x 108 in)',
              'Thread Count': '400',
              'Fabric Material': '100% long-staple cotton',
              'Care Instructions': 'Machine wash cold, tumble dry low',
            },
          },
        ],
      },
      {
        name: 'Brew Lab',
        category: 'Home & Living',
        details: 'Insulated drinkware that keeps chai hot through the workday.',
        products: [
          {
            title: 'Brew Lab Thermo Steel Bottle 750ml',
            sku: 'BREW-THERMO-750',
            tags: ['Drinkware'],
            status: 'active',
            sellingPrice: 999,
            mrp: 1499,
            stockStatus: 'in_stock',
            stockQuantity: 320,
            attributes: {
              'Volume Capacity (ml)': '750',
              'Insulation Duration (Hours)': '24',
              Material: '18/8 stainless steel',
              'Leak Proof': 'Yes',
            },
          },
        ],
      },
    ],
  },
  {
    email: 'user4@gmail.com',
    brands: [
      {
        name: 'Glow Ritual',
        category: 'Beauty',
        details: 'Clean skincare and heat-styling tools for everyday routines.',
        products: [
          {
            title: 'Glow Ritual 10% Vitamin C Serum',
            sku: 'GLOW-VITC-30',
            tags: ['Skin Care'],
            status: 'active',
            sellingPrice: 649,
            mrp: 899,
            stockStatus: 'in_stock',
            stockQuantity: 450,
            attributes: {
              'Skin Type': 'All skin types',
              'Volume (ml)': '30',
              'Key Ingredient': 'Ethyl ascorbic acid with niacinamide',
              'Sun Protection Factor (SPF)': '0',
            },
          },
          {
            title: 'Glow Ritual Ionic Hair Straightener',
            sku: 'GLOW-STRAIGHT-ION',
            tags: ['Hair Styling Tools', 'Beauty Tools'],
            status: 'active',
            sellingPrice: 2299,
            mrp: 3199,
            stockStatus: 'in_stock',
            stockQuantity: 85,
            attributes: {
              'Heat Settings > Max Temperature (°C)': '230',
              'Heat Settings > Heat Levels': '5',
              Cordless: 'false',
              'Plate Material': 'Ceramic with tourmaline coating',
              'Power Source': 'Corded, 220-240V',
              Material: 'Heat-resistant ABS body',
              'Head / Bristle Type': 'Floating 1-inch plates',
              'Washable / Waterproof': 'No',
            },
          },
        ],
      },
      {
        name: 'Zen Fit',
        category: 'Wellness & Fitness',
        details: 'Home workout and yoga essentials.',
        products: [
          {
            title: 'Zen Fit Cork Yoga Mat 6mm',
            sku: 'ZEN-MAT-CORK-6',
            tags: ['Yoga'],
            status: 'active',
            sellingPrice: 2599,
            mrp: 3499,
            stockStatus: 'in_stock',
            stockQuantity: 120,
            attributes: {
              'Thickness (mm)': '6',
              'Mat Material': 'Natural cork on TPE base',
              'Grip Level': 'High, improves when wet',
              'Length (cm)': '183',
            },
          },
          {
            title: 'Zen Fit Hex Dumbbell Pair 5kg',
            sku: 'ZEN-HEX-DB-5',
            tags: ['Fitness Gear'],
            status: 'draft',
            sellingPrice: 1899,
            mrp: 2399,
            stockStatus: 'discontinued',
            stockQuantity: 0,
            attributes: {
              'Weight (kg)': '5',
              'Resistance Level': 'Fixed weight',
              Material: 'Rubber-coated cast iron',
              'Target Muscle Group': 'Arms, shoulders, chest',
            },
          },
        ],
      },
    ],
  },
]
