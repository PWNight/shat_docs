import { CodeXml } from "lucide-react";

export default function InDev() {
    return (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-md p-8 py-9 flex flex-col items-center transition-all duration-300 hover:shadow-lg">
            <CodeXml className="h-24 w-24 text-blue-500 dark:text-blue-400 mb-6" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">В разработке</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 text-center">
                Мы активно работаем над выпуском данного функционала
            </p>
        </div>
    );
}