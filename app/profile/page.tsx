"use client"
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {getSession} from "@/utils/session";

export default function Profile() {
    const router = useRouter()

    useEffect(()=>{
        async function getInfo(){
            const data = await getSession();
            if ( !data ){
                router.push("/login");
            }
        }
        getInfo()
    },[router])

    return (
        <div>
            <h1>Добро пожаловать</h1>
        </div>
    )
}