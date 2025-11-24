"use client"
import {useState} from "react";
import {Loader2} from "lucide-react";

export default function LoginPage() {
    const pending = useState(false);
    return (
        <div className={'w-full h-screen flex items-center justify-center'}>
            <form className={'shadow-xl bg-white p-8 flex flex-col gap-2 rounded-xl'}>
                <h1 className={'text-4xl font-bold text-gray-900 mb-8 text-center'}>Вход в систему</h1>
                <div className={'flex flex-col gap-2'}>
                    <input
                        className={'px-4 py-2 border rounded-lg focus:ring outline-none transition-all border-gray-600 placeholder-gray-600'}
                        type="password"
                        name={'password'}
                        placeholder={'Введите пароль'}
                        autoComplete={'password'}
                    />
                    <input
                        className={'px-4 py-2 border rounded-lg focus:ring outline-none transition-all border-gray-600 placeholder-gray-600'}
                        type={'email'}
                        name={'username'}
                        placeholder={'Введите почту'}
                        autoComplete={'email'}
                    />
                </div>
                <button
                    type="submit"
                    className="w-full bg-[#F38F54] hover:bg-orange-500 text-white font-medium py-3 px-5 rounded-lg focus:ring-4 focus:ring-orange-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg select-none"
                    disabled={pending}
                >
                    {pending ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Вход...
                        </>
                    ) : (
                        "Войти"
                    )}
                </button>
            </form>
        </div>
    )
}