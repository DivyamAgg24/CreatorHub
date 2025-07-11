import { useState, useEffect, useRef } from 'react';
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