import { Lightbulb, Pen, BarChart3, BookOpen } from 'lucide-react';

export const Features = () => {
    return <div className="flex flex-col gap-y-12 mt-10 mb-10">
        <div className="flex justify-center text-3xl font-bold text-slate-700">
            Everything you need for your creative journey
        </div>
        <div className="grid grid-cols-4 mx-32 place-items-center h-44 gap-x-8">
            <div className="bg-slate-700 rounded-lg h-full w-full relative text-white">
                <div className="bg-blue-500 rounded-md relative p-2  w-fit left-6 -top-5 z-2">
                    <Lightbulb stroke='white' />
                </div>
                <div className='px-3 text-lg font-medium'>Idea Management</div>
                <div className='px-3 my-2'>Easily create, organize, and manage all your creative ideas in one place with intuitive tools.</div>
            </div>
            <div className="bg-slate-700 rounded-lg h-full w-full relative text-white">
                <div className="bg-purple-500 rounded-md relative p-2  w-fit left-6 -top-5 z-2">
                    <Pen stroke='white' />
                </div>
                <div className='px-3 text-lg font-medium'>Idea Management</div>
                <div className='px-3 my-2'>Easily create, organize, and manage all your creative ideas in one place with intuitive tools.</div>
            </div>
            <div className="bg-slate-700 rounded-lg h-full w-full relative text-white">
                <div className="bg-green-500 rounded-md relative p-2  w-fit left-6 -top-5 z-2">
                    <BarChart3 stroke='white' />
                </div>
                <div className='px-3 text-lg font-medium'>Idea Management</div>
                <div className='px-3 my-2'>Easily create, organize, and manage all your creative ideas in one place with intuitive tools.</div>
            </div>
            <div className="bg-slate-700 rounded-lg h-full w-full relative text-white">
                <div className="bg-yellow-500 rounded-md relative p-2  w-fit left-6 -top-5 z-2">
                    <BookOpen stroke='white' />
                </div>
                <div className='px-3 text-lg font-medium'>Idea Management</div>
                <div className='px-3 my-2'>Easily create, organize, and manage all your creative ideas in one place with intuitive tools.</div>
            </div>
            
        </div>
    </div>
}