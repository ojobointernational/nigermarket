router.post('/', requireAuth, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      items,
      total_amount,
      delivery_address,
      phone,
      notes
    } = req.body;

    // ✅ Validate input BEFORE DB work
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'No items in order.' });
    }

    if (!delivery_address || !phone) {
      return res.status(400).json({
        message: 'Delivery address and phone are required.'
      });
    }

    await client.query('BEGIN');

    // 1. Create order
    const orderResult = await client.query(
      `INSERT INTO orders (
        customer_id,
        total_amount,
        delivery_address,
        phone,
        notes,
        status,
        payment_status
      )
      VALUES ($1, $2, $3, $4, $5, 'pending', 'unpaid')
      RETURNING *`,
      [
        req.user.id,
        total_amount,
        delivery_address,
        phone,
        notes || null
      ]
    );

    const order = orderResult.rows[0]; // ✅ FIXED

    // 2. Insert items
    for (const item of items) {
      await client.query(
        `INSERT INTO order_items
          (order_id, product_name, product_price, quantity, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          order.id,
          item.product_name,
          item.product_price,
          item.quantity,
          item.product_price * item.quantity
        ]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Order created successfully',
      order_id: order.id
    });

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});

    console.error('🔥 ORDER ERROR DETAILS:', {
      message: err.message,
      detail: err.detail,
      code: err.code
    });

    return res.status(500).json({
      message: 'Could not create order.',
      error: err.message
    });

  } finally {
    client.release();
  }
});