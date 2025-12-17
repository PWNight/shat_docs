"use client"
import {useActionState, useEffect, useState} from "react";
import { useRouter } from "next/navigation";
import {getSession} from "@/utils/session";
import {getAllGroups} from "@/utils/functions";
import ErrorMessage from "@/components/notify-alert";
import {Loader2, SearchX} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {CreateGroup} from "@/utils/handlers";
import Link from "next/link";

export default function ProfileGroups() {
    const [userData, setUserData] = useState(Object)
    const [pageLoaded, setPageLoaded] = useState(false);
    const [groups, setGroups] = useState([]);
    const [notifyMessage, setNotifyMessage] = useState('');
    const [notifyType, setNotifyType] = useState('');
    const router = useRouter();
    const [state, action, pending] = useActionState(CreateGroup, undefined);

    useEffect(() => {
        getSession().then(async session => {
            if (!session){
               router.push("/login?to=profile/groups");
               return;
            }
            setUserData({email: session.email, uid: session.uid});

            const response = await getAllGroups();
            if (!response.success){
                setNotifyMessage(response.message);
                setNotifyType('error');
                return;
            }
            setGroups(response.data)
            setPageLoaded(true)
        })
    }, [router]);

    const handleClose = () => setNotifyMessage('');

    if (!pageLoaded) {
        return (
            <>
                {notifyMessage && <ErrorMessage message={notifyMessage} onClose={handleClose} type={notifyType} />}
            </>
        );
    }

    const GroupCreateForm = () => {
        const [open, setOpen] = useState(false);
        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <button>
                        Создать группу
                    </button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className={'text-3xl font-bold mb-4 select-none'}>Создание группы</DialogTitle>
                        <form
                            action={action}
                        >
                            <div className="mb-2">
                                <label htmlFor="username" className="block mb-1 font-medium text-sm">
                                    Название группы
                                </label>
                                <input
                                    type="text"
                                    autoComplete="name"
                                    id="name"
                                    name="name"
                                    className="shadow-lg w-full px-4 py-3 bg-gray-50  border border-gray-200  rounded-lg focus:ring focus:ring-blue-400 focus:border-blue-400 outline-none transition-all placeholder-gray-400"
                                    placeholder="44-W"
                                />
                                <input
                                    type="text"
                                    autoComplete="name"
                                    id="fk_user"
                                    name="fk_user"
                                    className={'hidden'}
                                    defaultValue={userData.uid}
                                />
                                {state?.errors?.name && (
                                    <p className="text-red-400 text-sm mt-2">{state.errors.name}</p>
                                )}
                                {state?.errors?.fk_user && (
                                    <p className="text-red-400 text-sm mt-2">{state.errors.fk_user}</p>
                                )}
                            </div>
                            {state?.message && (
                                <p className="text-red-400 text-sm mb-2">{state.message}</p>
                            )}
                            <button
                                type="submit"
                                className="w-full bg-blue-400 hover:bg-blue-500 text-white font-medium py-3 px-5 rounded-lg focus:ring-2 focus:ring-blue-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg select-none"
                                disabled={pending}
                            >
                                {pending ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Выполняю...
                                    </>
                                ) : (
                                    "Создать"
                                )}
                            </button>
                        </form>
                    </DialogHeader>
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <div className="w-full px-2 mt-4">
            {notifyMessage && <ErrorMessage message={notifyMessage} onClose={handleClose} type={notifyType} />}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Группы</h1>
                <GroupCreateForm />
            </div>

            {groups.length > 0 ? (
                <div className="grid gap-2 grid-cols-1 xl:grid-cols-2 w-fit">
                    {groups.map((group: any) => (
                        <div
                            key={group.id}
                            className="flex flex-col p-4 rounded-lg
                            bg-white dark:bg-zinc-800 dark:border-zinc-700
                            hover:border-[#F38F54] transition-all duration-300 shadow-md hover:shadow-lg"
                        >
                            <div className="flex-1 space-y-2 mb-3">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                                    {group.name}
                                </h3>
                                <p>Создана: {new Date(group.created_by).toLocaleString("ru-RU")}</p>
                            </div>
                            <Link href={`groups/${group.id}`} className="bg-blue-400 hover:bg-blue-500 text-white text-center font-medium py-2 rounded-lg focus:ring-2 focus:ring-blue-300 transition-all shadow-md hover:shadow-lg select-none">Управлять</Link>
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