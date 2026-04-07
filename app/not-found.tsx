import Link from "next/link";

export default function NotFound() {
    return (
        <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3 px-4 text-center">
            <h2 className="text-3xl font-bold">404</h2>
            <p className="text-muted-foreground">Страница не найдена или была перемещена.</p>
            <Link href="/" className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                На главную
            </Link>
        </div>
    );
}
