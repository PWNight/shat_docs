"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {getSession} from "@/utils/session";

export default function Me() {
    const [userData, setUserData] = useState(Object)
    const router = useRouter()

    useEffect(()=>{
        async function getInfo(){
            const data = await getSession();
            if ( data ){
                setUserData({email: data.email, uid: data.uid});
            }else{
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