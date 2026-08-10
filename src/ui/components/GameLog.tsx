/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface GameLogProps {
  logs: string[];
}

export const GameLog: React.FC<GameLogProps> = ({ logs }) => {
  return (
    <div className="w-full bg-[#1B1410] border border-[#3D322A] rounded-2xl p-4 shadow-lg">
      <h4 className="text-xs font-black uppercase tracking-wider text-[#D4A373] mb-2 flex items-center gap-1.5">
        <span>☕</span> Café Table Log
      </h4>
      <div className="max-h-28 overflow-y-auto space-y-1 text-xs text-[#A98467] pr-1">
        {logs.length === 0 ? (
          <p className="italic text-[#A98467]/60">No actions recorded yet.</p>
        ) : (
          logs.slice(-10).map((log, idx) => (
            <div key={idx} className="py-0.5 border-b border-[#3D322A]/50 last:border-0 text-[#FEFAE0]">
              <span className="text-[#D4A373] font-bold">•</span> {log}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
