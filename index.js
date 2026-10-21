const express = require('express');
const multer = require('multer');
const fs = require('fs');
const csvParser = require('csv-parser');
const { Parser } = require('json2csv');
require('dotenv').config();
const db = require('./config/db');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Configuración de Multer (guarda archivos temporalmente en uploads/)
const upload = multer({ dest: 'uploads/' });

// =======================================================
// PRÁCTICA 4: ENDPOINT DE IMPORTACIÓN (POST /api/productos/importar)
// =======================================================
app.post('/api/productos/importar', upload.single('archivo'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ mensaje: 'No se ha adjuntado ningún archivo bajo el campo "archivo"' });
  }

  const filePath = req.file.path;
  const originalName = req.file.originalname.toLowerCase();

  try {
    let productosAInsertar = [];

    // 1. Si el archivo es .json
    if (originalName.endsWith('.json')) {
      const fileData = fs.readFileSync(filePath, 'utf8');
      productosAInsertar = JSON.parse(fileData);
    } 
    // 2. Si el archivo es .csv
    else if (originalName.endsWith('.csv')) {
      productosAInsertar = await new Promise((resolve, reject) => {
        const resultados = [];
        fs.createReadStream(filePath)
          .pipe(csvParser())
          .on('data', (data) => resultados.push(data))
          .on('end', () => resolve(resultados))
          .on('error', (err) => reject(err));
      });
    } else {
      fs.unlinkSync(filePath); // Eliminar si no es un formato válido
      return res.status(400).json({ mensaje: 'Formato no soportado. Debe ser .json o .csv' });
    }

    // Insertar registros en MariaDB
    let registrosInsertados = 0;
    for (const prod of productosAInsertar) {
      const nombre = prod.nombre;
      const precio = parseFloat(prod.precio);
      const stock = parseInt(prod.stock, 10) || 0;

      if (nombre && !isNaN(precio)) {
        await db.query(
          'INSERT INTO productos (nombre, precio, stock) VALUES (?, ?, ?)',
          [nombre, precio, stock]
        );
        registrosInsertados++;
      }
    }

    // Eliminar archivo temporal de la carpeta uploads
    fs.unlinkSync(filePath);

    return res.status(200).json({
      mensaje: 'Procesamiento e importación completada exitosamente',
      registrosInsertados: registrosInsertados
    });

  } catch (error) {
    console.error('Error durante la importación:', error);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    return res.status(500).json({ mensaje: 'Error al procesar el archivo', error: error.message });
  }
});

// =======================================================
// PRÁCTICA 4: ENDPOINT DE EXPORTACIÓN (GET /api/productos/exportar/:formato)
// =======================================================
app.get('/api/productos/exportar/:formato', async (req, res) => {
  const { formato } = req.params;

  try {
    const [rows] = await db.query('SELECT * FROM productos');

    if (formato === 'json') {
      res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.json');
      res.setHeader('Content-Type', 'application/json');
      return res.json(rows);
    } 
    else if (formato === 'csv') {
      const json2csvParser = new Parser({ fields: ['id', 'nombre', 'precio', 'stock'] });
      const csvData = json2csvParser.parse(rows);

      res.setHeader('Content-Disposition', 'attachment; filename=datos_exportados.csv');
      res.setHeader('Content-Type', 'text/csv');
      return res.status(200).send(csvData);
    } 
    else {
      return res.status(400).json({ mensaje: 'Formato de exportación no válido. Use "json" o "csv".' });
    }

  } catch (error) {
    console.error('Error al exportar registros:', error);
    return res.status(500).json({ mensaje: 'Error interno al exportar los datos' });
  }
});

// =======================================================
// RUTAS CRUD EXISTENTES
// =======================================================

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

// 3. POST - Crear un nuevo producto individual
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