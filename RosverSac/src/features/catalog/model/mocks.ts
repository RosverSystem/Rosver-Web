import {
  IconBolt,
  IconBulb,
  IconChip,
  IconHome,
  IconShirt,
  IconSpray,
  IconTrowel,
  IconWrench,
  type IconComponent,
} from '@/shared/ui/icons'

/**
 * Modelo alineado a lo que vendrá del ERP / admin-catalog.
 * - `id`: clave externa (código ERP) cuando exista sync.
 * - `imageUrl`: foto de categoría (CDN / storage). Si falta → UI usa ícono + color.
 * - `icon`: fallback visual local (fase visual). En lógica ERP puede mapearse desde `iconKey`.
 * - `visible` / `sortOrder`: listos para filtrar y ordenar desde backoffice.
 */
export type Category = {
  id: string
  slug: string
  name: string
  icon: IconComponent
  imageUrl?: string
  visible?: boolean
  sortOrder?: number
  /** null/undefined = raíz (topbar); con padre = subcategoría */
  parentId?: string | null
  showInNav?: boolean
  /** Card en inicio «Explora por categoría» */
  showOnHome?: boolean
  tagline?: string
  points?: string[]
}

export type Product = {
  /** Código / id externo (ERP) */
  id: string
  slug: string
  name: string
  sku: string
  vendor: string
  category: string
  price: number | null
  originalPrice?: number
  /** Precio mayorista (MOQ). Si falta y hay `price`, la UI puede estimar. */
  wholesalePrice?: number
  offerPrice?: number
  /** Badge “Destacado” / sección home Top picks */
  featured?: boolean
  /** Orden en carrusel Destacados (menor = primero) */
  featuredSort?: number
  /** Sección Productos en tendencia */
  trending?: boolean
  trendingSort?: number
  rating: number
  reviewCount: number
  origin: string
  moq: number
  description: string
  /** Foto principal (CDN/ERP). Si falta → placeholder. */
  imageUrl?: string
  visible?: boolean
  packagings?: ProductPackaging[]
  specs?: ProductSpec[]
}

export type ProductPackaging = {
  id: string
  label: string
  contentQty: number
  isDefault: boolean
  unitName: string
  listPrice: number | null
  offerPrice: number | null
  wholesalePrice: number | null
  compareAt: number | null
}

export type ProductSpec = {
  key: string
  name: string
  value: string
  unit?: string | null
}

/** Precio mayorista publicado o ~8% bajo el precio lista (mock visual). */
export function getWholesalePrice(product: Product): number | null {
  if (product.wholesalePrice != null) return product.wholesalePrice
  if (product.price == null) return null
  return Math.round(product.price * 0.92 * 100) / 100
}

/** Fotos mock (Unsplash, ~640px) solo para preview visual. Reemplazar por URLs del ERP. */
export const CATEGORIES: Category[] = [
  {
    id: 'CAT-001',
    slug: 'herramientas',
    name: 'Herramientas',
    icon: IconWrench,
    sortOrder: 1,
    visible: true,
    showInNav: true,
    showOnHome: true,
    tagline: 'Listas para obra y taller',
    points: ['Marcas de importación', 'Stock continuo', 'Asesoría técnica'],
    imageUrl:
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=640&h=480&q=75',
  },
  {
    id: 'CAT-002',
    slug: 'ferreteria',
    name: 'Ferretería',
    icon: IconBolt,
    sortOrder: 2,
    visible: true,
    showInNav: true,
    showOnHome: true,
    tagline: 'Insumos al por mayor',
    points: ['Precio por volumen', 'MOQ flexible', 'Despacho nacional'],
    imageUrl:
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=640&h=480&q=75',
  },
  {
    id: 'CAT-003',
    slug: 'electronica',
    name: 'Electrónica',
    icon: IconChip,
    sortOrder: 3,
    visible: true,
    showInNav: true,
    showOnHome: true,
    tagline: 'Equipos y componentes',
    points: ['Garantía local', 'Modelos actuales', 'Soporte postventa'],
    imageUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=640&h=480&q=75',
  },
  {
    id: 'CAT-004',
    slug: 'hogar',
    name: 'Hogar',
    icon: IconHome,
    sortOrder: 4,
    visible: true,
    showInNav: true,
    showOnHome: true,
    tagline: 'Para retail y proyectos',
    points: ['Líneas rotativas', 'Calidad verificada', 'Entrega ágil'],
    imageUrl:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=640&h=480&q=75',
  },
  {
    id: 'CAT-005',
    slug: 'textil',
    name: 'Textil',
    icon: IconShirt,
    sortOrder: 5,
    visible: true,
    showInNav: true,
    showOnHome: true,
    tagline: 'Textil industrial y retail',
    points: ['Volúmenes a medida', 'Variedad de SKU', 'Cotiza rápido'],
    imageUrl:
      'https://images.unsplash.com/photo-1558171813-4c088753af8f?auto=format&fit=crop&w=640&h=480&q=75',
  },
  {
    id: 'CAT-006',
    slug: 'iluminacion',
    name: 'Iluminación',
    icon: IconBulb,
    sortOrder: 6,
    visible: true,
    showInNav: true,
    showOnHome: true,
    tagline: 'LED y soluciones de luz',
    points: ['Eficiencia energética', 'Uso comercial', 'Stock en Lima'],
    imageUrl:
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=640&h=480&q=75',
  },
  {
    id: 'CAT-007',
    slug: 'limpieza',
    name: 'Limpieza industrial',
    icon: IconSpray,
    sortOrder: 7,
    visible: true,
    showInNav: true,
    showOnHome: true,
    tagline: 'Mantenimiento industrial',
    points: ['Insumos profesionales', 'Rubros varios', 'Reposición fácil'],
    imageUrl:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=640&h=480&q=75',
  },
  {
    id: 'CAT-008',
    slug: 'construccion',
    name: 'Materiales de construcción',
    icon: IconTrowel,
    sortOrder: 8,
    visible: true,
    showInNav: true,
    showOnHome: true,
    tagline: 'Materiales para obra',
    points: ['Proyectos y ferreterías', 'Importación directa', 'Acompañamiento'],
    imageUrl:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=640&h=480&q=75',
  },
]

export const PRODUCTS: Product[] = [
  {
    id: 'PRD-1042',
    slug: 'taladro-percutor-20v',
    name: 'Taladro percutor inalámbrico 20V',
    sku: 'RS-1042',
    vendor: 'Rosver Tools',
    category: 'herramientas',
    price: 249,
    originalPrice: 289,
    wholesalePrice: 229,
    featured: true,
    rating: 4.5,
    reviewCount: 18,
    origin: 'China',
    moq: 1,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=640&h=640&q=75',
    description:
      'Taladro percutor inalámbrico 20V con batería de litio, mandril de 13mm y maletín. Ideal para uso doméstico e industrial ligero.',
  },
  {
    id: 'PRD-1088',
    slug: 'amoladora-angular-115mm',
    name: 'Amoladora angular 115mm',
    sku: 'RS-1088',
    vendor: 'Rosver Tools',
    category: 'herramientas',
    price: 189,
    wholesalePrice: 175,
    featured: true,
    rating: 4,
    reviewCount: 9,
    origin: 'China',
    moq: 1,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=640&h=640&q=75',
    description:
      'Amoladora angular 850W, disco de 115mm, incluye protector de seguridad y empuñadura auxiliar.',
  },
  {
    id: 'PRD-2011',
    slug: 'set-llaves-combinadas-40pzs',
    name: 'Set de llaves combinadas 40 pzs',
    sku: 'RS-2011',
    vendor: 'Ferretería Import',
    category: 'ferreteria',
    price: null,
    rating: 5,
    reviewCount: 6,
    origin: 'India',
    moq: 12,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=640&h=640&q=75',
    description:
      'Juego de 40 llaves combinadas en acero cromo-vanadio, con estuche organizador. Venta por caja mínima.',
  },
  {
    id: 'PRD-3305',
    slug: 'compresor-24l',
    name: 'Compresor de aire 24L',
    sku: 'RS-3305',
    vendor: 'Ferretería Import',
    category: 'ferreteria',
    price: null,
    rating: 4,
    reviewCount: 3,
    origin: 'Brasil',
    moq: 1,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=640&h=640&q=75',
    description:
      'Compresor de aire 24 litros, 2HP, motor monofásico. Consultar disponibilidad y condiciones de flete.',
  },
  {
    id: 'PRD-4120',
    slug: 'parlante-bluetooth-portatil',
    name: 'Parlante Bluetooth portátil',
    sku: 'RS-4120',
    vendor: 'Rosver Electro',
    category: 'electronica',
    price: 89,
    originalPrice: 109,
    rating: 4.5,
    reviewCount: 27,
    origin: 'China',
    moq: 6,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=640&h=640&q=75',
    description:
      'Parlante Bluetooth resistente a salpicaduras, 12h de batería, entrada USB y radio FM.',
  },
  {
    id: 'PRD-4477',
    slug: 'kit-destornilladores-precision',
    name: 'Kit destornilladores de precisión',
    sku: 'RS-4477',
    vendor: 'Rosver Electro',
    category: 'electronica',
    price: 59,
    rating: 4,
    reviewCount: 11,
    origin: 'China',
    moq: 10,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=640&h=640&q=75',
    description:
      'Set de 32 puntas de precisión para electrónica y reparación de equipos, con estuche.',
  },
  {
    id: 'PRD-5210',
    slug: 'ventilador-torre-hogar',
    name: 'Ventilador de torre para hogar',
    sku: 'RS-5210',
    vendor: 'Rosver Hogar',
    category: 'hogar',
    price: 139,
    originalPrice: 165,
    rating: 4.5,
    reviewCount: 14,
    origin: 'China',
    moq: 4,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1618220179428-22790b461013?auto=format&fit=crop&w=640&h=640&q=75',
    description:
      'Ventilador de torre 3 velocidades, control remoto y temporizador. Bajo consumo, ideal para oficina y hogar.',
  },
  {
    id: 'PRD-6103',
    slug: 'panel-led-plafon-24w',
    name: 'Panel LED plafón 24W',
    sku: 'RS-6103',
    vendor: 'Rosver Iluminación',
    category: 'iluminacion',
    price: 35,
    rating: 5,
    reviewCount: 8,
    origin: 'China',
    moq: 20,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=640&h=640&q=75',
    description:
      'Panel LED circular 24W, luz blanca fría, instalación empotrada. Venta por caja de 20 unidades.',
  },
  {
    id: 'PRD-1101',
    slug: 'sierra-circular-7-1-4',
    name: 'Sierra circular 7-1/4"',
    sku: 'RS-1101',
    vendor: 'Rosver Tools',
    category: 'herramientas',
    price: 329,
    originalPrice: 379,
    rating: 4.5,
    reviewCount: 12,
    origin: 'China',
    moq: 1,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=640&h=640&q=75',
    description: 'Sierra circular 1400W, disco 7-1/4", guía paralela y protector.',
  },
  {
    id: 'PRD-1120',
    slug: 'lijadora-orbital-125mm',
    name: 'Lijadora orbital 125mm',
    sku: 'RS-1120',
    vendor: 'Rosver Tools',
    category: 'herramientas',
    price: 159,
    rating: 4,
    reviewCount: 7,
    origin: 'China',
    moq: 2,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=640&h=640&q=75',
    description: 'Lijadora orbital 300W, plato 125mm, extracción de polvo.',
  },
  {
    id: 'PRD-2055',
    slug: 'caja-herramientas-metal-20',
    name: 'Caja de herramientas metálica 20"',
    sku: 'RS-2055',
    vendor: 'Ferretería Import',
    category: 'ferreteria',
    price: 95,
    rating: 4.5,
    reviewCount: 15,
    origin: 'India',
    moq: 4,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1581092918056-0c4c3acd3789?auto=format&fit=crop&w=640&h=640&q=75',
    description: 'Caja metálica 20" con bandeja removible y cierre seguro.',
  },
  {
    id: 'PRD-2088',
    slug: 'cinta-metricas-5m-pack',
    name: 'Cinta métrica 5m (pack 12)',
    sku: 'RS-2088',
    vendor: 'Ferretería Import',
    category: 'ferreteria',
    price: null,
    rating: 5,
    reviewCount: 4,
    origin: 'China',
    moq: 12,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=640&h=640&q=75',
    description: 'Pack mayorista de cintas métricas 5m con freno y gancho magnético.',
  },
  {
    id: 'PRD-4201',
    slug: 'multimetro-digital',
    name: 'Multímetro digital CAT III',
    sku: 'RS-4201',
    vendor: 'Rosver Electro',
    category: 'electronica',
    price: 79,
    originalPrice: 99,
    rating: 4.5,
    reviewCount: 21,
    origin: 'China',
    moq: 6,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=640&h=640&q=75',
    description: 'Multímetro digital auto-rango, display LCD, puntas incluidas.',
  },
  {
    id: 'PRD-4302',
    slug: 'extensiones-usb-c-hub',
    name: 'Hub USB-C 7 en 1',
    sku: 'RS-4302',
    vendor: 'Rosver Electro',
    category: 'electronica',
    price: 119,
    rating: 4,
    reviewCount: 9,
    origin: 'China',
    moq: 8,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&w=640&h=640&q=75',
    description: 'Hub USB-C con HDMI, USB 3.0, lector SD y carga PD.',
  },
  {
    id: 'PRD-5301',
    slug: 'organizador-oficina-metal',
    name: 'Organizador de escritorio metálico',
    sku: 'RS-5301',
    vendor: 'Rosver Hogar',
    category: 'hogar',
    price: 45,
    rating: 4,
    reviewCount: 6,
    origin: 'China',
    moq: 10,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=640&h=640&q=75',
    description: 'Organizador metálico para oficina: papeles, lápices y accesorios.',
  },
  {
    id: 'PRD-5402',
    slug: 'lampara-escritorio-led',
    name: 'Lámpara de escritorio LED',
    sku: 'RS-5402',
    vendor: 'Rosver Hogar',
    category: 'hogar',
    price: 68,
    originalPrice: 85,
    rating: 4.5,
    reviewCount: 19,
    origin: 'China',
    moq: 6,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=640&h=640&q=75',
    description: 'Lámpara LED brazo flexible, 3 temperaturas de color, USB.',
  },
  {
    id: 'PRD-6201',
    slug: 'tira-led-5m-rgb',
    name: 'Tira LED 5m RGB + control',
    sku: 'RS-6201',
    vendor: 'Rosver Iluminación',
    category: 'iluminacion',
    price: 42,
    rating: 4,
    reviewCount: 33,
    origin: 'China',
    moq: 20,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=640&h=640&q=75',
    description: 'Tira LED 5 metros RGB, adhesiva, control remoto e fuente 12V.',
  },
  {
    id: 'PRD-6305',
    slug: 'reflector-led-50w',
    name: 'Reflector LED 50W exterior',
    sku: 'RS-6305',
    vendor: 'Rosver Iluminación',
    category: 'iluminacion',
    price: 55,
    rating: 5,
    reviewCount: 10,
    origin: 'China',
    moq: 12,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=640&h=640&q=75',
    description: 'Reflector LED 50W IP65 para fachadas y obra, luz blanca fría.',
  },
  {
    id: 'PRD-7101',
    slug: 'detergente-industrial-20l',
    name: 'Detergente industrial 20L',
    sku: 'RS-7101',
    vendor: 'Ferretería Import',
    category: 'limpieza',
    price: null,
    rating: 4,
    reviewCount: 5,
    origin: 'Perú',
    moq: 4,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=640&h=640&q=75',
    description: 'Detergente concentrado 20L para limpieza industrial. Cotizar flete.',
  },
  {
    id: 'PRD-7202',
    slug: 'trapeador-industrial-pack',
    name: 'Trapeador industrial (pack 6)',
    sku: 'RS-7202',
    vendor: 'Ferretería Import',
    category: 'limpieza',
    price: 120,
    rating: 4,
    reviewCount: 3,
    origin: 'China',
    moq: 6,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=640&h=640&q=75',
    description: 'Pack de trapeadores industriales con mango reforzado.',
  },
  {
    id: 'PRD-1505',
    slug: 'taladro-banco-13mm',
    name: 'Taladro de banco 13mm',
    sku: 'RS-1505',
    vendor: 'Rosver Tools',
    category: 'herramientas',
    price: 459,
    rating: 4.5,
    reviewCount: 8,
    origin: 'China',
    moq: 1,
    visible: true,
    imageUrl:
      'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=640&h=640&q=75',
    description: 'Taladro de banco 350W, mandril 13mm, mesa ajustable.',
  },
]

export const TRUST_STATS = [
  {
    value: '+10',
    label: 'Años importando',
    description: 'Trayectoria con stock real para el mercado peruano',
  },
  {
    value: '6',
    label: 'Rubros activos',
    description: 'Herramientas, ferretería, hogar e industria',
  },
  {
    value: '+500',
    label: 'Clientes atendidos',
    description: 'Ferreterías, distribuidores y proyectos',
  },
  {
    value: '24h',
    label: 'Tiempo de respuesta',
    description: 'Asesoría comercial y cotizaciones ágiles',
  },
]

export const PURCHASE_STEPS = [
  {
    icon: 'clipboard' as const,
    title: 'Solicita tu cotización',
    description: 'Cuéntanos qué necesitas y te enviamos una propuesta a medida, sin compromiso.',
  },
  {
    icon: 'card' as const,
    title: 'Paga como prefieras',
    description: 'Transferencia, tarjeta o depósito — coordinamos la forma que más te acomode.',
  },
  {
    icon: 'truck' as const,
    title: 'Despachamos a todo el Perú',
    description: 'Coordinamos el envío a Lima Metropolitana y provincias, con seguimiento.',
  },
  {
    icon: 'headset' as const,
    title: 'Asesoría técnica especializada',
    description: 'Nuestro equipo te ayuda a elegir el producto correcto para tu proyecto.',
  },
]

export const TRUST_BADGES = [
  { icon: 'truck' as const, label: 'Envíos a todo el Perú', sublabel: 'En pedidos desde S/ 300' },
  { icon: 'receipt' as const, label: 'Cambios y devoluciones', sublabel: 'Hasta 7 días' },
  { icon: 'card' as const, label: 'Pago seguro', sublabel: 'Transferencia, tarjeta o depósito' },
  { icon: 'shield' as const, label: 'Compra 100% segura', sublabel: 'Factura o boleta electrónica' },
  { icon: 'headset' as const, label: 'Soporte 24/7', sublabel: 'Asesoría técnica especializada' },
]

export const INDUSTRY_SOLUTIONS = [
  {
    slug: 'ferreterias-distribuidores',
    icon: 'wrench' as const,
    title: 'Ferreterías y distribuidores',
    description: 'Herramientas y ferretería para reventa al por mayor, con MOQ y precio por volumen.',
  },
  {
    slug: 'construccion',
    icon: 'building' as const,
    title: 'Construcción y acabados',
    description: 'Materiales, herramientas y equipos para obra, remodelación y acabados.',
  },
  {
    slug: 'hogar-oficina',
    icon: 'home' as const,
    title: 'Hogar y oficina',
    description: 'Electrónica, iluminación y artículos para equipar hogares y locales comerciales.',
  },
  {
    slug: 'mantenimiento-limpieza',
    icon: 'spray' as const,
    title: 'Mantenimiento y limpieza',
    description: 'Insumos y equipos de limpieza industrial para instalaciones y locales.',
  },
]
