# Trading Journal

## Descripción

Aplicación web personal para el registro y análisis de operaciones de trading. Permite llevar un diario de trades con métricas de rendimiento, gráficos y filtros por período o activo. Corre en `localhost` y utiliza MySQL como base de datos local.

---

## Stack tecnológico

| Capa | Tecnología | Razón |
|------|-----------|-------|
| **Frontend** | Vite + React + TypeScript | Componentes reactivos, ideal para formularios y dashboards |
| **Estilos** | Tailwind CSS | Rápido y sencillo, sin configuración extra |
| **Animaciones** | GSAP | Transiciones suaves en la UI |
| **Routing** | React Router v7 | Navegación entre vistas |
| **Estado global** | React Context API + useReducer | Nativo de React, suficiente para esta escala |
| **Backend** | Node.js + Express (TypeScript) | JS/TS en todo el stack, sencillo y eficiente |
| **Driver MySQL** | mysql2 | Conexión directa a MySQL sin ORM |
| **Base de datos** | MySQL (local) | Gestionada manualmente con MySQL Workbench |
| **Gráficos** | Recharts | Basado en React, más fácil de integrar que Chart.js/D3 |
| **Exportación** | xlsx / csv-writer | Exportar datos a Excel/CSV |

---

## Funcionalidades

### 1. Gestión de cuentas
- Crear y editar cuentas/brokers (XTB, Interactive Brokers, etc.)
- Ver balance actual calculado automáticamente: `saldo_inicial + SUM(pnl de trades cerrados)`
- Moneda configurable por cuenta (USD, EUR, etc.)

### 2. Catálogo de activos
- Crear y editar activos con su símbolo, nombre, tipo y `pip_value`
- Tipos soportados: `forex`, `index`, `stocks`, `futures`, `commodities`
- El `pip_value` se usa para calcular ganancias automáticamente

### 3. Catálogo de estrategias
- Crear y editar estrategias con nombre y descripción
- Ejemplos: Breakout, Pullback, Scalping, Swing, Range

### 4. Registro de trades
- Formulario para registrar operaciones con todos los campos necesarios
- Soporte para trades **abiertos** (sin precio de salida) y **cerrados**
- Al cerrar un trade se calcula automáticamente `gross_pnl` y `pnl` neto
- Campo de notas personales por operación

### 5. Listado de trades
- Tabla paginada con todos los trades
- Filtros por: cuenta, activo, estrategia, dirección, estado y período (día / semana / mes / año)
- Búsqueda y ordenamiento por columnas

### 6. Dashboard de métricas
- **Win Rate**: porcentaje de trades ganadores
- **Ratio Riesgo/Beneficio**: planificado (SL/TP) y real (avg_win / avg_loss)
- **Drawdown máximo**: caída máxima desde un pico en la curva de equity
- **Ganancia promedio vs Pérdida promedio**
- **Profit Factor**: total_ganancias / total_pérdidas
- **Balance actual** por cuenta con curva de equity acumulada

### 7. Reportes y gráficos
- Curva de equity acumulada (chart de línea)
- Distribución de resultados por activo (barras)
- Rendimiento por estrategia (barras o radar)
- Filtros por período: día, semana, mes, año

### 8. Exportación de datos
- Exportar trades a **CSV**
- Exportar trades a **Excel (.xlsx)**
- Filtros aplicables antes de exportar

---

## Base de datos

El esquema completo está en [db.sql](db.sql). Motor: **MySQL**.

### Diagrama de relaciones

```
accounts   (1) ──→ (N) trades
assets     (1) ──→ (N) trades
strategies (1) ──→ (N) trades
```

---

### Tabla: `accounts`

Balance calculado dinámicamente: `initial_balance + SUM(trades.pnl WHERE status = 'closed')`.

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT, PK | Autoincremental |
| name | VARCHAR(100) | Nombre de la cuenta (ej: Cuenta XTB) |
| currency | VARCHAR(10) | Moneda de la cuenta (default: USD) |
| initial_balance | DECIMAL(15,2) | Saldo inicial |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

---

### Tabla: `assets`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT, PK | Autoincremental |
| symbol | VARCHAR(20), UNIQUE | Símbolo del activo (XAUUSD, US30, AAPL) |
| name | VARCHAR(100) | Nombre descriptivo |
| type | ENUM | `forex`, `index`, `stocks`, `futures`, `crypto`, `commodities` |
| pip_value | DECIMAL(10,5) | Valor del pip/punto para el cálculo de PnL |
| created_at | TIMESTAMP | Fecha de creación |

**Ejemplos pre-cargados:**

| Symbol | Type | pip_value |
|--------|------|-----------|
| XAUUSD | forex | 1.00 |
| US30 | index | 0.05 |
| US100 | index | 0.20 |

---

### Tabla: `strategies`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT, PK | Autoincremental |
| name | VARCHAR(50), UNIQUE | Nombre de la estrategia |
| description | TEXT | Descripción opcional |
| created_at | TIMESTAMP | Fecha de creación |

---

### Tabla: `trades`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INT, PK | Autoincremental |
| account_id | INT, FK | → accounts.id |
| asset_id | INT, FK | → assets.id |
| strategy_id | INT, FK (nullable) | → strategies.id |
| direction | ENUM | `long` (compra) o `short` (venta) |
| entry_date | DATETIME | Fecha y hora de entrada |
| exit_date | DATETIME (nullable) | Fecha y hora de salida |
| entry_price | DECIMAL(15,5) | Precio de entrada |
| exit_price | DECIMAL(15,5) (nullable) | Precio de salida |
| position_size | DECIMAL(10,2) | Lotaje / contratos / acciones |
| stop_loss | DECIMAL(15,5) (nullable) | Precio de stop loss planificado |
| take_profit | DECIMAL(15,5) (nullable) | Precio de take profit planificado |
| gross_pnl | DECIMAL(15,2) (nullable) | Beneficio bruto calculado |
| swap | DECIMAL(10,2) | Costo de swap overnight (default: 0) |
| commission | DECIMAL(10,2) | Comisiones del broker (default: 0) |
| rollover | DECIMAL(10,2) | Costo de rollover en futuros (default: 0) |
| pnl | DECIMAL(15,2) (nullable) | Beneficio neto (se llena al cerrar) |
| status | ENUM | `open` o `closed` (default: open) |
| comment | TEXT (nullable) | Notas personales del trade |
| created_at | TIMESTAMP | Fecha de creación |
| updated_at | TIMESTAMP | Última actualización |

---

### Cálculo del PnL

**Beneficio bruto:**

```
Long  (compra): gross_pnl = (exit_price - entry_price) * (position_size * 100) * pip_value
Short (venta):  gross_pnl = (entry_price - exit_price) * (position_size * 100) * pip_value
```

**Beneficio neto:**

```
pnl = gross_pnl - swap - commission - rollover
```

---

### Vistas SQL incluidas

- **`account_balances`**: balance actual, total trades, trades ganadores/perdedores por cuenta.
- **`trade_metrics`**: win rate, avg win/loss, ratio, profit factor por cuenta.

---

### Cálculo de métricas

| Métrica | Fórmula |
|---------|---------|
| Win Rate | `COUNT(pnl > 0) / COUNT(status = 'closed') * 100` |
| Ratio R/B planificado | `(take_profit - entry_price) / (entry_price - stop_loss)` |
| Ratio R/B real | `AVG(pnl WHERE pnl > 0) / ABS(AVG(pnl WHERE pnl < 0))` |
| Drawdown máximo | Curva acumulada de `pnl` ordenada por `exit_date`, caída máxima desde pico |
| Profit Factor | `SUM(pnl > 0) / ABS(SUM(pnl < 0))` |
| Ganancia prom. | `AVG(pnl) WHERE pnl > 0` |
| Pérdida prom. | `AVG(pnl) WHERE pnl < 0` |