import React, { useState } from "react";

type DayCardProps = {
  day: string;
  events: string[];
};

const DayCard: React.FC<DayCardProps> = ({ day, events }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="border rounded-md bg-white shadow-sm">
      <div
        className="flex items-center justify-between px-3 py-2 cursor-pointer hover:bg-gray-100"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold">{day}</span>
        <span className="text-gray-500">{open ? "▼" : "▶"}</span>
      </div>
      {open && (
        <div className="px-3 pb-2">
          {events.map((event, i) => (
            <div
              key={i}
              className="text-sm text-gray-700 py-1 border-b last:border-none"
            >
              {event}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DayCard;
