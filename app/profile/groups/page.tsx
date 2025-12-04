"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {getSession} from "@/utils/session";
import {getAllGroups} from "@/utils/functions";
import ErrorMessage from "@/components/notify-alert";
import Link from "next/link";
import {SearchX} from "lucide-react";

export default function MeGuilds() {
    const [pageLoaded, setPageLoaded] = useState(false);
    const [groups, setGroups] = useState([]);
    const [notifyMessage, setNotifyMessage] = useState('');
    const [notifyType, setNotifyType] = useState('');
    const router = useRouter();

    useEffect(() => {
        async function load(){
            const userData = await getSession();
            if (!userData){
                router.push("/login?to=me/guilds");
                return;
            }

            const response = await getAllGroups();
            if (!response.success){
                setNotifyMessage(response.message);
                setNotifyType('error');
            }else{
                setGroups(response.data)
                setPageLoaded(true)
            }
        }
        load();
    }, [router]);

    const handleClose = () => setNotifyMessage('');

    if (!pageLoaded) {
        return (
            <>
                {notifyMessage && <ErrorMessage message={notifyMessage} onClose={handleClose} type={notifyType} />}
            </>
        );
    }

    return (
        <div className="w-full px-2">
            {notifyMessage && <ErrorMessage message={notifyMessage} onClose={handleClose} type={notifyType} />}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Группы</h1>
                <Link
                    href="/guilds/create"
                >
                    Создать группу
                </Link>
            </div>

            {groups.length > 0 ? (
                <div className="grid gap-2 grid-cols-1 xl:grid-cols-2 w-fit">
                    {groups.map((group: any) => (
                        <div
                            key={group.url}
                            className="flex flex-col p-4 rounded-lg
                            bg-white dark:bg-zinc-800 dark:border-zinc-700
                            hover:border-[#F38F54] transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-row items-start gap-4">
                                    <div className="flex-1 space-y-3">
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                            {group.name}
                                        </h3>
                                        <p>Создана {new Date(group.created_by).toLocaleString("ru-RU")}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="w-fit bg-white dark:bg-zinc-800 rounded-lg p-6 border-2
                border-zinc-200 dark:border-zinc-700 shadow-md">
                    <div className="flex flex-col gap-4">
                        <SearchX className="h-16 w-16 text-gray-500 dark:text-gray-400" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Группы не найдены
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300">
                            Добавьте новую или подождите, пока добавят остальные
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}