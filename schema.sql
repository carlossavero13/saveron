-- Copia y pega esto en el SQL Editor de Supabase para crear tus tablas

-- 1. Tabla de Tarjetas/Cuentas
CREATE TABLE IF NOT EXISTS accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- Ej: 'VISA BCP Latam Pass'
  type TEXT NOT NULL CHECK (type IN ('debito', 'credito')),
  balance DECIMAL(12,2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tabla de Transacciones
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES accounts(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('in', 'out')), -- 'in' para ingresos, 'out' para gastos
  description TEXT NOT NULL, -- El comercio o detalle
  category TEXT DEFAULT 'General',
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Habilitar Tiempo Real (WebSockets) para que la app se actualice sola
alter publication supabase_realtime add table transactions;
alter publication supabase_realtime add table accounts;

-- Insertar tus tarjetas iniciales
INSERT INTO accounts (name, type, balance) VALUES 
('Cuenta Sueldo BCP', 'debito', 4250.00),
('American Express', 'credito', -850.00),
('VISA BCP Latam Pass', 'credito', -1200.00),
('Sip! Crédito', 'credito', -150.00),
('Tarjeta Ripley', 'credito', -420.00);
