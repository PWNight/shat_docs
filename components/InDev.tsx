import {CodeXml} from "lucide-react";


export default function InDev() {
    return (
        <div className="bg-neutral-100 rounded-sm p-4 py-14 dark:bg-neutral-800 flex flex-col w-fit">
            <CodeXml className='h-32 w-32'/>
            <h1 className='text-4xl'>В разработке</h1>
            <p className='text-2xl text-muted-foreground'>Мы активно работаем над выпуском данного функционала</p>
        </div>
    );
}