import { BrandCarousel } from '@/features/catalog/ui/BrandCarousel'
import { CategoryCarousel } from '@/features/catalog/ui/CategoryCarousel'
import { CtaBand } from '@/features/catalog/ui/CtaBand'
import { HeroWaveSlider } from '@/features/catalog/ui/HeroWaveSlider'
import { HowToBuy } from '@/features/catalog/ui/HowToBuy'
import { IndustrySolutions } from '@/features/catalog/ui/IndustrySolutions'
import { ProductCarousel } from '@/features/catalog/ui/ProductCarousel'
import { PromoBanners } from '@/features/catalog/ui/PromoBanners'
import { TrendingProducts } from '@/features/catalog/ui/TrendingProducts'
import { ValueRibbon } from '@/features/catalog/ui/ValueRibbon'
import { useCatalog } from '@/features/catalog/model/catalog-store'
import { ScrollReveal } from '@/shared/ui/scroll-reveal'
import { useMemo } from 'react'

export function HomePage() {
  const { products, categories, live } = useCatalog()
  const featured = useMemo(() => {
    const marked = products
      .filter((p) => p.visible !== false && p.featured)
      .slice()
      .sort(
        (a, b) =>
          (a.featuredSort ?? 0) - (b.featuredSort ?? 0) ||
          a.name.localeCompare(b.name, 'es'),
      )
    if (marked.length) return marked.slice(0, 12)
    // Sin DB de productos: mocks; con live y ninguno marcado → sección vacía
    if (!live) return products.slice(0, 8)
    return []
  }, [products, live])

  return (
    <>
      <HeroWaveSlider />
      <BrandCarousel />

      <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-12 overflow-x-hidden px-4 py-10 sm:gap-14 sm:py-12 sm:pb-28">
        <ValueRibbon />

        <CategoryCarousel categories={categories} />

        <ProductCarousel
          products={featured}
          title="Destacados para ti"
          subtitle="Selección lista para cotizar o comprar."
        />

        <PromoBanners />

        <TrendingProducts />

        <ScrollReveal delay={0.05}>
          <HowToBuy />
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <IndustrySolutions />
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <CtaBand />
        </ScrollReveal>
      </main>
    </>
  )
}
