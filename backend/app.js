// ============================================
// API REST - Sistema de Pedidos "El Sazón"
// ============================================

const express = require('express');
const cors = require('cors');

// Inicializar aplicación
const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());                    // Permitir peticiones desde el frontend
app.use(express.json());            // Parsear JSON en las peticiones
app.use(express.urlencoded({ extended: true })); // Parsear formularios

// ============================================
// BASE DE DATOS EN MEMORIA
// ============================================

// Catálogo de productos
let productos = [
    { id: 1, nombre: "Tacos al Pastor", precio: 45, categoria: "Tacos", disponible: true },
    { id: 2, nombre: "Tacos de Suadero", precio: 50, categoria: "Tacos", disponible: true },
    { id: 3, nombre: "Quesadillas", precio: 35, categoria: "Antojitos", disponible: true },
    { id: 4, nombre: "Hamburguesa Clásica", precio: 90, categoria: "Especialidades", disponible: true },
    { id: 5, nombre: "Pizza Margarita", precio: 120, categoria: "Especialidades", disponible: true },
    { id: 6, nombre: "Enchiladas Verdes", precio: 85, categoria: "Especialidades", disponible: true },
    { id: 7, nombre: "Refresco 600ml", precio: 25, categoria: "Bebidas", disponible: true },
    { id: 8, nombre: "Aguas Frescas", precio: 30, categoria: "Bebidas", disponible: true },
    { id: 9, nombre: "Café Americano", precio: 25, categoria: "Bebidas", disponible: true }
];

// Almacenamiento de pedidos
let pedidos = [];
let nextPedidoId = 1;

// Almacenamiento de usuarios (clientes)
let usuarios = [];
let nextUsuarioId = 1;

// ============================================
// ENDPOINTS - PRODUCTOS (CRUD completo)
// ============================================

// GET /productos - Obtener todos los productos
app.get('/productos', (req, res) => {
    const { disponibles, categoria } = req.query;
    let resultado = [...productos];
    
    // Filtrar por disponibilidad
    if (disponibles === 'true') {
        resultado = resultado.filter(p => p.disponible);
    }
    
    // Filtrar por categoría
    if (categoria) {
        resultado = resultado.filter(p => p.categoria.toLowerCase() === categoria.toLowerCase());
    }
    
    res.json({
        success: true,
        count: resultado.length,
        data: resultado
    });
});

// GET /productos/:id - Obtener un producto por ID
app.get('/productos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const producto = productos.find(p => p.id === id);
    
    if (!producto) {
        return res.status(404).json({
            success: false,
            message: `Producto con ID ${id} no encontrado`
        });
    }
    
    res.json({
        success: true,
        data: producto
    });
});

// POST /productos - Crear un nuevo producto
app.post('/productos', (req, res) => {
    const { nombre, precio, categoria, disponible } = req.body;
    
    // Validaciones
    if (!nombre || !precio) {
        return res.status(400).json({
            success: false,
            message: 'Los campos nombre y precio son obligatorios'
        });
    }
    
    const nuevoProducto = {
        id: productos.length + 1,
        nombre,
        precio: parseFloat(precio),
        categoria: categoria || 'General',
        disponible: disponible !== undefined ? disponible : true
    };
    
    productos.push(nuevoProducto);
    
    res.status(201).json({
        success: true,
        message: 'Producto creado exitosamente',
        data: nuevoProducto
    });
});

// PUT /productos/:id - Actualizar un producto
app.put('/productos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { nombre, precio, categoria, disponible } = req.body;
    const index = productos.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: `Producto con ID ${id} no encontrado`
        });
    }
    
    // Actualizar solo los campos proporcionados
    if (nombre) productos[index].nombre = nombre;
    if (precio) productos[index].precio = parseFloat(precio);
    if (categoria) productos[index].categoria = categoria;
    if (disponible !== undefined) productos[index].disponible = disponible;
    
    res.json({
        success: true,
        message: 'Producto actualizado exitosamente',
        data: productos[index]
    });
});

// DELETE /productos/:id - Eliminar un producto
app.delete('/productos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = productos.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: `Producto con ID ${id} no encontrado`
        });
    }
    
    const productoEliminado = productos.splice(index, 1);
    
    res.json({
        success: true,
        message: 'Producto eliminado exitosamente',
        data: productoEliminado[0]
    });
});

// ============================================
// ENDPOINTS - PEDIDOS
// ============================================

// GET /pedidos - Obtener todos los pedidos
app.get('/pedidos', (req, res) => {
    res.json({
        success: true,
        count: pedidos.length,
        data: pedidos
    });
});

// GET /pedidos/:id - Obtener un pedido por ID
app.get('/pedidos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const pedido = pedidos.find(p => p.id === id);
    
    if (!pedido) {
        return res.status(404).json({
            success: false,
            message: `Pedido con ID ${id} no encontrado`
        });
    }
    
    res.json({
        success: true,
        data: pedido
    });
});

// GET /pedidos/usuario/:usuarioId - Obtener pedidos por usuario
app.get('/pedidos/usuario/:usuarioId', (req, res) => {
    const usuarioId = parseInt(req.params.usuarioId);
    const pedidosUsuario = pedidos.filter(p => p.usuarioId === usuarioId);
    
    res.json({
        success: true,
        count: pedidosUsuario.length,
        data: pedidosUsuario
    });
});

// POST /pedidos - Crear un nuevo pedido
app.post('/pedidos', (req, res) => {
    const { usuarioId, items, direccion, metodoPago } = req.body;
    
    // Validaciones
    if (!items || !items.length) {
        return res.status(400).json({
            success: false,
            message: 'El pedido debe contener al menos un producto'
        });
    }
    
    // Calcular total del pedido
    let total = 0;
    const itemsDetalle = items.map(item => {
        const producto = productos.find(p => p.id === item.productoId);
        if (!producto) {
            throw new Error(`Producto con ID ${item.productoId} no encontrado`);
        }
        const subtotal = producto.precio * item.cantidad;
        total += subtotal;
        return {
            productoId: item.productoId,
            nombre: producto.nombre,
            cantidad: item.cantidad,
            precioUnitario: producto.precio,
            subtotal
        };
    });
    
    const nuevoPedido = {
        id: nextPedidoId++,
        usuarioId: usuarioId || null,
        fecha: new Date().toISOString(),
        items: itemsDetalle,
        total: total,
        estado: 'pendiente', // pendiente, confirmado, preparando, entregado, cancelado
        direccion: direccion || 'Av. Principal #123, Col. Centro',
        metodoPago: metodoPago || 'efectivo'
    };
    
    pedidos.push(nuevoPedido);
    
    res.status(201).json({
        success: true,
        message: 'Pedido creado exitosamente',
        data: nuevoPedido
    });
});

// PUT /pedidos/:id/estado - Actualizar estado de un pedido
app.put('/pedidos/:id/estado', (req, res) => {
    const id = parseInt(req.params.id);
    const { estado } = req.body;
    const estadosValidos = ['pendiente', 'confirmado', 'preparando', 'entregado', 'cancelado'];
    
    if (!estado || !estadosValidos.includes(estado)) {
        return res.status(400).json({
            success: false,
            message: `Estado inválido. Estados válidos: ${estadosValidos.join(', ')}`
        });
    }
    
    const pedido = pedidos.find(p => p.id === id);
    
    if (!pedido) {
        return res.status(404).json({
            success: false,
            message: `Pedido con ID ${id} no encontrado`
        });
    }
    
    pedido.estado = estado;
    
    res.json({
        success: true,
        message: `Estado del pedido actualizado a: ${estado}`,
        data: pedido
    });
});

// DELETE /pedidos/:id - Cancelar/Eliminar un pedido
app.delete('/pedidos/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = pedidos.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            message: `Pedido con ID ${id} no encontrado`
        });
    }
    
    const pedidoCancelado = pedidos.splice(index, 1)[0];
    
    res.json({
        success: true,
        message: 'Pedido cancelado exitosamente',
        data: pedidoCancelado
    });
});

// ============================================
// ENDPOINTS - USUARIOS
// ============================================

// GET /usuarios - Obtener todos los usuarios
app.get('/usuarios', (req, res) => {
    res.json({
        success: true,
        count: usuarios.length,
        data: usuarios
    });
});

// POST /usuarios - Registrar un nuevo usuario
app.post('/usuarios', (req, res) => {
    const { nombre, email, telefono, direccion } = req.body;
    
    if (!nombre || !email) {
        return res.status(400).json({
            success: false,
            message: 'Los campos nombre y email son obligatorios'
        });
    }
    
    const nuevoUsuario = {
        id: nextUsuarioId++,
        nombre,
        email,
        telefono: telefono || '',
        direccion: direccion || 'Av. Principal #123, Col. Centro',
        fechaRegistro: new Date().toISOString()
    };
    
    usuarios.push(nuevoUsuario);
    
    res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: nuevoUsuario
    });
});

// ============================================
// ENDPOINTS - ESTADÍSTICAS
// ============================================

// GET /estadisticas - Obtener estadísticas del sistema
app.get('/estadisticas', (req, res) => {
    const totalPedidos = pedidos.length;
    const pedidosCompletados = pedidos.filter(p => p.estado === 'entregado').length;
    const ingresosTotales = pedidos.reduce((sum, p) => sum + p.total, 0);
    const pedidosPendientes = pedidos.filter(p => p.estado === 'pendiente').length;
    
    // Productos más vendidos
    const ventasPorProducto = {};
    pedidos.forEach(pedido => {
        pedido.items.forEach(item => {
            if (!ventasPorProducto[item.nombre]) {
                ventasPorProducto[item.nombre] = { cantidad: 0, ingresos: 0 };
            }
            ventasPorProducto[item.nombre].cantidad += item.cantidad;
            ventasPorProducto[item.nombre].ingresos += item.subtotal;
        });
    });
    
    const productosMasVendidos = Object.entries(ventasPorProducto)
        .map(([nombre, stats]) => ({ nombre, ...stats }))
        .sort((a, b) => b.cantidad - a.cantidad)
        .slice(0, 5);
    
    res.json({
        success: true,
        data: {
            totalPedidos,
            pedidosCompletados,
            pedidosPendientes,
            ingresosTotales,
            productosMasVendidos
        }
    });
});

// ============================================
// ENDPOINT DE PRUEBA (Health Check)
// ============================================
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        endpoints: {
            productos: '/productos (GET, POST, PUT, DELETE)',
            pedidos: '/pedidos (GET, POST, PUT, DELETE)',
            usuarios: '/usuarios (GET, POST)',
            estadisticas: '/estadisticas (GET)'
        }
    });
});

// ============================================
// MIDDLEWARE PARA RUTAS NO ENCONTRADAS
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Ruta ${req.method} ${req.url} no encontrada`
    });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
    console.log(`🍽️ Servidor "El Sazón" corriendo en http://localhost:${PORT}`);
    console.log(`📋 Endpoints disponibles:`);
    console.log(`   GET    /productos`);
    console.log(`   GET    /productos/:id`);
    console.log(`   POST   /productos`);
    console.log(`   PUT    /productos/:id`);
    console.log(`   DELETE /productos/:id`);
    console.log(`   GET    /pedidos`);
    console.log(`   POST   /pedidos`);
    console.log(`   PUT    /pedidos/:id/estado`);
    console.log(`   DELETE /pedidos/:id`);
    console.log(`   GET    /usuarios`);
    console.log(`   POST   /usuarios`);
    console.log(`   GET    /estadisticas`);
    console.log(`   GET    /health`);
});