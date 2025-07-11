import { useNavigate } from "react-router-dom"

export const Topbar = () => {
    const navigate = useNavigate()
    return <div className="px-10 py-2  border-gray-400 shadow-md">
        <div className='flex justify-between  text-slate-600 border-gray-300 px-5 py-4 '>
            <div className="flex gap-x-4 items-center">
                <div className="font-bold text-xl">
                    CreatorHub
                </div>
                <button className="font-medium text-slate-600 hover:text-black cursor-pointer" onClick={()=>navigate("/")}>Home</button>
                <button className="font-medium text-slate-600 hover:text-black cursor-pointer" onClick={()=>navigate("/ideas")}>Ideas</button>
                <button className="font-medium text-slate-600 hover:text-black cursor-pointer" onClick={()=>navigate("/schedule")}>Schedule</button>
            </div>
            <div className="flex gap-x-4 font-medium text-slate-600">
                <button className="hover:text-black cursor-pointer" onClick={()=>navigate("/login")}>Login</button>
                <button className="hover:text-black cursor-pointer" onClick={()=>navigate("/register")}>Register</button>
            </div>
        </div>
    </div>
}