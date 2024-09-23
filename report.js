// report.js

document.addEventListener('dbReady', function() {
    // Configurar evento para el botón "Generar Reporte"
    const generarReporteBtn = document.getElementById('generar-reporte-btn');
    if (generarReporteBtn) {
        generarReporteBtn.addEventListener('click', generarReporte);
    }

    // Cerrar el modal de reporte
    const closeReporteModal = document.getElementById('close-reporte-modal');
    if (closeReporteModal) {
        closeReporteModal.addEventListener('click', function() {
            document.getElementById('reporte-modal').style.display = 'none';
        });
    }
});

/**
 * Genera el reporte de facturas y boletas asociadas, agrupadas por proveedor.
 */
function generarReporte() {
    const reporteContenido = document.getElementById('reporte-contenido');
    reporteContenido.innerHTML = ''; // Limpiar el contenido previo

    window.dbOperations.getAll('facturas', function(facturas) {
        // Agrupar facturas por proveedor
        const facturasPorProveedor = agruparPor(facturas, 'proveedorId');

        // Iterar sobre cada proveedor y sus facturas
        for (const [proveedorId, facturasProveedor] of Object.entries(facturasPorProveedor)) {
            window.dbOperations.get('proveedores', parseInt(proveedorId), function(proveedor) {
                facturasProveedor.forEach(factura => {
                    window.dbOperations.get('sucursales', factura.sucursalId, function(sucursal) {
                        window.dbOperations.get('empresas', sucursal.empresaId, function(empresa) {
                            const filaFactura = document.createElement('tr');

                            // Obtener los últimos datos de boleta si existen
                            const ultimaBoleta = factura.boletas && factura.boletas.length > 0 ?
                                factura.boletas[factura.boletas.length - 1] : null;

                            filaFactura.innerHTML = `
                                <td>${empresa.nombre}</td>
                                <td>${proveedor.nombre}</td>
                                <td>${factura.fechaEmision}</td>
                                <td>${factura.numeroFactura}</td>
                                <td>Q${factura.montoFactura.toFixed(2)}</td>
                                <td>${factura.fechaVencimiento}</td>
                                <td>${factura.estado}</td>
                                <td>${ultimaBoleta ? ultimaBoleta.fecha : 'N/A'}</td>
                                <td>Q${ultimaBoleta ? ultimaBoleta.montoAplicado.toFixed(2) : 'Q0.00'}</td>
                                <td>${ultimaBoleta ? ultimaBoleta.boletaId : 'N/A'}</td>
                                <td>${ultimaBoleta ? ultimaBoleta.banco : 'N/A'}</td>
                                <td>${ultimaBoleta ? ultimaBoleta.formaPago : 'N/A'}</td>
                                <td>${ultimaBoleta ? ultimaBoleta.quienDeposito : 'N/A'}</td>
                            `;
                            reporteContenido.appendChild(filaFactura);
                        });
                    });
                });

                // Mostrar el modal de reporte después de procesar todos los proveedores
                setTimeout(() => {
                    document.getElementById('reporte-modal').style.display = 'flex';
                }, 1000); // Ajusta el tiempo según sea necesario
            });
        }

        // Si no hay facturas, mostrar mensaje
        if (facturas.length === 0) {
            const fila = document.createElement('tr');
            fila.innerHTML = `<td colspan="13" style="text-align: center;">No hay facturas para mostrar en el reporte.</td>`;
            reporteContenido.appendChild(fila);
            document.getElementById('reporte-modal').style.display = 'flex';
        }
    });
}

/**
 * Agrupa un array de objetos por una clave específica.
 * @param {Array} array - Array de objetos a agrupar.
 * @param {string} clave - Clave por la cual agrupar.
 * @returns {Map} - Mapa donde las claves son los valores de la propiedad especificada y los valores son arrays de objetos.
 */
function agruparPor(array, clave) {
    return array.reduce((acc, obj) => {
        const key = obj[clave];
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(obj);
        return acc;
    }, {});
}
