import { BrandCarousel } from '@/features/catalog/ui/BrandCarousel'
import { CampaignLatestSection } from '@/features/catalog/ui/CampaignLatestSection'
import { CategoryCarousel } from '@/features/catalog/ui/CategoryCarousel'
import { HeroWaveSlider } from '@/features/catalog/ui/HeroWaveSlider'
import { TrendingProducts } from '@/features/catalog/ui/TrendingProducts'
import { TrustStatsSection } from '@/features/catalog/ui/TrustStatsSection'
import { useCatalog } from '@/features/catalog/model/catalog-store'

/**
 * Home Rosver: hero + marcas + categorías + mayoristas + campaña + cifras.
 * Espaciado amplio entre bloques (no “todo pegado”).
 */
export function HomePage() {
  const { categories } = useCatalog()

  return (
    <>
      <HeroWaveSlider />
      <BrandCarousel />

      <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-20 px-5 py-16 sm:gap-24 sm:px-6 sm:py-20 lg:gap-28 lg:px-8 lg:py-24 lg:pb-32">
        <CategoryCarousel categories={categories} />
        <TrendingProducts />
        <CampaignLatestSection categories={categories} />
        <TrustStatsSection />
      </main>
    </>
  )
}
