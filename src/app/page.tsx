"use client";

import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, ArrowUpRight, ArrowDownRight, Home, PieChart, Settings, QrCode, CreditCard, Send, Download, CheckCircle2, Edit2, Trash2, X, ChevronRight, Wallet, ArrowRightLeft
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Utilidad para estilos de tarjeta
const getCardStyle = (name: string) => {
  const n = name || '';
  if (n.includes("BCP") && n.includes("Sueldo")) return { bg: "bg-orange-500/20", text: "text-orange-400", short: "BCP", title: "Cuenta Sueldo", cierre: null, pago: null, linea: null };
  if (n.includes("American")) return { bg: "bg-blue-500/20", text: "text-blue-400", short: "BCP", title: "AMEX LATAM Pass", cierre: 22, pago: 18, linea: 6700 };
  if (n.includes("VISA")) return { bg: "bg-indigo-600/20", text: "text-indigo-400", short: "BCP", title: "VISA LATAM Pass", cierre: 10, pago: 8, linea: 2920 };
  if (n.includes("Sip")) return { bg: "bg-pink-500/20", text: "text-pink-400", short: "OH!", title: "Sip!", cierre: 28, pago: 25, linea: 3000 };
  if (n.includes("Ripley")) return { bg: "bg-purple-600/20", text: "text-purple-400", short: "RIPLEY", title: "Ripley Mastercard", cierre: 22, pago: 20, linea: 1000 };
  return { bg: "bg-gray-500/20", text: "text-gray-400", short: "CARD", title: n, cierre: null, pago: null, linea: null };
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados para Modales
  const [selectedTx, setSelectedTx] = useState<any>(null); // Modal de Detalle
  const [paymentAccount, setPaymentAccount] = useState<any>(null); // Modal de Pagar Tarjeta
  const [manualModal, setManualModal] = useState<'in' | 'out' | null>(null); // Modal Manual

  // Estados de carga internos
  const [isProcessing, setIsProcessing] = useState(false);

  // Estados para teclado numérico manual
  const [manualAmount, setManualAmount] = useState('0');
  const [manualDesc, setManualDesc] = useState('');
  const [manualSelectedAccount, setManualSelectedAccount] = useState<string>('');

  const fetchData = async () => {
    const { data: accountsData } = await supabase.from("accounts").select("*").order("type", { ascending: false });
    if (accountsData) setAccounts(accountsData);

    // Traemos transacciones CON el nombre de la cuenta (Join)
    const { data: txData } = await supabase.from("transactions").select("*, accounts(name, type)").order("transaction_date", { ascending: false }).limit(15);
    if (txData) setTransactions(txData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const channel = supabase.channel('realtime_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const debitBalance = accounts.filter(a => a.type === 'debito').reduce((sum, a) => sum + Number(a.balance), 0);
  const creditDebt = accounts.filter(a => a.type === 'credito').reduce((sum, a) => sum + Number(Math.abs(a.balance)), 0);
  const netLiquidity = debitBalance - creditDebt;

  // Función para manejar el teclado numérico
  const handleNumpad = (num: string) => {
    if (manualAmount === '0' && num !== '.') setManualAmount(num);
    else if (manualAmount.includes('.') && num === '.') return;
    else setManualAmount(prev => prev + num);
  };

  const handleDeleteNum = () => {
    if (manualAmount.length === 1) setManualAmount('0');
    else setManualAmount(prev => prev.slice(0, -1));
  };

  // Función para guardar movimiento manual
  const handleSaveManualTx = async () => {
    if (!manualSelectedAccount || manualAmount === '0' || !manualDesc) return;
    setIsProcessing(true);
    
    const amount = Number(manualAmount);
    const type = manualModal === 'in' ? 'in' : 'out';
    
    await supabase.from('transactions').insert([{
      account_id: manualSelectedAccount,
      amount: type === 'in' ? amount : -amount,
      type,
      description: manualDesc,
      category: 'Manual'
    }]);

    // Actualizar saldo de la tarjeta
    const acc = accounts.find(a => a.id === manualSelectedAccount);
    const newBalance = Number(acc.balance) + (type === 'in' ? amount : -amount);
    await supabase.from('accounts').update({ balance: newBalance }).eq('id', manualSelectedAccount);

    setManualModal(null);
    setManualAmount('0');
    setManualDesc('');
    setIsProcessing(false);
  };

  // Función para pagar tarjeta (Transfiere de Sueldo a la de Crédito)
  const handlePayCard = async () => {
    if (!paymentAccount) return;
    setIsProcessing(true);

    const sueldoAccount = accounts.find(a => a.name.includes("Sueldo"));
    if (!sueldoAccount) {
      alert("No se encontró tu Cuenta Sueldo");
      setIsProcessing(false);
      return;
    }

    const debtToPay = Math.abs(paymentAccount.balance);

    // 1. Gasto en Cuenta Sueldo
    await supabase.from('transactions').insert([{
      account_id: sueldoAccount.id, amount: -debtToPay, type: 'out', description: `Pago de Tarjeta ${getCardStyle(paymentAccount.name).title}`, category: 'Transferencia'
    }]);

    // 2. Ingreso en Tarjeta de Crédito (Pagando deuda)
    await supabase.from('transactions').insert([{
      account_id: paymentAccount.id, amount: debtToPay, type: 'in', description: `Pago recibido desde Cuenta Sueldo`, category: 'Pago'
    }]);

    // 3. Actualizar saldos
    await supabase.from('accounts').update({ balance: Number(sueldoAccount.balance) - debtToPay }).eq('id', sueldoAccount.id);
    await supabase.from('accounts').update({ balance: 0 }).eq('id', paymentAccount.id);

    setPaymentAccount(null);
    setIsProcessing(false);
  };

  // Modal Backdrop component
  const Backdrop = ({ onClick }: { onClick: () => void }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClick} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
  );

  return (
    <div className="min-h-screen relative text-white font-sans pb-28 lg:pb-0 overflow-x-hidden selection:bg-[#1DB954]/30">
      
      {/* Fondos */}
      <div className="fixed inset-0 bg-[#0a0a0a] -z-20"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#1DB954]/20 rounded-full blur-[120px] -z-10" />
      <div className="fixed top-[40%] right-[-20%] w-[600px] h-[600px] bg-[#0f3b20]/40 rounded-full blur-[150px] -z-10" />
      <div className="fixed bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-[#1DB954]/10 rounded-full blur-[100px] -z-10" />
      <div className="fixed inset-0 bg-white/[0.02] backdrop-blur-[80px] -z-10 border-t border-white/5 pointer-events-none"></div>

      <header className="px-5 pt-12 pb-4 flex justify-between items-center sticky top-0 z-50 bg-white/5 backdrop-blur-2xl border-b border-white/5">
        <div className="flex items-center gap-3">
          <motion.div whileTap={{ scale: 0.9 }} className="w-11 h-11 rounded-full bg-[#1DB954] flex items-center justify-center shadow-[0_0_20px_rgba(29,185,84,0.3)]">
            <span className="text-[#0a0a0a] font-black text-lg tracking-tighter">SV</span>
          </motion.div>
          <div>
            <p className="text-xs text-white/60 font-medium tracking-wide uppercase">Hola,</p>
            <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-md">Savero</h1>
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center relative hover:bg-white/10 transition-colors backdrop-blur-md">
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#1DB954] rounded-full shadow-[0_0_8px_rgba(29,185,84,1)]"></span>
          <Bell className="w-5 h-5 text-white/90" />
        </motion.button>
      </header>

      <main className="px-5 py-6 max-w-md mx-auto lg:max-w-4xl space-y-6 relative z-10">
        
        {/* Tarjeta de Liquidez */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-8 bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <p className="text-white/70 text-sm font-medium mb-2 drop-shadow-sm">Liquidez Total</p>
          
          <div className="flex items-start gap-1 mb-8">
            <span className="text-2xl mt-2 text-[#1DB954] font-bold drop-shadow-[0_0_10px_rgba(29,185,84,0.5)]">S/</span>
            <h2 className="text-6xl font-black tracking-tighter text-white drop-shadow-lg">
              {loading ? "..." : netLiquidity.toLocaleString('es-PE', {minimumFractionDigits: 2})}
            </h2>
          </div>

          <div className="flex gap-4 w-full justify-center">
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setManualModal('out')} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-md shadow-lg">
                <Send className="w-6 h-6 text-[#1DB954]" />
              </div>
              <span className="text-xs font-semibold text-white/80">Gasto</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setManualModal('in')} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-md shadow-lg">
                <Download className="w-6 h-6 text-[#1DB954]" />
              </div>
              <span className="text-xs font-semibold text-white/80">Ingreso</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-md shadow-lg">
                <CreditCard className="w-6 h-6 text-[#1DB954]" />
              </div>
              <span className="text-xs font-semibold text-white/80">Tarjetas</span>
            </motion.button>
          </div>
        </motion.section>

        {/* Carrusel de Tarjetas */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-white/80 tracking-tight">Mis Tarjetas</h3>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {loading ? (
              <p className="text-white/50 text-sm px-2">Cargando tus tarjetas...</p>
            ) : (
              accounts.map((account) => {
                const style = getCardStyle(account.name);
                const isDebit = account.type === 'debito';
                const debtAmount = Math.abs(account.balance);
                const saldoDisponible = !isDebit && style.linea ? (style.linea - debtAmount) : account.balance;

                return (
                  <div key={account.id} className="min-w-[300px] bg-white/5 backdrop-blur-3xl rounded-[24px] p-5 border border-white/10 shadow-lg snap-start shrink-0 flex flex-col justify-between relative overflow-hidden group">
                    <div className={`absolute -top-10 -right-10 w-40 h-40 ${style.bg} blur-[50px] -z-10 rounded-full opacity-60 group-hover:opacity-80 transition-opacity`}></div>
                    <div className="z-10">
                      <div className="flex justify-between items-center mb-2">
                        <div className={`px-2.5 py-1 rounded-md ${style.bg} border border-white/5`}>
                          <p className={`text-[10px] ${style.text} font-black tracking-wider uppercase drop-shadow-md`}>{style.short}</p>
                        </div>
                        {isDebit && <span className="text-[9px] text-[#1DB954] font-bold bg-[#1DB954]/10 border border-[#1DB954]/20 px-2 py-0.5 rounded-full">Débito</span>}
                      </div>
                      <h4 className="text-[17px] font-bold text-white mb-6 drop-shadow-sm">{style.title}</h4>
                      
                      {!isDebit ? (
                        <div className="flex items-start gap-4 border-t border-white/10 pt-4 mb-2">
                          <div className="flex flex-col border-r border-white/10 pr-4">
                            <span className="text-[8px] text-white/50 font-bold mb-1 tracking-wider uppercase">Deuda Actual</span>
                            <span className="text-sm font-bold text-rose-400 drop-shadow-md">S/ {debtAmount.toLocaleString('es-PE', {minimumFractionDigits: 2})}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[8px] text-white/50 font-bold mb-1 tracking-wider">DISPONIBLE</span>
                            <span className="text-sm font-black text-white drop-shadow-md">S/ {saldoDisponible.toLocaleString('es-PE', {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-4 border-t border-white/10 pt-4 mb-2">
                          <div className="flex flex-col">
                            <span className="text-[8px] text-[#1DB954]/70 font-bold mb-1 tracking-wider uppercase">Saldo Disponible en tu cuenta</span>
                            <span className="text-2xl font-black text-white drop-shadow-lg">S/ {saldoDisponible.toLocaleString('es-PE', {minimumFractionDigits: 2})}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 mt-4 z-10">
                      {!isDebit && debtAmount > 0 && (
                        <button onClick={() => setPaymentAccount(account)} className="flex items-center gap-1.5 bg-[#1DB954] text-[#0a0a0a] text-[11px] font-black px-4 py-1.5 rounded-lg hover:bg-[#1ed760] transition shadow-[0_4px_15px_rgba(29,185,84,0.3)] hover:scale-105 transform">
                          <CheckCircle2 className="w-3.5 h-3.5"/> Pagar
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.section>

        {/* Movimientos */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-6 bg-white/5 backdrop-blur-2xl rounded-[32px] p-6 border border-white/10 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Últimos movimientos</h3>
          </div>
          
          <div className="space-y-1 text-white">
            {transactions.length === 0 && !loading && (
               <p className="text-white/40 text-sm text-center py-4">No hay movimientos recientes.</p>
            )}
            {transactions.map((tx) => {
              const cardStyle = getCardStyle(tx.accounts?.name);
              const txDate = new Date(tx.transaction_date);
              
              return (
                <motion.div 
                  key={tx.id} 
                  onClick={() => setSelectedTx({ ...tx, cardStyle })}
                  className="group flex items-center justify-between py-3 px-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border border-white/5 ${tx.type === 'in' ? 'bg-[#1DB954]/20' : 'bg-white/5'}`}>
                      {tx.type === 'in' ? <ArrowUpRight className="w-5 h-5 text-[#1DB954]" /> : <ArrowDownRight className="w-5 h-5 text-white/60" />}
                    </div>
                    <div>
                      <p className="font-bold text-white text-sm line-clamp-1">{tx.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-white/50">{txDate.toLocaleDateString('es-PE', {day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit'})}</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm ${cardStyle.bg} ${cardStyle.text} uppercase`}>
                          {cardStyle.short}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-bold text-sm ${tx.type === 'in' ? 'text-[#1DB954]' : 'text-white'}`}>
                      {tx.type === 'in' ? '+' : '-'} S/ {Math.abs(tx.amount).toLocaleString('es-PE', {minimumFractionDigits: 2})}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

      </main>

      {/* Dock Inferior */}
      <nav className="fixed bottom-0 w-full bg-[#0a0a0a]/60 backdrop-blur-[40px] border-t border-white/10 px-6 pb-safe pt-3 lg:hidden z-50 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <button className="flex flex-col items-center gap-1.5 text-[#1DB954]">
          <Home className="w-6 h-6 drop-shadow-md" />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-white/40">
          <PieChart className="w-6 h-6" />
        </button>
        <div className="relative -top-6">
          <button onClick={() => setManualModal('out')} className="w-16 h-16 bg-[#1DB954] hover:bg-[#1ed760] rounded-2xl rotate-3 flex items-center justify-center text-[#0a0a0a] transform hover:scale-105 hover:rotate-6 transition-all shadow-[0_10px_30px_rgba(29,185,84,0.4)] border border-[#1DB954]/50">
            <QrCode className="w-8 h-8 -rotate-3" />
          </button>
        </div>
        <button className="flex flex-col items-center gap-1.5 text-white/40">
          <CreditCard className="w-6 h-6" />
        </button>
        <button className="flex flex-col items-center gap-1.5 text-white/40">
          <Settings className="w-6 h-6" />
        </button>
      </nav>

      {/* --- MODALES INTERACTIVOS (FASE 2) --- */}
      <AnimatePresence>
        
        {/* MODAL: DETALLE DE MOVIMIENTO */}
        {selectedTx && (
          <>
            <Backdrop onClick={() => setSelectedTx(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 inset-x-0 bg-[#121212] rounded-t-[32px] p-6 z-[101] shadow-[0_-10px_50px_rgba(0,0,0,0.5)] border-t border-white/10 max-h-[85vh] overflow-y-auto">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
              <div className="text-center mb-8">
                <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${selectedTx.type === 'in' ? 'bg-[#1DB954]/20 text-[#1DB954]' : 'bg-white/10 text-white'}`}>
                  {selectedTx.type === 'in' ? <ArrowUpRight className="w-8 h-8" /> : <ArrowDownRight className="w-8 h-8" />}
                </div>
                <h3 className="text-3xl font-black text-white mb-2">S/ {Math.abs(selectedTx.amount).toLocaleString('es-PE', {minimumFractionDigits: 2})}</h3>
                <p className="text-white/60 text-sm font-medium">{selectedTx.description}</p>
              </div>

              <div className="bg-white/5 rounded-2xl p-4 space-y-4 border border-white/5 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">Estado</span>
                  <span className="text-sm font-bold text-[#1DB954] flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Aprobado</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">Fecha</span>
                  <span className="text-sm font-bold text-white/90">{new Date(selectedTx.transaction_date).toLocaleString('es-PE', {day:'2-digit',month:'long',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">Tarjeta Usada</span>
                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${selectedTx.cardStyle.bg} ${selectedTx.cardStyle.text}`}>
                    {selectedTx.cardStyle.title}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-white/50">Categoría</span>
                  <span className="text-sm font-bold text-white/90">{selectedTx.category}</span>
                </div>
              </div>
              
              <button onClick={() => setSelectedTx(null)} className="w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white font-bold transition-colors">
                Cerrar
              </button>
            </motion.div>
          </>
        )}

        {/* MODAL: PAGAR TARJETA */}
        {paymentAccount && (
          <>
            <Backdrop onClick={() => !isProcessing && setPaymentAccount(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 inset-x-0 bg-[#121212] rounded-t-[32px] p-6 z-[101] shadow-[0_-10px_50px_rgba(0,0,0,0.5)] border-t border-white/10">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-6" />
              <h3 className="text-xl font-bold text-white mb-2 text-center">Pagar Tarjeta de Crédito</h3>
              <p className="text-white/50 text-sm text-center mb-8">Estás a punto de transferir dinero desde tu Cuenta Sueldo para saldar la deuda.</p>
              
              <div className="flex items-center justify-center gap-4 mb-8">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-orange-500/20 text-orange-400 rounded-full flex items-center justify-center mb-2"><Wallet className="w-6 h-6"/></div>
                  <span className="text-[10px] text-white/60">Sueldo</span>
                </div>
                <ArrowRightLeft className="w-6 h-6 text-white/30" />
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 ${getCardStyle(paymentAccount.name).bg} ${getCardStyle(paymentAccount.name).text} rounded-full flex items-center justify-center mb-2`}><CreditCard className="w-6 h-6"/></div>
                  <span className="text-[10px] text-white/60">{getCardStyle(paymentAccount.name).short}</span>
                </div>
              </div>

              <div className="text-center mb-8">
                <span className="text-sm text-white/50">Monto a pagar (Deuda total)</span>
                <h2 className="text-4xl font-black text-white mt-1">S/ {Math.abs(paymentAccount.balance).toLocaleString('es-PE', {minimumFractionDigits: 2})}</h2>
              </div>

              <button onClick={handlePayCard} disabled={isProcessing} className="w-full py-4 bg-[#1DB954] hover:bg-[#1ed760] text-[#0a0a0a] rounded-2xl font-black transition-colors flex justify-center items-center gap-2 text-lg">
                {isProcessing ? "Procesando..." : "Confirmar Pago"}
              </button>
            </motion.div>
          </>
        )}

        {/* MODAL: MOVIMIENTO MANUAL (TECLADO TIPO YAPE) */}
        {manualModal && (
          <>
            <Backdrop onClick={() => !isProcessing && setManualModal(null)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="fixed bottom-0 inset-x-0 h-[85vh] bg-[#121212] rounded-t-[32px] p-6 z-[101] shadow-[0_-10px_50px_rgba(0,0,0,0.5)] border-t border-white/10 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <button onClick={() => setManualModal(null)} className="p-2 bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
                <h3 className="font-bold text-white">{manualModal === 'in' ? 'Recibir Dinero' : 'Enviar / Gastar'}</h3>
                <div className="w-9"></div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-center">
                <span className="text-[#1DB954] font-bold mb-2">S/</span>
                <h1 className="text-6xl font-black text-white tracking-tighter">{manualAmount}</h1>
                
                <input 
                  type="text" 
                  placeholder="¿Por qué motivo?" 
                  value={manualDesc}
                  onChange={(e) => setManualDesc(e.target.value)}
                  className="mt-6 bg-transparent border-b border-white/20 text-center text-white/80 focus:outline-none focus:border-[#1DB954] w-2/3 py-2 text-sm"
                />

                <select 
                  value={manualSelectedAccount}
                  onChange={(e) => setManualSelectedAccount(e.target.value)}
                  className="mt-6 bg-white/5 border border-white/10 rounded-xl p-3 text-white/80 text-sm focus:outline-none w-2/3"
                >
                  <option value="" disabled className="text-black">Selecciona la tarjeta...</option>
                  {accounts.map(a => (
                    <option key={a.id} value={a.id} className="text-black">{a.name} ({a.type})</option>
                  ))}
                </select>
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                  <button key={num} onClick={() => handleNumpad(num.toString())} className="h-16 flex items-center justify-center text-2xl font-bold text-white active:bg-white/10 rounded-2xl transition-colors">
                    {num}
                  </button>
                ))}
                <button onClick={handleDeleteNum} className="h-16 flex items-center justify-center text-2xl font-bold text-white active:bg-white/10 rounded-2xl transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <button 
                onClick={handleSaveManualTx} 
                disabled={isProcessing || manualAmount === '0' || !manualSelectedAccount || !manualDesc} 
                className="w-full py-4 bg-[#1DB954] disabled:bg-white/10 disabled:text-white/30 text-[#0a0a0a] rounded-2xl font-black transition-colors text-lg"
              >
                {isProcessing ? "Guardando..." : (manualModal === 'in' ? 'Recibir' : 'Pagar')}
              </button>
            </motion.div>
          </>
        )}

      </AnimatePresence>
    </div>
  );
}
