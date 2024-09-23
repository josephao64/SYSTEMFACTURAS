// filters.js

document.addEventListener('dbReady', function() {
    // Inicialización una vez que la base de datos está lista
    configurarFiltros();
});

/**
 * Configura los eventos de los filtros y botones de estado.
 */
function configurarFiltros() {
    // Elementos de filtro
    const filtroSucursal = document.getElementById('filtro-sucursal');
    const filtroEmpresa = document.getElementById('filtro-empresa');
    const filtroProveedor = document.getElementById('filtro-proveedor');
    const filtroBanco = document.getElementById('filtro-banco');

    // Botones de filtro por estado
    const botonesEstado = document.querySelectorAll('.btn-estado');

    // Elementos de búsqueda
    const buscarFactura = document.getElementById('buscar-factura');
    const buscarBoleta = document.getElementById('buscar-boleta');

    // Selector de ordenamiento
    const ordenarPor = document.getElementById('ordenar-por');

    // Asignar eventos de cambio a los elementos de filtro
    filtroSucursal.addEventListener('change', aplicarFiltros);
    filtroEmpresa.addEventListener('change', aplicarFiltros);
    filtroProveedor.addEventListener('change', aplicarFiltros);
    filtroBanco.addEventListener('change', aplicarFiltros);

    // Asignar eventos de input a los campos de búsqueda
    buscarFactura.addEventListener('input', aplicarFiltros);
    buscarBoleta.addEventListener('input', aplicarFiltros);

    // Asignar eventos de cambio al selector de ordenamiento
    ordenarPor.addEventListener('change', aplicarFiltros);

    // Asignar eventos de clic a los botones de filtro por estado
    botonesEstado.forEach(boton => {
        boton.addEventListener('click', function() {
            // Remover la clase 'active' de todos los botones
            botonesEstado.forEach(btn => btn.classList.remove('active'));
            // Añadir la clase 'active' al botón clicado
            this.classList.add('active');
            // Aplicar los filtros después de seleccionar el estado
            aplicarFiltros();
        });
    });

    // Inicializar el estado activo para los botones de estado
    inicializarEstadoFiltros(botonesEstado);
}

/**
 * Inicializa el estado activo para los botones de filtro por estado.
 * @param {NodeList} botonesEstado - Lista de botones de estado.
 */
function inicializarEstadoFiltros(botonesEstado) {
    // Por defecto, activar el botón "Todas las Facturas"
    botonesEstado.forEach(boton => {
        if (boton.dataset.estado === 'todas') {
            boton.classList.add('active');
        }
    });
}

/**
 * Aplica los filtros seleccionados y actualiza la tabla de facturas.
 */
function aplicarFiltros() {
    // Obtener valores de los filtros
    const filtroSucursal = document.getElementById('filtro-sucursal').value;
    const filtroEmpresa = document.getElementById('filtro-empresa').value;
    const filtroProveedor = document.getElementById('filtro-proveedor').value;
    const filtroBanco = document.getElementById('filtro-banco').value;

    // Obtener valores de búsqueda
    const buscarFactura = document.getElementById('buscar-factura').value.trim().toLowerCase();
    const buscarBoleta = document.getElementById('buscar-boleta').value.trim().toLowerCase();

    // Obtener criterio de ordenamiento
    const criterioOrdenamiento = document.getElementById('ordenar-por').value;

    // Obtener estado seleccionado
    const filtroEstado = document.querySelector('.filtro-estado .btn-estado.active')?.dataset.estado || 'todas';

    // Llamar a la función para cargar las facturas con los filtros aplicados
    cargarFacturas({
        filtroSucursal,
        filtroEmpresa,
        filtroProveedor,
        filtroBanco,
        buscarFactura,
        buscarBoleta,
        criterioOrdenamiento,
        filtroEstado
    });
}

/**
 * Carga y renderiza las facturas aplicando los filtros proporcionados.
 * @param {Object} filtros - Objeto que contiene los criterios de filtrado.
 */
function cargarFacturas(filtros) {
    const tableBody = document.getElementById('facturas-table');
    tableBody.innerHTML = ''; // Limpiar la tabla antes de cargar

    window.dbOperations.getAll('facturas', function(facturas) {
        // Filtrar facturas según los criterios
        const facturasFiltradas = facturas.filter(factura => {
            // Filtrar por sucursal
            if (filtros.filtroSucursal !== 'todas' && factura.sucursalId != filtros.filtroSucursal) {
                return false;
            }

            // Filtrar por empresa
            if (filtros.filtroEmpresa !== 'todas') {
                const sucursal = obtenerSucursal(factura.sucursalId);
                if (!sucursal || sucursal.empresaId != filtros.filtroEmpresa) {
                    return false;
                }
            }

            // Filtrar por proveedor
            if (filtros.filtroProveedor !== 'todos' && factura.proveedorId != filtros.filtroProveedor) {
                return false;
            }

            // Filtrar por banco
            if (filtros.filtroBanco !== 'todos') {
                const ultimaBoleta = obtenerUltimaBoleta(factura.boletas);
                if (!ultimaBoleta || ultimaBoleta.banco !== filtros.filtroBanco) {
                    return false;
                }
            }

            // Filtrar por estado
            if (!filtrarPorEstado(factura, filtros.filtroEstado)) {
                return false;
            }

            // Filtrar por búsqueda de factura
            if (filtros.buscarFactura) {
                const coincideFactura = factura.numeroFactura.toLowerCase().includes(filtros.buscarFactura);
                if (!coincideFactura) {
                    return false;
                }
            }

            // Filtrar por búsqueda de boleta
            if (filtros.buscarBoleta) {
                const boletaEncontrada = factura.boletas.some(boleta =>
                    boleta.boletaId.toLowerCase().includes(filtros.buscarBoleta)
                );
                if (!boletaEncontrada) {
                    return false;
                }
            }

            return true;
        });

        // Ordenar facturas según el criterio
        ordenarFacturas(facturasFiltradas, filtros.criterioOrdenamiento);

        // Renderizar las facturas filtradas
        facturasFiltradas.forEach(factura => renderFactura(factura));

        // Mostrar mensaje si no hay facturas
        if (facturasFiltradas.length === 0) {
            const fila = document.createElement('tr');
            fila.innerHTML = `<td colspan="15" style="text-align: center;">No se encontraron facturas que coincidan con los criterios seleccionados.</td>`;
            tableBody.appendChild(fila);
        }
    });
}

/**
 * Obtiene la sucursal correspondiente a un ID de sucursal.
 * @param {number} sucursalId - ID de la sucursal.
 * @returns {Object|null} - Objeto de la sucursal o null si no se encuentra.
 */
function obtenerSucursal(sucursalId) {
    let sucursal = null;
    window.dbOperations.get('sucursales', sucursalId, function(result) {
        sucursal = result;
    });
    return sucursal;
}

/**
 * Obtiene la última boleta de una factura.
 * @param {Array} boletas - Array de boletas de la factura.
 * @returns {Object|null} - Última boleta o null si no hay boletas.
 */
function obtenerUltimaBoleta(boletas) {
    if (boletas && boletas.length > 0) {
        return boletas[boletas.length - 1];
    }
    return null;
}

/**
 * Filtra una factura según el estado seleccionado.
 * @param {Object} factura - Objeto de la factura.
 * @param {string} estado - Estado seleccionado.
 * @returns {boolean} - Verdadero si la factura cumple con el estado, falso de lo contrario.
 */
function filtrarPorEstado(factura, estado) {
    const hoy = new Date();
    const fechaVencimiento = new Date(factura.fechaVencimiento);
    const diferenciaDias = Math.ceil((fechaVencimiento - hoy) / (1000 * 60 * 60 * 24));

    switch (estado) {
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
 * Ordena las facturas según el criterio seleccionado.
 * @param {Array} facturas - Array de facturas a ordenar.
 * @param {string} criterio - Criterio de ordenamiento.
 */
function ordenarFacturas(facturas, criterio) {
    facturas.sort((a, b) => {
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
 * Renderiza una factura en la tabla.
 * @param {Object} factura - Objeto de la factura.
 */
function renderFactura(factura) {
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

    // Obtener los detalles relacionados: empresa, sucursal, proveedor
    let empresaNombre = '';
    let sucursalNombre = '';
    let proveedorNombre = '';

    window.dbOperations.get('sucursales', factura.sucursalId, function(sucursal) {
        if (sucursal) {
            sucursalNombre = sucursal.nombre;
            window.dbOperations.get('empresas', sucursal.empresaId, function(empresa) {
                empresaNombre = empresa ? empresa.nombre : 'N/A';
                window.dbOperations.get('proveedores', factura.proveedorId, function(proveedor) {
                    proveedorNombre = proveedor ? proveedor.nombre : 'N/A';
                    
                    // Obtener los últimos datos de boleta si existen
                    const ultimaBoleta = obtenerUltimaBoleta(factura.boletas);

                    row.innerHTML = `
                        <td><input type="checkbox" class="factura-checkbox" data-id="${factura.id}" data-monto="${factura.montoPendiente}" data-empresa="${empresaNombre}" data-proveedor="${proveedorNombre}"></td>
                        <td>${empresaNombre}</td>
                        <td>${proveedorNombre}</td>
                        <td>${sucursalNombre}</td>
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
                    `;
                    tableBody.appendChild(row);
                });
            });
        }
    });
}

/**
 * Maneja la selección y deselección de facturas mediante checkboxes.
 */
document.addEventListener('change', function(event) {
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

/**
 * Actualiza el estado de los botones de acción según las facturas seleccionadas.
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
 * Actualiza el total pendiente seleccionado en la tabla.
 */
function actualizarTotalPendiente() {
    let totalPendiente = facturasSeleccionadas.reduce((total, factura) =>
        total + parseFloat(factura.montoPendiente), 0);
    document.getElementById('total-pendiente').innerText = `Q${totalPendiente.toFixed(2)}`;
}

/**
 * Evento para abrir el modal de pago al hacer clic en "Pagar Facturas".
 */
document.getElementById('pagar-facturas-btn').addEventListener('click', function () {
    if (facturasSeleccionadas.length === 0) {
        Swal.fire('Error', 'Por favor seleccione al menos una factura para pagar.', 'error');
        return;
    }

    const facturasSeleccionadasDiv = document.getElementById('facturas-seleccionadas');
    facturasSeleccionadasDiv.innerHTML = '';

    let totalPendiente = 0;

    facturasSeleccionadas.forEach(factura => {
        // Obtener detalles de la factura para mostrarlos
        window.dbOperations.get('facturas', factura.id, function(facturaData) {
            window.dbOperations.get('sucursales', facturaData.sucursalId, function(sucursal) {
                window.dbOperations.get('proveedores', facturaData.proveedorId, function(proveedor) {
                    window.dbOperations.get('empresas', sucursal.empresaId, function(empresa) {
                        const empresaNombre = empresa ? empresa.nombre : 'N/A';
                        const sucursalNombre = sucursal ? sucursal.nombre : 'N/A';
                        const proveedorNombre = proveedor ? proveedor.nombre : 'N/A';

                        const facturaInfo = document.createElement('p');
                        facturaInfo.innerHTML = `<strong>Factura ID:</strong> ${facturaData.id}, <strong>Empresa:</strong> ${empresaNombre}, <strong>Proveedor:</strong> ${proveedorNombre}, <strong>Fecha de Factura:</strong> ${facturaData.fechaEmision}, <strong>Número de Factura:</strong> ${facturaData.numeroFactura}, <strong>Monto Pendiente:</strong> Q${facturaData.montoPendiente.toFixed(2)}`;
                        facturasSeleccionadasDiv.appendChild(facturaInfo);

                        totalPendiente += facturaData.montoPendiente;
                        document.getElementById('total-pendiente-modal').innerText = `Q${totalPendiente.toFixed(2)}`;
                    });
                });
            });
        });
    });

    // Mostrar el modal de pago
    document.getElementById('pago-modal').style.display = 'flex';
});

/**
 * Cerrar los modales cuando se haga clic en la "x".
 */
document.getElementById('close-modal').addEventListener('click', function() {
    document.getElementById('modal').style.display = 'none';
});

document.getElementById('close-pago-modal').addEventListener('click', function() {
    document.getElementById('pago-modal').style.display = 'none';
});

/**
 * ==================== Funcionalidad de Agregar y Editar Facturas ====================
 */

// Evento para abrir el modal de agregar factura
document.getElementById('agregar-factura-btn').addEventListener('click', function() {
    abrirModalFactura();
});

// Evento para cerrar el modal de factura
document.getElementById('close-factura-modal').addEventListener('click', function() {
    cerrarModalFactura();
});

/**
 * Abre el modal para agregar una nueva factura.
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
 * Cierra el modal de agregar/editar factura.
 */
function cerrarModalFactura() {
    document.getElementById('factura-modal').style.display = 'none';
    limpiarCamposFactura();
    facturaEnEdicion = null;
    document.getElementById('guardar-factura').style.display = 'inline-block';
    document.getElementById('actualizar-factura').style.display = 'none';
}

/**
 * Limpia los campos del modal de factura.
 */
function limpiarCamposFactura() {
    document.getElementById('sucursal-factura').value = '';
    document.getElementById('proveedor-factura').value = '';
    document.getElementById('numero-factura').value = '';
    document.getElementById('fecha-emision').value = '';
    document.getElementById('fecha-vencimiento').value = '';
    document.getElementById('monto-factura').value = '';
    document.getElementById('dias-credito-factura').value = '';
}

/**
 * Evento para guardar la nueva factura.
 */
document.getElementById('guardar-factura').addEventListener('click', function() {
    const sucursalId = document.getElementById('sucursal-factura').value;
    const proveedorId = document.getElementById('proveedor-factura').value;
    const numeroFactura = document.getElementById('numero-factura').value.trim();
    const fechaEmision = document.getElementById('fecha-emision').value;
    const fechaVencimiento = document.getElementById('fecha-vencimiento').value;
    const montoFactura = parseFloat(document.getElementById('monto-factura').value);

    console.log("Agregar factura:", { sucursalId, proveedorId, numeroFactura, fechaEmision, fechaVencimiento, montoFactura });

    if (!sucursalId || !proveedorId || !numeroFactura || !fechaEmision ||
        !fechaVencimiento || isNaN(montoFactura) || montoFactura <= 0) {
        Swal.fire('Error', 'Complete todos los campos correctamente.', 'error');
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

    console.log("Factura a agregar:", facturaData);

    window.dbOperations.add('facturas', facturaData, function() {
        console.log("Factura agregada correctamente");
        Swal.fire('Éxito', 'Factura agregada correctamente', 'success');
        cerrarModalFactura();
        aplicarFiltros(); // Recargar las facturas aplicando los filtros actuales
    });
});

/**
 * Evento para el botón "Editar Factura".
 */
document.getElementById('editar-factura-btn').addEventListener('click', function() {
    if (facturaSeleccionada !== null) {
        cargarDatosFactura(facturaSeleccionada);
    }
});

/**
 * Carga los datos de una factura en el modal para editar.
 * @param {number} facturaId - ID de la factura a editar.
 */
function cargarDatosFactura(facturaId) {
    window.dbOperations.get('facturas', facturaId, function(factura) {
        if (factura) {
            document.getElementById('modal-title').innerText = 'Editar Factura';
            document.getElementById('factura-modal').style.display = 'flex';
            document.getElementById('sucursal-factura').value = factura.sucursalId;
            document.getElementById('proveedor-factura').value = factura.proveedorId;
            document.getElementById('numero-factura').value = factura.numeroFactura;
            document.getElementById('fecha-emision').value = factura.fechaEmision;
            document.getElementById('fecha-vencimiento').value = factura.fechaVencimiento;
            document.getElementById('monto-factura').value = factura.montoFactura;

            document.getElementById('guardar-factura').style.display = 'none';
            document.getElementById('actualizar-factura').style.display = 'inline-block';

            facturaEnEdicion = facturaId;
        } else {
            Swal.fire('Error', 'No se encontró la factura seleccionada.', 'error');
        }
    });
}

/**
 * Evento para actualizar la factura.
 */
document.getElementById('actualizar-factura').addEventListener('click', function() {
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

    window.dbOperations.get('facturas', facturaEnEdicion, function(factura) {
        if (factura) {
            factura.sucursalId = parseInt(sucursalId);
            factura.proveedorId = parseInt(proveedorId);
            factura.numeroFactura = numeroFactura;
            factura.fechaEmision = fechaEmision;
            factura.fechaVencimiento = fechaVencimiento;

            // Ajustar monto pendiente si el monto de la factura cambió
            const diferenciaMonto = montoFactura - factura.montoFactura;
            factura.montoFactura = montoFactura;
            factura.montoPendiente += diferenciaMonto;

            factura.estado = factura.montoPendiente === 0 ? 'Pagada' : 'Pendiente';

            window.dbOperations.update('facturas', factura, function() {
                Swal.fire('Éxito', 'Factura actualizada correctamente', 'success');
                cerrarModalFactura();
                aplicarFiltros(); // Recargar las facturas aplicando los filtros actuales
                facturaSeleccionada = null;
                facturaEnEdicion = null;
                actualizarBotonesAccion();
            });
        } else {
            Swal.fire('Error', 'No se encontró la factura seleccionada para actualizar.', 'error');
        }
    });
});

/**
 * Evento para el botón "Eliminar Factura".
 */
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

/**
 * Elimina una factura de la base de datos.
 * @param {number} facturaId - ID de la factura a eliminar.
 */
function eliminarFactura(facturaId) {
    window.dbOperations.delete('facturas', facturaId, function() {
        Swal.fire('Eliminada', 'La factura ha sido eliminada.', 'success');
        aplicarFiltros(); // Recargar las facturas aplicando los filtros actuales
        facturaSeleccionada = null;
        actualizarBotonesAccion();
    });
}

/**
 * Evento para seleccionar una factura y habilitar botones.
 */
document.addEventListener('click', function(event) {
    if (event.target.classList.contains('factura-checkbox')) {
        const facturaId = parseInt(event.target.dataset.id);
        if (event.target.checked) {
            facturaSeleccionada = facturaId;
            document.getElementById('editar-factura-btn').disabled = false;
            document.getElementById('eliminar-factura-btn').disabled = false;
        } else {
            facturaSeleccionada = null;
            document.getElementById('editar-factura-btn').disabled = true;
            document.getElementById('eliminar-factura-btn').disabled = true;
        }
    }
});

/**
 * Evento para cargar los días de crédito al seleccionar un proveedor.
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
 * Evento para calcular la fecha de vencimiento al ingresar la fecha de emisión.
 */
document.getElementById('fecha-emision').addEventListener('change', calcularFechaVencimiento);

/**
 * Calcula la fecha de vencimiento basada en la fecha de emisión y los días de crédito.
 */
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
