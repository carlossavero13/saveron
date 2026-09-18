export interface ParsedTransaction {
  amount: number;
  description: string;
  type: 'in' | 'out';
  currency: string;
  bank: string;
}

export function parseBankEmail(from: string, subject: string, bodyText: string): ParsedTransaction | null {
  const text = `${subject} ${bodyText}`.replace(/\n/g, ' ');

  // 1. Patrón BCP (Consumos)
  // Ej: "Realizaste un consumo de S/ 45.78 con tu Tarjeta de Crédito BCP en ARUMA LA PLANICIE."
  const bcpRegex = /consumo\s+de\s+(S\/|US\$)\s*([\d,.]+)\s+con.*?\s+en\s+(.*?)\./i;
  const bcpMatch = text.match(bcpRegex);
  
  if (bcpMatch || from.toLowerCase().includes('bcp')) {
    if (bcpMatch) {
      const currency = bcpMatch[1] === 'S/' ? 'PEN' : 'USD';
      const amount = parseFloat(bcpMatch[2].replace(/,/g, ''));
      const description = bcpMatch[3].trim();
      return { amount, description, type: 'out', currency, bank: 'BCP' };
    }
  }

  // 1.5. Patrón BCP (Operaciones / AMEX)
  // Ej: "Realizaste una operación de S/ 53.60 con tu Tarjeta..." y en la tabla "Empresa SEDA000006000039 Canal"
  const bcpOpRegex = /operaci[oó]n\s+de\s+(S\/|US\$)\s*([\d,.]+)\s+con\s+tu\s+Tarjeta/i;
  const bcpOpMatch = text.match(bcpOpRegex);
  
  if (bcpOpMatch || (from.toLowerCase().includes('bcp') && text.includes('operación'))) {
    if (bcpOpMatch) {
      const currency = bcpOpMatch[1] === 'S/' ? 'PEN' : 'USD';
      const amount = parseFloat(bcpOpMatch[2].replace(/,/g, ''));
      
      // Buscar la empresa en la tabla
      const empresaMatch = text.match(/Empresa\s+(.*?)\s+Canal/i);
      const description = empresaMatch ? empresaMatch[1].trim() : 'Operación BCP';

      return { amount, description, type: 'out', currency, bank: 'BCP AMEX' };
    }
  }

  // 2. Patrón Ingresos / Transferencias Recibidas
  // Ej: "Recibiste una transferencia de S/ 2500.00 de Juan Perez"
  const ingresoRegex = /transferencia\s+de\s+(S\/|US\$)\s*([\d,.]+)\s+de\s+(.*?)(?=\.|$)/i;
  const ingresoMatch = text.match(ingresoRegex);
  
  if (ingresoMatch) {
    const currency = ingresoMatch[1] === 'S/' ? 'PEN' : 'USD';
    const amount = parseFloat(ingresoMatch[2].replace(/,/g, ''));
    const description = `Transf. de ${ingresoMatch[3].trim()}`;
    return { amount, description, type: 'in', currency, bank: 'BCP' };
  }

  // 2.5. Patrón BCP Pago de Servicios
  // Ej: "CONSTANCIA DE PAGO DE SERVICIO... Empresa: LUZ DEL SUR SAA ... Importe/Monto: S/ 45.00"
  if (subject.toUpperCase().includes('PAGO DE SERVICIO') && from.toLowerCase().includes('bcp')) {
    const empresaMatch = text.match(/Empresa:\s*(.*?)(?:Servicio:|Titular)/i);
    const description = empresaMatch ? empresaMatch[1].trim() : 'Pago de Servicio BCP';
    
    // Tratamos de buscar Importe o Monto
    const montoMatch = text.match(/(?:Importe|Monto)[\s:]*(S\/|US\$)\s*([\d,.]+)/i);
    if (montoMatch) {
      const currency = montoMatch[1] === 'S/' ? 'PEN' : 'USD';
      const amount = parseFloat(montoMatch[2].replace(/,/g, ''));
      return { amount, description, type: 'out', currency, bank: 'BCP' };
    }
  }

  // 3. Patrón Ripley (Basado en correo real)
  // Ej: "...consumo con tu tarjeta Ripley... por S/ 149.94, en PORTA FREEDOM SANTA AN."
  const ripleyRegex = /consumo\s+con\s+tu\s+tarjeta.*?\s+por\s+(S\/|US\$)\s*([\d,.]+),\s+en\s+(.*?)\./i;
  const ripleyMatch = text.match(ripleyRegex);

  if (ripleyMatch || from.toLowerCase().includes('ripley') || subject.toLowerCase().includes('ripley')) {
    if (ripleyMatch) {
        const currency = ripleyMatch[1] === 'S/' ? 'PEN' : 'USD';
        const amount = parseFloat(ripleyMatch[2].replace(/,/g, ''));
        const description = ripleyMatch[3].trim();
        return { amount, description, type: 'out', currency, bank: 'Ripley' };
    }
  }

  // 4. Patrn Sip! (Basado en correo real)
  // Ej: "Establecimiento: TOULON Monto: S/. 3.40"
  const sipRegex = /Establecimiento:[\s\S]*?([A-Za-z0-9\s\.\-\*\_]+)[\s\S]*?Monto:[\s\S]*?(?:S\/\.|US\$)?[\s\S]*?([\d,]+\.\d{2})/i;
  const sipMatch = text.match(sipRegex);

  if (sipMatch || from.toLowerCase().includes('sip.pe') || subject.toLowerCase().includes('sip')) {
    if (sipMatch) {
        const description = sipMatch[1].trim().replace(/\s+Monto/i, '').trim();
        const currency = text.includes('US$') ? 'USD' : 'PEN';
        const amount = parseFloat(sipMatch[2].replace(/,/g, ''));
        return { amount, description, type: 'out', currency, bank: 'Sip!' };
    }
    // Si no hizo match perfecto pero sabemos que es Sip, forzamos la extraccin
    const fallbackMontoMatch = text.match(/([\d,]+\.\d{2})/);
    if (fallbackMontoMatch) {
        return { amount: parseFloat(fallbackMontoMatch[1].replace(/,/g, '')), description: 'Compra Sip!', type: 'out', currency: 'PEN', bank: 'Sip!' };
    }
  }

  return null; // No se pudo interpretar el correo
}
