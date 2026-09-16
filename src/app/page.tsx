"use client";

import { motion } from "framer-motion";
import { 
  Bell, 
  ArrowUpRight, 
  ArrowDownRight, 
  Home,
  PieChart,
  Settings,
  QrCode,
  CreditCard,
  Send,
  Download,
  CheckCircle2,
  Edit2,
  Trash2
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Utilidad para dar estilo único a cada tarjeta basado en su nombre y configurar fechas
const getCardStyle = (name: string) => {
  if (name.includes("BCP") && name.includes("Sueldo")) return { bg: "bg-orange-500/20", text: "text-orange-400", short: "BCP", title: "Cuenta Sueldo", cierre: null, pago: null, linea: null };
  if (name.includes("American")) return { bg: "bg-blue-500/20", text: "text-blue-400", short: "BCP", title: "AMEX LATAM Pass", cierre: 22, pago: 18, linea: 6700 };
  if (name.includes("VISA")) return { bg: "bg-indigo-600/20", text: "text-indigo-400", short: "BCP", title: "VISA LATAM Pass", cierre: 10, pago: 8, linea: 2920 };
  if (name.includes("Sip")) return { bg: "bg-pink-500/20", text: "text-pink-400", short: "FINANCIERA OH!", title: "Sip!", cierre: 28, pago: 25, linea: 3000 };
  if (name.includes("Ripley")) return { bg: "bg-purple-600/20", text: "text-purple-400", short: "BANCO RIPLEY", title: "Ripley Mastercard", cierre: 22, pago: 20, linea: 1000 };
  return { bg: "bg-gray-500/20", text: "text-gray-400", short: "CARD", title: name, cierre: null, pago: null, linea: null };
};

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar datos y suscribirse a Realtime
  useEffect(() => {
    const fetchData = async () => {
      // Traer Cuentas
      const { data: accountsData } = await supabase.from("accounts").select("*").order("type", { ascending: false });
      if (accountsData) setAccounts(accountsData);

      // Traer Transacciones
      const { data: txData } = await supabase.from("transactions").select("*").order("transaction_date", { ascending: false }).limit(5);
      if (txData) setTransactions(txData);
      
      setLoading(false);
    };

    fetchData();

    // Configurar WebSocket para tiempo real
    const channel = supabase.channel('realtime_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
        // Al recibir una transacción nueva, recargamos los datos
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'accounts' }, (payload) => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Cálculos matemáticos
  const debitBalance = accounts.filter(a => a.type === 'debito').reduce((sum, a) => sum + Number(a.balance), 0);
  const creditDebt = accounts.filter(a => a.type === 'credito').reduce((sum, a) => sum + Number(Math.abs(a.balance)), 0);
  const netLiquidity = debitBalance - creditDebt;

  return (
    // Fondo Glassmorphism (Mesh gradient + Blur)
    <div className="min-h-screen relative text-white font-sans pb-28 lg:pb-0 overflow-x-hidden selection:bg-[#1DB954]/30">
      
      {/* Fondo Base Mesh Gradient */}
      <div className="fixed inset-0 bg-[#0a0a0a] -z-20"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#1DB954]/20 rounded-full blur-[120px] -z-10" />
      <div className="fixed top-[40%] right-[-20%] w-[600px] h-[600px] bg-[#0f3b20]/40 rounded-full blur-[150px] -z-10" />
      <div className="fixed bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-[#1DB954]/10 rounded-full blur-[100px] -z-10" />
      <div className="fixed inset-0 bg-white/[0.02] backdrop-blur-[80px] -z-10 border-t border-white/5 pointer-events-none"></div>

      {/* Header */}
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
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-8 bg-white/5 backdrop-blur-3xl rounded-[32px] border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] relative overflow-hidden"
        >
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          <p className="text-white/70 text-sm font-medium mb-2 drop-shadow-sm">Liquidez Total</p>
          
          <div className="flex items-start gap-1 mb-8">
            <span className="text-2xl mt-2 text-[#1DB954] font-bold drop-shadow-[0_0_10px_rgba(29,185,84,0.5)]">S/</span>
            <h2 className="text-6xl font-black tracking-tighter text-white drop-shadow-lg">
              {loading ? "..." : netLiquidity.toLocaleString('es-PE', {minimumFractionDigits: 2})}
            </h2>
          </div>

          <div className="flex gap-4 w-full justify-center">
            <motion.button whileTap={{ scale: 0.95 }} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-md shadow-lg">
                <Send className="w-6 h-6 text-[#1DB954]" />
              </div>
              <span className="text-xs font-semibold text-white/80">Enviar</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-md shadow-lg">
                <Download className="w-6 h-6 text-[#1DB954]" />
              </div>
              <span className="text-xs font-semibold text-white/80">Recibir</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.95 }} className="flex flex-col items-center gap-2 group">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-md shadow-lg">
                <CreditCard className="w-6 h-6 text-[#1DB954]" />
              </div>
              <span className="text-xs font-semibold text-white/80">Tarjetas</span>
            </motion.button>
          </div>
        </motion.section>

        {/* Carrusel de Tarjetas desde Supabase */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-bold text-white/80 tracking-tight">Mis Tarjetas</h3>
            <button className="text-xs font-bold text-[#1DB954] hover:text-white transition-colors">Añadir +</button>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x hide-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {loading ? (
              <p className="text-white/50 text-sm px-2">Cargando tus tarjetas...</p>
            ) : (
              accounts.map((account) => {
                const style = getCardStyle(account.name);
                const isDebit = account.type === 'debito';
                const debtAmount = Math.abs(account.balance);
                
                // Calculamos saldo disponible basado en la línea, si es crédito
                const saldoDisponible = !isDebit && style.linea ? (style.linea - debtAmount) : account.balance;

                return (
                  <div key={account.id} className="min-w-[300px] bg-white/5 backdrop-blur-3xl rounded-[24px] p-5 border border-white/10 shadow-lg snap-start shrink-0 flex flex-col justify-between relative overflow-hidden group">
                    {/* Brillo de fondo con el color del banco */}
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
                          {/* Cierre / Pago */}
                          <div className="flex gap-4">
                            <div className="flex flex-col">
                              <span className="text-[8px] text-white/50 font-bold mb-1 tracking-wider">CIERRE</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-[10px] text-white/40">Día</span>
                                <span className="text-sm font-bold text-white/90">{style.cierre}</span>
                              </div>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[8px] text-white/50 font-bold mb-1 tracking-wider">PAGO</span>
                              <div className="flex items-baseline gap-1">
                                <span className="text-[10px] text-white/40">Día</span>
                                <span className="text-sm font-bold text-white/90">{style.pago}</span>
                              </div>
                            </div>
                          </div>

                          {/* Línea */}
                          <div className="flex flex-col border-l border-white/10 pl-3">
                            <span className="text-[8px] text-white/50 font-bold mb-1 tracking-wider">LÍNEA</span>
                            <span className="text-xs font-bold text-white/70">S/ {style.linea?.toLocaleString('es-PE', {minimumFractionDigits: 2})}</span>
                          </div>

                          {/* Saldo Disponible */}
                          <div className="flex flex-col border-l border-white/10 pl-3">
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

                    {/* Botones de acción inferiores */}
                    <div className="flex justify-end gap-2 mt-4 z-10">
                      {!isDebit && (
                        <button className="flex items-center gap-1.5 bg-[#1DB954] text-[#0a0a0a] text-[11px] font-black px-4 py-1.5 rounded-lg hover:bg-[#1ed760] transition shadow-[0_4px_15px_rgba(29,185,84,0.3)] hover:scale-105 transform">
                          <CheckCircle2 className="w-3.5 h-3.5"/> Pagar
                        </button>
                      )}
                      <button className="bg-white/5 p-1.5 rounded-lg border border-white/10 hover:bg-white/20 text-white/80 transition">
                        <Edit2 className="w-3.5 h-3.5"/>
                      </button>
                      <button className="bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20 hover:bg-rose-500/30 text-rose-400 transition">
                        <Trash2 className="w-3.5 h-3.5"/>
                      </button>
                    </div>
                  </div>
                );
              })
            )}

            <div className="min-w-[160px] bg-white/5 backdrop-blur-xl rounded-[24px] p-5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer shadow-lg snap-start shrink-0 flex items-center justify-center border-dashed">
              <div className="text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-white/5 flex items-center justify-center mb-2">
                  <span className="text-[#1DB954] text-xl">+</span>
                </div>
                <p className="text-xs text-white/50 font-medium">Conectar Banco</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Movimientos desde Supabase */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 bg-white/5 backdrop-blur-2xl rounded-[32px] p-6 border border-white/10 shadow-lg"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white tracking-tight">Últimos movimientos</h3>
            <button className="text-xs font-bold text-[#1DB954] hover:text-white transition-colors">Ver todos</button>
          </div>
          
          <div className="space-y-1 text-white">
            {transactions.length === 0 && !loading && (
               <p className="text-white/40 text-sm text-center py-4">No hay movimientos recientes.</p>
            )}
            {transactions.map((tx) => (
              <motion.div key={tx.id} className="group flex items-center justify-between py-3 px-2 rounded-2xl hover:bg-white/5 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border border-white/5 ${tx.type === 'in' ? 'bg-[#1DB954]/20' : 'bg-white/5'}`}>
                    {tx.type === 'in' ? <ArrowUpRight className="w-5 h-5 text-[#1DB954]" /> : <ArrowDownRight className="w-5 h-5 text-white/60" />}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{tx.description}</p>
                    <p className="text-[11px] text-white/50 mt-0.5">
                      {new Date(tx.transaction_date).toLocaleDateString('es-PE', {day: '2-digit', month: 'short'})} • {tx.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${tx.type === 'in' ? 'text-[#1DB954]' : 'text-white'}`}>
                    {tx.type === 'in' ? '+' : '-'} S/ {Math.abs(tx.amount).toLocaleString('es-PE', {minimumFractionDigits: 2})}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

      </main>

      {/* Dock Inferior */}
      <nav className="fixed bottom-0 w-full bg-[#0a0a0a]/60 backdrop-blur-[40px] border-t border-white/10 px-6 pb-safe pt-3 lg:hidden z-50 flex justify-between items-center shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'home' ? 'text-[#1DB954]' : 'text-white/40'}`}>
          <Home className="w-6 h-6 drop-shadow-md" />
          <span className="text-[10px] font-bold">Inicio</span>
        </button>
        <button onClick={() => setActiveTab('stats')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'stats' ? 'text-[#1DB954]' : 'text-white/40'}`}>
          <PieChart className="w-6 h-6 drop-shadow-md" />
          <span className="text-[10px] font-bold">Análisis</span>
        </button>
        
        <div className="relative -top-6">
          <button className="w-16 h-16 bg-[#1DB954] hover:bg-[#1ed760] rounded-2xl rotate-3 flex items-center justify-center text-[#0a0a0a] transform hover:scale-105 hover:rotate-6 transition-all shadow-[0_10px_30px_rgba(29,185,84,0.4)] border border-[#1DB954]/50">
            <QrCode className="w-8 h-8 -rotate-3" />
          </button>
        </div>

        <button onClick={() => setActiveTab('cards')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'cards' ? 'text-[#1DB954]' : 'text-white/40'}`}>
          <CreditCard className="w-6 h-6 drop-shadow-md" />
          <span className="text-[10px] font-bold">Tarjetas</span>
        </button>
        <button onClick={() => setActiveTab('settings')} className={`flex flex-col items-center gap-1.5 transition-colors ${activeTab === 'settings' ? 'text-[#1DB954]' : 'text-white/40'}`}>
          <Settings className="w-6 h-6 drop-shadow-md" />
          <span className="text-[10px] font-bold">Ajustes</span>
        </button>
      </nav>
    </div>
  );
}
