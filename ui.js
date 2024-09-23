// ui.js

document.addEventListener('dbReady', function() {
    // Inicialización una vez que la base de datos está lista
    cargarSucursales();
    cargarEmpresasFiltro();
    cargarSucursalesFiltro();
    cargarProveedoresFiltro();
    cargarProveedores();
    cargarFacturas();
    cargarSucursalesPago();
    configurarEventos();
});

// Variables globales
let facturasSeleccionadas = [];
let facturaSeleccionada = null;
let facturaEnEdicion = null; // Variable para identificar la factura en edición

/**
 * Cargar sucursales en el select de facturas
 */
function cargarSucursales() {
    const sucursalSelect = document.getElementById('sucursal-factura');
    sucursalSelect.innerHTML = '<option value="">Seleccione una sucursal</option>';

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
 * Cargar sucursales en el select de pago
 */
function cargarSucursalesPago() {
    const sucursalPagoSelect = document.getElementById('sucursal-pago');
    sucursalPagoSelect.innerHTML = '<option value="">Seleccione una sucursal</option>';

    window.dbOperations.getAll('sucursales', function(sucursales) {
        sucursales.forEach(sucursal => {
            const option = document.createElement('option');
            option.value = sucursal.nombre;
            option.textContent = sucursal.nombre;
            sucursalPagoSelect.appendChild(option);
        });
    });
}

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
 * Cargar proveedores en el select de facturas
 */
function cargarProveedores() {
    const proveedorSelect = document.getElementById('proveedor-factura');
    proveedorSelect.innerHTML = '<option value="">Seleccione un proveedor</option>';

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
 * Cargar y renderizar facturas desde IndexedDB
 */
function cargarFacturas() {
    const tableBody = document.getElementById('facturas-table');
    tableBody.innerHTML = ''; // Limpiar la tabla antes de cargar

    // Obtener valores de filtros y búsquedas
    const filtroSucursal = document.getElementById('filtro-sucursal').value;
    const filtroEmpresa = document.getElementById('filtro-empresa').value;
    const filtroProveedor = document.getElementById('filtro-proveedor').value;
    const filtroBanco = document.getElementById('filtro-banco').value;
    const criterioOrdenamiento = document.getElementById('ordenar-por').value;
    const buscarFactura = document.getElementById('buscar-factura').value.trim().toLowerCase();
    const buscarBoleta = document.getElementById('buscar-boleta').value.trim().toLowerCase();

    const buscarFacturas = buscarFactura.split(',').map(term => term.trim()).filter(term => term);
    const buscarBoletas = buscarBoleta.split(',').map(term => term.trim()).filter(term => term);

    // Obtener todas las facturas
    window.dbOperations.getAll('facturas', function(facturas) {
        // Filtrar facturas según los criterios
        let facturasFiltradas = facturas.filter(factura => {
            return (
                (filtroSucursal === 'todas' || factura.sucursalId == filtroSucursal) &&
                (filtroEmpresa === 'todas' || factura.empresaId == filtroEmpresa) &&
                (filtroProveedor === 'todos' || factura.proveedorId == filtroProveedor) &&
                (filtroBanco === 'todos' || (factura.boletas.length > 0 && factura.boletas[factura.boletas.length - 1].banco === filtroBanco)) &&
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

        // Ordenar las facturas
        facturasFiltradas = ordenarFacturas(facturasFiltradas, criterioOrdenamiento);

        // Renderizar las facturas en la tabla
        facturasFiltradas.forEach(factura => {
            window.dbOperations.get('sucursales', factura.sucursalId, function(sucursal) {
                window.dbOperations.get('empresas', sucursal.empresaId, function(empresa) {
                    window.dbOperations.get('proveedores', factura.proveedorId, function(proveedor) {
                        renderFactura(factura, empresa, sucursal, proveedor);
                    });
                });
            });
        });

        // Mostrar mensaje si no hay facturas
        if (facturasFiltradas.length === 0) {
            const fila = document.createElement('tr');
            fila.innerHTML = `<td colspan="15" style="text-align: center;">No se encontraron facturas que coincidan con los criterios seleccionados.</td>`;
            tableBody.appendChild(fila);
        }
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
 * Ordenar facturas según el criterio seleccionado
 */
function ordenarFacturas(facturas, criterio) {
    return facturas.sort((a, b) => {
        const fechaA = new Date(a.fechaEmision);
        const fechaB = new Date(b.fechaEmision);
        const vencimientoA = new Date(a.fechaVencimiento);
        const vencimientoB = new Date(b.fechaVencimiento);

        switch (criterio) {
            case 'masReciente':
                return fechaB - fechaA;
            case 'masAntiguo':
                return fechaA - fechaB;
            case 'vencimientoReciente':
                return vencimientoB - vencimientoA;
            case 'vencimientoAntiguo':
                return vencimientoA - vencimientoB;
            default:
                return 0;
        }
    });
}

/**
 * Renderizar una factura en la tabla principal
 */
function renderFactura(factura, empresa, sucursal, proveedor) {
    const tableBody = document.getElementById('facturas-table');
    const row = document.createElement('tr');

    // Asignar clase según estado
    if (factura.boletas.length === 0) {
        row.classList.add('sin-pago');  // Rojo
    } else if (factura.montoPendiente > 0) {
        row.classList.add('pendiente'); // Amarillo
    } else {
        row.classList.add('pagada');    // Verde
    }

    // Obtener los últimos datos de boleta si existen
    const ultimaBoleta = factura.boletas.length > 0 ?
        factura.boletas[factura.boletas.length - 1] : null;

    row.innerHTML = `
        <td><input type="checkbox" class="factura-checkbox" data-id="${factura.id}" data-monto="${factura.montoPendiente}" data-empresa="${empresa.nombre}" data-proveedor="${proveedor.nombre}"></td>
        <td>${empresa.nombre}</td>
        <td>${proveedor.nombre}</td>
        <td>${sucursal.nombre}</td>
        <td>${factura.fechaEmision}</td>
        <td>${factura.numeroFactura}</td>
        <td>Q${factura.montoFactura.toFixed(2)}</td>
        <td>${factura.fechaVencimiento}</td>
        <td id="estado-${factura.id}" class="estado">
            ${factura.montoPendiente === 0 ? 'Pagada' : 'Pendiente'}
        </td>
        <td id="fechaAbono-${factura.id}">${ultimaBoleta ? ultimaBoleta.fecha : 'N/A'}</td>
        <td id="abono-${factura.id}">Q${factura.montoPendiente.toFixed(2)}</td>
        <td id="boleta-${factura.id}">${ultimaBoleta ? ultimaBoleta.boletaId : 'N/A'}</td>
        <td id="banco-${factura.id}">${ultimaBoleta ? ultimaBoleta.banco : 'N/A'}</td>
        <td id="formaPago-${factura.id}">${ultimaBoleta ? ultimaBoleta.formaPago : 'N/A'}</td>
        <td id="quienDeposito-${factura.id}">${ultimaBoleta ? ultimaBoleta.quienDeposito : 'N/A'}</td>
        <td><button class="btn-ver-boletas" data-id="${factura.id}">Ver Boletas de Pago</button></td>
    `;
    tableBody.appendChild(row);
}

/**
 * Configurar todos los eventos necesarios
 */
function configurarEventos() {
    // Eventos para filtros
    document.getElementById('filtro-sucursal').addEventListener('change', cargarFacturas);
    document.getElementById('filtro-empresa').addEventListener('change', cargarFacturas);
    document.getElementById('filtro-proveedor').addEventListener('change', cargarFacturas);
    document.getElementById('filtro-banco').addEventListener('change', cargarFacturas);
    document.getElementById('ordenar-por').addEventListener('change', cargarFacturas);
    document.getElementById('buscar-factura').addEventListener('input', cargarFacturas);
    document.getElementById('buscar-boleta').addEventListener('input', cargarFacturas);

    // Eventos para botones de estado
    document.querySelectorAll('.filtro-estado .btn-estado').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filtro-estado .btn-estado').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            cargarFacturas();
        });
    });

    // Evento para abrir el modal de agregar factura
    document.getElementById('agregar-factura-btn').addEventListener('click', abrirModalFactura);

    // Evento para cerrar el modal de factura
    document.getElementById('close-factura-modal').addEventListener('click', cerrarModalFactura);

    // Evento para guardar la nueva factura
    document.getElementById('guardar-factura').addEventListener('click', guardarFactura);

    // Evento para actualizar la factura
    document.getElementById('actualizar-factura').addEventListener('click', actualizarFactura);

    // Evento para seleccionar y deseleccionar facturas con checkboxes
    document.getElementById('facturas-table').addEventListener('change', function(event) {
        if (event.target.classList.contains('factura-checkbox')) {
            const facturaId = parseInt(event.target.dataset.id);
            const montoPendiente = parseFloat(event.target.dataset.monto);
            const empresa = event.target.dataset.empresa;
            const proveedor = event.target.dataset.proveedor;

            if (event.target.checked) {
                // Verificar reglas antes de agregar
                if (facturasSeleccionadas.length > 0) {
                    const primeraFactura = facturasSeleccionadas[0];
                    if (primeraFactura.empresa !== empresa) {
                        Swal.fire('Error', 'No se pueden pagar facturas de diferentes empresas juntas.', 'error');
                        event.target.checked = false;
                        return;
                    }
                    if (primeraFactura.proveedor !== proveedor) {
                        Swal.fire('Error', 'No se pueden pagar facturas de diferentes proveedores juntas.', 'error');
                        event.target.checked = false;
                        return;
                    }
                }
                facturasSeleccionadas.push({ id: facturaId, montoPendiente, empresa, proveedor });
            } else {
                facturasSeleccionadas = facturasSeleccionadas.filter(factura => factura.id !== facturaId);
            }

            // Actualizar facturaSeleccionada
            if (facturasSeleccionadas.length === 1) {
                facturaSeleccionada = facturasSeleccionadas[0].id;
            } else {
                facturaSeleccionada = null;
            }

            // Actualizar el total pendiente seleccionado
            actualizarTotalPendiente();

            // Actualizar el estado de los botones de acción
            actualizarBotonesAccion();
        }
    });

    // Evento para eliminar una factura
    document.getElementById('eliminar-factura-btn').addEventListener('click', function() {
        if (facturaSeleccionada !== null) {
            Swal.fire({
                title: '¿Está seguro?',
                text: 'Esta acción eliminará la factura seleccionada.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    eliminarFactura(facturaSeleccionada);
                }
            });
        }
    });

    // Evento para editar una factura
    document.getElementById('editar-factura-btn').addEventListener('click', function() {
        if (facturaSeleccionada !== null) {
            cargarDatosFactura(facturaSeleccionada);
        }
    });

    // Evento para abrir el modal de pago al hacer clic en "Pagar Facturas"
    document.getElementById('pagar-facturas-btn').addEventListener('click', function () {
        if (facturasSeleccionadas.length === 0) {
            Swal.fire('Error', 'Por favor seleccione al menos una factura para pagar.', 'error');
            return;
        }

        const facturasSeleccionadasDiv = document.getElementById('facturas-seleccionadas');
        facturasSeleccionadasDiv.innerHTML = '';

        let totalPendiente = 0;
        let facturasDetalle = 0;

        facturasSeleccionadas.forEach(factura => {
            window.dbOperations.get('facturas', factura.id, function(facturaData) {
                window.dbOperations.get('sucursales', facturaData.sucursalId, function(sucursal) {
                    window.dbOperations.get('empresas', sucursal.empresaId, function(empresa) {
                        window.dbOperations.get('proveedores', facturaData.proveedorId, function(proveedor) {
                            const facturaInfo = document.createElement('p');
                            facturaInfo.innerHTML = `<strong>Factura ID:</strong> ${facturaData.id}, <strong>Proveedor:</strong> ${proveedor.nombre}, <strong>Empresa:</strong> ${empresa.nombre}, <strong>Fecha de Factura:</strong> ${facturaData.fechaEmision}, <strong>Número de Factura:</strong> ${facturaData.numeroFactura}, <strong>Monto Pendiente:</strong> Q${facturaData.montoPendiente.toFixed(2)}`;
                            facturasSeleccionadasDiv.appendChild(facturaInfo);

                            totalPendiente += facturaData.montoPendiente;
                            facturasDetalle++;

                            // Una vez cargadas todas las facturas seleccionadas
                            if (facturasDetalle === facturasSeleccionadas.length) {
                                document.getElementById('total-pendiente-modal').innerText = `Q${totalPendiente.toFixed(2)}`;
                                document.getElementById('pago-modal').style.display = 'flex';
                                // Asegurar que el botón de aplicar pago esté habilitado
                                document.getElementById('aplicar-pago').disabled = false;
                            }
                        });
                    });
                });
            });
        });
    });

    // Evento para cerrar los modales
    document.getElementById('close-modal').addEventListener('click', function() {
        document.getElementById('modal').style.display = 'none';
    });

    document.getElementById('close-pago-modal').addEventListener('click', function() {
        document.getElementById('pago-modal').style.display = 'none';
    });

    document.getElementById('close-reporte-modal').addEventListener('click', function() {
        document.getElementById('reporte-modal').style.display = 'none';
    });

    /**
     * Abrir el modal de agregar factura
     */
    function abrirModalFactura() {
        document.getElementById('factura-modal').style.display = 'flex';
        document.getElementById('modal-title').textContent = 'Agregar Nueva Factura';
        document.getElementById('guardar-factura').style.display = 'inline-block';
        document.getElementById('actualizar-factura').style.display = 'none';
        limpiarCamposFactura();
        facturaEnEdicion = null;
    }

    /**
     * Cerrar el modal de agregar/editar factura
     */
    function cerrarModalFactura() {
        document.getElementById('factura-modal').style.display = 'none';
        limpiarCamposFactura();
        facturaEnEdicion = null;
        document.getElementById('guardar-factura').style.display = 'inline-block';
        document.getElementById('actualizar-factura').style.display = 'none';
    }

    /**
     * Limpiar los campos del modal de factura
     */
    function limpiarCamposFactura() {
        document.getElementById('sucursal-factura').value = '';
        document.getElementById('proveedor-factura').value = '';
        document.getElementById('dias-credito-factura').value = '';
        document.getElementById('numero-factura').value = '';
        document.getElementById('fecha-emision').value = '';
        document.getElementById('fecha-vencimiento').value = '';
        document.getElementById('monto-factura').value = '';
    }

    /**
     * Guardar una nueva factura en la base de datos
     */
    function guardarFactura() {
        const sucursalId = document.getElementById('sucursal-factura').value;
        const proveedorId = document.getElementById('proveedor-factura').value;
        const numeroFactura = document.getElementById('numero-factura').value.trim();
        const fechaEmision = document.getElementById('fecha-emision').value;
        const fechaVencimiento = document.getElementById('fecha-vencimiento').value;
        const montoFactura = parseFloat(document.getElementById('monto-factura').value);

        if (!sucursalId || !proveedorId || !numeroFactura || !fechaEmision ||
            !fechaVencimiento || isNaN(montoFactura) || montoFactura <= 0) {
            Swal.fire('Error', 'Complete todos los campos correctamente.', 'error');
            return;
        }

        // Validar que numeroFactura sea único
        window.dbOperations.getAll('facturas', function(facturas) {
            const existe = facturas.some(factura => factura.numeroFactura.toLowerCase() === numeroFactura.toLowerCase());
            if (existe) {
                Swal.fire('Error', 'El número de factura ya existe. Por favor ingrese uno diferente.', 'error');
                return;
            }

            // Guardar la factura en IndexedDB
            const facturaData = {
                sucursalId: parseInt(sucursalId),
                proveedorId: parseInt(proveedorId),
                numeroFactura,
                fechaEmision,
                fechaVencimiento,
                montoFactura: montoFactura,
                montoPendiente: montoFactura,
                estado: 'Pendiente',
                boletas: []
            };

            window.dbOperations.add('facturas', facturaData, function() {
                Swal.fire('Éxito', 'Factura agregada correctamente.', 'success');
                cerrarModalFactura();
                cargarFacturas(); // Refrescar la tabla
            });
        });
    }

    /**
     * Cargar datos de una factura para editar
     */
    function cargarDatosFactura(facturaId) {
        window.dbOperations.get('facturas', facturaId, function(factura) {
            if (!factura) {
                Swal.fire('Error', 'Factura no encontrada.', 'error');
                return;
            }

            document.getElementById('modal-title').innerText = 'Editar Factura';
            document.getElementById('factura-modal').style.display = 'flex';
            document.getElementById('guardar-factura').style.display = 'none';
            document.getElementById('actualizar-factura').style.display = 'inline-block';

            document.getElementById('sucursal-factura').value = factura.sucursalId;
            document.getElementById('proveedor-factura').value = factura.proveedorId;
            document.getElementById('numero-factura').value = factura.numeroFactura;
            document.getElementById('fecha-emision').value = factura.fechaEmision;
            document.getElementById('fecha-vencimiento').value = factura.fechaVencimiento;
            document.getElementById('monto-factura').value = factura.montoFactura;

            facturaEnEdicion = facturaId;
        });
    }

    /**
     * Actualizar una factura en la base de datos
     */
    function actualizarFactura() {
        if (facturaEnEdicion === null) {
            Swal.fire('Error', 'No se ha seleccionado ninguna factura para actualizar.', 'error');
            return;
        }

        const sucursalId = document.getElementById('sucursal-factura').value;
        const proveedorId = document.getElementById('proveedor-factura').value;
        const numeroFactura = document.getElementById('numero-factura').value.trim();
        const fechaEmision = document.getElementById('fecha-emision').value;
        const fechaVencimiento = document.getElementById('fecha-vencimiento').value;
        const montoFactura = parseFloat(document.getElementById('monto-factura').value);

        if (!sucursalId || !proveedorId || !numeroFactura || !fechaEmision ||
            !fechaVencimiento || isNaN(montoFactura) || montoFactura <= 0) {
            Swal.fire('Error', 'Complete todos los campos correctamente.', 'error');
            return;
        }

        // Validar que numeroFactura sea único (excepto para la factura en edición)
        window.dbOperations.getAll('facturas', function(facturas) {
            const existe = facturas.some(factura => 
                factura.numeroFactura.toLowerCase() === numeroFactura.toLowerCase() &&
                factura.id !== facturaEnEdicion
            );
            if (existe) {
                Swal.fire('Error', 'El número de factura ya existe. Por favor ingrese uno diferente.', 'error');
                return;
            }

            window.dbOperations.get('facturas', facturaEnEdicion, function(factura) {
                if (!factura) {
                    Swal.fire('Error', 'Factura no encontrada.', 'error');
                    return;
                }

                // Ajustar monto pendiente si el monto de la factura cambió
                const diferenciaMonto = montoFactura - factura.montoFactura;
                factura.sucursalId = parseInt(sucursalId);
                factura.proveedorId = parseInt(proveedorId);
                factura.numeroFactura = numeroFactura;
                factura.fechaEmision = fechaEmision;
                factura.fechaVencimiento = fechaVencimiento;
                factura.montoFactura = montoFactura;
                factura.montoPendiente += diferenciaMonto;
                factura.estado = factura.montoPendiente === 0 ? 'Pagada' : 'Pendiente';

                window.dbOperations.update('facturas', factura, function() {
                    Swal.fire('Éxito', 'Factura actualizada correctamente.', 'success');
                    cerrarModalFactura();
                    cargarFacturas(); // Refrescar la tabla
                    facturaEnEdicion = null;
                    actualizarBotonesAccion();
                });
            });
        });
    }

    /**
     * Eliminar una factura de la base de datos
     */
    function eliminarFactura(facturaId) {
        window.dbOperations.delete('facturas', facturaId, function() {
            Swal.fire('Eliminada', 'La factura ha sido eliminada.', 'success');
            cargarFacturas(); // Refrescar la tabla
            facturaSeleccionada = null;
            facturasSeleccionadas = [];
            actualizarTotalPendiente();
            actualizarBotonesAccion();
        });
    }

    /**
     * Actualizar el estado de los botones de acción
     */
    function actualizarBotonesAccion() {
        const editarBtn = document.getElementById('editar-factura-btn');
        const eliminarBtn = document.getElementById('eliminar-factura-btn');
        const pagarBtn = document.getElementById('pagar-facturas-btn');

        if (facturasSeleccionadas.length === 1) {
            editarBtn.disabled = false;
            eliminarBtn.disabled = false;
        } else {
            editarBtn.disabled = true;
            eliminarBtn.disabled = facturasSeleccionadas.length === 0;
        }

        if (facturasSeleccionadas.length > 0) {
            pagarBtn.disabled = false;
        } else {
            pagarBtn.disabled = true;
        }
    }

    /**
     * Actualizar el total pendiente seleccionado
     */
    function actualizarTotalPendiente() {
        let totalPendiente = facturasSeleccionadas.reduce((total, factura) =>
            total + parseFloat(factura.montoPendiente), 0);
        document.getElementById('total-pendiente').innerText = `Q${totalPendiente.toFixed(2)}`;
    }

    /**
     * Validar los campos del pago
     */
    function validarPago() {
        const montoTotal = parseFloat(document.getElementById('monto-total').value);
        const bancoSeleccionado = document.getElementById('banco').value;
        const sucursalPagoSeleccionada = document.getElementById('sucursal-pago').value;
        const formaPagoSeleccionada = document.getElementById('forma-pago').value;

        if (isNaN(montoTotal) || montoTotal <= 0) {
            Swal.fire('Error', 'Por favor ingrese un monto válido.', 'error');
            return false;
        }

        if (bancoSeleccionado === "") {
            Swal.fire('Error', 'Por favor seleccione un banco.', 'error');
            return false;
        }

        if (sucursalPagoSeleccionada === "") {
            Swal.fire('Error', 'Por favor seleccione una sucursal para el pago.', 'error');
            return false;
        }

        if (formaPagoSeleccionada === "") {
            Swal.fire('Error', 'Por favor seleccione una forma de pago.', 'error');
            return false;
        }

        return true;
    }

    /**
     * Aplicar pagos a las facturas seleccionadas
     */
    document.getElementById('aplicar-pago').addEventListener('click', function () {
        if (!validarPago()) return;

        const montoTotal = parseFloat(document.getElementById('monto-total').value);
        const fechaPago = document.getElementById('fecha-pago').value;
        const numeroBoleta = document.getElementById('numero-boleta').value.trim();
        const bancoSeleccionado = document.getElementById('banco').value;
        const sucursalPagoSeleccionada = document.getElementById('sucursal-pago').value;
        const formaPagoSeleccionada = document.getElementById('forma-pago').value;

        if (!fechaPago || !numeroBoleta || bancoSeleccionado === "" ||
            sucursalPagoSeleccionada === "" || formaPagoSeleccionada === "") {
            Swal.fire('Error', 'Complete todos los campos: fecha, número de boleta, banco, sucursal y forma de pago.', 'error');
            return;
        }

        let montoRestante = montoTotal;
        const transaction = db.transaction(["facturas"], "readwrite");
        const facturaStore = transaction.objectStore("facturas");

        facturasSeleccionadas.forEach(facturaSeleccionada => {
            window.dbOperations.get('facturas', facturaSeleccionada.id, function(factura) {
                if (montoRestante <= 0) return;

                let pagoAplicado = 0;

                if (montoRestante >= factura.montoPendiente) {
                    pagoAplicado = factura.montoPendiente;
                    montoRestante -= factura.montoPendiente;
                    factura.montoPendiente = 0;
                    factura.estado = 'Pagada';
                } else {
                    pagoAplicado = montoRestante;
                    factura.montoPendiente -= montoRestante;
                    montoRestante = 0;
                    factura.estado = 'Pendiente';
                }

                // Validar que no existan boletas con el mismo número de factura (numeroBoleta)
                const boletaExiste = factura.boletas.some(boleta => boleta.boletaId.toLowerCase() === numeroBoleta.toLowerCase());
                if (boletaExiste) {
                    Swal.fire('Error', `La boleta ID "${numeroBoleta}" ya existe para la factura "${factura.numeroFactura}".`, 'error');
                    return;
                }

                // Agregar la boleta
                factura.boletas.push({
                    boletaId: numeroBoleta,
                    montoAplicado: parseFloat(pagoAplicado.toFixed(2)),
                    fecha: fechaPago,
                    banco: bancoSeleccionado,
                    formaPago: formaPagoSeleccionada,
                    quienDeposito: sucursalPagoSeleccionada
                });

                window.dbOperations.update('facturas', factura, function() {
                    if (facturasSeleccionadas.indexOf(facturaSeleccionada) === facturasSeleccionadas.length - 1 && montoRestante === 0) {
                        Swal.fire({
                            title: '¡Pago aplicado con éxito!',
                            html: `
                                <strong>Fecha:</strong> ${fechaPago}<br>
                                <strong>Número de Boleta:</strong> ${numeroBoleta}<br>
                                <strong>Banco:</strong> ${bancoSeleccionado}<br>
                                <strong>Forma de Pago:</strong> ${formaPagoSeleccionada}<br>
                                <strong>Sucursal para el Pago (Quién Depositó):</strong> ${sucursalPagoSeleccionada}<br>
                                <strong>Monto Aplicado:</strong> Q${pagoAplicado.toFixed(2)}
                            `,
                            icon: 'success',
                            confirmButtonText: 'Aceptar'
                        });

                        // Limpiar el formulario y restablecer la interfaz
                        document.getElementById('monto-total').value = '';
                        document.getElementById('fecha-pago').value = '';
                        document.getElementById('numero-boleta').value = '';
                        document.getElementById('banco').value = '';
                        document.getElementById('sucursal-pago').value = '';
                        document.getElementById('forma-pago').value = '';
                        facturasSeleccionadas = [];
                        facturaSeleccionada = null;
                        facturaEnEdicion = null;
                        actualizarTotalPendiente();
                        actualizarBotonesAccion();
                        cargarFacturas();
                        document.getElementById('pago-modal').style.display = 'none';
                    }
                });
            });
        });
    });

    /**
     * Ver los detalles del pago realizado
     */
    function verPago(facturaId) {
        window.dbOperations.get('facturas', facturaId, function(factura) {
            const modal = document.getElementById('modal');
            const detallesPago = document.getElementById('detalles-pago');

            if (factura.boletas && factura.boletas.length > 0) {
                const boletasDetalles = factura.boletas.map(boleta => `
                    <strong>ID Boleta:</strong> ${boleta.boletaId}<br>
                    <strong>Monto Aplicado:</strong> Q${boleta.montoAplicado.toFixed(2)}<br>
                    <strong>Fecha de Abono:</strong> ${boleta.fecha}<br>
                    <strong>Banco:</strong> ${boleta.banco}<br>
                    <strong>Forma de Pago:</strong> ${boleta.formaPago}<br>
                    <strong>Quién Depositó:</strong> ${boleta.quienDeposito}<br>
                `).join('<hr>');

                detallesPago.innerHTML = boletasDetalles;
                modal.style.display = 'flex';
            } else {
                detallesPago.innerHTML = 'No se han realizado pagos para esta factura.';
                modal.style.display = 'flex';
            }
        });
    }

    /**
     * Agregar evento para los botones "Ver Boletas de Pago"
     */
    document.getElementById('facturas-table').addEventListener('click', function(event) {
        if (event.target.classList.contains('btn-ver-boletas')) {
            const facturaId = parseInt(event.target.dataset.id);
            mostrarBoletas(facturaId);
        }
    });

    /**
     * Mostrar boletas en un alert con la suma total
     */
    function mostrarBoletas(facturaId) {
        window.dbOperations.get('facturas', facturaId, function(factura) {
            if (factura.boletas.length === 0) {
                Swal.fire('Boletas de Pago', 'No hay boletas de pago para esta factura.', 'info');
                return;
            }

            const boletasHTML = factura.boletas.map(boleta => `
                <strong>ID Boleta:</strong> ${boleta.boletaId}<br>
                <strong>Monto Aplicado:</strong> Q${boleta.montoAplicado.toFixed(2)}<br>
                <strong>Fecha de Abono:</strong> ${boleta.fecha}<br>
                <strong>Banco:</strong> ${boleta.banco}<br>
                <strong>Forma de Pago:</strong> ${boleta.formaPago}<br>
                <strong>Quién Depositó:</strong> ${boleta.quienDeposito}<br><hr>
            `).join('');

            const total = factura.boletas.reduce((sum, boleta) => sum + boleta.montoAplicado, 0).toFixed(2);

            Swal.fire({
                title: 'Boletas de Pago',
                html: `${boletasHTML}<strong>Total de Pagos:</strong> Q${total}`,
                icon: 'info',
                width: '600px',
                confirmButtonText: 'Cerrar'
            });
        });
    }

    /**
     * Configurar filtros y botones de reporte
     */
    // Ya configurado en configurarEventos()

    /**
     * Manejar la selección de filtros y generación de reporte
     */
    // Ya implementado

    /**
     * Escuchar cambios en el proveedor para cargar días de crédito
     */
    document.getElementById('proveedor-factura').addEventListener('change', function() {
        const proveedorId = parseInt(this.value);
        if (!proveedorId) {
            document.getElementById('dias-credito-factura').value = '';
            document.getElementById('fecha-vencimiento').value = '';
            return;
        }

        window.dbOperations.get('proveedores', proveedorId, function(proveedor) {
            if (proveedor) {
                document.getElementById('dias-credito-factura').value = proveedor.diasCredito;
                calcularFechaVencimiento();
            }
        });
    });

    /**
     * Calcular la fecha de vencimiento basada en la fecha de emisión y los días de crédito
     */
    document.getElementById('fecha-emision').addEventListener('change', calcularFechaVencimiento);

    function calcularFechaVencimiento() {
        const fechaEmision = document.getElementById('fecha-emision').value;
        const diasCredito = parseInt(document.getElementById('dias-credito-factura').value);

        if (fechaEmision && diasCredito) {
            const fechaVencimiento = new Date(fechaEmision);
            fechaVencimiento.setDate(fechaVencimiento.getDate() + diasCredito);
            const fechaVencimientoString = fechaVencimiento.toISOString().split('T')[0];
            document.getElementById('fecha-vencimiento').value = fechaVencimientoString;
        } else {
            document.getElementById('fecha-vencimiento').value = '';
        }
    }

    /**
     * Función para generar el reporte con facturas y boletas asociadas
     */
    document.getElementById('generar-reporte-btn').addEventListener('click', function() {
        generarReporte();
    });

    /**
     * Función para generar el reporte con facturas y boletas asociadas
     */
    function generarReporte() {
        const reporteContenido = document.getElementById('reporte-contenido');
        reporteContenido.innerHTML = '';

        // Obtener todos los filtros aplicados
        const filtroSucursal = document.getElementById('filtro-sucursal').value;
        const filtroEmpresa = document.getElementById('filtro-empresa').value;
        const filtroProveedor = document.getElementById('filtro-proveedor').value;
        const filtroBanco = document.getElementById('filtro-banco').value;
        const criterioOrdenamiento = document.getElementById('ordenar-por').value;
        const buscarFactura = document.getElementById('buscar-factura').value.trim().toLowerCase();
        const buscarBoleta = document.getElementById('buscar-boleta').value.trim().toLowerCase();

        const buscarFacturas = buscarFactura.split(',').map(term => term.trim()).filter(term => term);
        const buscarBoletas = buscarBoleta.split(',').map(term => term.trim()).filter(term => term);

        // Obtener todas las facturas
        window.dbOperations.getAll('facturas', function(facturas) {
            // Filtrar facturas según los criterios
            let facturasFiltradas = facturas.filter(factura => {
                return (
                    (filtroSucursal === 'todas' || factura.sucursalId == filtroSucursal) &&
                    (filtroEmpresa === 'todas' || factura.empresaId == filtroEmpresa) &&
                    (filtroProveedor === 'todos' || factura.proveedorId == filtroProveedor) &&
                    (filtroBanco === 'todos' || (factura.boletas.length > 0 && factura.boletas[factura.boletas.length - 1].banco === filtroBanco)) &&
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

            // Ordenar las facturas
            facturasFiltradas = ordenarFacturas(facturasFiltradas, criterioOrdenamiento);

            // Agrupar facturas por Proveedor para unir filas en el reporte
            const facturasAgrupadas = agruparFacturasPorProveedor(facturasFiltradas);

            // Renderizar el reporte
            facturasAgrupadas.forEach(grupo => {
                grupo.facturas.forEach((factura, index) => {
                    window.dbOperations.get('sucursales', factura.sucursalId, function(sucursal) {
                        window.dbOperations.get('empresas', sucursal.empresaId, function(empresa) {
                            window.dbOperations.get('proveedores', factura.proveedorId, function(proveedor) {
                                renderReporteFila(grupo.proveedor, factura, empresa, sucursal, index === 0, grupo.facturas.length);
                            });
                        });
                    });
                });
            });

            // Mostrar el modal de reporte
            document.getElementById('reporte-modal').style.display = 'flex';
        });
    }

    /**
     * Agrupar facturas por proveedor
     */
    function agruparFacturasPorProveedor(facturas) {
        const agrupado = {};

        facturas.forEach(factura => {
            if (!agrupado[factura.proveedorId]) {
                agrupado[factura.proveedorId] = {
                    proveedor: factura.proveedorId,
                    facturas: []
                };
            }
            agrupado[factura.proveedorId].facturas.push(factura);
        });

        // Convertir a un array
        const resultado = [];
        for (let proveedorId in agrupado) {
            resultado.push({
                proveedor: agrupado[proveedorId].facturas[0].proveedorId,
                facturas: agrupado[proveedorId].facturas
            });
        }

        return resultado;
    }

    /**
     * Renderizar una fila en el reporte con posibles filas unificadas
     */
    function renderReporteFila(proveedorId, factura, empresa, sucursal, esPrimeraFila, totalFilas) {
        const reporteContenido = document.getElementById('reporte-contenido');

        window.dbOperations.get('proveedores', proveedorId, function(proveedor) {
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

            // Si no hay boletas, agregar una fila con N/A
            if (factura.boletas.length === 0) {
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
                `;
                reporteContenido.appendChild(filaFactura);
            }
        });
    }

    /**
     * Manejar el clic en "Exportar Tabla" y los botones de exportación en el modal
     */
    // Ya manejado por export.js

    /**
     * Escuchar cambios en el proveedor para cargar días de crédito
     */
    // Ya configurado

    /**
     * Función para generar el reporte con facturas y boletas asociadas
     */
    // Ya implementado

    /**
     * Cerrar los modales cuando se haga clic fuera de ellos
     */
    window.onclick = function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target == modal) {
                modal.style.display = "none";
            }
        });
    };
}
