import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../../context/EventsContext';
import { DateSelectArg } from '@fullcalendar/core';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (event: Partial<CalendarEvent>) => void;
    onDelete?: () => void;
    selectedEvent?: CalendarEvent | null;
    selectedDates?: DateSelectArg | null;
}

const EventModal: React.FC<EventModalProps> = ({
    isOpen,
    onClose,
    onSave,
    onDelete,
    selectedEvent,
    selectedDates,
}) => {
    const [eventData, setEventData] = useState<Partial<CalendarEvent>>({
        title: '',
        description: '',
        allDay: false,
        color: '#3788d8', // Default color
    });

    // Update form when selectedEvent or selectedDates changes
    useEffect(() => {
        if (selectedEvent) {
            // Editing an existing event
            setEventData({
                id: selectedEvent.id,
                title: selectedEvent.title,
                start: selectedEvent.start,
                end: selectedEvent.end,
                allDay: selectedEvent.allDay,
                description: selectedEvent.description || '',
                color: selectedEvent.color || '#3788d8',
            });
        } else if (selectedDates) {
            // Creating a new event
            setEventData({
                title: '',
                start: selectedDates.startStr,
                end: selectedDates.endStr,
                allDay: selectedDates.allDay,
                description: '',
                color: '#3788d8',
            });
        }
    }, [selectedEvent, selectedDates]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checkbox = e.target as HTMLInputElement;
            setEventData(prev => ({ ...prev, [name]: checkbox.checked }));
        } else {
            setEventData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(eventData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">
                        {selectedEvent ? 'Edit Event' : 'Create Event'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700"
                    >
                        &times;
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <input
                            type="text"
                            name="title"
                            value={eventData.title || ''}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Start</label>
                            <input
                                type="datetime-local"
                                name="start"
                                value={eventData.start instanceof Date
                                    ? eventData.start.toISOString().slice(0, 16)
                                    : typeof eventData.start === 'string'
                                        ? eventData.start.slice(0, 16)
                                        : ''}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">End</label>
                            <input
                                type="datetime-local"
                                name="end"
                                value={eventData.end instanceof Date
                                    ? eventData.end.toISOString().slice(0, 16)
                                    : typeof eventData.end === 'string'
                                        ? eventData.end.slice(0, 16)
                                        : ''}
                                onChange={handleChange}
                                className="w-full p-2 border rounded"
                            />
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="allDay"
                                checked={eventData.allDay || false}
                                onChange={handleChange}
                                className="mr-2"
                            />
                            <span className="text-sm font-medium">All Day</span>
                        </label>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium mb-1">Description</label>
                        <textarea
                            name="description"
                            value={eventData.description || ''}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            rows={3}
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-1">Color</label>
                        <input
                            type="color"
                            name="color"
                            value={eventData.color || '#3788d8'}
                            onChange={handleChange}
                            className="w-full p-1 border rounded h-10"
                        />
                    </div>

                    <div className="flex justify-between">
                        {selectedEvent && onDelete && (
                            <button
                                type="button"
                                onClick={onDelete}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Delete
                            </button>
                        )}
                        <div className="ml-auto space-x-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;