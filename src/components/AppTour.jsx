import { useEffect, useRef } from 'react';
import Shepherd from 'shepherd.js';
import 'shepherd.js/dist/css/shepherd.css';

const STEP_DELAY = 180;

function waitForRender() {
  return new Promise((resolve) => {
    window.setTimeout(resolve, STEP_DELAY);
  });
}

function tourButtons(tour, isLastStep = false) {
  return [
    {
      classes: 'shepherdButtonSecondary',
      text: 'Salir',
      action: tour.cancel
    },
    {
      classes: 'shepherdButtonSecondary',
      text: 'Atras',
      action: tour.back
    },
    {
      classes: 'shepherdButtonPrimary',
      text: isLastStep ? 'Finalizar' : 'Siguiente',
      action: isLastStep ? tour.complete : tour.next
    }
  ];
}

function actionButtons(tour, skipText = 'Saltar') {
  return [
    {
      classes: 'shepherdButtonSecondary',
      text: 'Salir',
      action: tour.cancel
    },
    {
      classes: 'shepherdButtonSecondary',
      text: skipText,
      action: tour.next
    }
  ];
}

function navigateTo(onNavigate, view) {
  return async () => {
    onNavigate?.(view);
    await waitForRender();
  };
}

function buildTourSteps(tour, onNavigate) {
  return [
    {
      id: 'welcome',
      title: 'Tutorial completo FEVV',
      text: 'Esta guia te llevara por el flujo real del sistema: cargar JSON, consultar Hacienda, alimentar registros, crear Libros de IVA, cargar anexos y generar CSV.',
      attachTo: { element: '[data-tour="start-guide"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'inicio-action',
      title: '1. Entrar a Inicio',
      text: 'Haz clic en INICIO. Esta pantalla es el punto de entrada donde se cargan y procesan los DTE en formato JSON.',
      attachTo: { element: '[data-tour="nav-inicio"]', on: 'bottom' },
      advanceOn: { selector: '[data-tour="nav-inicio"]', event: 'click' },
      buttons: actionButtons(tour)
    },
    {
      id: 'folder',
      title: 'Seleccionar carpeta',
      text: 'Este campo contiene la carpeta donde estan los archivos JSON. Presiona el icono de carpeta para elegir una ubicacion real; todos los documentos encontrados ahi podran procesarse.',
      attachTo: { element: '[data-tour="folder-picker"]', on: 'bottom' },
      beforeShowPromise: waitForRender,
      buttons: tourButtons(tour)
    },
    {
      id: 'folder-button',
      title: 'Boton de carpeta',
      text: 'Este boton abre el selector de carpetas. Usalo cuando quieras cargar todos los JSON de una carpeta contenedora.',
      attachTo: { element: '[data-tour="select-folder-button"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'document-type',
      title: '2. Tipo de Documento',
      text: 'Abre este selector y elige el DTE a procesar: 01, 03, 05, 07, 09, 11, 14 u otro disponible. El tipo elegido define que documentos se tomaran en cuenta.',
      attachTo: { element: '[data-tour="document-type-select"]', on: 'bottom' },
      advanceOn: { selector: '[data-tour="document-type-select"]', event: 'change' },
      buttons: actionButtons(tour, 'Continuar sin cambiar')
    },
    {
      id: 'structure',
      title: '3. Nombre de estructura',
      text: 'Selecciona la estructura correspondiente. Si es VENTA, luego alimenta Registro de Clientes. Si es COMPRA, luego alimenta Registro de Proveedores.',
      attachTo: { element: '[data-tour="structure-select"]', on: 'bottom' },
      advanceOn: { selector: '[data-tour="structure-select"]', event: 'change' },
      buttons: actionButtons(tour, 'Continuar sin cambiar')
    },
    {
      id: 'date-filters',
      title: '4. Filtro por fechas',
      text: 'Fecha Desde y Fecha Hasta limitan los documentos por periodo. El boton Limpiar fechas elimina ese filtro para volver a revisar todos los documentos.',
      attachTo: { element: '[data-tour="date-from-input"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'clear-dates',
      title: 'Limpiar fechas',
      text: 'Presiona este boton cuando quieras quitar el rango de fechas. No borra los JSON ni la tabla; solo elimina el filtro de periodo.',
      attachTo: { element: '[data-tour="clear-dates-button"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'load-json',
      title: '5. Cargar archivos JSON',
      text: 'Presiona Cargar JSON para leer los documentos. El sistema extrae tipo DTE, fecha, numero de control, codigo de generacion, sello, emisor, receptor, estado, tipo de item y totales.',
      attachTo: { element: '[data-tour="load-json-button"]', on: 'bottom' },
      advanceOn: { selector: '[data-tour="load-json-button"]', event: 'click' },
      buttons: actionButtons(tour, 'Ya tengo datos')
    },
    {
      id: 'status-metrics',
      title: 'Resultados de carga',
      text: 'Aqui veras cuantos registros estan visibles, cargados, no cargados y cuantas columnas tiene la tabla. Durante cargas grandes tambien veras el avance.',
      attachTo: { element: '[data-tour="status-metrics"]', on: 'top' },
      beforeShowPromise: waitForRender,
      buttons: tourButtons(tour)
    },
    {
      id: 'dte-summary',
      title: 'Contadores de DTE',
      text: 'Estos chips resumen los DTE encontrados por tipo y separan duplicados, invalidados y rechazados. Sirven para detectar problemas antes de generar libros o anexos.',
      attachTo: { element: '[data-tour="dte-summary"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'mass-query',
      title: '6. Consulta masiva Hacienda',
      text: 'Este boton consulta varios DTE contra Hacienda. Usalo con documentos cargados para actualizar estados reales como aceptado, rechazado, invalidado o sin informacion.',
      attachTo: { element: '[data-tour="mass-query-button"]', on: 'top' },
      buttons: tourButtons(tour)
    },
    {
      id: 'fill-stamps',
      title: '7. Agregar sello de recepcion',
      text: 'Despues de consultar Hacienda, este boton completa los sellos encontrados. El sello ayuda a identificar y comprobar el procesamiento del DTE.',
      attachTo: { element: '[data-tour="fill-stamps-button"]', on: 'top' },
      buttons: tourButtons(tour)
    },
    {
      id: 'select-row-for-single-query',
      title: '8. Seleccionar un registro',
      text: 'Haz clic sobre una fila de la tabla para seleccionarla. La guia avanzara despues del clic y luego podras usar Consulta individual Hacienda.',
      attachTo: { element: '[data-tour="home-data-table"]', on: 'top' },
      advanceOn: { selector: '[data-tour="home-data-table"]', event: 'click' },
      buttons: actionButtons(tour, 'Ya seleccione una fila')
    },
    {
      id: 'single-query',
      title: 'Consulta individual Hacienda',
      text: 'Ahora usa este boton para consultar solo el registro seleccionado. Sirve para verificar un DTE especifico, actualizar su estado o revisar un documento que no obtuvo informacion.',
      attachTo: { element: '[data-tour="single-query-button"]', on: 'top' },
      buttons: tourButtons(tour)
    },
    {
      id: 'home-buttons',
      title: '9. Botones de Inicio',
      text: 'Exportar Excel genera respaldo; Seleccionar archivos permite elegir JSON puntuales; Cargar JSON procesa datos; Limpiar borra la tabla despues de confirmar.',
      attachTo: { element: '[data-tour="home-actions"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'clear-home',
      title: 'Limpiar y volver a cargar',
      text: 'Este boton limpia la tabla de Inicio. Si lo usas en una demostracion, confirma el mensaje y luego vuelve a presionar Cargar JSON para continuar trabajando.',
      attachTo: { element: '[data-tour="clear-home-button"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'registers-action',
      title: '10. Ir a Registros',
      text: 'Haz clic en REGISTROS. Recuerda la regla: VENTA va a Clientes y COMPRA va a Proveedores.',
      attachTo: { element: '[data-tour="nav-registros"]', on: 'bottom' },
      advanceOn: { selector: '[data-tour="nav-registros"]', event: 'click' },
      buttons: actionButtons(tour)
    },
    {
      id: 'register-overview',
      title: 'Registros auxiliares',
      text: 'En este modulo se administran clientes. Estos catalogos completan informacion en Libros de IVA y anexos.',
      attachTo: { element: '[data-tour="register-toolbar"]', on: 'bottom' },
      beforeShowPromise: waitForRender,
      buttons: tourButtons(tour)
    },
    {
      id: 'register-load',
      title: 'Cargar registro',
      text: 'CARGAR alimenta clientes o proveedores desde los documentos procesados. Si estas en una estructura de venta usa Clientes; si es compra usa Proveedores.',
      attachTo: { element: '[data-tour="register-load-button"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'register-buttons',
      title: 'Botones del registro',
      text: 'Agregar crea un registro manual. Editar habilita cambios. Limpiar todo borra el catalogo con confirmacion. Plantilla, exportar e importar Excel ayudan a trabajar masivamente.',
      attachTo: { element: '[data-tour="register-add-button"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'providers',
      title: 'Registro de Proveedores',
      text: 'Ahora entraremos a proveedores para ver el mismo flujo aplicado a compras: NRC, NIT, DUI, proveedor, tipo de operacion, clasificacion, sector y costo/gasto.',
      beforeShowPromise: navigateTo(onNavigate, 'registers-providers'),
      attachTo: { element: '[data-tour="register-toolbar"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'iva-action',
      title: '13. Ir a Libros de IVA',
      text: 'Haz clic en LIBROS DE IVA. Los libros toman datos desde Inicio y los organizan fiscalmente.',
      attachTo: { element: '[data-tour="nav-libros-iva"]', on: 'bottom' },
      advanceOn: { selector: '[data-tour="nav-libros-iva"]', event: 'click' },
      buttons: actionButtons(tour)
    },
    {
      id: 'purchases-book',
      title: '14. Libro de Compras',
      text: 'Este libro organiza compras: proveedor, NRC/NIT, compras exentas, gravadas, IVA, retenciones, percepciones y datos de renta.',
      attachTo: { element: '[data-tour="iva-book-view"]', on: 'top' },
      beforeShowPromise: waitForRender,
      buttons: tourButtons(tour)
    },
    {
      id: 'book-toolbar',
      title: 'Acciones del libro',
      text: 'Registros Proveedores abre el catalogo relacionado. Cargar Datos trae informacion desde Inicio. Exportar a Excel genera respaldo. Limpiar Tabla borra el libro con confirmacion.',
      attachTo: { element: '[data-tour="iva-book-toolbar"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'book-load-action',
      title: 'Cargar Datos',
      text: 'Presiona este boton para alimentar el libro actual desde Inicio. En compras puede incluir DTE 03, 05, 14 y 09 cuando corresponda.',
      attachTo: { element: '[data-tour="iva-load-button"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'book-export-clear',
      title: 'Exportar y limpiar',
      text: 'Exportar a Excel crea el archivo del libro. Limpiar Tabla borra las filas despues de confirmar; luego puedes usar Cargar Datos otra vez.',
      attachTo: { element: '[data-tour="iva-export-button"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'ccf-book',
      title: '15. Libro de Ventas CCF',
      text: 'Ahora veremos Ventas CCF. Se usa para ventas a contribuyentes y puede recibir DTE 03, 05, 07 y 09 segun las reglas configuradas.',
      beforeShowPromise: navigateTo(onNavigate, 'iva-books-ccf-sales'),
      attachTo: { element: '[data-tour="iva-book-view"]', on: 'top' },
      buttons: tourButtons(tour)
    },
    {
      id: 'fcf-book',
      title: '16. Libro de Ventas FCF',
      text: 'Este libro se usa para consumidor final. Normalmente toma DTE 01 y DTE 11 cuando aplica, con ventas gravadas, exportaciones, total y renta.',
      beforeShowPromise: navigateTo(onNavigate, 'iva-books-fcf-sales'),
      attachTo: { element: '[data-tour="iva-book-view"]', on: 'top' },
      buttons: tourButtons(tour)
    },
    {
      id: 'duplicates',
      title: '17. Duplicados, rechazados e invalidados',
      text: 'Antes de anexos revisa estos contadores. Los duplicados no deben duplicarse en libros/anexos; rechazados e invalidados se excluyen cuando la regla lo indica.',
      attachTo: { element: '[data-tour="iva-book-toolbar"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'anexos-action',
      title: '18. Ir a Anexos',
      text: 'Haz clic en ANEXOS. Los anexos toman informacion de los Libros de IVA y la preparan para archivos fiscales CSV.',
      attachTo: { element: '[data-tour="nav-anexos"]', on: 'bottom' },
      advanceOn: { selector: '[data-tour="nav-anexos"]', event: 'click' },
      buttons: actionButtons(tour)
    },
    {
      id: 'anexo-ccf',
      title: '19. Anexo Venta CCF',
      text: 'Este anexo se alimenta desde el Libro de Ventas CCF. Revisa fecha, clase, tipo, resolucion, cliente, ventas, debito fiscal, renta y numero de anexo.',
      attachTo: { element: '[data-tour="anexos-view"]', on: 'top' },
      beforeShowPromise: waitForRender,
      buttons: tourButtons(tour)
    },
    {
      id: 'anexo-load',
      title: 'Cargar datos del anexo',
      text: 'Cargar Datos trae las filas correspondientes desde los libros. El contador muestra cuantos item(s) quedaron cargados.',
      attachTo: { element: '[data-tour="anexo-load-button"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'anexo-csv',
      title: 'Generar CSV',
      text: 'Generar CSV crea el archivo fiscal del anexo. El sistema lo genera respetando la estructura del Ministerio de Hacienda.',
      attachTo: { element: '[data-tour="anexo-csv-button"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'anexo-clear',
      title: 'Borrar datos del anexo',
      text: 'Borrar Datos limpia el anexo. Despues de confirmar, puedes volver a usar Cargar Datos para continuar la demostracion.',
      attachTo: { element: '[data-tour="anexo-clear-button"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'anexo-fcf',
      title: '20. Anexo Venta FCF',
      text: 'Ahora se muestra Venta FCF. Este anexo toma datos del Libro de Ventas FCF y separa ventas locales, exportaciones, renta y numero de anexo.',
      beforeShowPromise: navigateTo(onNavigate, 'anexos-sales-fcf'),
      attachTo: { element: '[data-tour="anexos-view"]', on: 'top' },
      buttons: tourButtons(tour)
    },
    {
      id: 'anexo-purchases',
      title: '21. Anexo Compras',
      text: 'El Anexo Compras toma datos del Libro de Compras: proveedor, documento, compras exentas/no sujetas, gravadas, credito fiscal y campos de renta.',
      beforeShowPromise: navigateTo(onNavigate, 'anexos-purchases'),
      attachTo: { element: '[data-tour="anexos-view"]', on: 'top' },
      buttons: tourButtons(tour)
    },
    {
      id: 'anexo-rest',
      title: '22. Resto de anexos',
      text: 'Repite el mismo procedimiento en FSE, Anticipo IVA 2%, Retencion IVA 1%, Percepcion IVA 1% y Documentos Invalidados: cargar, revisar, editar, generar CSV y borrar si necesitas reiniciar.',
      attachTo: { element: '[data-tour="anexos-toolbar"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'final-flow',
      title: '23. Flujo completo',
      text: 'JSON -> Inicio -> Consulta Hacienda -> Registros -> Libros de IVA -> Anexos -> Excel o CSV. Venta va a Clientes y Libros/Anexos de venta; Compra va a Proveedores y Libro/Anexo de compras.',
      attachTo: { element: '[data-tour="anexos-toolbar"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'rules',
      title: '24. Reglas de uso',
      text: 'Cada boton indica una accion concreta. Los botones de limpiar, borrar o limpiar tabla muestran confirmacion y despues puedes volver a cargar datos. No mezcles estructuras de venta con proveedores ni compras con clientes.',
      attachTo: { element: '[data-tour="anexos-toolbar"]', on: 'bottom' },
      buttons: tourButtons(tour)
    },
    {
      id: 'done',
      title: '25. Resumen final',
      text: 'Inicio procesa DTE. Registros mantiene clientes/proveedores. Libros de IVA organiza documentos. Anexos convierte libros en estructuras CSV. Exportaciones crea archivos para respaldo o presentacion.',
      attachTo: { element: '[data-tour="anexos-toolbar"]', on: 'bottom' },
      buttons: tourButtons(tour, true)
    }
  ];
}

export function AppTour({ onNavigate, runId }) {
  const tourRef = useRef(null);

  useEffect(() => {
    if (!runId) return undefined;

    const tour = new Shepherd.Tour({
      defaultStepOptions: {
        cancelIcon: { enabled: true },
        canClickTarget: true,
        classes: 'dteShepherdStep',
        modalOverlayOpeningPadding: 8,
        modalOverlayOpeningRadius: 4,
        scrollTo: { behavior: 'smooth', block: 'center' }
      },
      useModalOverlay: true
    });

    tourRef.current = tour;
    buildTourSteps(tour, onNavigate).forEach((step) => tour.addStep(step));
    tour.start();

    return () => {
      if (tour.isActive()) tour.cancel();
      tourRef.current = null;
    };
  }, [onNavigate, runId]);

  return null;
}
