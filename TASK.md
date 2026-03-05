# Tareas de implementación — Trading Journal

## Fase 1: Configuración del proyecto

### Base de datos
- [✔] Ejecutar `db.sql` en MySQL Workbench para crear la base de datos `trading_journal`
- [✔] Verificar que las 4 tablas (`accounts`, `assets`, `strategies`, `trades`) se crearon correctamente
- [✔] Verificar que las vistas (`account_balances`, `trade_metrics`) se crearon correctamente
- [✔] Confirmar que los datos de ejemplo de assets y strategies se insertaron

### Backend (Node.js + Express + TypeScript)
- [✔] Crear carpeta `server/` e inicializar proyecto: `npm init -y`
- [✔] Instalar dependencias: `express`, `mysql2`, `cors`, `dotenv`
- [✔] Instalar dependencias de desarrollo: `typescript`, `ts-node`, `nodemon`, `@types/express`, `@types/cors`, `@types/node`
- [✔] Configurar `tsconfig.json`
- [✔] Configurar `nodemon.json` para desarrollo con hot-reload
- [✔] Crear archivo `.env` con las variables: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`
- [✔] Crear `src/db.ts` con el pool de conexión a MySQL usando `mysql2`
- [✔] Crear `src/index.ts` con la configuración base de Express (cors, json, rutas)
- [✔] Verificar conexión a la base de datos al iniciar el servidor

### Frontend (Vite + React + TypeScript)
- [✔] Crear carpeta `client/` e inicializar proyecto: `npm create vite@latest`
- [✔] Instalar dependencias: `react-router-dom`, `recharts`, `gsap`, `xlsx`
- [✔] Instalar dependencias de desarrollo: `tailwindcss`, `@types/node`
- [✔] Configurar Tailwind CSS (`tailwind.config.js` + `postcss.config.js`)
- [✔] Configurar proxy en `vite.config.ts` apuntando al backend (`localhost:3000`)
- [✔] Limpiar archivos por defecto de Vite (App.tsx, index.css)
- [✔] Crear estructura de carpetas: `components/`, `pages/`, `context/`, `hooks/`, `services/`, `types/`

---

## Fase 2: Backend — Tipos y estructura de rutas

- [✔] Crear `src/types/index.ts` con las interfaces TypeScript para `Account`, `Asset`, `Strategy`, `Trade`
- [✔] Crear estructura de carpetas: `src/routes/`, `src/controllers/`
- [✔] Crear `src/routes/accounts.ts` con el router de Express
- [✔] Crear `src/routes/assets.ts`
- [✔] Crear `src/routes/strategies.ts`
- [✔] Crear `src/routes/trades.ts`
- [✔] Registrar todas las rutas en `src/index.ts` bajo el prefijo `/api`

---

## Fase 3: Backend — Endpoints de Cuentas (`/api/accounts`)

- [✔] `GET /api/accounts` — Listar todas las cuentas con balance calculado (usando vista `account_balances`)
- [✔] `GET /api/accounts/:id` — Obtener una cuenta por ID
- [✔] `POST /api/accounts` — Crear nueva cuenta (validar `name`, `initial_balance`)
- [✔] `PUT /api/accounts/:id` — Editar cuenta
- [✔] `DELETE /api/accounts/:id` — Eliminar cuenta (solo si no tiene trades asociados)

---

## Fase 4: Backend — Endpoints de Activos (`/api/assets`)

- [✔] `GET /api/assets` — Listar todos los activos
- [✔] `GET /api/assets/:id` — Obtener un activo por ID
- [✔] `POST /api/assets` — Crear nuevo activo (validar `symbol` único, `type`, `pip_value`)
- [✔] `PUT /api/assets/:id` — Editar activo
- [✔] `DELETE /api/assets/:id` — Eliminar activo (solo si no tiene trades asociados)

---

## Fase 5: Backend — Endpoints de Estrategias (`/api/strategies`)

- [✔] `GET /api/strategies` — Listar todas las estrategias
- [✔] `GET /api/strategies/:id` — Obtener una estrategia por ID
- [✔] `POST /api/strategies` — Crear nueva estrategia (validar `name` único)
- [✔] `PUT /api/strategies/:id` — Editar estrategia
- [✔] `DELETE /api/strategies/:id` — Eliminar estrategia (solo si no tiene trades asociados)

---

## Fase 6: Backend — Endpoints de Trades (`/api/trades`)

- [✔] `GET /api/trades` — Listar trades con filtros opcionales por query params:
  - `account_id`, `asset_id`, `strategy_id`, `direction`, `status`
  - `period`: `day`, `week`, `month`, `year`
  - `page` y `limit` para paginación
- [✔] `GET /api/trades/:id` — Obtener un trade por ID (con JOIN a assets, strategies, accounts)
- [✔] `POST /api/trades` — Crear nuevo trade (status inicial: `open`)
- [✔] `PUT /api/trades/:id` — Editar trade (datos generales)
- [✔] `PUT /api/trades/:id/close` — Cerrar trade:
  - Recibe `exit_price`, `exit_date`, `swap`, `commission`, `rollover`
  - Calcula `gross_pnl` según dirección (long/short) y `pip_value` del activo
  - Calcula `pnl = gross_pnl - swap - commission - rollover`
  - Actualiza `status = 'closed'`
- [✔] `DELETE /api/trades/:id` — Eliminar trade

---

## Fase 7: Backend — Endpoints de Métricas (`/api/metrics`)

- [✔] `GET /api/metrics/summary` — Resumen general usando vista `trade_metrics` (filtrable por `account_id`)
- [✔] `GET /api/metrics/equity-curve` — Curva de equity: array de `{ exit_date, pnl_acumulado }` ordenado por fecha
- [✔] `GET /api/metrics/by-asset` — PnL, win rate y total trades agrupados por activo
- [✔] `GET /api/metrics/by-strategy` — PnL, win rate y total trades agrupados por estrategia
- [✔] Todos los endpoints aceptan filtros: `account_id`, `period`

---

## Fase 8: Backend — Exportación (`/api/export`)

- [✔] `GET /api/export/csv` — Exportar trades filtrados en formato CSV
- [✔] `GET /api/export/excel` — Exportar trades filtrados en formato `.xlsx`
- [✔] Aplicar los mismos filtros que el listado de trades

---

## Fase 9: Frontend — Layout y navegación

- [✔] Crear `AppContext` con `useReducer` para estado global: cuenta activa, filtros activos
- [✔] Crear `AppLayout.tsx` con sidebar de navegación y área de contenido
- [✔] Crear componente `Sidebar.tsx` con links a todas las secciones
- [✔] Configurar rutas en `App.tsx` con React Router:
  - `/` → Dashboard
  - `/trades` → Listado de trades
  - `/trades/new` → Nuevo trade
  - `/trades/:id` → Detalle/edición de trade
  - `/accounts` → Gestión de cuentas
  - `/assets` → Gestión de activos
  - `/strategies` → Gestión de estrategias
  - `/reports` → Reportes y gráficos
- [✔] Crear capa de servicios `services/api.ts` con fetch base hacia el backend
- [✔] Crear servicios específicos: `accountsService.ts`, `assetsService.ts`, `strategiesService.ts`, `tradesService.ts`, `metricsService.ts`

---

## Fase 10: Frontend — Gestión de Cuentas

- [✔] Crear página `AccountsPage.tsx` con listado de cuentas en tarjetas
- [✔] Mostrar por cada cuenta: nombre, moneda, balance inicial, balance actual, total trades
- [✔] Crear modal/formulario `AccountForm.tsx` para crear y editar cuentas
- [✔] Implementar botón de eliminar con confirmación
- [✔] Selector de cuenta activa en el sidebar (persiste en Context)

---

## Fase 11: Frontend — Gestión de Activos

- [✔] Crear página `AssetsPage.tsx` con tabla de activos
- [✔] Mostrar columnas: símbolo, nombre, tipo, pip_value
- [✔] Crear modal/formulario `AssetForm.tsx` para crear y editar activos
- [✔] Selector de tipo con los valores del ENUM (`forex`, `index`, `stocks`, etc.)
- [✔] Implementar botón de eliminar con confirmación

---

## Fase 12: Frontend — Gestión de Estrategias

- [✔] Crear página `StrategiesPage.tsx` con tabla de estrategias
- [✔] Crear modal/formulario `StrategyForm.tsx` para crear y editar estrategias
- [✔] Implementar botón de eliminar con confirmación

---

## Fase 13: Frontend — Registro de Trades

- [✔] Crear página `NewTradePage.tsx` con formulario completo
- [✔] Campos del formulario:
  - Cuenta (select)
  - Activo (select)
  - Estrategia (select opcional)
  - Dirección (Long / Short — toggle visual)
  - Fecha y hora de entrada
  - Precio de entrada
  - Tamaño de posición (lotaje)
  - Stop Loss (opcional)
  - Take Profit (opcional)
  - Notas/comentario (textarea)
- [✔] Validación de campos requeridos antes de enviar
- [✔] Redirigir al listado tras crear el trade

---

## Fase 14: Frontend — Listado de Trades

- [✔] Crear página `TradesPage.tsx` con tabla paginada
- [✔] Columnas: fecha entrada, activo, dirección, lotaje, precio entrada, precio salida, PnL, estado, estrategia
- [✔] Panel de filtros: cuenta, activo, estrategia, dirección, estado, período
- [✔] Ordenamiento por columnas (click en cabecera)
- [✔] Paginación con selector de registros por página
- [✔] Botones por fila: cerrar trade (si está abierto), editar, eliminar
- [✔] Botones de exportación CSV y Excel (aplican los filtros activos)

---

## Fase 15: Frontend — Cerrar Trade

- [✔] Crear modal `CloseTradeModal.tsx`
- [✔] Campos: precio de salida, fecha de salida, swap, comisiones, rollover
- [✔] Mostrar preview del PnL calculado en tiempo real antes de confirmar
- [✔] Al confirmar, llamar al endpoint `PUT /api/trades/:id/close`
- [✔] Actualizar la tabla tras el cierre

---

## Fase 16: Frontend — Dashboard de métricas

- [✔] Crear página `DashboardPage.tsx`
- [✔] Tarjetas KPI: balance actual, win rate, profit factor, ratio R/B, ganancia promedio, pérdida promedio, drawdown máximo, total trades
- [✔] Selector de período y cuenta en la parte superior
- [✔] Calcular drawdown máximo en el frontend a partir de la equity curve

---

## Fase 17: Frontend — Gráficos

- [✔] Crear página `ReportsPage.tsx`
- [✔] Gráfico de línea: curva de equity acumulada
- [✔] Gráfico de barras: PnL por activo
- [✔] Gráfico de barras: win rate y PnL por estrategia
- [✔] Tooltips informativos en todos los gráficos
- [✔] Todos los gráficos respetan filtros de período y cuenta activa

---

## Fase 18: Polish y animaciones

- [✔] Animaciones de entrada a las páginas con GSAP (fade + slide)
- [✔] Animaciones en tarjetas KPI al cargar datos
- [✔] Estados de carga (skeleton) en tablas y gráficos
- [✔] Estados vacíos cuando no hay datos
- [✔] Notificaciones de éxito/error en operaciones CRUD (toast)
- [✔] Confirmación antes de eliminar cualquier registro

---

## Fase 19: Revisión final

- [✔] Flujo completo: crear cuenta → activo → estrategia → registrar trade → cerrar trade → ver métricas
- [✔] Verificar que el balance de cuenta se calcula correctamente
- [✔] Verificar fórmulas de PnL (long y short) con valores reales
- [✔] Probar todos los filtros combinados en el listado
- [✔] Probar exportación CSV y Excel
- [✔] Verificar que no se pueden eliminar registros con dependencias