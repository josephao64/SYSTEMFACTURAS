// db.js

// Crear/abrir la base de datos de IndexedDB
let db;
const dbName = "GestionDB";
const dbVersion = 2;

// Abrir la conexión a IndexedDB
const request = indexedDB.open(dbName, dbVersion);

// Evento para manejar la actualización de la base de datos (crear almacenes de objetos)
request.onupgradeneeded = function(event) {
    db = event.target.result;

    // Crear almacenes de objetos si no existen
    if (!db.objectStoreNames.contains('empresas')) {
        db.createObjectStore("empresas", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains('sucursales')) {
        const sucursalStore = db.createObjectStore("sucursales", {
            keyPath: "id",
            autoIncrement: true
        });
        sucursalStore.createIndex("empresaId", "empresaId", { unique: false });
    }
    if (!db.objectStoreNames.contains('proveedores')) {
        db.createObjectStore("proveedores", { keyPath: "id", autoIncrement: true });
    }
    if (!db.objectStoreNames.contains('facturas')) {
        const facturaStore = db.createObjectStore("facturas", {
            keyPath: "id",
            autoIncrement: true
        });
        facturaStore.createIndex("sucursalId", "sucursalId", { unique: false });
        facturaStore.createIndex("proveedorId", "proveedorId", { unique: false });
        facturaStore.createIndex("numeroFactura", "numeroFactura", { unique: false });
        facturaStore.createIndex("boletaId", "boletas.boletaId", { unique: false, multiEntry: true });
    }
};

// Evento que se ejecuta cuando la base de datos se abre exitosamente
request.onsuccess = function(event) {
    db = event.target.result;
    console.log("Base de datos abierta exitosamente.");

    // Emitir un evento personalizado para indicar que la base de datos está lista
    document.dispatchEvent(new Event('dbReady'));
};

// Evento que se ejecuta si hay un error al abrir la base de datos
request.onerror = function(event) {
    console.error("Error al abrir la base de datos", event.target.error);
};

// Funciones de acceso a la base de datos
const dbOperations = {
    /**
     * Obtener todos los registros de una tienda de objetos.
     * @param {string} storeName - Nombre de la tienda de objetos.
     * @param {function} callback - Función a ejecutar con los resultados.
     */
    getAll: function(storeName, callback) {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = function(event) {
            callback(event.target.result);
        };

        request.onerror = function(event) {
            console.error(`Error al obtener datos de ${storeName}:`, event.target.error);
        };
    },

    /**
     * Agregar un nuevo registro a una tienda de objetos.
     * @param {string} storeName - Nombre de la tienda de objetos.
     * @param {object} data - Datos a agregar.
     * @param {function} [callback] - Función opcional a ejecutar después de agregar.
     */
    add: function(storeName, data, callback) {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.add(data);

        request.onsuccess = function() {
            console.log(`Datos agregados a ${storeName} exitosamente.`);
            if (callback) callback();
        };

        request.onerror = function(event) {
            console.error(`Error al agregar datos a ${storeName}:`, event.target.error);
        };
    },

    /**
     * Actualizar un registro existente en una tienda de objetos.
     * @param {string} storeName - Nombre de la tienda de objetos.
     * @param {object} data - Datos actualizados (deben incluir la clave primaria).
     * @param {function} [callback] - Función opcional a ejecutar después de actualizar.
     */
    update: function(storeName, data, callback) {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = function() {
            console.log(`Datos en ${storeName} actualizados exitosamente.`);
            if (callback) callback();
        };

        request.onerror = function(event) {
            console.error(`Error al actualizar datos en ${storeName}:`, event.target.error);
        };
    },

    /**
     * Eliminar un registro de una tienda de objetos.
     * @param {string} storeName - Nombre de la tienda de objetos.
     * @param {number|string} key - Clave primaria del registro a eliminar.
     * @param {function} [callback] - Función opcional a ejecutar después de eliminar.
     */
    delete: function(storeName, key, callback) {
        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = function() {
            console.log(`Datos con clave ${key} eliminados de ${storeName} exitosamente.`);
            if (callback) callback();
        };

        request.onerror = function(event) {
            console.error(`Error al eliminar datos de ${storeName}:`, event.target.error);
        };
    },

    /**
     * Obtener un registro específico de una tienda de objetos por su clave primaria.
     * @param {string} storeName - Nombre de la tienda de objetos.
     * @param {number|string} key - Clave primaria del registro a obtener.
     * @param {function} callback - Función a ejecutar con el resultado.
     */
    get: function(storeName, key, callback) {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = function(event) {
            callback(event.target.result);
        };

        request.onerror = function(event) {
            console.error(`Error al obtener datos de ${storeName} con clave ${key}:`, event.target.error);
        };
    },

    /**
     * Buscar registros en una tienda de objetos utilizando un índice.
     * @param {string} storeName - Nombre de la tienda de objetos.
     * @param {string} indexName - Nombre del índice a utilizar.
     * @param {*} query - Valor de búsqueda.
     * @param {function} callback - Función a ejecutar con los resultados.
     */
    searchByIndex: function(storeName, indexName, query, callback) {
        const transaction = db.transaction([storeName], "readonly");
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(query);

        request.onsuccess = function(event) {
            callback(event.target.result);
        };

        request.onerror = function(event) {
            console.error(`Error al buscar en ${storeName} por índice ${indexName}:`, event.target.error);
        };
    }
};

// Exponer dbOperations al ámbito global para que otros scripts puedan acceder a él
window.dbOperations = dbOperations;
