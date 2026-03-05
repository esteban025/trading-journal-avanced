-- ============================================
-- Trading Journal Database Schema (MySQL)
-- ============================================
-- Esquema para registro personal de trades
-- Incluye: cuentas, activos, estrategias y operaciones
-- ============================================

-- Crear base de datos (opcional, descomentar si necesitas)
DROP DATABASE IF EXISTS trading_journal;
CREATE DATABASE trading_journal CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE trading_journal;

-- ============================================
-- TABLA: accounts (Cuentas/Brokers)
-- ============================================
-- Registra las diferentes cuentas donde operas
-- El balance actual se calcula: initial_balance + SUM(trades.pnl)

CREATE TABLE IF NOT EXISTS accounts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL COMMENT 'Nombre de la cuenta (ej: Cuenta XTB, Interactive Brokers)',
    currency VARCHAR(10) NOT NULL DEFAULT 'USD' COMMENT 'Moneda de la cuenta',
    initial_balance DECIMAL(15, 2) NOT NULL DEFAULT 0.00 COMMENT 'Saldo inicial de la cuenta',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: assets (Activos)
-- ============================================
-- Catálogo de activos que operas (XAUUSD, US30, AAPL, etc.)
-- pip_value se usa para calcular ganancias automáticamente

CREATE TABLE IF NOT EXISTS assets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE COMMENT 'Símbolo del activo (XAUUSD, US30, AAPL)',
    name VARCHAR(100) COMMENT 'Nombre descriptivo (Oro/Dólar, Dow Jones, Apple Inc.)',
    type ENUM('forex', 'index', 'stocks', 'futures', 'crypto', 'commodities') NOT NULL COMMENT 'Tipo de mercado',
    pip_value DECIMAL(10, 5) COMMENT 'Valor del pip/punto para cálculo de ganancias',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_assets_type (type),
    INDEX idx_assets_symbol (symbol)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: strategies (Estrategias)
-- ============================================
-- Catálogo de estrategias de trading

CREATE TABLE IF NOT EXISTS strategies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nombre de la estrategia (Breakout, Pullback, Scalping)',
    description TEXT COMMENT 'Descripción detallada de la estrategia',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- TABLA: trades (Operaciones)
-- ============================================
-- Tabla principal de registro de trades
-- gross_pnl = beneficio bruto calculado con la fórmula
-- pnl = gross_pnl - swap - commission - rollover (beneficio neto)

CREATE TABLE IF NOT EXISTS trades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    account_id INT NOT NULL COMMENT 'Cuenta donde se realizó el trade',
    asset_id INT NOT NULL COMMENT 'Activo operado',
    strategy_id INT COMMENT 'Estrategia utilizada (opcional)',
    
    -- Datos de la operación
    direction ENUM('long', 'short') NOT NULL COMMENT 'Dirección: compra (long) o venta (short)',
    entry_date DATETIME NOT NULL COMMENT 'Fecha y hora de entrada',
    exit_date DATETIME COMMENT 'Fecha y hora de salida (NULL si está abierto)',
    entry_price DECIMAL(15, 5) NOT NULL COMMENT 'Precio de entrada',
    exit_price DECIMAL(15, 5) COMMENT 'Precio de salida (NULL si está abierto)',
    position_size DECIMAL(10, 2) NOT NULL COMMENT 'Tamaño de posición (lotaje/contratos/acciones)',
    
    -- Gestión de riesgo
    stop_loss DECIMAL(15, 5) COMMENT 'Precio de stop loss planificado',
    take_profit DECIMAL(15, 5) COMMENT 'Precio de take profit planificado',
    
    -- Costos y ganancias
    -- Fórmula gross_pnl:
    --   Long:  (exit_price - entry_price) * (position_size * 100) * pip_value
    --   Short: (entry_price - exit_price) * (position_size * 100) * pip_value
    gross_pnl DECIMAL(15, 2) COMMENT 'Beneficio bruto del trade',
    swap DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Costo de swap (overnight)',
    commission DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Comisiones del broker',
    rollover DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Costo de rollover (futuros)',
    pnl DECIMAL(15, 2) COMMENT 'Beneficio neto = gross_pnl - swap - commission - rollover',
    
    -- Estado y notas
    status ENUM('open', 'closed') NOT NULL DEFAULT 'open' COMMENT 'Estado del trade',
    comment TEXT COMMENT 'Notas personales sobre el trade',
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign Keys
    CONSTRAINT fk_trades_account FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_trades_asset FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_trades_strategy FOREIGN KEY (strategy_id) REFERENCES strategies(id) ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- Índices para consultas frecuentes
    INDEX idx_trades_account (account_id),
    INDEX idx_trades_asset (asset_id),
    INDEX idx_trades_strategy (strategy_id),
    INDEX idx_trades_status (status),
    INDEX idx_trades_entry_date (entry_date),
    INDEX idx_trades_exit_date (exit_date),
    INDEX idx_trades_direction (direction)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- VISTA: account_balances
-- ============================================
-- Calcula el balance actual de cada cuenta
-- balance = initial_balance + SUM(pnl de trades cerrados)

CREATE OR REPLACE VIEW account_balances AS
SELECT 
    a.id,
    a.name,
    a.currency,
    a.initial_balance,
    COALESCE(SUM(t.pnl), 0) AS total_pnl,
    (a.initial_balance + COALESCE(SUM(t.pnl), 0)) AS current_balance,
    COUNT(CASE WHEN t.status = 'closed' THEN 1 END) AS total_trades,
    COUNT(CASE WHEN t.pnl > 0 THEN 1 END) AS winning_trades,
    COUNT(CASE WHEN t.pnl < 0 THEN 1 END) AS losing_trades
FROM accounts a
LEFT JOIN trades t ON a.id = t.account_id AND t.status = 'closed'
GROUP BY a.id, a.name, a.currency, a.initial_balance;

-- ============================================
-- VISTA: trade_metrics
-- ============================================
-- Métricas de rendimiento por cuenta

CREATE OR REPLACE VIEW trade_metrics AS
SELECT 
    a.id AS account_id,
    a.name AS account_name,
    COUNT(CASE WHEN t.status = 'closed' THEN 1 END) AS total_closed_trades,
    
    -- Win Rate
    ROUND(
        COUNT(CASE WHEN t.pnl > 0 AND t.status = 'closed' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(CASE WHEN t.status = 'closed' THEN 1 END), 0), 
    2) AS win_rate,
    
    -- Promedio de ganancias vs pérdidas
    ROUND(AVG(CASE WHEN t.pnl > 0 THEN t.pnl END), 2) AS avg_win,
    ROUND(AVG(CASE WHEN t.pnl < 0 THEN t.pnl END), 2) AS avg_loss,
    
    -- Ratio ganancia/pérdida promedio
    ROUND(
        ABS(AVG(CASE WHEN t.pnl > 0 THEN t.pnl END)) / 
        NULLIF(ABS(AVG(CASE WHEN t.pnl < 0 THEN t.pnl END)), 0),
    2) AS avg_win_loss_ratio,
    
    -- Totales
    ROUND(SUM(CASE WHEN t.pnl > 0 THEN t.pnl ELSE 0 END), 2) AS total_wins,
    ROUND(SUM(CASE WHEN t.pnl < 0 THEN t.pnl ELSE 0 END), 2) AS total_losses,
    ROUND(SUM(t.pnl), 2) AS net_pnl,
    
    -- Profit Factor
    ROUND(
        ABS(SUM(CASE WHEN t.pnl > 0 THEN t.pnl ELSE 0 END)) / 
        NULLIF(ABS(SUM(CASE WHEN t.pnl < 0 THEN t.pnl ELSE 0 END)), 0),
    2) AS profit_factor

FROM accounts a
LEFT JOIN trades t ON a.id = t.account_id
GROUP BY a.id, a.name;

-- ============================================
-- DATOS DE EJEMPLO: Assets
-- ============================================
-- Activos mencionados con sus pip_value

INSERT INTO assets (symbol, name, type, pip_value) VALUES
('XAUUSD', 'Oro/Dólar', 'forex', 1.00),
('US30', 'Dow Jones 30', 'index', 0.05),
('US100', 'Nasdaq 100', 'index', 0.20);

-- ============================================
-- DATOS DE EJEMPLO: Strategies
-- ============================================

INSERT INTO strategies (name, description) VALUES
('Breakout', 'Entrada cuando el precio rompe un nivel clave de soporte/resistencia'),
('Pullback', 'Entrada en retroceso tras un movimiento fuerte'),
('Scalping', 'Operaciones rápidas buscando pequeños movimientos'),
('Swing', 'Operaciones de varios días siguiendo la tendencia'),
('Range', 'Operaciones dentro de un rango definido de precios');

-- ============================================
-- EJEMPLO DE USO: Calcular PnL al cerrar trade
-- ============================================
-- Este es un ejemplo de cómo calcular el PnL al cerrar un trade
-- usando la fórmula que mencionaste

/*
-- Para un trade LONG (compra):
UPDATE trades t
JOIN assets a ON t.asset_id = a.id
SET 
    t.exit_price = 2050.50,
    t.exit_date = NOW(),
    t.gross_pnl = (2050.50 - t.entry_price) * (t.position_size * 100) * a.pip_value,
    t.pnl = ((2050.50 - t.entry_price) * (t.position_size * 100) * a.pip_value) - t.swap - t.commission - t.rollover,
    t.status = 'closed'
WHERE t.id = 1 AND t.direction = 'long';

-- Para un trade SHORT (venta):
UPDATE trades t
JOIN assets a ON t.asset_id = a.id
SET 
    t.exit_price = 2030.00,
    t.exit_date = NOW(),
    t.gross_pnl = (t.entry_price - 2030.00) * (t.position_size * 100) * a.pip_value,
    t.pnl = ((t.entry_price - 2030.00) * (t.position_size * 100) * a.pip_value) - t.swap - t.commission - t.rollover,
    t.status = 'closed'
WHERE t.id = 1 AND t.direction = 'short';
*/

-- ============================================
-- CONSULTAS ÚTILES
-- ============================================

/*
-- Ver balance actual de todas las cuentas:
SELECT * FROM account_balances;

-- Ver métricas de rendimiento:
SELECT * FROM trade_metrics;

-- Trades por activo:
SELECT 
    a.symbol,
    COUNT(*) AS total_trades,
    SUM(t.pnl) AS total_pnl,
    ROUND(AVG(t.pnl), 2) AS avg_pnl
FROM trades t
JOIN assets a ON t.asset_id = a.id
WHERE t.status = 'closed'
GROUP BY a.symbol;

-- Trades por estrategia:
SELECT 
    s.name AS strategy,
    COUNT(*) AS total_trades,
    ROUND(COUNT(CASE WHEN t.pnl > 0 THEN 1 END) * 100.0 / COUNT(*), 2) AS win_rate,
    SUM(t.pnl) AS total_pnl
FROM trades t
JOIN strategies s ON t.strategy_id = s.id
WHERE t.status = 'closed'
GROUP BY s.name;

-- Trades filtrados por período (último mes):
SELECT * FROM trades
WHERE entry_date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
AND status = 'closed'
ORDER BY entry_date DESC;
*/
