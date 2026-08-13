import Icon from './icons';

export default function ChatHeader({ onClose }) {
  return (
    <div className="p-4 border-b border-slate-200 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Icon name="bot" className="w-6 h-6 text-blue-600" />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">Healthcare Assistant</h3>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-xs text-slate-500">Online</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600"
          aria-label="Close chat"
        >
          <Icon name="close" className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}