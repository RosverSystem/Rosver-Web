/**
 * Rueda del mouse sobre un contenedor con overflow:
 * - Si la lista aún puede scrollear → mueve la lista (frena Lenis/página).
 * - Al tope/fondo → deja pasar el evento para scrollear la página.
 *
 * Marca el nodo con `data-lenis-prevent` para que Lenis también lo ignore.
 */
export function attachNestedScrollWheel(el: HTMLElement): () => void {
  el.setAttribute('data-lenis-prevent', '')
  el.classList.add('overscroll-contain')

  function onWheel(e: WheelEvent) {
    const { scrollTop, scrollHeight, clientHeight } = el
    const maxScroll = Math.max(0, scrollHeight - clientHeight)
    if (maxScroll <= 0) return

    const atTop = scrollTop <= 0
    const atBottom = scrollTop >= maxScroll - 1
    const down = e.deltaY > 0
    const up = e.deltaY < 0
    const listCanConsume = (down && !atBottom) || (up && !atTop)
    if (!listCanConsume) return

    e.preventDefault()
    e.stopPropagation()
    if (typeof e.stopImmediatePropagation === 'function') {
      e.stopImmediatePropagation()
    }
    el.scrollTop = Math.min(maxScroll, Math.max(0, scrollTop + e.deltaY))
  }

  el.addEventListener('wheel', onWheel, { passive: false, capture: true })
  return () => {
    el.removeEventListener('wheel', onWheel, true)
  }
}
