import { BrandCarousel } from '@/features/catalog/ui/BrandCarousel'
import { CampaignLatestSection } from '@/features/catalog/ui/CampaignLatestSection'
import { CategoryCarousel } from '@/features/catalog/ui/CategoryCarousel'
import { HeroWaveSlider } from '@/features/catalog/ui/HeroWaveSlider'
import { TrendingProducts } from '@/features/catalog/ui/TrendingProducts'
import { TrustStatsSection } from '@/features/catalog/ui/TrustStatsSection'
import { useCatalog } from '@/features/catalog/model/catalog-store'

/**
 * Home Rosver: hero + marcas + categorías + mayoristas + campaña + cifras.
 */
export function HomePage() {
  const { categories } = useCatalog()

  return (
    <>
      <HeroWaveSlider />
      <BrandCarousel />

      <main className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-14 overflow-x-hidden px-4 py-12 sm:gap-16 sm:py-14 sm:pb-28">
        <CategoryCarousel categories={categories} />
        <TrendingProducts />
        <CampaignLatestSection categories={categories} />
        <TrustStatsSection />
      </main>
    </>
  )
}
