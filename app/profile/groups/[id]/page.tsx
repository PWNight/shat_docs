"use client"
import { useRouter } from"next/navigation";
import { useEffect, useState } from"react";
import { Loader2, Pencil } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ErrorMessage from "@/components/notify-alert";
import {getSession} from "@/utils/session";
import {getGroup} from "@/utils/functions";
type PageProps = {
    params: Promise<{ id: string }>;
};

export default function MyGuild(props: PageProps) {
    const [userData, setUserData] = useState(Object)
    const [group, setGroup] = useState(Object)
    const [updateFormData, setUpdateFormData] = useState(Object)

    const [pageLoaded, setPageLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const [notifyMessage, setNotifyMessage] = useState('');
    const [notifyType, setNotifyType] = useState('');

    const [groupId, setGroupId] = useState('');
    const router = useRouter();

    useEffect(() => {
        getSession().then(async session => {
            const params = await props.params;
            setGroupId(params.id);

            if (!session){
                router.push(`/login?to=profile/groups/${params.id}`);
                return;
            }
            setUserData({email: session.email, uid: session.uid});

            const response = await getGroup(params.id);
            if (!response.success){
                setNotifyMessage(response.message);
                setNotifyType('error');
                return;
            }
            setGroup(response.data)
            setPageLoaded(true)
        })
    }, [props.params, router]);

    const handleUpdate = async(e: any) => {
        e.preventDefault();
        setIsLoading(true);

        const changedFormData = Object.keys(updateFormData).reduce((acc: any, key) => {
            if (updateFormData[key] !== group[key]) {
                acc[key] = updateFormData[key];
            }
            return acc;
        }, {});

        if (Object.keys(changedFormData).length === 0) {
            setNotifyMessage(`Внесите изменения, чтобы сохранить`)
            setNotifyType('warning')
            setIsLoading(false);
            return;
        }

        const response = await fetch(`/api/v1/groups/${groupId}`,{
            method: 'POST',
            body: JSON.stringify({name: changedFormData.name, fk_user: group.fk_user}),
        })

        if ( !response.ok ) {
            const errorData = await response.json()
            console.log(errorData)

            setNotifyMessage(`Произошла ошибка ${response.status} при обновлении группы`)
            setNotifyType('error')
            setIsLoading(false);
            return
        }

        setNotifyMessage(`Информация о группе успешно обновлена`)
        setNotifyType('success')

        setIsLoading(false)
    };

    const handleInputChange = (e: any) => {
        const { id, value } = e.target;
        setUpdateFormData({ ...updateFormData, [id]: value });
    };

    const GroupDeleteDialog = ({ onDelete }: { onDelete: () => void }) => {
        const [open, setOpen] = useState(false);

        const handleDeleteConfirm = () => {
            onDelete();
            setOpen(false);
        };

        return (
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <button>
                        Удалить гильдию
                    </button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Подтверждение удаления</DialogTitle>
                        <DialogDescription>
                            Вы уверены, что хотите удалить гильдию {group.name}? Это действие нельзя
                            отменить.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className='flex gap-2'>
                        <button
                            onClick={() => setOpen(false)}
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleDeleteConfirm}
                        >
                            Удалить
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        );
    };

    const handleDelete = async () => {
        const response = await fetch(`/api/v1/groups/${groupId}`,{
            method: 'DELETE',
            headers: {"Authorization": `Bearer ${userData.token}`}
        })

        if (!response.ok) {
            const errorData = await response.json()
            console.log(errorData)

            setNotifyMessage(`Произошла ошибка ${response.status} при удалении группы`)
            setNotifyType('error')
            return
        }

        router.push('/profile/guilds')
    }

    const handleClose = () => {
        setNotifyMessage('')
    }

    if( pageLoaded ) {
        return (
            <div className='mt-4'>
                { notifyMessage && <ErrorMessage message={notifyMessage} onClose={handleClose} type={notifyType} />}
                <h1 className="text-3xl font-bold mb-4 sm:ml-0 ml-4">Редактирование гильдии</h1>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:w-fit">
                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg shadow h-fit">
                        <div className="p-4">
                            <form onSubmit={handleUpdate}>
                                <div className="mb-4">
                                    <label htmlFor="name" className="block font-medium mb-2">Название группы</label>
                                    <input
                                        type="text"
                                        id="name"
                                        placeholder="Введите новое название"
                                        defaultValue={group.name}
                                        onChange={handleInputChange}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 dark:bg-neutral-700 dark:border-gray-600 dark:text-white"
                                    />
                                </div>
                                <button type="submit" disabled={isLoading} className={'flex'}>
                                    {isLoading ? <><Loader2 className="mr-2 animate-spin" /> Выполняю..</> : <><Pencil className="mr-2" />Сохранить изменения</>}
                                </button>

                            </form>
                        </div>
                    </div>

                    <div className="bg-neutral-100 dark:bg-neutral-800 rounded-lg shadow h-fit">
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <h2 className="text-xl font-semibold">Действия</h2>
                        </div>
                        <div className="p-4">
                            <div className="mt-4 flex flex-col gap-2">
                                <GroupDeleteDialog onDelete={handleDelete} />

                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }else{
        return (
            <div>

            </div>
        )
    }
}