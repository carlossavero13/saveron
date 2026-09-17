"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CreditCard, Wallet, ArrowDownRight, ArrowUpRight, TrendingUp, Filter, AlertCircle, X, Search, ChevronRight, CheckCircle, Smartphone, CheckCircle2, ArrowRightLeft, Home, PieChart, Repeat, Plus, Bell, Send, Download, QrCode, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Utilidad para estilos de tarjeta realistas
const getCardStyle = (name: string) => {
  const n = name || '';
  if (n.includes("BCP") && n.includes("Sueldo")) return { 
    bg: "bg-gradient-to-br from-orange-500 to-orange-800", text: "text-white", short: "BCP", title: "Cuenta Sueldo", digits: "•••• 4123", cierre: null, pago: null, linea: null 
  };
  if (n.includes("American")) return { 
    bg: "bg-gradient-to-br from-slate-800 to-blue-900", text: "text-white", short: "AMEX", title: "AMEX LATAM Pass", digits: "•••• 9824", cierre: 22, pago: 18, linea: 6700 
  };
  if (n.includes("VISA")) return { 
    bg: "bg-gradient-to-br from-indigo-800 to-indigo-950", text: "text-white", short: "VISA", title: "VISA LATAM Pass", digits: "•••• 8278", cierre: 10, pago: 8, linea: 2920 
  };
  if (n.includes("Sip")) return { 
    bg: "bg-gradient-to-br from-pink-700 to-rose-950", text: "text-white", short: "SIP!", title: "Tarjeta Sip!", digits: "•••• 1234", cierre: 28, pago: 25, linea: 3000 
  };
  if (n.includes("Ripley")) return { 
    bg: "bg-gradient-to-br from-purple-800 to-purple-950", text: "text-white", short: "RIPLEY", title: "Ripley Mastercard", digits: "•••• 0709", cierre: 22, pago: 20, linea: 1000 
  };
  return { bg: "bg-gradient-to-br from-gray-700 to-gray-900", text: "text-white", short: "CARD", title: n, digits: "•••• 0000", cierre: null, pago: null, linea: null };
};

export default function MobileDashboard() {
  const [activeTab, setActiveTab] = useState<'home' | 'analytics' | 'subscriptions'>('home');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtro de tarjeta
  const [filterCardId, setFilterCardId] = useState<string | null>(null);

  // Estados para Modales
  const [selectedTx, setSelectedTx] = useState<any>(null);
  const [paymentAccount, setPaymentAccount] = useState<any>(null);
  const [manualModal, setManualModal] = useState<'in' | 'out' | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [manualAmount, setManualAmount] = useState('0');
  const [manualDesc, setManualDesc] = useState('');
  const [manualSelectedAccount, setManualSelectedAccount] = useState<string>('');

  const fetchData = async () => {
    const { data: accountsData } = await supabase.from("accounts").select("*").order("type", { ascending: false });
    if (accountsData) setAccounts(accountsData);

    const { data: txData } = await supabase.from("transactions").select("*, accounts(name, type)").order("transaction_date", { ascending: false }).limit(25);
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

  // Lógica del Consejo del Día (Carrusel)
  const tips: any[] = [];
  
  if (accounts.length > 0) {
    const today = new Date();
    const currentDay = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    const cardStats: any[] = [];

    accounts.forEach(acc => {
      if (acc.type !== 'credito') return;
      const style = getCardStyle(acc.name);
      if (!style.cierre || !style.pago) return;

      let nextCloseDate = new Date(currentYear, currentMonth, style.cierre);
      if (currentDay > style.cierre) {
        nextCloseDate = new Date(currentYear, currentMonth + 1, style.cierre);
      }

      const daysToClose = Math.ceil((nextCloseDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      let payMonth = nextCloseDate.getMonth() + 1;
      let payYear = nextCloseDate.getFullYear();
      if (payMonth > 11) { payMonth = 0; payYear++; }
      const paymentDate = new Date(payYear, payMonth, style.pago);
      
      cardStats.push({ style, daysToClose, paymentDate });
    });

    // Ordenar de mejor (más días) a peor (menos días)
    cardStats.sort((a, b) => b.daysToClose - a.daysToClose);
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

    if (cardStats.length > 0) {
      const best = cardStats[0];
      tips.push({
        id: 'tip-1',
        type: 'best',
        badge: 'Top 1: Mayor tiempo',
        cardTitle: best.style.title,
        color: 'text-[#1DB954]',
        bg: 'from-[#1DB954]/20 to-[#0f3b20]/40',
        border: 'border-[#1DB954]/30',
        message1: `Hoy te conviene comprar con tu <strong class="text-[#1DB954] font-black">${best.style.title}</strong> porque facturarás a máximo plazo.`,
        message2: `¡Si compras hoy, no tendrás que pagarlo sino hasta el <strong class="text-white">${best.style.pago} de ${months[best.paymentDate.getMonth()]}</strong>!`
      });
      
      if (cardStats.length > 1) {
        const second = cardStats[1];
        tips.push({
          id: 'tip-2',
          type: 'good',
          badge: 'Top 2: Alternativa',
          cardTitle: second.style.title,
          color: 'text-[#3b82f6]',
          bg: 'from-[#3b82f6]/20 to-[#1e3a8a]/40',
          border: 'border-[#3b82f6]/30',
          message1: `Otra excelente opción es usar tu <strong class="text-[#3b82f6] font-black">${second.style.title}</strong>.`,
          message2: `El cierre será en ${second.daysToClose} días y pagarás recién el <strong class="text-white">${second.style.pago} de ${months[second.paymentDate.getMonth()]}</strong>.`
        });
      }

      const worst = cardStats[cardStats.length - 1];
      if (worst && worst.daysToClose <= 7) {
        tips.push({
          id: 'tip-3',
          type: 'warning',
          badge: 'Alerta de Cierre',
          cardTitle: worst.style.title,
          color: 'text-[#ef4444]',
          bg: 'from-[#ef4444]/20 to-[#7f1d1d]/40',
          border: 'border-[#ef4444]/30',
          message1: `¡Cuidado! Evita hacer compras fuertes hoy con tu <strong class="text-[#ef4444] font-black">${worst.style.title}</strong>.`,
          message2: `Faltan solo ${worst.daysToClose} días para su cierre y tendrías que pagarlo muy pronto.`
        });
      }
    }
  }

  const handleNumpad = (num: string) => {
    if (manualAmount === '0' && num !== '.') setManualAmount(num);
    else if (manualAmount.includes('.') && num === '.') return;
    else setManualAmount(prev => prev + num);
  };

  const handleDeleteNum = () => {
    if (manualAmount.length === 1) setManualAmount('0');
    else setManualAmount(prev => prev.slice(0, -1));
  };

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

    const acc = accounts.find(a => a.id === manualSelectedAccount);
    const delta = type === 'in' ? amount : -amount;
    const newBalance = Number(acc.balance) + (acc.type === 'credito' ? -delta : delta);
    await supabase.from('accounts').update({ balance: newBalance }).eq('id', manualSelectedAccount);

    setManualModal(null);
    setManualAmount('0');
    setManualDesc('');
    setIsProcessing(false);
  };

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

    await supabase.from('transactions').insert([{
      account_id: sueldoAccount.id, amount: -debtToPay, type: 'out', description: `Pago de Tarjeta ${getCardStyle(paymentAccount.name).title}`, category: 'Transferencia'
    }]);

    await supabase.from('transactions').insert([{
      account_id: paymentAccount.id, amount: debtToPay, type: 'in', description: `Pago recibido desde Cuenta Sueldo`, category: 'Pago'
    }]);

    await supabase.from('accounts').update({ balance: Number(sueldoAccount.balance) - debtToPay }).eq('id', sueldoAccount.id);
    await supabase.from('accounts').update({ balance: 0 }).eq('id', paymentAccount.id);

    setPaymentAccount(null);
    setIsProcessing(false);
  };

  const Backdrop = ({ onClick }: { onClick: () => void }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClick} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
  );

  const filteredTransactions = filterCardId ? transactions.filter(tx => tx.account_id === filterCardId) : transactions;

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
          <button onClick={() => setActiveTab('home')} className="w-10 h-10 rounded-full bg-[#1DB954] text-black font-black flex items-center justify-center text-lg hover:scale-105 transition-transform shadow-[0_0_20px_rgba(29,185,84,0.3)]">
            SV
          </button>
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
        
        {activeTab === 'home' && (
          <>
        
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
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
              if (accounts.length > 0) setFilterCardId(accounts[0].id);
            }} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-md shadow-lg">
                <CreditCard className="w-6 h-6 text-[#1DB954]" />
              </div>
              <span className="text-xs font-semibold text-white/80">Filtrar</span>
            </motion.button>
          </div>
        </motion.section>

        {/* Carrusel de Tarjetas Realistas */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="w-full">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-white/80 tracking-tight">Mis Tarjetas {filterCardId && "(1 Filtrada)"}</h3>
            {filterCardId && (
              <button onClick={() => setFilterCardId(null)} className="text-[10px] text-[#1DB954] font-bold">Ver todas</button>
            )}
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-6 pt-2 px-1 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {loading ? (
              <p className="text-white/50 text-sm px-2">Cargando tus tarjetas...</p>
            ) : (
              accounts.map((account) => {
                const style = getCardStyle(account.name);
                const isDebit = account.type === 'debito';
                const debtAmount = Math.abs(account.balance);
                const saldoDisponible = !isDebit && style.linea ? (style.linea - debtAmount) : account.balance;
                const isSelected = filterCardId === account.id;

                return (
                  <div key={account.id} className="snap-center shrink-0 flex flex-col items-center">
                    {/* Tarjeta Física */}
                    <div 
                      onClick={() => setFilterCardId(prev => prev === account.id ? null : account.id)}
                      className={`
                        w-[300px] h-[200px] rounded-[20px] p-5 flex flex-col justify-between relative overflow-hidden shadow-2xl transition-all cursor-pointer border border-white/10
                        ${style.bg} ${style.text}
                        ${isSelected ? 'ring-2 ring-white/60 scale-105 shadow-[0_10px_40px_rgba(255,255,255,0.2)]' : 'opacity-90 hover:opacity-100'}
                      `}
                    >
                      {/* Brillo estilo plástico */}
                      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent opacity-30 pointer-events-none rounded-t-[20px]"></div>

                      {/* Header de la tarjeta */}
                      <div className="flex justify-between items-start z-10">
                        {/* Chip falso */}
                        <div className="w-10 h-8 rounded bg-[#e8c77b]/80 border border-[#b69242] flex flex-col justify-between p-1 opacity-90 shadow-sm">
                          <div className="w-full h-px bg-[#b69242]/50"></div>
                          <div className="w-full h-px bg-[#b69242]/50"></div>
                          <div className="w-full h-px bg-[#b69242]/50"></div>
                        </div>
                        <span className="font-black italic text-lg tracking-widest opacity-80">{style.short}</span>
                      </div>

                      {/* Montos */}
                      <div className="z-10 mt-1">
                        <p className="text-[10px] font-medium opacity-70 uppercase tracking-widest">
                          {isDebit ? 'Saldo Disponible' : 'Deuda Actual'}
                        </p>
                        <h4 className="text-3xl font-black drop-shadow-md">
                          S/ {isDebit ? saldoDisponible.toLocaleString('es-PE', {minimumFractionDigits: 2}) : debtAmount.toLocaleString('es-PE', {minimumFractionDigits: 2})}
                        </h4>
                        
                        {!isDebit && style.linea && (
                          <div className="flex gap-4 mt-1.5 opacity-90">
                            <div className="flex flex-col">
                              <span className="text-[7px] uppercase tracking-widest opacity-80">Disponible</span>
                              <span className="text-xs font-bold text-[#1DB954] drop-shadow-sm">S/ {saldoDisponible.toLocaleString('es-PE', {minimumFractionDigits: 2})}</span>
                            </div>
                            <div className="flex flex-col border-l border-white/20 pl-4">
                              <span className="text-[7px] uppercase tracking-widest opacity-80">Línea Total</span>
                              <span className="text-xs font-bold">S/ {style.linea.toLocaleString('es-PE')}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer de la tarjeta */}
                      <div className="flex justify-between items-end z-10">
                        <div className="flex flex-col">
                          <span className="font-mono text-sm tracking-[0.2em] opacity-90">{style.digits}</span>
                          <span className="text-[10px] uppercase font-bold opacity-70 mt-1">{style.title}</span>
                        </div>
                        {isDebit && <span className="text-[10px] font-bold opacity-70">DÉBITO</span>}
                      </div>
                    </div>

                    {/* Botón de Pagar (Fuera de la tarjeta para no interferir con el click de filtro) */}
                    {!isDebit && debtAmount > 0 && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPaymentAccount(account); }} 
                        className={`
                          mt-3 flex items-center justify-center gap-1.5 w-[280px] bg-white/5 border border-white/10 text-white text-xs font-bold py-2.5 rounded-xl transition shadow-lg backdrop-blur-md
                          hover:bg-[#1DB954] hover:text-black hover:border-[#1DB954]
                          ${isSelected ? 'opacity-100' : 'opacity-80'}
                        `}
                      >
                        <Wallet className="w-4 h-4"/> Pagar Deuda de S/ {debtAmount.toLocaleString('es-PE', {minimumFractionDigits: 2})}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.section>

        {/* Consejos del Día Carrusel */}
        {tips.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="w-full mt-2">
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {tips.map(tip => (
                <div key={tip.id} className={`snap-center shrink-0 w-[300px] bg-gradient-to-r ${tip.bg} backdrop-blur-xl border ${tip.border} rounded-3xl p-5 shadow-lg relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <CreditCard className="w-24 h-24 rotate-12" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${tip.color}`}>{tip.badge}</span>
                    </div>
                    <h3 className="text-white font-medium text-sm mb-2 leading-relaxed" dangerouslySetInnerHTML={{__html: tip.message1}}></h3>
                    <p className="text-white/70 text-xs" dangerouslySetInnerHTML={{__html: tip.message2}}></p>
                  </div>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Movimientos Filtrados */}
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-2 bg-white/5 backdrop-blur-2xl rounded-[32px] p-6 border border-white/10 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white tracking-tight">
              {filterCardId ? 'Movimientos filtrados' : 'Últimos movimientos'}
            </h3>
            {filterCardId && <span className="bg-[#1DB954]/20 text-[#1DB954] text-[10px] font-bold px-2 py-1 rounded-full">{filteredTransactions.length} items</span>}
          </div>
          
          <div className="space-y-1 text-white">
            {filteredTransactions.length === 0 && !loading && (
               <p className="text-white/40 text-sm text-center py-8">No hay movimientos para esta tarjeta.</p>
            )}
            {filteredTransactions.map((tx) => {
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
                        {!filterCardId && (
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-sm bg-white/10 text-white/70 uppercase`}>
                            {cardStyle.short}
                          </span>
                        )}
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

          </>
        )}

        {/* --- PESTAÑA: ANÁLISIS --- */}
        {activeTab === 'analytics' && (
          <motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <button onClick={() => setActiveTab('home')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
              <h2 className="text-2xl font-black text-white">Análisis</h2>
            </div>
            
            <div className="bg-white/5 backdrop-blur-2xl rounded-[32px] p-6 border border-white/10 shadow-lg flex flex-col items-center justify-center py-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5">
                <PieChart className="w-40 h-40" />
              </div>
              <span className="text-sm font-bold text-white/50 tracking-widest uppercase mb-2">Gastos Totales</span>
              <h3 className="text-5xl font-black text-white tracking-tighter">
                S/ {transactions.filter(tx => tx.type === 'out').reduce((sum, tx) => sum + Math.abs(tx.amount), 0).toLocaleString('es-PE', {minimumFractionDigits: 2})}
              </h3>
            </div>

            <div className="bg-white/5 backdrop-blur-2xl rounded-[32px] p-6 border border-white/10 shadow-lg">
               <h3 className="text-sm font-bold text-white/50 tracking-widest uppercase mb-4">Por Tarjeta</h3>
               <div className="space-y-4">
                  {accounts.filter(a => a.type === 'credito').map(acc => {
                    const spent = transactions.filter(tx => tx.account_id === acc.id && tx.type === 'out').reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
                    const percent = Math.min(100, (spent / (getCardStyle(acc.name).linea || 1)) * 100);
                    if (spent === 0) return null;
                    return (
                      <div key={acc.id} className="flex flex-col gap-2">
                        <div className="flex justify-between items-end">
                           <span className="font-bold text-sm text-white/90">{getCardStyle(acc.name).title}</span>
                           <span className="font-mono text-sm text-white">S/ {spent.toLocaleString('es-PE')}</span>
                        </div>
                        <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                           <div className="h-full bg-[#1DB954] rounded-full" style={{ width: `${percent}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
               </div>
            </div>
          </motion.section>
        )}

        {/* --- PESTAÑA: SUSCRIPCIONES --- */}
        {activeTab === 'subscriptions' && (
          <motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
            <div className="flex justify-between items-center px-2">
               <div className="flex items-center gap-3">
                 <button onClick={() => setActiveTab('home')} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                   <ChevronRight className="w-5 h-5 rotate-180" />
                 </button>
                 <h2 className="text-2xl font-black text-white">Suscripciones</h2>
               </div>
               <button onClick={() => alert('Próximamente: Modal para crear suscripción')} className="w-10 h-10 bg-[#1DB954]/20 text-[#1DB954] rounded-full flex items-center justify-center">
                  <Plus className="w-6 h-6" />
               </button>
            </div>
            
            <div className="bg-white/5 backdrop-blur-2xl rounded-[32px] p-6 border border-white/10 shadow-lg text-center py-12">
               <Repeat className="w-16 h-16 mx-auto text-white/20 mb-4" />
               <h3 className="text-lg font-bold text-white mb-2">No hay suscripciones aún</h3>
               <p className="text-sm text-white/50 max-w-[250px] mx-auto">
                 Crea la tabla en Supabase y luego podrás agregar tus pagos recurrentes aquí.
               </p>
            </div>
          </motion.section>
        )}

      </main>

      {/* Dock Inferior */}
      <nav className="fixed bottom-0 w-full bg-[#0a0a0a]/80 backdrop-blur-[40px] border-t border-white/10 px-6 pb-safe pt-3 z-50 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'home' ? 'text-[#1DB954]' : 'text-white/40'}`}>
          <Home className={`w-6 h-6 ${activeTab === 'home' ? 'drop-shadow-md' : ''}`} />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button onClick={() => setActiveTab('analytics')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'analytics' ? 'text-[#1DB954]' : 'text-white/40'}`}>
          <PieChart className="w-6 h-6" />
          <span className="text-[10px] font-bold">Análisis</span>
        </button>
        <div className="relative -top-6">
          <button onClick={() => setManualModal('out')} className="w-16 h-16 bg-[#1DB954] hover:bg-[#1ed760] rounded-2xl rotate-3 flex items-center justify-center text-[#0a0a0a] transform hover:scale-105 hover:rotate-6 transition-all shadow-[0_10px_30px_rgba(29,185,84,0.4)] border border-[#1DB954]/50">
            <QrCode className="w-8 h-8 -rotate-3" />
          </button>
        </div>
        <button onClick={() => setActiveTab('subscriptions')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'subscriptions' ? 'text-[#1DB954]' : 'text-white/40'}`}>
          <Repeat className="w-6 h-6" />
          <span className="text-[10px] font-bold">Pagos</span>
        </button>
        <button className="flex flex-col items-center gap-1.5 text-white/40">
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold">Ajustes</span>
        </button>
      </nav>

      {/* --- MODALES INTERACTIVOS (FASE 2 & 3) --- */}
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
                  <span className={`text-xs font-bold px-2 py-1 rounded-md bg-white/10 text-white`}>
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
                  <div className={`w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center mb-2`}><CreditCard className="w-6 h-6"/></div>
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
