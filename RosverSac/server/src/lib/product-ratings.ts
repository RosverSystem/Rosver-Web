import { pool } from '../db.js'

/** Recalcula rating y review_count desnormalizados desde reseñas visibles. */
export async function recalculateProductRating(productId: string) {
  await pool.query(
    `UPDATE products SET
       rating = COALESCE((
         SELECT ROUND(AVG(rating)::numeric, 2)
         FROM product_reviews
         WHERE product_id = $1 AND visible = true
       ), 0),
       review_count = (
         SELECT COUNT(*)::int
         FROM product_reviews
         WHERE product_id = $1 AND visible = true
       ),
       updated_at = now()
     WHERE id = $1`,
    [productId],
  )
}
