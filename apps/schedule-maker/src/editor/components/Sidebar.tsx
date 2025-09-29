import React from "react";
import DayCard from "./DayCard";

const Sidebar = () => {
  const week = [
    { day: "Monday", events: ["Meeting 1", "Call 2"] },
    { day: "Tuesday", events: ["Event A", "Event B"] },
    { day: "Wednesday", events: ["Workshop"] },
    { day: "Thursday", events: ["Review", "Sync"] },
    { day: "Friday", events: ["Party 🎉"] },
  ];

  return (
    <div className="h-full w-64 space-y-3 overflow-y-auto border-r bg-gray-50 p-3">
      {week.map((d) => (
        <DayCard key={d.day} day={d.day} events={d.events} />
      ))}
    </div>
  );
};

export default Sidebar;
