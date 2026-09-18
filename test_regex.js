
const text = \
Hola CARLOS GERMAN,

¡Tu operación se realizó con éxito!

Operación realizada:
Pago de servicios

Número de operación:
00778463

Fecha y hora:        Viernes, 18 Septiembre 2026 - 08:33 A. M.
Empresa:             LUZ DEL SUR SAA
Servicio:            LUZ DEL SUR
Titular del servicio: SAVERO NAVARRO CARLOS ALBERTO
Código de usuario:    1578619
Cuenta origen:       Tarjeta de crédito
Importe:             S/ 140.50
\;
const subject = 'ENVIO AUTOMATICO - CONSTANCIA DE PAGO DE SERVICIO - BANCA MOVIL BCP';
const from = 'BCP Notificaciones <notificaciones@notificacionesbcp.com.pe>';

const empresaMatch = text.match(/Empresa:\s*(.*?)(?:Servicio:|Titular)/i);
const description = empresaMatch ? empresaMatch[1].trim() : 'Pago de Servicio BCP';

// Tratamos de buscar Importe o Monto
const montoMatch = text.match(/(?:Importe|Monto)[\s:]*(S\/|US\$)\s*([\d,.]+)/i);
let amount = 0;
if (montoMatch) {
  amount = parseFloat(montoMatch[2].replace(/,/g, ''));
}
console.log({ description, amount });

