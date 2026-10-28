/* ============================================================
   STORES — Centralized product data
   All product information lives here. Unknown values are `null`.
   - price: PKR. null = not verified → price UI is omitted entirely.
   - priceVerifiedAt: ISO date when the price was last checked.
   - darazUrl: real product deep links when provided; the generic
     storefront URL is an honest fallback (never an affiliate claim).
   ============================================================ */

export const GENERIC_DARAZ_URL = 'https://www.daraz.pk';

export const PRODUCTS = [
    {
        id: 'gripper',
        name: 'Histro Auto-Count Gripper',
        category: 'Fitness',
        brand: 'Histro',
        description: 'Adjustable 5–60KG resistance with automatic counting and a non-slip grip for home workouts.',
        images: ['Assets/Img/post (1).jpg'],
        price: null,
        originalPrice: null,
        priceVerifiedAt: null,
        badge: null,
        tags: ['fitness', 'grip trainer', 'home workout'],
        specifications: {
            'Resistance': 'Adjustable 5–60KG',
            'Counting': 'Automatic',
            'Grip': 'Non-slip',
        },
        features: ['Adjustable resistance from 5 to 60 KG', 'Automatic counting', 'Non-slip grip'],
        darazUrl: GENERIC_DARAZ_URL,
        availability: null,
        featured: true,
        collection: 'essentials',
    },
    {
        id: 'jacket',
        name: 'Black & White Suit Jacket',
        category: 'Apparel',
        brand: null,
        description: 'A monochrome suit jacket for men — sharp lines, all-day comfort.',
        images: ['Assets/Img/post (2).jpg'],
        price: null,
        originalPrice: null,
        priceVerifiedAt: null,
        badge: null,
        tags: ['apparel', 'formal', 'jacket'],
        specifications: {
            'Type': 'Suit jacket',
            'Colorway': 'Black & white',
            'Fit': 'Men’s',
        },
        features: ['Monochrome black & white design', 'Structured silhouette'],
        darazUrl: GENERIC_DARAZ_URL,
        availability: null,
        featured: false,
        collection: 'style',
    },
    {
        id: 'mask',
        name: 'Retinol Gold Mask',
        category: 'Skincare',
        brand: null,
        description: 'Moisturizing facial mask with retinol, 100ML.',
        images: ['Assets/Img/post (3).jpg'],
        price: null,
        originalPrice: null,
        priceVerifiedAt: null,
        badge: null,
        tags: ['skincare', 'mask', 'retinol'],
        specifications: {
            'Size': '100ML',
            'Type': 'Facial mask',
            'Key ingredient': 'Retinol',
        },
        features: ['100ML size', 'Retinol-infused formula'],
        darazUrl: GENERIC_DARAZ_URL,
        availability: null,
        featured: true,
        collection: 'editors',
    },
    {
        id: 'tees',
        name: 'Summer Collection Tees',
        category: 'Apparel',
        brand: null,
        description: 'Half-sleeve printed tees for men and women — breathable cotton, bold prints.',
        images: ['Assets/Img/post (4).jpg'],
        price: null,
        originalPrice: null,
        priceVerifiedAt: null,
        badge: null,
        tags: ['apparel', 'tees', 'summer'],
        specifications: {
            'Type': 'Half-sleeve tee',
            'Material': 'Cotton',
            'Fit': 'Men & women',
        },
        features: ['Breathable cotton', 'Bold printed designs', 'Unisex fit'],
        darazUrl: GENERIC_DARAZ_URL,
        availability: null,
        featured: false,
        collection: 'style',
    },
    {
        id: 'earkit',
        name: 'Ear Wax Cleaning Kit',
        category: 'Health',
        brand: null,
        description: '6-piece ear pick tool set with spring earwax cleaner.',
        images: ['Assets/Img/post (7).jpg'],
        price: null,
        originalPrice: null,
        priceVerifiedAt: null,
        badge: null,
        tags: ['health', 'personal care', 'tools'],
        specifications: {
            'Pieces': '6-piece set',
            'Type': 'Ear pick tools',
        },
        features: ['6-piece tool set', 'Spring earwax cleaner'],
        darazUrl: GENERIC_DARAZ_URL,
        availability: null,
        featured: true,
        collection: 'essentials',
    },
];

/* Collections — product counts are computed from the data above.
   The "Under Rs. 2,000" price-based collection is intentionally omitted:
   no prices are verified yet, so its membership could not be honest. */
export const COLLECTIONS = [
    {
        id: 'essentials',
        title: 'Everyday Essentials',
        description: 'Practical picks chosen for how well they do one simple job.',
        cover: 'Assets/Img/3.avif',
    },
    {
        id: 'style',
        title: 'Style Finds',
        description: 'Apparel pieces with a point of view.',
        cover: 'Assets/Img/2.avif',
    },
    {
        id: 'editors',
        title: 'Editor’s Picks',
        description: 'A shortlist of the products we keep coming back to.',
        cover: 'Assets/Img/1.avif',
    },
];

export function productImage(p) {
    return p.images && p.images[0] ? p.images[0] : null;
}

export function productById(id) {
    return PRODUCTS.find((p) => p.id === id) || null;
}
