/**
 * Slides del hero Home (full-bleed + ola) — admin-content / ERP en fase lógica.
 */
export type HomeHeroSlide = {
  id: string
  eyebrow?: string
  title: string
  /** Palabra destacada dentro del título (opcional). */
  titleAccent?: string
  subtitle: string
  ctaLabel: string
  ctaTo: string
  imageUrl: string
  visible?: boolean
  sortOrder?: number
}

export const HOME_HERO_SLIDES: HomeHeroSlide[] = [
  {
    id: 'HERO-01',
    sortOrder: 1,
    visible: true,
    eyebrow: '100% importaciones Rosver',
    title: 'Herramientas listas para',
    titleAccent: 'obra',
    subtitle:
      'Stock para ferreterías, distribuidores y proyectos industriales en todo el Perú.',
    ctaLabel: 'Ver catálogo',
    ctaTo: '/catalogo',
    imageUrl:
      'https://images.unsplash.com/photo-1572981779307-38b8cabb2407?auto=format&fit=crop&w=900&h=900&q=80',
  },
  {
    id: 'HERO-02',
    sortOrder: 2,
    visible: true,
    eyebrow: 'Compra al por mayor',
    title: 'Ferretería con precio por',
    titleAccent: 'volumen',
    subtitle:
      'Condiciones especiales para reventa. Cotiza sin compromiso y recibe asesoría comercial.',
    ctaLabel: 'Cotizar ahora',
    ctaTo: '/cotizar',
    imageUrl:
      'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=900&h=900&q=80',
  },
]
