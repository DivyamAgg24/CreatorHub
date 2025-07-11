// import { useState, useMemo, useEffect } from "react";
// import { Calendar, momentLocalizer, ToolbarProps, View } from "react-big-calendar";
// import moment from "moment";
// import "react-big-calendar/lib/css/react-big-calendar.css";
// import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X, Clock } from "lucide-react";
// import { useIdeas } from "../../context/IdeasContext";
// import { Node, Descendant } from "slate";

// // Configure localizer for react-big-calendar
// const localizer = momentLocalizer(moment);

// // Helper function to get plain text from Slate nodes (copied from Ideas.jsx)
// const getPlainTextFromNodes = (nodes: Descendant[] | undefined): string => {
//   if (!nodes || !Array.isArray(nodes)) return "";
//   return nodes.map(node => Node.string(node)).join(" ");
// };

// interface Idea {
//   id: string;
//   title: string;
//   content: Descendant[];
//   tags: string[];
// }

// interface CalendarEvent {
//   id: string;
//   title: string;
//   start: Date;
//   end: Date;
//   ideaId: string;
//   allDay?: boolean;
// }

// interface SlotInfo {
//   start: Date;
//   end: Date;
//   slots: Date[];
//   action: "select" | "click" | "doubleClick";
// }

// const Schedule = () => {
//   const { ideas } = useIdeas();
//   const [events, setEvents] = useState<CalendarEvent[]>([]);
//   const [selectedDate, setSelectedDate] = useState<Date>(new Date());
//   const [showModal, setShowModal] = useState<boolean>(false);
//   const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
//   const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
//   const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null);
//   const [searchTerm, setSearchTerm] = useState<string>("");
//   const [duration, setDuration] = useState<number>(60); // Default duration in minutes

//   // Load events from localStorage on component mount
//   useEffect(() => {
//     const savedEvents = localStorage.getItem("scheduledEvents");
//     if (savedEvents) {
//       const parsedEvents = JSON.parse(savedEvents).map((event: any) => ({
//         ...event,
//         start: new Date(event.start),
//         end: new Date(event.end)
//       }));
//       setEvents(parsedEvents);
//     }
//   }, []);

//   // Save events to localStorage whenever events change
//   useEffect(() => {
//     localStorage.setItem("scheduledEvents", JSON.stringify(events));
//   }, [events]);

//   // Filter ideas based on search term
//   const filteredIdeas = useMemo(() => {
//     return ideas.filter((idea: Idea) => {
//       if (!searchTerm) return true;

//       const searchTermLower = searchTerm.toLowerCase();
//       const contentText = getPlainTextFromNodes(idea.content);

//       return (
//         idea.title.toLowerCase().includes(searchTermLower) ||
//         contentText.toLowerCase().includes(searchTermLower) ||
//         (idea.tags && idea.tags.some(tag => tag.toLowerCase().includes(searchTermLower)))
//       );
//     });
//   }, [ideas, searchTerm]);

//   // Handle slot selection (clicking on a time slot in the calendar)
//   const handleSelectSlot = (slotInfo: SlotInfo) => {
//     setSelectedSlot(slotInfo);
//     setSelectedEvent(null);
//     setShowModal(true);
//   };

//   // Handle event selection (clicking on an existing event)
//   const handleSelectEvent = (event: CalendarEvent) => {
//     setSelectedEvent(event);
//     setSelectedIdea(ideas.find((idea: Idea) => idea.id === event.ideaId) || null);
//     setSelectedSlot(null);
//     setShowModal(true);
//   };

//   // Create a new event (schedule an idea)
//   const handleCreateEvent = () => {
//     if (!selectedIdea || !selectedSlot) return;

//     const startTime = selectedSlot.start;
//     const endTime = new Date(startTime.getTime() + (duration * 60000)); // Convert minutes to milliseconds

//     const newEvent = {
//       id: Date.now().toString(),
//       title: selectedIdea.title,
//       start: startTime,
//       end: endTime,
//       ideaId: selectedIdea.id,
//       allDay: selectedSlot.slots && selectedSlot.slots.length === 1 && selectedSlot.action === "click"
//     };

//     setEvents([...events, newEvent]);
//     setShowModal(false);
//     setSelectedSlot(null);
//     setSelectedIdea(null);
//   };

//   // Delete an existing event
//   const handleDeleteEvent = () => {
//     if (!selectedEvent) return;
//     setEvents(events.filter(event => event.id !== selectedEvent.id));
//     setShowModal(false);
//     setSelectedEvent(null);
//   };

//   // Custom components for the calendar
//   const components = {
//     toolbar: CustomToolbar as any,
//     event: CustomEvent as any
//   };

//   return (
//     <div className="relative h-screen px-6">
//       <div className="text-5xl mt-10 font-bold">
//         Schedule
//       </div>

//       <div className="border-b my-5 pb-2 border-gray-300">
//         <p className="text-gray-500">Plan and schedule your ideas</p>
//       </div>

//       <div className="h-5/6 pb-10">
//         <Calendar
//           localizer={localizer}
//           events={events}
//           startAccessor="start"
//           endAccessor="end"
//           style={{ height: "100%" }}
//           onSelectSlot={handleSelectSlot}
//           onSelectEvent={handleSelectEvent}
//           selectable
//           components={components}
//         />
//       </div>

//       {/* Modal for creating/editing events */}
//       {showModal && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white rounded-lg p-6 w-full max-w-md">
//             <div className="flex justify-between items-center mb-4">
//               <h2 className="text-xl font-semibold">
//                 {selectedEvent ? "Event Details" : "Schedule an Idea"}
//               </h2>
//               <button 
//                 onClick={() => setShowModal(false)}
//                 className="p-1 hover:bg-gray-100 rounded-full"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             {selectedEvent ? (
//               // View/Edit existing event
//               <div>
//                 <div className="mb-4">
//                   <h3 className="font-medium text-lg">{selectedEvent.title}</h3>
//                   {selectedIdea && (
//                     <div className="mt-2 text-gray-600">
//                       <p>{getPlainTextFromNodes(selectedIdea.content).substring(0, 100)}...</p>

//                       {selectedIdea.tags && selectedIdea.tags.length > 0 && (
//                         <div className="flex gap-1 mt-2 flex-wrap">
//                           {selectedIdea.tags.map(tag => (
//                             <span key={tag} className="bg-gray-200 text-gray-700 px-2 py-1 rounded-md text-xs">
//                               {tag}
//                             </span>
//                           ))}
//                         </div>
//                       )}
//                     </div>
//                   )}

//                   <div className="flex items-center gap-2 mt-4 text-gray-600">
//                     <CalendarIcon size={16} />
//                     <span>
//                       {moment(selectedEvent.start).format("MMM D, YYYY")}
//                     </span>
//                   </div>

//                   <div className="flex items-center gap-2 mt-2 text-gray-600">
//                     <Clock size={16} />
//                     <span>
//                       {selectedEvent.allDay 
//                         ? "All day" 
//                         : `${moment(selectedEvent.start).format("h:mm A")} - ${moment(selectedEvent.end).format("h:mm A")}`}
//                     </span>
//                   </div>
//                 </div>

//                 <div className="flex justify-end gap-3 mt-6">
//                   <button
//                     onClick={handleDeleteEvent}
//                     className="px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200"
//                   >
//                     Delete
//                   </button>
//                   <button
//                     onClick={() => setShowModal(false)}
//                     className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
//                   >
//                     Close
//                   </button>
//                 </div>
//               </div>
//             ) : (
//               // Create new event
//               <div>
//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Date
//                   </label>
//                   <div className="px-3 py-2 border rounded-md bg-gray-50">
//                     {moment(selectedSlot.start).format("MMMM D, YYYY")}
//                   </div>
//                 </div>

//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Time
//                   </label>
//                   <div className="px-3 py-2 border rounded-md bg-gray-50">
//                     {selectedSlot.slots && selectedSlot.slots.length === 1 && selectedSlot.action === "click"
//                       ? "All day"
//                       : moment(selectedSlot.start).format("h:mm A")}
//                   </div>
//                 </div>

//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Duration (minutes)
//                   </label>
//                   <input
//                     type="number"
//                     min="15"
//                     step="15"
//                     value={duration}
//                     onChange={(e) => setDuration(Number(e.target.value))}
//                     className="w-full px-3 py-2 border rounded-md"
//                   />
//                 </div>

//                 <div className="mb-4">
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Select Idea
//                   </label>
//                   <input
//                     type="text"
//                     placeholder="Search ideas..."
//                     value={searchTerm}
//                     onChange={(e) => setSearchTerm(e.target.value)}
//                     className="w-full px-3 py-2 border rounded-md mb-2"
//                   />

//                   <div className="max-h-40 overflow-y-auto border rounded-md">
//                     {filteredIdeas.length > 0 ? (
//                       filteredIdeas.map(idea => (
//                         <div
//                           key={idea.id}
//                           onClick={() => setSelectedIdea(idea)}
//                           className={`p-2 cursor-pointer hover:bg-gray-100 ${
//                             selectedIdea?.id === idea.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
//                           }`}
//                         >
//                           <div className="font-medium">{idea.title}</div>
//                           <div className="text-sm text-gray-500 truncate">
//                             {getPlainTextFromNodes(idea.content).substring(0, 60)}...
//                           </div>
//                         </div>
//                       ))
//                     ) : (
//                       <div className="p-3 text-center text-gray-500">
//                         No ideas found. Try a different search term.
//                       </div>
//                     )}
//                   </div>
//                 </div>

//                 <div className="flex justify-end gap-3 mt-6">
//                   <button
//                     onClick={() => setShowModal(false)}
//                     className="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     onClick={handleCreateEvent}
//                     disabled={!selectedIdea}
//                     className={`px-4 py-2 rounded ${
//                       selectedIdea
//                         ? "bg-blue-600 text-white hover:bg-blue-700"
//                         : "bg-blue-300 text-white cursor-not-allowed"
//                     }`}
//                   >
//                     Schedule
//                   </button>
//                 </div>
//               </div>
//             )}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// // Custom toolbar component for the calendar
// const CustomToolbar = ({ label, onNavigate, onView }: ToolbarProps) => {
//   return (
//     <div className="flex justify-between items-center mb-4">
//       <div className="flex items-center gap-2">
//         <button
//           onClick={() => onNavigate("PREV")}
//           className="p-1 hover:bg-gray-100 rounded"
//         >
//           <ChevronLeft />
//         </button>
//         <button
//           onClick={() => onNavigate("TODAY")}
//           className="px-3 py-1 text-sm hover:bg-gray-100 rounded"
//         >
//           Today
//         </button>
//         <button
//           onClick={() => onNavigate("NEXT")}
//           className="p-1 hover:bg-gray-100 rounded"
//         >
//           <ChevronRight />
//         </button>
//         <span className="font-semibold text-lg ml-2">{label}</span>
//       </div>

//       <div className="flex gap-2">
//         <button
//           onClick={() => onView("month")}
//           className="px-3 py-1 text-sm hover:bg-gray-100 rounded"
//         >
//           Month
//         </button>
//         <button
//           onClick={() => onView("week")}
//           className="px-3 py-1 text-sm hover:bg-gray-100 rounded"
//         >
//           Week
//         </button>
//         <button
//           onClick={() => onView("day")}
//           className="px-3 py-1 text-sm hover:bg-gray-100 rounded"
//         >
//           Day
//         </button>
//         <button
//           onClick={() => onView("agenda")}
//           className="px-3 py-1 text-sm hover:bg-gray-100 rounded"
//         >
//           Agenda
//         </button>
//       </div>
//     </div>
//   );
// };

// // Custom event component to style events in the calendar
// interface EventProps {
//   event: {
//     title: string;
//     start: Date;
//     end: Date;
//     ideaId: string;
//     id: string;
//     allDay?: boolean;
//   };
// }

// const CustomEvent = ({ event }: EventProps) => {
//   return (
//     <div className="bg-blue-100 border-l-2 border-blue-500 p-1 overflow-hidden text-blue-800">
//       <div className="font-medium text-sm truncate">{event.title}</div>
//     </div>
//   );
// };

// export default Schedule;

import React, { useState, useEffect, useRef } from 'react';
import {
    EventApi,
    DateSelectArg,
    EventClickArg,
    EventContentArg,
    formatDate,
} from '@fullcalendar/core';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useEvents, CalendarEvent } from './../../context/EventsContext';
import EventModal from './../../components/ui/EventModal';

interface SchedulerProps {
    userId: number;
}

const Scheduler = () => {
    const [weekendsVisible, setWeekendsVisible] = useState(true);
    const [currentEvents, setCurrentEvents] = useState<EventApi[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
    const [selectedDates, setSelectedDates] = useState<DateSelectArg | null>(null);

    // Use the EventsContext instead of direct API calls
    const {
        events,
        loading,
        error,
        fetchEvents,
        addEvent,
        updateEvent,
        deleteEvent,
        getEventsForFullCalendar
    } = useEvents();

    const calendarRef = useRef<FullCalendar>(null);

    // Fetch events from context on component mount
    useEffect(() => {
        fetchEvents();
    }, []);

    // Update calendar when events change in context
    useEffect(() => {
        if (calendarRef.current && events.length > 0) {
            const calendarApi = calendarRef.current.getApi();
            calendarApi.removeAllEvents();

            // Add events from context to the calendar
            const fullCalendarEvents = getEventsForFullCalendar();
            fullCalendarEvents.forEach(event => {
                calendarApi.addEvent(event);
            });
        }
    }, [events]);

    const handleWeekendsToggle = () => {
        setWeekendsVisible(!weekendsVisible);
    };

    const handleDateSelect = (selectInfo: DateSelectArg) => {
        setSelectedDates(selectInfo);
        setSelectedEvent(null);
        setIsModalOpen(true);
    };

    const handleEventClick = (clickInfo: EventClickArg) => {
        // Find the corresponding event from our context
        const eventId = clickInfo.event.id;
        const contextEvent = events.find(event => event.id === eventId);

        if (contextEvent) {
            setSelectedEvent(contextEvent);
            setSelectedDates(null);
            setIsModalOpen(true);
        }
    };

    const handleEvents = (events: EventApi[]) => {
        setCurrentEvents(events);
    };

    const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
        try {
            if (selectedEvent) {
                // Update existing event using context
                // Ensure dates are properly formatted for the API
                const updatedEvent: CalendarEvent = {
                    ...selectedEvent,
                    title: eventData.title || selectedEvent.title,
                    start: formatDateForAPI(eventData.start) || formatDateForAPI(selectedEvent.start),
                    end: eventData.end ? formatDateForAPI(eventData.end) : undefined,
                    allDay: eventData.allDay ?? selectedEvent.allDay,
                    description: eventData.description,
                    color: eventData.color
                };

                const success = await updateEvent(updatedEvent);

                if (!success) {
                    console.error("Failed to update event through context");
                }
            } else if (selectedDates) {
                const userString = JSON.parse(localStorage.getItem("user"))
                // Create new event using context
                // For new events from date selection, ensure we format the dates properly
                const newEvent: Omit<CalendarEvent, 'id' | "userId"> = {
                    title: eventData.title || 'New Event',
                    start: formatDateForAPI(eventData.start) || selectedDates.startStr,
                    end: eventData.end ? formatDateForAPI(eventData.end) : selectedDates.endStr,
                    allDay: eventData.allDay ?? selectedDates.allDay,
                    description: eventData.description,
                    color: eventData.color,
                    //   userId: userString.id
                };

                console.log('Creating new event with data:', newEvent);
                const createdEvent = await addEvent(newEvent);

                if (!createdEvent) {
                    console.error("Failed to create event through context");
                }
            }
        } catch (err) {
            console.error('Error saving event:', err);
        }

        // Close the modal and reset selection
        setIsModalOpen(false);
        setSelectedEvent(null);
        setSelectedDates(null);
    };

    // Helper function to ensure consistent date formatting for API calls
    const formatDateForAPI = (date: Date | string | undefined): string => {
        if (!date) return '';

        if (typeof date === 'string') {
            // If already a string, ensure it's in ISO format
            // Try to parse and convert to ensure valid format
            try {
                return new Date(date).toISOString();
            } catch (e) {
                console.error('Invalid date string:', date);
                return '';
            }
        }

        // If it's a Date object, convert to ISO string
        return date.toISOString();
    };

    const handleDeleteEvent = async () => {
        if (!selectedEvent) return;

        try {
            const success = await deleteEvent(selectedEvent.id);

            if (!success) {
                console.error("Failed to delete event through context");
            }
        } catch (err) {
            console.error('Error deleting event:', err);
        }

        // Close the modal and reset selection
        setIsModalOpen(false);
        setSelectedEvent(null);
        setSelectedDates(null);
    };

    const renderEventContent = (eventContent: EventContentArg) => {
        return (
            <>
                <b>{eventContent.timeText}</b>
                <i>{eventContent.event.title}</i>
            </>
        );
    };

    const renderSidebarEvent = (event: EventApi) => {
        return (
            <li key={event.id} className="p-2 mb-1 bg-gray-100 rounded">
                <b>{formatDate(event.start!, { year: 'numeric', month: 'short', day: 'numeric' })}</b>
                <i className="ml-2">{event.title}</i>
            </li>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row h-full">
            <div className="w-full lg:w-64 p-4 bg-white border-r">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-2">Calendar Settings</h2>
                    <label className="flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={weekendsVisible}
                            onChange={handleWeekendsToggle}
                            className="mr-2"
                        />
                        <span>Show weekends</span>
                    </label>
                </div>

                <div>
                    <h2 className="text-lg font-semibold mb-2">
                        Events ({currentEvents.length})
                    </h2>
                    {loading ? (
                        <p>Loading events...</p>
                    ) : error ? (
                        <p className="text-red-500">{error}</p>
                    ) : (
                        <ul className="space-y-1 max-h-96 overflow-y-auto">
                            {currentEvents.map(renderSidebarEvent)}
                        </ul>
                    )}
                </div>
            </div>

            <div className="flex-1 p-4">
                <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    initialView="dayGridMonth"
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={true}
                    weekends={weekendsVisible}
                    select={handleDateSelect}
                    eventContent={renderEventContent}
                    eventClick={handleEventClick}
                    eventsSet={handleEvents}
                    height="auto"
                />
            </div>

            <EventModal
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedEvent(null);
                    setSelectedDates(null);
                }}
                onSave={handleSaveEvent}
                onDelete={handleDeleteEvent}
                selectedEvent={selectedEvent}
                selectedDates={selectedDates}
            />
        </div>
    );
};

export default Scheduler;