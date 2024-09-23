/* empresas.js */

// Variables globales
let db;

// Inicializar o abrir la base de datos de IndexedDB
const request = indexedDB.open("GestionDB", 2); // Asegúrate de que la versión coincida con otros scripts si existen

request.onupgradeneeded = function(event) {
    db = event.target.result;

    // Crear almacenes de objetos si no existen
    if (!db.objectStoreNames.contains('empresas')) {
        const empresaStore = db.createObjectStore("empresas", { keyPath: "id", autoIncrement: true });
        empresaStore.createIndex("nombre", "nombre", { unique: true });
    }

    if (!db.objectStoreNames.contains('sucursales')) {
        const sucursalStore = db.createObjectStore("sucursales", { keyPath: "id", autoIncrement: true });
        sucursalStore.createIndex("nombre", "nombre", { unique: false });
        sucursalStore.createIndex("empresaId", "empresaId", { unique: false });
    }

    if (!db.objectStoreNames.contains('proveedores')) {
        const proveedorStore = db.createObjectStore("proveedores", { keyPath: "id", autoIncrement: true });
        proveedorStore.createIndex("nombre", "nombre", { unique: true });
    }
};

request.onsuccess = function(event) {
    db = event.target.result;
    console.log("Base de datos abierta exitosamente:", db);
    cargarEmpresas();
    cargarSucursales();
    cargarProveedores();
    cargarEmpresasEnSucursalModal();
    // No es necesario habilitar botones basados en selección
};

request.onerror = function(event) {
    console.error("Error al abrir la base de datos", event.target.error);
    Swal.fire('Error', 'No se pudo abrir la base de datos.', 'error');
};

// Funciones para manejar Empresas

// Cargar y renderizar empresas en la tabla
function cargarEmpresas() {
    const tableBody = document.getElementById('empresas-table');
    tableBody.innerHTML = ''; // Limpiar la tabla antes de cargar

    const transaction = db.transaction(["empresas"], "readonly");
    const empresaStore = transaction.objectStore("empresas");

    empresaStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const empresa = cursor.value;
            renderEmpresa(empresa);
            cursor.continue();
        }
    };
}

// Renderizar una empresa en la tabla
function renderEmpresa(empresa) {
    const tableBody = document.getElementById('empresas-table');
    const row = document.createElement('tr');

    row.innerHTML = `
        <td><input type="checkbox" class="empresa-checkbox" data-id="${empresa.id}"></td>
        <td>${empresa.nombre}</td>
        <td>
            <button class="btn editar-empresa-btn" data-id="${empresa.id}">Editar</button>
            <button class="btn eliminar-empresa-btn" data-id="${empresa.id}">Eliminar</button>
        </td>
    `;
    tableBody.appendChild(row);
}

// Agregar Evento para abrir el modal de agregar empresa
document.getElementById('agregar-empresa-btn').addEventListener('click', function() {
    document.getElementById('empresa-modal-title').innerText = "Agregar Nueva Empresa";
    document.getElementById('nombre-empresa').value = '';
    document.getElementById('guardar-empresa').style.display = 'inline-block';
    document.getElementById('actualizar-empresa').style.display = 'none';
    document.getElementById('empresa-modal').style.display = 'flex';
});

// Cerrar el modal de empresa
document.getElementById('close-empresa-modal').addEventListener('click', function() {
    document.getElementById('empresa-modal').style.display = 'none';
});

// Guardar una nueva empresa
document.getElementById('guardar-empresa').addEventListener('click', function() {
    const nombre = document.getElementById('nombre-empresa').value.trim();
    if (nombre === '') {
        Swal.fire('Error', 'El nombre de la empresa no puede estar vacío.', 'error');
        return;
    }

    const transaction = db.transaction(["empresas"], "readwrite");
    const empresaStore = transaction.objectStore("empresas");
    const request = empresaStore.add({ nombre });

    request.onsuccess = function() {
        Swal.fire('Éxito', 'Empresa agregada correctamente.', 'success');
        document.getElementById('empresa-modal').style.display = 'none';
        cargarEmpresas();
        cargarEmpresasEnSucursalModal();
    };

    request.onerror = function() {
        Swal.fire('Error', 'No se pudo agregar la empresa. Puede que el nombre ya exista.', 'error');
    };
});

// Agregar Evento para editar empresa
document.getElementById('empresas-table').addEventListener('click', function(event) {
    if (event.target.classList.contains('editar-empresa-btn')) {
        const empresaId = parseInt(event.target.dataset.id);
        editarEmpresa(empresaId);
    }
});

// Función para editar una empresa
function editarEmpresa(empresaId) {
    const transaction = db.transaction(["empresas"], "readonly");
    const empresaStore = transaction.objectStore("empresas");
    const request = empresaStore.get(empresaId);

    request.onsuccess = function(event) {
        const empresa = event.target.result;
        if (empresa) {
            document.getElementById('empresa-modal-title').innerText = "Editar Empresa";
            document.getElementById('nombre-empresa').value = empresa.nombre;
            document.getElementById('guardar-empresa').style.display = 'none';
            document.getElementById('actualizar-empresa').style.display = 'inline-block';
            document.getElementById('actualizar-empresa').dataset.id = empresa.id;
            document.getElementById('empresa-modal').style.display = 'flex';
        }
    };

    request.onerror = function() {
        Swal.fire('Error', 'No se pudo obtener la información de la empresa.', 'error');
    };
}

// Actualizar una empresa existente
document.getElementById('actualizar-empresa').addEventListener('click', function() {
    const empresaId = parseInt(this.dataset.id);
    const nombre = document.getElementById('nombre-empresa').value.trim();

    if (nombre === '') {
        Swal.fire('Error', 'El nombre de la empresa no puede estar vacío.', 'error');
        return;
    }

    const transaction = db.transaction(["empresas"], "readwrite");
    const empresaStore = transaction.objectStore("empresas");
    const request = empresaStore.put({ id: empresaId, nombre });

    request.onsuccess = function() {
        Swal.fire('Éxito', 'Empresa actualizada correctamente.', 'success');
        document.getElementById('empresa-modal').style.display = 'none';
        cargarEmpresas();
        cargarEmpresasEnSucursalModal();
    };

    request.onerror = function() {
        Swal.fire('Error', 'No se pudo actualizar la empresa. Puede que el nombre ya exista.', 'error');
    };
});

// Agregar Evento para eliminar empresa
document.getElementById('empresas-table').addEventListener('click', function(event) {
    if (event.target.classList.contains('eliminar-empresa-btn')) {
        const empresaId = parseInt(event.target.dataset.id);
        eliminarEmpresa(empresaId);
    }
});

// Función para eliminar una empresa
function eliminarEmpresa(empresaId) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Se eliminará la empresa y todas sus sucursales asociadas.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const transaction = db.transaction(["empresas", "sucursales"], "readwrite");
            const empresaStore = transaction.objectStore("empresas");
            const sucursalStore = transaction.objectStore("sucursales");

            // Eliminar la empresa
            empresaStore.delete(empresaId).onsuccess = function() {
                // Eliminar todas las sucursales asociadas
                const sucursalIndex = sucursalStore.index("empresaId");
                const request = sucursalIndex.openCursor(IDBKeyRange.only(empresaId));

                request.onsuccess = function(event) {
                    const cursor = event.target.result;
                    if (cursor) {
                        cursor.delete();
                        cursor.continue();
                    }
                };

                Swal.fire('Eliminado', 'Empresa y sus sucursales eliminadas correctamente.', 'success');
                cargarEmpresas();
                cargarSucursales();
                cargarProveedores();
                cargarEmpresasEnSucursalModal();
            };

            empresaStore.delete(empresaId).onerror = function() {
                Swal.fire('Error', 'No se pudo eliminar la empresa.', 'error');
            };
        }
    });
}

// Funciones para manejar Sucursales

// Cargar y renderizar sucursales en la tabla
function cargarSucursales() {
    const tableBody = document.getElementById('sucursales-table');
    tableBody.innerHTML = ''; // Limpiar la tabla antes de cargar

    const transaction = db.transaction(["sucursales", "empresas"], "readonly");
    const sucursalStore = transaction.objectStore("sucursales");
    const empresaStore = transaction.objectStore("empresas");

    sucursalStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const sucursal = cursor.value;
            empresaStore.get(sucursal.empresaId).onsuccess = function(event) {
                const empresa = event.target.result;
                renderSucursal(sucursal, empresa ? empresa.nombre : 'N/A');
            };
            cursor.continue();
        }
    };
}

// Renderizar una sucursal en la tabla
function renderSucursal(sucursal, empresaNombre) {
    const tableBody = document.getElementById('sucursales-table');
    const row = document.createElement('tr');

    row.innerHTML = `
        <td><input type="checkbox" class="sucursal-checkbox" data-id="${sucursal.id}"></td>
        <td>${sucursal.nombre}</td>
        <td>${empresaNombre}</td>
        <td>
            <button class="btn editar-sucursal-btn" data-id="${sucursal.id}">Editar</button>
            <button class="btn eliminar-sucursal-btn" data-id="${sucursal.id}">Eliminar</button>
        </td>
    `;
    tableBody.appendChild(row);
}

// Agregar Evento para abrir el modal de agregar sucursal
document.getElementById('agregar-sucursal-btn').addEventListener('click', function() {
    document.getElementById('sucursal-modal-title').innerText = "Agregar Nueva Sucursal";
    document.getElementById('nombre-sucursal').value = '';

    // Opcional: Puedes preseleccionar una empresa si lo deseas, o dejarlo en blanco
    document.getElementById('empresa-sucursal').value = '';

    document.getElementById('guardar-sucursal').style.display = 'inline-block';
    document.getElementById('actualizar-sucursal').style.display = 'none';
    document.getElementById('sucursal-modal').style.display = 'flex';
});

// Cerrar el modal de sucursal
document.getElementById('close-sucursal-modal').addEventListener('click', function() {
    document.getElementById('sucursal-modal').style.display = 'none';
});

// Guardar una nueva sucursal
document.getElementById('guardar-sucursal').addEventListener('click', function() {
    const nombre = document.getElementById('nombre-sucursal').value.trim();
    const empresaId = parseInt(document.getElementById('empresa-sucursal').value);

    if (nombre === '' || isNaN(empresaId)) {
        Swal.fire('Error', 'El nombre de la sucursal y la empresa son obligatorios.', 'error');
        return;
    }

    const transaction = db.transaction(["sucursales"], "readwrite");
    const sucursalStore = transaction.objectStore("sucursales");
    const request = sucursalStore.add({ nombre, empresaId });

    request.onsuccess = function() {
        Swal.fire('Éxito', 'Sucursal agregada correctamente.', 'success');
        document.getElementById('sucursal-modal').style.display = 'none';
        cargarSucursales();
    };

    request.onerror = function() {
        Swal.fire('Error', 'No se pudo agregar la sucursal. Puede que el nombre ya exista.', 'error');
    };
});

// Agregar Evento para editar sucursal
document.getElementById('sucursales-table').addEventListener('click', function(event) {
    if (event.target.classList.contains('editar-sucursal-btn')) {
        const sucursalId = parseInt(event.target.dataset.id);
        editarSucursal(sucursalId);
    }
});

// Función para editar una sucursal
function editarSucursal(sucursalId) {
    const transaction = db.transaction(["sucursales"], "readonly");
    const sucursalStore = transaction.objectStore("sucursales");
    const request = sucursalStore.get(sucursalId);

    request.onsuccess = function(event) {
        const sucursal = event.target.result;
        if (sucursal) {
            document.getElementById('sucursal-modal-title').innerText = "Editar Sucursal";
            document.getElementById('nombre-sucursal').value = sucursal.nombre;
            document.getElementById('empresa-sucursal').value = sucursal.empresaId;
            document.getElementById('guardar-sucursal').style.display = 'none';
            document.getElementById('actualizar-sucursal').style.display = 'inline-block';
            document.getElementById('actualizar-sucursal').dataset.id = sucursal.id;
            document.getElementById('sucursal-modal').style.display = 'flex';
        }
    };

    request.onerror = function() {
        Swal.fire('Error', 'No se pudo obtener la información de la sucursal.', 'error');
    };
}

// Actualizar una sucursal existente
document.getElementById('actualizar-sucursal').addEventListener('click', function() {
    const sucursalId = parseInt(this.dataset.id);
    const nombre = document.getElementById('nombre-sucursal').value.trim();
    const empresaId = parseInt(document.getElementById('empresa-sucursal').value);

    if (nombre === '' || isNaN(empresaId)) {
        Swal.fire('Error', 'El nombre de la sucursal y la empresa son obligatorios.', 'error');
        return;
    }

    const transaction = db.transaction(["sucursales"], "readwrite");
    const sucursalStore = transaction.objectStore("sucursales");
    const request = sucursalStore.put({ id: sucursalId, nombre, empresaId });

    request.onsuccess = function() {
        Swal.fire('Éxito', 'Sucursal actualizada correctamente.', 'success');
        document.getElementById('sucursal-modal').style.display = 'none';
        cargarSucursales();
    };

    request.onerror = function() {
        Swal.fire('Error', 'No se pudo actualizar la sucursal. Puede que el nombre ya exista.', 'error');
    };
});

// Agregar Evento para eliminar sucursal
document.getElementById('sucursales-table').addEventListener('click', function(event) {
    if (event.target.classList.contains('eliminar-sucursal-btn')) {
        const sucursalId = parseInt(event.target.dataset.id);
        eliminarSucursal(sucursalId);
    }
});

// Función para eliminar una sucursal
function eliminarSucursal(sucursalId) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Se eliminará la sucursal.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const transaction = db.transaction(["sucursales"], "readwrite");
            const sucursalStore = transaction.objectStore("sucursales");

            sucursalStore.delete(sucursalId).onsuccess = function() {
                Swal.fire('Eliminado', 'Sucursal eliminada correctamente.', 'success');
                cargarSucursales();
            };

            sucursalStore.delete(sucursalId).onerror = function() {
                Swal.fire('Error', 'No se pudo eliminar la sucursal.', 'error');
            };
        }
    });
}

// Funciones para manejar Proveedores

// Cargar y renderizar proveedores en la tabla
function cargarProveedores() {
    const tableBody = document.getElementById('proveedores-table');
    tableBody.innerHTML = ''; // Limpiar la tabla antes de cargar

    const transaction = db.transaction(["proveedores"], "readonly");
    const proveedorStore = transaction.objectStore("proveedores");

    proveedorStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const proveedor = cursor.value;
            renderProveedor(proveedor);
            cursor.continue();
        }
    };
}

// Renderizar un proveedor en la tabla
function renderProveedor(proveedor) {
    const tableBody = document.getElementById('proveedores-table');
    const row = document.createElement('tr');

    row.innerHTML = `
        <td><input type="checkbox" class="proveedor-checkbox" data-id="${proveedor.id}"></td>
        <td>${proveedor.nombre}</td>
        <td>${proveedor.diasCredito}</td>
        <td>
            <button class="btn editar-proveedor-btn" data-id="${proveedor.id}">Editar</button>
            <button class="btn eliminar-proveedor-btn" data-id="${proveedor.id}">Eliminar</button>
        </td>
    `;
    tableBody.appendChild(row);
}

// Agregar Evento para abrir el modal de agregar proveedor
document.getElementById('agregar-proveedor-btn').addEventListener('click', function() {
    document.getElementById('proveedor-modal-title').innerText = "Agregar Nuevo Proveedor";
    document.getElementById('nombre-proveedor').value = '';
    document.getElementById('dias-credito-proveedor').value = '';
    document.getElementById('guardar-proveedor').style.display = 'inline-block';
    document.getElementById('actualizar-proveedor').style.display = 'none';
    document.getElementById('proveedor-modal').style.display = 'flex';
});

// Cerrar el modal de proveedor
document.getElementById('close-proveedor-modal').addEventListener('click', function() {
    document.getElementById('proveedor-modal').style.display = 'none';
});

// Guardar un nuevo proveedor
document.getElementById('guardar-proveedor').addEventListener('click', function() {
    const nombre = document.getElementById('nombre-proveedor').value.trim();
    const diasCredito = parseInt(document.getElementById('dias-credito-proveedor').value);

    if (nombre === '' || isNaN(diasCredito) || diasCredito < 0) {
        Swal.fire('Error', 'El nombre del proveedor y los días de crédito son obligatorios y deben ser válidos.', 'error');
        return;
    }

    const transaction = db.transaction(["proveedores"], "readwrite");
    const proveedorStore = transaction.objectStore("proveedores");
    const request = proveedorStore.add({ nombre, diasCredito });

    request.onsuccess = function() {
        Swal.fire('Éxito', 'Proveedor agregado correctamente.', 'success');
        document.getElementById('proveedor-modal').style.display = 'none';
        cargarProveedores();
    };

    request.onerror = function() {
        Swal.fire('Error', 'No se pudo agregar el proveedor. Puede que el nombre ya exista.', 'error');
    };
});

// Agregar Evento para editar proveedor
document.getElementById('proveedores-table').addEventListener('click', function(event) {
    if (event.target.classList.contains('editar-proveedor-btn')) {
        const proveedorId = parseInt(event.target.dataset.id);
        editarProveedor(proveedorId);
    }
});

// Función para editar un proveedor
function editarProveedor(proveedorId) {
    const transaction = db.transaction(["proveedores"], "readonly");
    const proveedorStore = transaction.objectStore("proveedores");
    const request = proveedorStore.get(proveedorId);

    request.onsuccess = function(event) {
        const proveedor = event.target.result;
        if (proveedor) {
            document.getElementById('proveedor-modal-title').innerText = "Editar Proveedor";
            document.getElementById('nombre-proveedor').value = proveedor.nombre;
            document.getElementById('dias-credito-proveedor').value = proveedor.diasCredito;
            document.getElementById('guardar-proveedor').style.display = 'none';
            document.getElementById('actualizar-proveedor').style.display = 'inline-block';
            document.getElementById('actualizar-proveedor').dataset.id = proveedor.id;
            document.getElementById('proveedor-modal').style.display = 'flex';
        }
    };

    request.onerror = function() {
        Swal.fire('Error', 'No se pudo obtener la información del proveedor.', 'error');
    };
}

// Actualizar un proveedor existente
document.getElementById('actualizar-proveedor').addEventListener('click', function() {
    const proveedorId = parseInt(this.dataset.id);
    const nombre = document.getElementById('nombre-proveedor').value.trim();
    const diasCredito = parseInt(document.getElementById('dias-credito-proveedor').value);

    if (nombre === '' || isNaN(diasCredito) || diasCredito < 0) {
        Swal.fire('Error', 'El nombre del proveedor y los días de crédito son obligatorios y deben ser válidos.', 'error');
        return;
    }

    const transaction = db.transaction(["proveedores"], "readwrite");
    const proveedorStore = transaction.objectStore("proveedores");
    const request = proveedorStore.put({ id: proveedorId, nombre, diasCredito });

    request.onsuccess = function() {
        Swal.fire('Éxito', 'Proveedor actualizado correctamente.', 'success');
        document.getElementById('proveedor-modal').style.display = 'none';
        cargarProveedores();
    };

    request.onerror = function() {
        Swal.fire('Error', 'No se pudo actualizar el proveedor. Puede que el nombre ya exista.', 'error');
    };
});

// Agregar Evento para eliminar proveedor
document.getElementById('proveedores-table').addEventListener('click', function(event) {
    if (event.target.classList.contains('eliminar-proveedor-btn')) {
        const proveedorId = parseInt(event.target.dataset.id);
        eliminarProveedor(proveedorId);
    }
});

// Función para eliminar un proveedor
function eliminarProveedor(proveedorId) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "Se eliminará el proveedor.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const transaction = db.transaction(["proveedores"], "readwrite");
            const proveedorStore = transaction.objectStore("proveedores");

            proveedorStore.delete(proveedorId).onsuccess = function() {
                Swal.fire('Eliminado', 'Proveedor eliminado correctamente.', 'success');
                cargarProveedores();
            };

            proveedorStore.delete(proveedorId).onerror = function() {
                Swal.fire('Error', 'No se pudo eliminar el proveedor.', 'error');
            };
        }
    });
}

// Funciones adicionales

// Cargar empresas en el select del modal de sucursal
function cargarEmpresasEnSucursalModal() {
    const empresaSelect = document.getElementById('empresa-sucursal');
    empresaSelect.innerHTML = '<option value="">Seleccione una empresa</option>';

    const transaction = db.transaction(["empresas"], "readonly");
    const empresaStore = transaction.objectStore("empresas");

    empresaStore.openCursor().onsuccess = function(event) {
        const cursor = event.target.result;
        if (cursor) {
            const empresa = cursor.value;
            const option = document.createElement('option');
            option.value = empresa.id;
            option.textContent = empresa.nombre;
            empresaSelect.appendChild(option);
            cursor.continue();
        }
    };
}

// Función para exportar tablas a Excel, PDF o Imagen (opcional en el futuro)
// Puedes implementar esto si lo deseas, ya que actualmente se ha eliminado la funcionalidad de reportes

/*
function exportarTabla(tablaId, tipoExportacion) {
    const tabla = document.getElementById(tablaId);

    if (tipoExportacion === 'excel') {
        const workbook = XLSX.utils.table_to_book(tabla, { sheet: "Sheet1" });
        XLSX.writeFile(workbook, 'Reporte.xlsx');
    } else if (tipoExportacion === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.autoTable({ html: `#${tablaId}` });
        doc.save('Reporte.pdf');
    } else if (tipoExportacion === 'imagen') {
        html2canvas(tabla).then(canvas => {
            const imgData = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = imgData;
            link.download = 'Reporte.png';
            link.click();
        });
    }
}
*/

// Nota: He comentado la funcionalidad de exportación ya que se ha eliminado la generación de reportes.
// Puedes implementarla nuevamente si decides agregarla en el futuro.

