import React from 'react';
import { getAllHotkeysWithLongDescriptions } from '@/data/hotkeys';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface HotkeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeysModal: React.FC<HotkeysModalProps> = ({ isOpen, onClose }) => {
  // Get hotkeys from centralized data source
  const hotkeys = getAllHotkeysWithLongDescriptions();

  // Split into two columns
  const mid = Math.ceil(hotkeys.length / 2);
  const leftColumn = hotkeys.slice(0, mid);
  const rightColumn = hotkeys.slice(mid);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="lg:min-w-[900px] w-[95vw] max-h-[65vh] top-[45vh]">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
        </DialogHeader>
        <div className="p-6 pt-0 overflow-y-scroll max-h-[calc(65vh-120px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="flex flex-col">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 bg-[#0f0f0f] text-[#9ca3af] text-xs font-bold uppercase tracking-wider border-b-2 border-[#3d3d3d]">
                      Key
                    </th>
                    <th className="text-left px-4 py-3 bg-[#0f0f0f] text-[#9ca3af] text-xs font-bold uppercase tracking-wider border-b-2 border-[#3d3d3d]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {leftColumn.map((hotkey, index) => (
                    <tr key={index} className="border-b border-[#2d2d2d]">
                      <td className="px-4 py-3 font-mono font-bold text-blue-500 text-sm min-w-[80px]">
                        {hotkey.key}
                      </td>
                      <td className="px-4 py-3 text-[#e5e7eb] text-sm">
                        {hotkey.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right Column */}
            <div className="flex flex-col">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left px-4 py-3 bg-[#0f0f0f] text-[#9ca3af] text-xs font-bold uppercase tracking-wider border-b-2 border-[#3d3d3d]">
                      Key
                    </th>
                    <th className="text-left px-4 py-3 bg-[#0f0f0f] text-[#9ca3af] text-xs font-bold uppercase tracking-wider border-b-2 border-[#3d3d3d]">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rightColumn.map((hotkey, index) => (
                    <tr key={index} className="border-b border-[#2d2d2d]">
                      <td className="px-4 py-3 font-mono font-bold text-blue-500 text-sm min-w-[80px]">
                        {hotkey.key}
                      </td>
                      <td className="px-4 py-3 text-[#e5e7eb] text-sm">
                        {hotkey.action}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
