"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex min-h-[70vh] flex-col mx-auto justify-center gap-4 px-4">
      <div className="relative mb-8">
        <div className="absolute inset-0 animate-pulse rounded-full bg-blue-100 blur-3xl dark:bg-blue-900/20" />
        <div className="relative flex h-32 w-32 items-center justify-center rounded-3xl bg-white shadow-xl dark:bg-slate-900">
          <FileQuestion size={64} className="text-blue-600" strokeWidth={1.5} />
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white sm:text-3xl">
          Упс! Похоже, вы потерялись
        </h2>
        <p className="text-muted-foreground">
          Страница, которую вы ищете, не существует или была перемещена в другое созвездие.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full bg-blue-500 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-blue-600 hover:shadow-lg active:scale-95"
        >
          <Home size={18} />
          На главную
        </Link>
        
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-medium transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900"
        >
          <ArrowLeft size={18} />
          Вернуться назад
        </button>
      </div>
    </div>
  );
}