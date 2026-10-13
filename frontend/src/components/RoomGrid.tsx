import React, { useState } from 'react';
import { Room } from '../types';
import { Home, Check, Info, Layers, Users, Search } from 'lucide-react';

interface RoomGridProps {
  rooms: Room[];
  selectedRoomIds: number[];
  onToggleRoom: (roomId: number) => void;
  maxSelections?: number;
  defaultFloor?: number;
}

export const RoomGrid: React.FC<RoomGridProps> = ({
  rooms,
  selectedRoomIds,
  onToggleRoom,
  maxSelections = 5,
  defaultFloor = 1,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<number | 'all'>(defaultFloor);
  const [searchTerm, setSearchTerm] = useState<string>('');

  React.useEffect(() => {
    if (defaultFloor) {
      setSelectedFloor(defaultFloor);
    }
  }, [defaultFloor]);

  const floors = Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b);

  const filteredRooms = rooms.filter(r => {
    if (selectedFloor !== 'all' && r.floor !== selectedFloor) return false;
    if (searchTerm.trim() && !r.room_number.toLowerCase().includes(searchTerm.trim().toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 w-full md:w-auto custom-scrollbar">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 mr-1 shrink-0">
            <Layers className="w-3.5 h-3.5 text-[#bf0c4e]" />
            Floor:
          </span>
          <button
            type="button"
            onClick={() => setSelectedFloor('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 ${
              selectedFloor === 'all'
                ? 'bg-[#bf0c4e] text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            All Floors ({rooms.length})
          </button>
          {floors.map(fl => {
            const count = rooms.filter(r => r.floor === fl).length;
            return (
              <button
                key={fl}
                type="button"
                onClick={() => setSelectedFloor(fl)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all shrink-0 ${
                  selectedFloor === fl
                    ? 'bg-[#bf0c4e] text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Floor {fl} ({count} rooms)
              </button>
            );
          })}
        </div>

        {/* Quick Search & Selection Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-700 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search room # (e.g. 105)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 placeholder-slate-500 focus:outline-none focus:border-[#bf0c4e] w-full sm:w-48 font-medium"
            />
          </div>

          <div className="text-xs text-slate-700 font-bold flex items-center gap-1.5 shrink-0">
            <Info className="w-3.5 h-3.5 text-[#bf0c4e] shrink-0" />
            <span>{selectedRoomIds.length}/{maxSelections} selected</span>
          </div>
        </div>
      </div>

      {/* Showing count banner */}
      <div className="flex items-center justify-between text-xs text-slate-700 font-medium px-1">
        <span>Showing {filteredRooms.length} rooms available on this level</span>
        {selectedRoomIds.length > 0 && (
          <span className="text-[#bf0c4e] font-bold">
            Preference priority 1 to {selectedRoomIds.length} assigned automatically
          </span>
        )}
      </div>

      {/* Room Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[520px] overflow-y-auto pr-1 custom-scrollbar">
        {filteredRooms.map((room) => {
          const isSelected = selectedRoomIds.includes(room.id);
          const priorityIndex = selectedRoomIds.indexOf(room.id) + 1;
          const isFull = room.available_beds <= 0;

          return (
            <div
              key={room.id}
              onClick={() => !isFull && onToggleRoom(room.id)}
              className={`relative rounded-2xl p-4 border transition-all cursor-pointer select-none group ${
                isSelected
                  ? 'bg-[#fdf2f6] border-[#bf0c4e] ring-2 ring-[#bf0c4e]/30 shadow-md'
                  : isFull
                  ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                  : 'bg-white border-slate-200 hover:border-[#bf0c4e] hover:shadow-sm'
              }`}
            >
              {/* Priority Badge */}
              {isSelected && (
                <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#bf0c4e] text-white text-xs font-bold flex items-center justify-center shadow-md">
                  #{priorityIndex}
                </div>
              )}

              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#bf0c4e] text-white' : 'bg-slate-100 text-slate-600 group-hover:text-[#bf0c4e]'}`}>
                  <Home className="w-4 h-4" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-slate-900 group-hover:text-[#bf0c4e] transition-colors">
                    Room {room.room_number}
                  </h5>
                  <span className="text-[11px] text-slate-700 font-medium">Floor {room.floor}</span>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1 text-slate-700 font-medium">
                  <Users className="w-3.5 h-3.5 text-slate-700" />
                  {room.sharing_capacity}-Share
                </span>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isFull
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : room.available_beds === room.sharing_capacity
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}
                >
                  {isFull ? 'Full' : `${room.available_beds} beds free`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
