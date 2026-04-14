import { motion } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";

export default function Loader() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-50/20 via-background to-background">
      <div className="relative w-full max-w-sm">
        <div className="absolute -inset-4 bg-blue-500/10 blur-3xl rounded-full" />
        
        <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-card/60 backdrop-blur-xl p-8 shadow-[0_8px_32px_0_rgba(0,0,0,0.05)]">
            <div className="flex items-start justify-between gap-6 mb-8">

            <div className="space-y-2.5">
              <h3 className="font-semibold text-2xl tracking-tight text-foreground">
                Почти готово
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
                Связываемся с сервером и обрабатываем ваши данные...
              </p>
            </div>

            <div className="relative flex-shrink-0 mt-1">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute -inset-2 rounded-full border-2 border-dashed border-blue-500/30"
              />
              <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            </div>
          </div>

          <div className="w-full space-y-3.5">
            <div className="h-1.5 w-full bg-muted/50 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.4)] rounded-full"
                initial={{ width: "0%" }}
                animate={{ 
                  width: ["0%", "40%", "65%", "90%", "100%"],
                }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity,
                  times: [0, 0.2, 0.5, 0.8, 1] 
                }}
              />
            </div>
            
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="text-[10px] uppercase tracking-widest font-medium text-muted-foreground">
                Безопасное соединение
              </span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};