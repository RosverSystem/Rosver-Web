export function AddToCartButton({
  onClick,
}: {
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full bg-rosver-red px-5 py-2.5 text-sm font-bold text-white transition hover:bg-rosver-red-dark"
    >
      Añadir al carrito
    </button>
  )
}
