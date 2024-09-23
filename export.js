// export.js

document.addEventListener('dbReady', function() {
    // Configurar eventos de exportación una vez que la base de datos está lista
    configurarExportacion();
});

/**
 * Configura los eventos de los botones de exportación.
 */
function configurarExportacion() {
    // Evento para exportar la tabla con una alerta para escoger el formato
    const exportarTablaBtn = document.getElementById('exportar-tabla-btn');
    if (exportarTablaBtn) {
        exportarTablaBtn.addEventListener('click', function() {
            Swal.fire({
                title: 'Exportar Tabla',
                text: 'Elige el formato en el que deseas exportar la tabla:',
                icon: 'question',
                showCancelButton: true,
                showDenyButton: true,
                confirmButtonText: 'PDF',
                denyButtonText: 'Imagen',
                cancelButtonText: 'Excel'
            }).then((result) => {
                if (result.isConfirmed) {
                    exportToPDF('#facturas-table', 'Reporte_Facturas.pdf');
                } else if (result.isDenied) {
                    exportToImage('#facturas-table', 'Reporte_Facturas.png');
                } else if (result.isDismissed) {
                    exportToExcel('#facturas-table', 'Reporte_Facturas.xlsx');
                }
            });
        });
    }

    // Eventos para exportar desde el modal de reporte
    const exportExcelBtn = document.getElementById('export-excel');
    const exportPdfBtn = document.getElementById('export-pdf');
    const exportImageBtn = document.getElementById('export-image');

    if (exportExcelBtn) {
        exportExcelBtn.addEventListener('click', function() {
            exportToExcel('#reporte-table', 'Reporte_Facturas.xlsx');
        });
    }

    if (exportPdfBtn) {
        exportPdfBtn.addEventListener('click', function() {
            exportToPDF('#reporte-table', 'Reporte_Facturas.pdf');
        });
    }

    if (exportImageBtn) {
        exportImageBtn.addEventListener('click', function() {
            exportToImage('#reporte-modal .modal-content', 'Reporte_Facturas.png');
        });
    }
}

/**
 * Exporta una tabla HTML a un archivo Excel utilizando SheetJS.
 * @param {string} selector - Selector CSS de la tabla a exportar.
 * @param {string} filename - Nombre del archivo de Excel.
 */
function exportToExcel(selector, filename) {
    const table = document.querySelector(selector);
    if (!table) {
        Swal.fire('Error', 'No se encontró la tabla para exportar.', 'error');
        return;
    }

    const workbook = XLSX.utils.table_to_book(table, { sheet: "Reporte" });
    XLSX.writeFile(workbook, filename);
}

/**
 * Exporta una tabla HTML a un archivo PDF utilizando jsPDF y jsPDF-AutoTable.
 * @param {string} selector - Selector CSS de la tabla a exportar.
 * @param {string} filename - Nombre del archivo PDF.
 */
function exportToPDF(selector, filename) {
    const table = document.querySelector(selector);
    if (!table) {
        Swal.fire('Error', 'No se encontró la tabla para exportar.', 'error');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');

    doc.autoTable({ html: selector, startY: 50 });
    doc.save(filename);
}

/**
 * Exporta una sección del DOM a una imagen utilizando html2canvas.
 * @param {string} selector - Selector CSS del elemento a exportar.
 * @param {string} filename - Nombre del archivo de imagen.
 */
function exportToImage(selector, filename) {
    const element = document.querySelector(selector);
    if (!element) {
        Swal.fire('Error', 'No se encontró el elemento para exportar.', 'error');
        return;
    }

    html2canvas(element).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = filename;
        link.click();
    }).catch(error => {
        console.error('Error al exportar a imagen:', error);
        Swal.fire('Error', 'No se pudo exportar la imagen.', 'error');
    });
}
