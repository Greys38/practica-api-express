const express = require('express');
require('dotenv').config();
const db = require('./config/db');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// 1. GET ALL - Obtener todos los productos
app.get('/api/productos', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM productos');
    res.status(200).json(rows);
  } catch (error) {
    console.error('Error en GET /api/productos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// 2. GET BY ID - Obtener un producto por su ID
app.get('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM productos WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado' });
    }
    res.status(200).json(rows[0]);
  } catch (error) {
    console.error('Error en GET /api/productos/:id:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// 3. POST - Crear un nuevo producto
app.post('/api/productos', async (req, res) => {
  const { nombre, precio, stock } = req.body;
  if (!nombre || precio == null) {
    return res.status(400).json({ mensaje: 'El nombre y el precio son obligatorios' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)',
      [nombre, precio, stock || 0]
    );

    res.status(201).json({
      mensaje: 'Producto registrado exitosamente',
      id: result.insertId,
      producto: { id: result.insertId, nombre, precio, stock: stock || 0 }
    });
  } catch (error) {
    console.error('Error en POST /api/productos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// 4. PUT - Actualizar un producto
app.put('/api/productos/:id', async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, stock } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE productos SET nombre = ?, precio = ?, stock = ? WHERE id = ?',
      [nombre, precio, stock, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado para actualizar' });
    }

    res.status(200).json({ mensaje: 'Producto actualizado exitosamente' });
  } catch (error) {
    console.error('Error en PUT /api/productos/:id:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

// 5. DELETE - Eliminar un producto
app.delete('/api/productos/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM productos WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensaje: 'Producto no encontrado para eliminar' });
    }

    res.status(200).json({ mensaje: 'Producto eliminado exitosamente' });
  } catch (error) {
    console.error('Error en DELETE /api/productos/:id:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});