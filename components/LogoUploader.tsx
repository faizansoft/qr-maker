
import React from 'react';

interface LogoUploaderProps {
  onUpload: (src: string | null) => void;
  currentLogo: string | null;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ onUpload, currentLogo }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onUpload(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-semibold text-slate-700">Central Logo (Optional)</label>
      <div className="flex items-center gap-4">
        <div className="relative group cursor-pointer">
          <div className="w-16 h-16 rounded-xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden transition-all group-hover:border-indigo-400 group-hover:bg-indigo-50">
            {currentLogo ? (
              <img src={currentLogo} alt="Logo Preview" className="w-full h-full object-contain p-2" />
            ) : (
              <svg className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            )}
          </div>
          <input 
            type="file" 
            accept="image/*" 
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </div>
        
        {currentLogo && (
          <button 
            onClick={() => onUpload(null)}
            className="text-sm text-red-500 hover:text-red-600 font-medium"
          >
            Remove Logo
          </button>
        )}
        
        {!currentLogo && (
          <p className="text-xs text-slate-500">
            Upload PNG, JPG or SVG. <br/> Works best with high contrast.
          </p>
        )}
      </div>
    </div>
  );
};
