# Lector DTE Hacienda

Aplicacion de escritorio creada con React, Tailwind CSS y Electron para cargar, leer y exportar archivos DTE de El Salvador en formato JSON o CSV.

El programa permite seleccionar una carpeta o archivos individuales, aplicar estructuras por tipo de documento, visualizar los datos en una tabla optimizada, consultar informacion publica de Hacienda y exportar los resultados a Excel con formato contable.

## Funcionalidades

- Carga de archivos JSON y CSV desde carpetas locales.
- Filtro por tipo de DTE y estructura configurada.
- Tabla virtualizada para manejar grandes volumenes de datos.
- Deteccion visual de documentos duplicados.
- Consulta masiva e individual a la pagina publica de Hacienda.
- Exportacion a Excel con encabezados, filtros, totales, colores y formato contable.
- Soporte para estructuras DTE como CCF, FCF, Nota de Credito, Retencion, Exportacion y Sujeto Excluido.

## Tecnologias

- React
- Tailwind CSS
- Electron
- Vite
- ExcelJS

## Comandos

```bash
npm install
npm run dev
npm run build
```

## Configuracion local

Copie `.env.example` como `.env` y cambie la clave local:

```bash
VITE_REGISTER_CLEAR_KEY=su-clave-local
```

El archivo `.env` no se sube a GitHub.

## Objetivo

Facilitar la lectura, validacion, consulta y exportacion de documentos tributarios electronicos de El Salvador desde archivos locales hacia reportes de Excel listos para revision contable.
