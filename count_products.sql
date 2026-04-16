SELECT COUNT(*) AS total_products FROM products;

SELECT sellerId, COUNT(*) AS seller_total
FROM products
GROUP BY sellerId
ORDER BY sellerId;