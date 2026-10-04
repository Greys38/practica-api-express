const express = require('express');
const app = express();
const PORT = 3000;

// Middleware para parsear JSON en el cuerpo de las peticiones
app.use(express.json());

// 1. Arreglo en memoria (Simulación de Base de Datos)
let alumnos = [
    { id: 1, nombre: 'Ana Gómez', matricula: '20261001', carrera: 'Sistemas' },
    { id: 2, nombre: 'Carlos López', matricula: '20261002', carrera: 'Sistemas' }
];

// Ruta base (confirmación de servidor en línea)
app.get('/', (req, res) => {
    res.send('Servidor en línea y funcionando correctamente');
});

// 2. ENDPOINTS DE LA API REST

// GET /api/alumnos -> Obtener todos los alumnos
app.get('/api/alumnos', (req, res) => {
    res.status(200).json(alumnos);
});

// GET /api/alumnos/:id -> Obtener un alumno por ID
app.get('/api/alumnos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const alumno = alumnos.find(a => a.id === id);

    if (!alumno) {
        return res.status(404).json({ mensaje: 'Alumno no encontrado' });
    }

    res.status(200).json(alumno);
});

// POST /api/alumnos -> Crear un nuevo alumno
app.post('/api/alumnos', (req, res) => {
    const { nombre, matricula, carrera } = req.body;

    // Generar un ID dinámico
    const nuevoId = alumnos.length > 0 ? Math.max(...alumnos.map(a => a.id)) + 1 : 1;

    const nuevoAlumno = {
        id: nuevoId,
        nombre,
        matricula,
        carrera
    };

    alumnos.push(nuevoAlumno);
    res.status(201).json(nuevoAlumno);
});

// PUT /api/alumnos/:id -> Actualizar un alumno existente
app.put('/api/alumnos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const alumnoIndex = alumnos.findIndex(a => a.id === id);

    if (alumnoIndex === -1) {
        return res.status(404).json({ mensaje: 'Alumno no encontrado' });
    }

    const { nombre, matricula, carrera } = req.body;

    alumnos[alumnoIndex] = {
        id: id,
        nombre: nombre || alumnos[alumnoIndex].nombre,
        matricula: matricula || alumnos[alumnoIndex].matricula,
        carrera: carrera || alumnos[alumnoIndex].carrera
    };

    res.status(200).json(alumnos[alumnoIndex]);
});

// DELETE /api/alumnos/:id -> Eliminar un alumno
app.delete('/api/alumnos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const alumnoIndex = alumnos.findIndex(a => a.id === id);

    if (alumnoIndex === -1) {
        return res.status(404).json({ mensaje: 'Alumno no encontrado' });
    }

    alumnos.splice(alumnoIndex, 1);
    res.status(200).json({ mensaje: `Alumno con ID ${id} eliminado correctamente` });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor escuchando en http://localhost:${PORT}`);
});