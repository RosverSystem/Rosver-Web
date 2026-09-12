import { prefersReducedMotion } from '@/shared/lib/gsap'
import { motion } from 'motion/react'
import type { ReactNode } from 'react'

type AuthSplitShellProps = {
  heroSrc: string
  heroCaption: string
  children: ReactNode
  /** Toasts u overlays fuera del scroll del formulario */
  floating?: ReactNode
}

/**
 * Shell split login/registro: ocupa exactamente el viewport.
 * - Desktop: 50/50; hero escala con la altura.
 * - Móvil/tablet: solo formulario; scroll interno sin barra visible.
 */
export function AuthSplitShell({
  heroSrc,
  heroCaption,
  children,
  floating,
}: AuthSplitShellProps) {
  const reduce = prefersReducedMotion()

  return (
    <main className="grid h-dvh max-h-dvh w-full grid-cols-1 overflow-hidden lg:grid-cols-2">
      {floating}

      <aside className="relative hidden h-full min-h-0 overflow-hidden bg-rosver-soft lg:block">
        <div
          className="absolute inset-y-0 left-0 z-10 w-2 bg-rosver-red sm:w-2.5"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full bg-rosver-red/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute bottom-10 left-16 size-56 rounded-full bg-rosver-blue/15 blur-3xl"
          aria-hidden
        />

        <div
          className={[
            'relative z-[1] flex h-full min-h-0 flex-col items-center justify-end',
            'px-6 pb-8 pt-16 xl:px-10 xl:pb-10',
            '[@media(max-height:820px)]:justify-center [@media(max-height:820px)]:pb-6 [@media(max-height:820px)]:pt-14',
            '[@media(max-height:700px)]:pb-4 [@media(max-height:700px)]:pt-12',
          ].join(' ')}
        >
          <motion.img
            src={heroSrc}
            alt=""
            width={720}
            height={960}
            decoding="async"
            fetchPriority="high"
            className={[
              'mx-auto h-auto w-full object-contain object-bottom',
              'max-w-[min(100%,28rem)] max-h-[min(68dvh,34rem)]',
              'drop-shadow-[0_28px_48px_rgba(13,13,13,0.18)]',
              'xl:max-w-[min(100%,32rem)]',
              '[@media(max-height:900px)]:max-h-[min(62dvh,30rem)]',
              '[@media(max-height:800px)]:max-h-[min(56dvh,24rem)]',
              '[@media(max-height:700px)]:max-h-[min(48dvh,20rem)]',
            ].join(' ')}
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
          <p
            className={[
              'mx-auto mt-5 max-w-sm text-center text-sm font-medium text-rosver-muted',
              '[@media(max-height:720px)]:mt-3 [@media(max-height:720px)]:text-xs',
              '[@media(max-height:640px)]:hidden',
            ].join(' ')}
          >
            {heroCaption}
          </p>
        </div>
      </aside>

      <section className="hide-scrollbar h-full min-h-0 overflow-y-auto overscroll-y-contain bg-white">
        <div
          className={[
            'flex min-h-full flex-col justify-center',
            'px-5 py-10 sm:px-10 sm:py-12',
            'lg:px-12 lg:py-10 xl:px-20',
            '[@media(max-height:820px)]:py-7',
            '[@media(max-height:700px)]:py-5',
          ].join(' ')}
        >
          <motion.div
            className="mx-auto w-full max-w-md"
            initial={reduce ? false : { opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            {children}
          </motion.div>
        </div>
      </section>
    </main>
  )
}
