import { cn } from '../lib/utils';

interface PlayerCardProps {
  player: any;
  schema: any;
  registrationNumber?: number | string;
  className?: string;
  layout?: 'horizontal' | 'vertical';
}

export default function PlayerCard({ player, schema, registrationNumber, className, layout = 'horizontal' }: PlayerCardProps) {
  if (!player || !schema) return null;

  // Filter out file fields and the basePrice as we might handle it differently (or include it if we want)
  const displayFields = schema.fields.filter(
    (f: any) => f.type !== 'file' && f.id !== 'photo' && f.id !== 'name'
  );

  return (
    <div 
      className={cn(
        "relative flex w-full max-w-4xl bg-[#030b20] border-2 border-blue-600/50 overflow-hidden shadow-[0_0_40px_rgba(37,99,235,0.3)] rounded-xl font-sans",
        className
      )}
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30,58,138,0.2) 0%, transparent 100%)'
      }}
    >
      {/* Sci-Fi Corners/Accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-400 rounded-tl-lg shadow-[0_0_15px_#60a5fa]" />
      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-400 rounded-tr-lg shadow-[0_0_15px_#60a5fa]" />
      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-400 rounded-bl-lg shadow-[0_0_15px_#60a5fa]" />
      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-400 rounded-br-lg shadow-[0_0_15px_#60a5fa]" />

      {/* Background Watermark */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.03] z-0">
        <span className="text-white font-black text-[10rem] md:text-[15rem] leading-none tracking-tighter -rotate-12 select-none whitespace-nowrap">
          AUCTION 47
        </span>
      </div>

      {/* Powered By Badge */}
      <div className="absolute bottom-4 right-10 z-20 flex items-center gap-1.5 opacity-60">
        <span className="text-[8px] sm:text-[10px] text-blue-300 font-bold uppercase tracking-widest">Powered by</span>
        <span className="text-[10px] sm:text-xs text-white font-black tracking-wider bg-blue-900/50 px-2 py-0.5 rounded border border-blue-500/30">AUCTION 47</span>
      </div>

      <div className={cn(
        "flex w-full p-6 sm:p-8 gap-6 sm:gap-10 relative z-10",
        layout === 'vertical' ? 'flex-col' : 'flex-col sm:flex-row'
      )}>
        
        {/* LEFT COLUMN: Photo Frame & Reg Number */}
        <div className="flex flex-col items-center shrink-0">
          <div className="relative p-1 bg-gradient-to-b from-blue-400 to-blue-900 rounded-lg shadow-[0_0_20px_rgba(59,130,246,0.6)]">
            <div className="absolute -inset-1 bg-blue-500 opacity-20 blur-md rounded-lg animate-pulse" />
            <div className="relative bg-[#020617] rounded p-1 border border-blue-500/30">
              <img 
                src={player.photo || 'https://via.placeholder.com/300x400?text=No+Photo'} 
                alt={player.name} 
                className="w-48 h-64 sm:w-64 sm:h-80 object-cover rounded shadow-inner"
              />
              
              {/* Sci-fi crosshair overlays on the image */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400" />
            </div>
          </div>

          {/* Registration Number Badge */}
          {(registrationNumber !== undefined) && (
            <div className="mt-4 px-8 py-2 bg-blue-900 border-2 border-blue-400 rounded shadow-[0_0_15px_#3b82f6] text-center w-full max-w-[200px]">
              <span className="text-blue-100 font-black text-2xl tracking-widest">{registrationNumber}</span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Player Details */}
        <div className="flex-1 flex flex-col justify-center pt-2 pb-12 min-w-0">
          
          {/* Main Name Field */}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-cyan-400 font-bold uppercase tracking-widest text-sm shrink-0">NAME</span>
              <div className="h-[2px] flex-1 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></div>
            </div>
            <div className="text-white font-black text-3xl sm:text-4xl uppercase pl-4 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] truncate">
              {player.name}
            </div>
          </div>

          {/* Dynamic Fields */}
          <div className="space-y-4">
            {displayFields.map((field: any) => {
              const val = player[field.id];
              if (!val) return null; // Skip empty fields if desired, or show "N/A"
              
              return (
                <div key={field.id}>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-cyan-400 font-bold uppercase tracking-widest text-xs shrink-0">
                      {field.label}
                    </span>
                    <div className="h-[2px] flex-1 bg-blue-800/80 shadow-[0_0_8px_#1e40af] relative overflow-hidden">
                       <div className="absolute top-0 left-0 h-full w-1/3 bg-blue-500 blur-[1px]"></div>
                    </div>
                  </div>
                  <div className="text-white font-black text-xl uppercase pl-4 drop-shadow-md truncate">
                    {String(val)}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </div>
  );
}
