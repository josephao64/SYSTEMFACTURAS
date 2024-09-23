// reportes.js

document.addEventListener('dbReady', function() {
    cargarFiltros();
    configurarEventos();
    establecerFechasPredeterminadas();
});

// Función para cargar los filtros
function cargarFiltros() {
    cargarSucursalesFiltro();
    cargarEmpresasFiltro();
    cargarProveedoresFiltro();
}

// Variables globales
let facturasFiltradas = [];

/**
 * Cargar sucursales en el filtro
 */
function cargarSucursalesFiltro() {
    const sucursalSelect = document.getElementById('filtro-sucursal');
    sucursalSelect.innerHTML = '<option value="todas">Todas</option>';

    window.dbOperations.getAll('sucursales', function(sucursales) {
        sucursales.forEach(sucursal => {
            const option = document.createElement('option');
            option.value = sucursal.id;
            option.textContent = sucursal.nombre;
            sucursalSelect.appendChild(option);
        });
    });
}

/**
 * Cargar empresas en el filtro
 */
function cargarEmpresasFiltro() {
    const empresaSelect = document.getElementById('filtro-empresa');
    empresaSelect.innerHTML = '<option value="todas">Todas</option>';

    window.dbOperations.getAll('empresas', function(empresas) {
        empresas.forEach(empresa => {
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nombre;
            empresaSelect.appendChild(option);
        });
    });
}

/**
 * Cargar proveedores en el filtro
 */
function cargarProveedoresFiltro() {
    const proveedorSelect = document.getElementById('filtro-proveedor');
    proveedorSelect.innerHTML = '<option value="todos">Todos</option>';

    window.dbOperations.getAll('proveedores', function(proveedores) {
        proveedores.forEach(proveedor => {
            const option = document.createElement('option');
            option.value = proveedor.id;
            option.textContent = proveedor.nombre;
            proveedorSelect.appendChild(option);
        });
    });
}

/**
 * Establecer fechas y horas predeterminadas
 */
function establecerFechasPredeterminadas() {
    const fechaInicioInput = document.getElementById('fecha-inicio');
    const fechaFinInput = document.getElementById('fecha-fin');

    const hoy = new Date();
    const fechaInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 0, 0);
    const fechaFin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate(), 23, 59);

    fechaInicioInput.value = fechaInicio.toISOString().slice(0, 16);
    fechaFinInput.value = fechaFin.toISOString().slice(0, 16);
}

/**
 * Configurar eventos
 */
function configurarEventos() {
    // Eventos para los filtros
    document.getElementById('filtro-sucursal').addEventListener('change', cargarFacturas);
    document.getElementById('filtro-empresa').addEventListener('change', cargarFacturas);
    document.getElementById('filtro-proveedor').addEventListener('change', cargarFacturas);
    document.getElementById('filtro-banco').addEventListener('change', cargarFacturas);

    // Eventos para botones de estado
    document.querySelectorAll('.filtro-estado .btn-estado').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filtro-estado .btn-estado').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            cargarFacturas();
        });
    });

    // Eventos para los campos de búsqueda
    document.getElementById('buscar-factura').addEventListener('input', cargarFacturas);
    document.getElementById('buscar-boleta').addEventListener('input', cargarFacturas);

    // Eventos para las fechas y horas
    document.getElementById('fecha-inicio').addEventListener('change', cargarFacturas);
    document.getElementById('fecha-fin').addEventListener('change', cargarFacturas);

    // Evento para generar reporte
    document.getElementById('generar-reporte-btn').addEventListener('click', function() {
        generarReporte();
    });

    // Eventos para cerrar el modal
    document.getElementById('close-reporte-modal').addEventListener('click', function() {
        document.getElementById('reporte-modal').style.display = 'none';
    });

    // Evento para exportar el reporte
    document.getElementById('export-excel').addEventListener('click', exportarExcel);
    document.getElementById('export-pdf').addEventListener('click', exportarPDF);
    document.getElementById('export-image').addEventListener('click', exportarImagen);
}

/**
 * Función para cargar y filtrar facturas
 */
function cargarFacturas() {
    // No hacemos nada aquí ya que cargaremos las facturas al generar el reporte
}

/**
 * Función para generar el reporte
 */
function generarReporte() {
    const reporteContenido = document.getElementById('reporte-contenido');
    reporteContenido.innerHTML = '';

    // Obtener valores de los filtros
    const filtroSucursal = document.getElementById('filtro-sucursal').value;
    const filtroEmpresa = document.getElementById('filtro-empresa').value;
    const filtroProveedor = document.getElementById('filtro-proveedor').value;
    const filtroBanco = document.getElementById('filtro-banco').value;
    const buscarFactura = document.getElementById('buscar-factura').value.trim().toLowerCase();
    const buscarBoleta = document.getElementById('buscar-boleta').value.trim().toLowerCase();

    const fechaInicio = new Date(document.getElementById('fecha-inicio').value);
    const fechaFin = new Date(document.getElementById('fecha-fin').value);

    if (fechaInicio > fechaFin) {
        Swal.fire('Error', 'La fecha y hora de inicio no puede ser mayor que la fecha y hora de fin.', 'error');
        return;
    }

    const buscarFacturas = buscarFactura.split(',').map(term => term.trim()).filter(term => term);
    const buscarBoletas = buscarBoleta.split(',').map(term => term.trim()).filter(term => term);

    // Obtener todas las facturas
    window.dbOperations.getAll('facturas', function(facturas) {
        // Filtrar facturas según los criterios
        facturasFiltradas = facturas.filter(factura => {
            const fechaFactura = new Date(factura.fechaEmision);

            return (
                fechaFactura >= fechaInicio &&
                fechaFactura <= fechaFin &&
                (filtroSucursal === 'todas' || factura.sucursalId == filtroSucursal) &&
                (filtroEmpresa === 'todas' || factura.empresaId == filtroEmpresa) &&
                (filtroProveedor === 'todos' || factura.proveedorId == filtroProveedor) &&
                (filtroBanco === 'todos' || factura.boletas.some(boleta => boleta.banco === filtroBanco)) &&
                filtrarPorEstado(factura)
            );
        });

        // Búsqueda múltiple por número de factura
        if (buscarFacturas.length > 0) {
            facturasFiltradas = facturasFiltradas.filter(factura => {
                return buscarFacturas.some(term => factura.numeroFactura.toLowerCase().includes(term));
            });
        }

        // Búsqueda múltiple por boleta ID
        if (buscarBoletas.length > 0) {
            facturasFiltradas = facturasFiltradas.filter(factura => {
                return factura.boletas.some(boleta => {
                    return buscarBoletas.some(term => boleta.boletaId.toLowerCase().includes(term));
                });
            });
        }

        // Verificar si hay facturas que mostrar
        if (facturasFiltradas.length === 0) {
            Swal.fire('Información', 'No se encontraron registros con los criterios seleccionados.', 'info');
            return;
        }

        // Renderizar el reporte
        facturasFiltradas.forEach(factura => {
            window.dbOperations.get('sucursales', factura.sucursalId, function(sucursal) {
                window.dbOperations.get('empresas', sucursal.empresaId, function(empresa) {
                    window.dbOperations.get('proveedores', factura.proveedorId, function(proveedor) {
                        renderReporteFila(factura, empresa, sucursal, proveedor);
                    });
                });
            });
        });

        // Mostrar el modal de reporte
        document.getElementById('reporte-modal').style.display = 'flex';
    });
}

/**
 * Filtrar facturas por estado
 */
function filtrarPorEstado(factura) {
    const filtroEstado = document.querySelector('.filtro-estado .btn-estado.active')?.dataset.estado || 'todas';
    const hoy = new Date();
    const fechaVencimiento = new Date(factura.fechaVencimiento);
    const diferenciaDias = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

    switch (filtroEstado) {
        case 'todas':
            return true;
        case 'pagadas':
            return factura.estado === 'Pagada';
        case 'porPagar':
            return factura.estado !== 'Pagada';
        case 'vencidas':
            return factura.estado !== 'Pagada' && fechaVencimiento < hoy;
        case 'pagoPendiente':
            return factura.estado === 'Pendiente' && factura.montoPendiente < factura.montoFactura;
        case 'prontoVencer':
            return factura.estado !== 'Pagada' && diferenciaDias >= 0 && diferenciaDias <= 8;
        case 'porPagarHoy':
            return factura.estado !== 'Pagada' && fechaVencimiento.toDateString() === hoy.toDateString();
        default:
            return true;
    }
}

/**
 * Renderizar una fila en el reporte
 */
function renderReporteFila(factura, empresa, sucursal, proveedor) {
    const reporteContenido = document.getElementById('reporte-contenido');

    if (factura.boletas && factura.boletas.length > 0) {
        factura.boletas.forEach((boleta, index) => {
            const filaFactura = document.createElement('tr');

            if (index === 0) {
                filaFactura.innerHTML = `
                    <td rowspan="${factura.boletas.length}">${empresa.nombre}</td>
                    <td rowspan="${factura.boletas.length}">${proveedor.nombre}</td>
                    <td rowspan="${factura.boletas.length}">${factura.fechaEmision}</td>
                    <td rowspan="${factura.boletas.length}">${factura.numeroFactura}</td>
                    <td rowspan="${factura.boletas.length}">Q${factura.montoFactura.toFixed(2)}</td>
                    <td rowspan="${factura.boletas.length}">${factura.fechaVencimiento}</td>
                    <td rowspan="${factura.boletas.length}">${factura.estado}</td>
                    <td>${boleta.fecha}</td>
                    <td>Q${boleta.montoAplicado.toFixed(2)}</td>
                    <td>${boleta.boletaId}</td>
                    <td>${boleta.banco}</td>
                    <td>${boleta.formaPago}</td>
                    <td>${boleta.quienDeposito}</td>
                `;
            } else {
                filaFactura.innerHTML = `
                    <td>${boleta.fecha}</td>
                    <td>Q${boleta.montoAplicado.toFixed(2)}</td>
                    <td>${boleta.boletaId}</td>
                    <td>${boleta.banco}</td>
                    <td>${boleta.formaPago}</td>
                    <td>${boleta.quienDeposito}</td>
                `;
            }

            reporteContenido.appendChild(filaFactura);
        });
    } else {
        const filaFactura = document.createElement('tr');
        filaFactura.innerHTML = `
            <td>${empresa.nombre}</td>
            <td>${proveedor.nombre}</td>
            <td>${factura.fechaEmision}</td>
            <td>${factura.numeroFactura}</td>
            <td>Q${factura.montoFactura.toFixed(2)}</td>
            <td>${factura.fechaVencimiento}</td>
            <td>${factura.estado}</td>
            <td>N/A</td>
            <td>N/A</td>
            <td>N/A</td>
            <td>N/A</td>
            <td>N/A</td>
            <td>N/A</td>
        `;
        reporteContenido.appendChild(filaFactura);
    }
}

/**
 * Funciones para exportar el reporte
 */
function exportarExcel() {
    // Implementación de exportación a Excel
    const table = document.getElementById('reporte-table');
    const workbook = XLSX.utils.table_to_book(table, { sheet: "Reporte" });
    XLSX.writeFile(workbook, 'reporte_facturas.xlsx');
}

function exportarPDF() {
    // Implementación de exportación a PDF
    const doc = new jsPDF('l', 'pt', 'a4');
    doc.autoTable({ html: '#reporte-table' });
    doc.save('reporte_facturas.pdf');
}

function exportarImagen() {
    // Implementación de exportación a Imagen
    const reporteModal = document.getElementById('reporte-modal');
    html2canvas(reporteModal.querySelector('.modal-content')).then(canvas => {
        const link = document.createElement('a');
        link.download = 'reporte_facturas.png';
        link.href = canvas.toDataURL();
        link.click();
    });
}

/**
 * Cerrar el modal cuando se hace clic fuera de él
 */
window.onclick = function(event) {
    const modal = document.getElementById('reporte-modal');
    if (event.target == modal) {
        modal.style.display = "none";
    }
};
