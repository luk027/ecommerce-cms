import { getPayload } from 'payload'
import config from '../payload.config'
import 'dotenv/config'

export interface TagAttributeSeed {
  label: string
  validation?: {
    type?: 'text' | 'number'
    min?: number
    max?: number
  }
}

export interface TagSeed {
  name: string
  attributes: TagAttributeSeed[]
}

export interface CategorySeed {
  category: string
  tags: TagSeed[]
}

export const taxonomyData: CategorySeed[] = [
  {
    category: 'Beauty',
    tags: [
      {
        name: 'Skin Care',
        attributes: [
          { label: 'Skin Type', validation: { type: 'text' } },
          { label: 'Volume (ml)', validation: { type: 'number', min: 1, max: 2000 } },
          { label: 'Key Ingredient', validation: { type: 'text' } },
          { label: 'Sun Protection Factor (SPF)', validation: { type: 'number', min: 0, max: 100 } },
        ],
      },
      {
        name: 'Makeup',
        attributes: [
          { label: 'Color / Shade', validation: { type: 'text' } },
          { label: 'Finish', validation: { type: 'text' } },
          { label: 'Coverage', validation: { type: 'text' } },
          { label: 'Formulation', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Hair Care',
        attributes: [
          { label: 'Hair Type', validation: { type: 'text' } },
          { label: 'Bottle Size (ml)', validation: { type: 'number', min: 1, max: 2000 } },
          { label: 'Sulfate Free', validation: { type: 'text' } },
          { label: 'Treatment Purpose', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Bath & Body',
        attributes: [
          { label: 'Scent / Fragrance Note', validation: { type: 'text' } },
          { label: 'Net Quantity (ml)', validation: { type: 'number', min: 1, max: 5000 } },
          { label: 'Skin Benefit', validation: { type: 'text' } },
          { label: 'Form', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Fragrance',
        attributes: [
          { label: 'Fragrance Concentration', validation: { type: 'text' } },
          { label: 'Bottle Capacity (ml)', validation: { type: 'number', min: 1, max: 1000 } },
          { label: 'Fragrance Family', validation: { type: 'text' } },
          { label: 'Longevity (Hours)', validation: { type: 'number', min: 1, max: 48 } },
        ],
      },
      {
        name: 'Nail Care',
        attributes: [
          { label: 'Finish Type', validation: { type: 'text' } },
          { label: 'Volume (ml)', validation: { type: 'number', min: 1, max: 100 } },
          { label: 'Toxin Free Level', validation: { type: 'text' } },
          { label: 'Drying Time (Mins)', validation: { type: 'number', min: 1, max: 60 } },
        ],
      },
      {
        name: 'Beauty Tools',
        attributes: [
          { label: 'Power Source', validation: { type: 'text' } },
          { label: 'Material', validation: { type: 'text' } },
          { label: 'Head / Bristle Type', validation: { type: 'text' } },
          { label: 'Washable / Waterproof', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Grooming',
        attributes: [
          { label: 'Blade Material', validation: { type: 'text' } },
          { label: 'Battery Run Time (Mins)', validation: { type: 'number', min: 1, max: 600 } },
          { label: 'Waterproof Rating', validation: { type: 'text' } },
          { label: 'Cutting Length Settings', validation: { type: 'number', min: 1, max: 50 } },
        ],
      },
    ],
  },
  {
    category: 'Fashion',
    tags: [
      {
        name: 'Tops',
        attributes: [
          { label: 'Size', validation: { type: 'text' } },
          { label: 'Fabric Material', validation: { type: 'text' } },
          { label: 'Sleeve Length', validation: { type: 'text' } },
          { label: 'Neckline Style', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Bottoms',
        attributes: [
          { label: 'Waist Size (Inches)', validation: { type: 'number', min: 20, max: 60 } },
          { label: 'Fit Type', validation: { type: 'text' } },
          { label: 'Fabric Material', validation: { type: 'text' } },
          { label: 'Closure Type', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Dresses & One-Pieces',
        attributes: [
          { label: 'Dress Length', validation: { type: 'text' } },
          { label: 'Occasion', validation: { type: 'text' } },
          { label: 'Pattern / Print', validation: { type: 'text' } },
          { label: 'Fabric Material', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Footwear',
        attributes: [
          { label: 'Shoe Size (UK/India)', validation: { type: 'number', min: 1, max: 16 } },
          { label: 'Upper Material', validation: { type: 'text' } },
          { label: 'Sole Material', validation: { type: 'text' } },
          { label: 'Toe Style', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Bags',
        attributes: [
          { label: 'Capacity (Litres)', validation: { type: 'number', min: 1, max: 120 } },
          { label: 'Material', validation: { type: 'text' } },
          { label: 'Number of Compartments', validation: { type: 'number', min: 1, max: 20 } },
          { label: 'Strap Type', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Jewellery',
        attributes: [
          { label: 'Base Metal', validation: { type: 'text' } },
          { label: 'Plating / Finish', validation: { type: 'text' } },
          { label: 'Gemstone Type', validation: { type: 'text' } },
          { label: 'Clasp Type', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Watches',
        attributes: [
          { label: 'Movement Type', validation: { type: 'text' } },
          { label: 'Dial Diameter (mm)', validation: { type: 'number', min: 20, max: 60 } },
          { label: 'Water Resistance Depth (m)', validation: { type: 'number', min: 0, max: 1000 } },
          { label: 'Strap Material', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Fashion Accessories',
        attributes: [
          { label: 'Accessory Type', validation: { type: 'text' } },
          { label: 'Material', validation: { type: 'text' } },
          { label: 'Color', validation: { type: 'text' } },
          { label: 'Gender / Fit', validation: { type: 'text' } },
        ],
      },
    ],
  },
  {
    category: 'Tech',
    tags: [
      {
        name: 'Mobile Accessories',
        attributes: [
          { label: 'Compatible Phone Model', validation: { type: 'text' } },
          { label: 'Material', validation: { type: 'text' } },
          { label: 'Drop Protection Rating', validation: { type: 'text' } },
          { label: 'Special Features', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Audio',
        attributes: [
          { label: 'Connectivity Type', validation: { type: 'text' } },
          { label: 'Battery Life (Hours)', validation: { type: 'number', min: 1, max: 200 } },
          { label: 'Noise Cancellation', validation: { type: 'text' } },
          { label: 'Driver Size (mm)', validation: { type: 'number', min: 4, max: 100 } },
        ],
      },
      {
        name: 'Wearables',
        attributes: [
          { label: 'Display Size (Inches)', validation: { type: 'number', min: 0.5, max: 4 } },
          { label: 'Battery Life (Days)', validation: { type: 'number', min: 1, max: 60 } },
          { label: 'Water Resistance Rating', validation: { type: 'text' } },
          { label: 'Sensors Included', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Gaming',
        attributes: [
          { label: 'Platform Compatibility', validation: { type: 'text' } },
          { label: 'DPI / Sensitivity', validation: { type: 'number', min: 100, max: 50000 } },
          { label: 'Connection Type', validation: { type: 'text' } },
          { label: 'RGB Lighting', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Charging',
        attributes: [
          { label: 'Total Wattage (W)', validation: { type: 'number', min: 1, max: 300 } },
          { label: 'Number of Ports', validation: { type: 'number', min: 1, max: 12 } },
          { label: 'Fast Charging Standard', validation: { type: 'text' } },
          { label: 'Cable Length (m)', validation: { type: 'number', min: 0.1, max: 10 } },
        ],
      },
      {
        name: 'Computer Accessories',
        attributes: [
          { label: 'Interface / Connection', validation: { type: 'text' } },
          { label: 'Operating System Support', validation: { type: 'text' } },
          { label: 'Weight (g)', validation: { type: 'number', min: 10, max: 5000 } },
          { label: 'Form Factor', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Smart Devices',
        attributes: [
          { label: 'Voice Assistant Compatibility', validation: { type: 'text' } },
          { label: 'Wireless Protocol', validation: { type: 'text' } },
          { label: 'Operating Voltage (V)', validation: { type: 'number', min: 5, max: 250 } },
          { label: 'App Control', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Creator Gear',
        attributes: [
          { label: 'Mount / Thread Type', validation: { type: 'text' } },
          { label: 'Max Payload Capacity (kg)', validation: { type: 'number', min: 0.1, max: 50 } },
          { label: 'Color Temperature (K)', validation: { type: 'number', min: 1000, max: 10000 } },
          { label: 'Power Output (W)', validation: { type: 'number', min: 1, max: 1000 } },
        ],
      },
    ],
  },
  {
    category: 'Home & Living',
    tags: [
      {
        name: 'Room Décor',
        attributes: [
          { label: 'Dimensions (cm)', validation: { type: 'text' } },
          { label: 'Material', validation: { type: 'text' } },
          { label: 'Theme / Aesthetic', validation: { type: 'text' } },
          { label: 'Mounting Type', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Lighting',
        attributes: [
          { label: 'Bulb Base Type', validation: { type: 'text' } },
          { label: 'Wattage (W)', validation: { type: 'number', min: 1, max: 500 } },
          { label: 'Light Color / Temperature', validation: { type: 'text' } },
          { label: 'Dimmable', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Bedding',
        attributes: [
          { label: 'Bed Size', validation: { type: 'text' } },
          { label: 'Thread Count', validation: { type: 'number', min: 100, max: 2000 } },
          { label: 'Fabric Material', validation: { type: 'text' } },
          { label: 'Care Instructions', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Kitchen & Dining',
        attributes: [
          { label: 'Capacity / Volume', validation: { type: 'text' } },
          { label: 'Material', validation: { type: 'text' } },
          { label: 'Dishwasher Safe', validation: { type: 'text' } },
          { label: 'Microwave Safe', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Drinkware',
        attributes: [
          { label: 'Volume Capacity (ml)', validation: { type: 'number', min: 50, max: 5000 } },
          { label: 'Insulation Duration (Hours)', validation: { type: 'number', min: 1, max: 72 } },
          { label: 'Material', validation: { type: 'text' } },
          { label: 'Leak Proof', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Storage & Organization',
        attributes: [
          { label: 'Capacity (Litres)', validation: { type: 'number', min: 1, max: 500 } },
          { label: 'Material', validation: { type: 'text' } },
          { label: 'Stackable', validation: { type: 'text' } },
          { label: 'Number of Tiers / Shelves', validation: { type: 'number', min: 1, max: 20 } },
        ],
      },
      {
        name: 'Desk & Workspace',
        attributes: [
          { label: 'Surface Dimensions (cm)', validation: { type: 'text' } },
          { label: 'Height Adjustable', validation: { type: 'text' } },
          { label: 'Frame Material', validation: { type: 'text' } },
          { label: 'Weight Capacity (kg)', validation: { type: 'number', min: 1, max: 300 } },
        ],
      },
      {
        name: 'Home Accessories',
        attributes: [
          { label: 'Placement Area', validation: { type: 'text' } },
          { label: 'Material', validation: { type: 'text' } },
          { label: 'Primary Color', validation: { type: 'text' } },
          { label: 'Finish', validation: { type: 'text' } },
        ],
      },
    ],
  },
  {
    category: 'Wellness & Fitness',
    tags: [
      {
        name: 'Fitness Gear',
        attributes: [
          { label: 'Weight (kg)', validation: { type: 'number', min: 0.5, max: 200 } },
          { label: 'Resistance Level', validation: { type: 'text' } },
          { label: 'Material', validation: { type: 'text' } },
          { label: 'Target Muscle Group', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Yoga',
        attributes: [
          { label: 'Thickness (mm)', validation: { type: 'number', min: 1, max: 30 } },
          { label: 'Mat Material', validation: { type: 'text' } },
          { label: 'Grip Level', validation: { type: 'text' } },
          { label: 'Length (cm)', validation: { type: 'number', min: 100, max: 250 } },
        ],
      },
      {
        name: 'Recovery',
        attributes: [
          { label: 'Intensity Levels', validation: { type: 'number', min: 1, max: 30 } },
          { label: 'Battery Run Time (Hours)', validation: { type: 'number', min: 1, max: 24 } },
          { label: 'Target Body Part', validation: { type: 'text' } },
          { label: 'Heat Therapy Included', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Sleep & Relaxation',
        attributes: [
          { label: 'Aroma / Scent', validation: { type: 'text' } },
          { label: 'Material', validation: { type: 'text' } },
          { label: 'Machine Washable', validation: { type: 'text' } },
          { label: 'Sound / Mode Count', validation: { type: 'number', min: 1, max: 50 } },
        ],
      },
      {
        name: 'Oral Care',
        attributes: [
          { label: 'Bristle Softness', validation: { type: 'text' } },
          { label: 'Vibration Speed (VPM)', validation: { type: 'number', min: 1000, max: 70000 } },
          { label: 'Battery Life (Days)', validation: { type: 'number', min: 1, max: 120 } },
          { label: 'Timer Feature', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Feminine Care',
        attributes: [
          { label: 'Absorbency Level', validation: { type: 'text' } },
          { label: 'Pack Count', validation: { type: 'number', min: 1, max: 200 } },
          { label: 'Organic Certified', validation: { type: 'text' } },
          { label: 'Fragrance Free', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Wellness Devices',
        attributes: [
          { label: 'Measurement Accuracy', validation: { type: 'text' } },
          { label: 'Display Type', validation: { type: 'text' } },
          { label: 'Memory Storage (Readings)', validation: { type: 'number', min: 1, max: 500 } },
          { label: 'Connectivity', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Travel Wellness',
        attributes: [
          { label: 'TSA Approved', validation: { type: 'text' } },
          { label: 'Weight (g)', validation: { type: 'number', min: 10, max: 2000 } },
          { label: 'Ergonomic Support Type', validation: { type: 'text' } },
          { label: 'Foldable / Compact', validation: { type: 'text' } },
        ],
      },
    ],
  },
  {
    category: 'Lifestyle & Culture',
    tags: [
      {
        name: 'Stationery',
        attributes: [
          { label: 'Point Size / Nib (mm)', validation: { type: 'number', min: 0.1, max: 5 } },
          { label: 'Ink Color', validation: { type: 'text' } },
          { label: 'Pack Size (Units)', validation: { type: 'number', min: 1, max: 100 } },
          { label: 'Refillable', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Journals & Planners',
        attributes: [
          { label: 'Paper Weight (GSM)', validation: { type: 'number', min: 40, max: 300 } },
          { label: 'Page Count', validation: { type: 'number', min: 20, max: 1000 } },
          { label: 'Cover Type', validation: { type: 'text' } },
          { label: 'Ruling Type', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Books',
        attributes: [
          { label: 'Format', validation: { type: 'text' } },
          { label: 'Page Count', validation: { type: 'number', min: 10, max: 3000 } },
          { label: 'Language', validation: { type: 'text' } },
          { label: 'Edition Year', validation: { type: 'number', min: 1900, max: 2030 } },
        ],
      },
      {
        name: 'Collectibles',
        attributes: [
          { label: 'Scale / Ratio', validation: { type: 'text' } },
          { label: 'Limited Edition', validation: { type: 'text' } },
          { label: 'Material', validation: { type: 'text' } },
          { label: 'Certificate Included', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Anime & Fandom',
        attributes: [
          { label: 'Character / Series', validation: { type: 'text' } },
          { label: 'Manufacturer', validation: { type: 'text' } },
          { label: 'Height (cm)', validation: { type: 'number', min: 2, max: 150 } },
          { label: 'Articulated Joints', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Hobby & DIY',
        attributes: [
          { label: 'Skill Level', validation: { type: 'text' } },
          { label: 'Number of Pieces', validation: { type: 'number', min: 1, max: 10000 } },
          { label: 'Tools Included', validation: { type: 'text' } },
          { label: 'Recommended Age (Years)', validation: { type: 'number', min: 3, max: 99 } },
        ],
      },
      {
        name: 'Travel Accessories',
        attributes: [
          { label: 'Material', validation: { type: 'text' } },
          { label: 'Water Resistant', validation: { type: 'text' } },
          { label: 'Lock Mechanism', validation: { type: 'text' } },
          { label: 'Dimensions (cm)', validation: { type: 'text' } },
        ],
      },
      {
        name: 'Gifting',
        attributes: [
          { label: 'Occasion', validation: { type: 'text' } },
          { label: 'Gift Box Included', validation: { type: 'text' } },
          { label: 'Personalizable', validation: { type: 'text' } },
          { label: 'Recipient Type', validation: { type: 'text' } },
        ],
      },
    ],
  },
]

export interface SeedProductInput {
  title: string
  sku: string
  categoryName: string
  tagNames: string[]
  brand: string
  sellingPrice: number
  mrp: number
  stockStatus: 'in_stock' | 'out_of_stock' | 'preorder' | 'discontinued'
  stockQuantity: number
  attributes: { label: string; value: string }[]
}

export const authenticProducts: SeedProductInput[] = [
  {
    title: 'Sony WH-1000XM5 Wireless Noise-Canceling Headphones',
    sku: 'TECH-SNY-WH1000XM5-SLV',
    categoryName: 'Tech',
    tagNames: ['Audio', 'Mobile Accessories'],
    brand: 'Sony',
    sellingPrice: 29990,
    mrp: 34990,
    stockStatus: 'in_stock',
    stockQuantity: 45,
    attributes: [
      // Tag: Audio
      { label: 'Connectivity Type', value: 'Bluetooth 5.2 / 3.5mm AUX' },
      { label: 'Battery Life (Hours)', value: '30' },
      { label: 'Noise Cancellation', value: 'Dual Processor V1 & HD QN1 Active Noise Cancelling' },
      { label: 'Driver Size (mm)', value: '30' },
      // Tag: Mobile Accessories
      { label: 'Compatible Phone Model', value: 'Universal iOS and Android' },
      { label: 'Material', value: 'Soft Fit Synthetic Leather & Recycled ABS' },
      { label: 'Drop Protection Rating', value: 'Hard Shell Carrying Case Included' },
      { label: 'Special Features', value: 'Multipoint Connection, Speak-to-Chat, LDAC Hi-Res Audio' },
    ],
  },
  {
    title: 'CeraVe Hydrating Facial Cleanser for Normal to Dry Skin',
    sku: 'BTY-CRV-HYDCLN-473',
    categoryName: 'Beauty',
    tagNames: ['Skin Care'],
    brand: 'CeraVe',
    sellingPrice: 1250,
    mrp: 1450,
    stockStatus: 'in_stock',
    stockQuantity: 150,
    attributes: [
      // Tag: Skin Care
      { label: 'Skin Type', value: 'Normal to Dry, Sensitive Skin' },
      { label: 'Volume (ml)', value: '473' },
      { label: 'Key Ingredient', value: 'Ceramides 1, 3, 6-II and Hyaluronic Acid' },
      { label: 'Sun Protection Factor (SPF)', value: '0' },
    ],
  },
  {
    title: "Nike Air Zoom Pegasus 40 Men's Road Running Shoes",
    sku: 'FSH-NKE-PEG40-BLK09',
    categoryName: 'Fashion',
    tagNames: ['Footwear'],
    brand: 'Nike',
    sellingPrice: 9695,
    mrp: 11895,
    stockStatus: 'in_stock',
    stockQuantity: 60,
    attributes: [
      // Tag: Footwear
      { label: 'Shoe Size (UK/India)', value: '9' },
      { label: 'Upper Material', value: 'Engineered Breathable Mesh' },
      { label: 'Sole Material', value: 'Waffle Rubber with React Foam & Dual Zoom Air Units' },
      { label: 'Toe Style', value: 'Round Toe with Protective Bumper' },
    ],
  },
  {
    title: 'Fellow Carter Move Tumbler with 360 Sip Lid (16 oz)',
    sku: 'HML-FLW-CARTER-16MB',
    categoryName: 'Home & Living',
    tagNames: ['Drinkware', 'Kitchen & Dining'],
    brand: 'Fellow',
    sellingPrice: 3499,
    mrp: 3999,
    stockStatus: 'in_stock',
    stockQuantity: 85,
    attributes: [
      // Tag: Drinkware
      { label: 'Volume Capacity (ml)', value: '473' },
      { label: 'Insulation Duration (Hours)', value: '12' },
      { label: 'Material', value: '18/8 Stainless Steel with True Taste Ceramic Interior' },
      { label: 'Leak Proof', value: 'Yes (Splash-Guard Included)' },
      // Tag: Kitchen & Dining
      { label: 'Capacity / Volume', value: '16 oz / 473 ml' },
      { label: 'Dishwasher Safe', value: 'Hand Wash Recommended' },
      { label: 'Microwave Safe', value: 'No' },
    ],
  },
  {
    title: 'Theragun Prime QuietForce Percussive Therapy Massage Gun',
    sku: 'WLF-THB-PRIME-G4',
    categoryName: 'Wellness & Fitness',
    tagNames: ['Recovery', 'Wellness Devices'],
    brand: 'Therabody',
    sellingPrice: 24999,
    mrp: 29999,
    stockStatus: 'in_stock',
    stockQuantity: 28,
    attributes: [
      // Tag: Recovery
      { label: 'Intensity Levels', value: '5' },
      { label: 'Battery Run Time (Hours)', value: '2' },
      { label: 'Target Body Part', value: 'Full Body, Glutes, Hamstrings, Shoulders' },
      { label: 'Heat Therapy Included', value: 'No (Sold Separately)' },
      // Tag: Wellness Devices
      { label: 'Measurement Accuracy', value: '16mm Amplitude Percussive Depth' },
      { label: 'Display Type', value: 'LED Speed Indicators' },
      { label: 'Memory Storage (Readings)', value: '3' },
      { label: 'Connectivity', value: 'Bluetooth Smart App Integration' },
    ],
  },
]

export async function resetAndSeed(): Promise<void> {
  const payload = await getPayload({ config })
  console.log('=== Starting Database Reset and Taxonomy Seed ===')

  // 1. Verify Users (MUST NOT BE DELETED)
  const existingUsers = await payload.find({
    collection: 'users',
    limit: 100,
  })
  console.log(`[Users Preserved] Total users in database: ${existingUsers.totalDocs}`)
  existingUsers.docs.forEach((u) => console.log(` - User ID: ${u.id}, Email: ${u.email}`))

  // 2. Delete all Products first
  console.log('\n--- Cleaning up Products ---')
  const existingProducts = await payload.find({
    collection: 'products',
    limit: 1000,
  })
  for (const prod of existingProducts.docs) {
    await payload.delete({
      collection: 'products',
      id: prod.id,
    })
    console.log(` Deleted product: ${prod.title} (${prod.id})`)
  }
  console.log(`Cleaned up ${existingProducts.docs.length} products.`)

  // 2b. Delete all Brands
  console.log('\n--- Cleaning up Brands ---')
  const existingBrands = await payload.find({
    collection: 'brands',
    limit: 1000,
  })
  for (const brand of existingBrands.docs) {
    await payload.delete({
      collection: 'brands',
      id: brand.id,
    })
    console.log(` Deleted brand: ${brand.name} (${brand.id})`)
  }
  console.log(`Cleaned up ${existingBrands.docs.length} brands.`)


  // 3. Delete all Tags next
  console.log('\n--- Cleaning up Tags ---')
  const existingTags = await payload.find({
    collection: 'tags',
    limit: 1000,
  })
  for (const tag of existingTags.docs) {
    await payload.delete({
      collection: 'tags',
      id: tag.id,
    })
    console.log(` Deleted tag: ${tag.name} (${tag.id})`)
  }
  console.log(`Cleaned up ${existingTags.docs.length} tags.`)

  // 4. Delete all Categories next (safe now that products and tags are gone)
  console.log('\n--- Cleaning up Categories ---')
  const existingCategories = await payload.find({
    collection: 'categories',
    limit: 1000,
  })
  for (const cat of existingCategories.docs) {
    await payload.delete({
      collection: 'categories',
      id: cat.id,
    })
    console.log(` Deleted category: ${cat.name} (${cat.id})`)
  }
  console.log(`Cleaned up ${existingCategories.docs.length} categories.`)

  // 5. Verify Users again to be 100% sure nothing touched them
  const verifiedUsers = await payload.find({
    collection: 'users',
    limit: 100,
  })
  console.log(`\n[Verification] Users count after clean: ${verifiedUsers.totalDocs}`)
  if (verifiedUsers.totalDocs !== existingUsers.totalDocs) {
    throw new Error('User count changed during reset! Aborting.')
  }

  // 7. Seed new Categories and Tags with authentic Attributes
  console.log('\n--- Seeding New Categories and Tags with Attributes ---')
  const createdCategoryMap = new Map<string, string>()
  const createdTagMap = new Map<string, string>()

  for (const item of taxonomyData) {
    const createdCategory = await payload.create({
      collection: 'categories',
      data: {
        name: item.category,
      },
    })
    const categoryId = String(createdCategory.id)
    createdCategoryMap.set(item.category, categoryId)
    console.log(`\n[Category Created] ${item.category} (ID: ${categoryId})`)

    for (const tagItem of item.tags) {
      const createdTag = await payload.create({
        collection: 'tags',
        data: {
          name: tagItem.name,
          category: categoryId,
          attributes: tagItem.attributes.map((attr) => ({
            label: attr.label,
            validation: attr.validation || { type: 'text' },
          })),
        },
      })
      const tagId = String(createdTag.id)
      createdTagMap.set(tagItem.name, tagId)
      console.log(`  └─ [Tag Created] ${tagItem.name} (${tagItem.attributes.length} attributes, ID: ${tagId})`)
    }
  }

  // 8. Seed Brands and Authentic Products
  console.log('\n--- Seeding Brands ---')
  let defaultOwnerId = existingUsers.docs[0]?.id
  if (!defaultOwnerId) {
    const adminUser = await payload.create({
      collection: 'users',
      data: {
        email: 'admin@catalog.com',
        password: 'adminpassword123',
        role: 'admin',
      },
    })
    defaultOwnerId = adminUser.id
    console.log(`Created default admin user: admin@catalog.com (ID: ${defaultOwnerId})`)
  }

  const uniqueBrandNames = Array.from(new Set(authenticProducts.map((p) => p.brand)))
  const createdBrandMap = new Map<string, string>()

  for (const bName of uniqueBrandNames) {
    const createdBrand = await payload.create({
      collection: 'brands',
      data: {
        name: bName,
        details: `${bName} brand products and accessories`,
        currency: 'INR',
        owner: defaultOwnerId,
      },
    })
    createdBrandMap.set(bName, String(createdBrand.id))
    console.log(`✔ [Brand Created] ${bName} (ID: ${createdBrand.id})`)
  }

  console.log('\n--- Seeding Authentic Products ---')
  for (const prod of authenticProducts) {
    const categoryId = createdCategoryMap.get(prod.categoryName)
    if (!categoryId) {
      throw new Error(`Category "${prod.categoryName}" not found for product "${prod.title}".`)
    }

    const tagIds = prod.tagNames.map((tagName) => {
      const id = createdTagMap.get(tagName)
      if (!id) {
        throw new Error(`Tag "${tagName}" not found for product "${prod.title}".`)
      }
      return id
    })

    const brandId = createdBrandMap.get(prod.brand)

    const createdProduct = await payload.create({
      collection: 'products',
      data: {
        title: prod.title,
        sku: prod.sku,
        category: categoryId,
        brand: brandId,
        sellingPrice: prod.sellingPrice,
        mrp: prod.mrp,
        status: 'active',
        stockStatus: prod.stockStatus,
        stockQuantity: prod.stockQuantity,
        tags: tagIds,
        attributes: prod.attributes,
      },
    })

    console.log(`✔ [Product Created] ${createdProduct.title} (SKU: ${createdProduct.sku}, ID: ${createdProduct.id})`)
  }

  // 9. Final Count Verification
  const finalCategories = await payload.find({ collection: 'categories', limit: 100 })
  const finalTags = await payload.find({ collection: 'tags', limit: 100 })
  const finalProducts = await payload.find({ collection: 'products', limit: 100 })
  const finalBrands = await payload.find({ collection: 'brands', limit: 100 })

  const finalUsers = await payload.find({ collection: 'users', limit: 100 })

  console.log('\n=== Final Database State ===')
  console.log(`Users: ${finalUsers.totalDocs} (Kept intact: YES)`)
  console.log(`Categories: ${finalCategories.totalDocs} (Expected: 6)`)
  console.log(`Tags: ${finalTags.totalDocs} (Expected: 48)`)
  console.log(`Products: ${finalProducts.totalDocs} (Expected: 5)`)
  console.log('=== Reset and Seed Completed Successfully ===')
}

// Allow direct execution
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('seed.ts')) {
  resetAndSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Reset and seed failed:', err)
      process.exit(1)
    })
}
