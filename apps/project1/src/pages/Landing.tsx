import { Features } from "../components/ui/Features"
import { Hero1 } from "../components/ui/HeroSection1"

export const Landing = () => {
    return <div className="">
        <div className="mx-10 pb-10">
            <Hero1></Hero1>
            {/* <div className="ml-5">
                <Button className="" size="lg">Start Now</Button>
            </div> */}
        </div>
        <Features />
    </div>
}
{/* <div className='flex justify-center'>
    <div className='flex items-center'>
        <input placeholder="Idea..." className='border rounded px-1' />
        <button className='border rounded mx-2 px-2 hover:bg-black hover:text-white'>Add</button>
    </div>
</div> */}