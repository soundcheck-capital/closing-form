import React from 'react';

const ButtonPrimary = ({ children, onClick, disabled, className }: { children: React.ReactNode, onClick: () => void, disabled: boolean, className?: string }) => {
    return (
        <button 
            onClick={onClick} 
            disabled={disabled} 
            className={`
                ${className || ''} 
                px-6 py-2.5 
                rounded-3xl 
                font-bold 
                text-white
                flex items-center justify-center
                relative
                backdrop-blur-md
                border border-white/40
                bg-gradient-to-br from-rose-400/60 via-rose-500/70 to-amber-500/60
                shadow-lg shadow-rose-300/40
                hover:from-rose-500/70 hover:via-rose-600/80 hover:to-amber-600/70
                hover:shadow-xl hover:shadow-rose-400/50
                hover:border-white/50
                active:translate-y-0.5
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg
                transition-all duration-300 ease-out
                before:absolute before:inset-0 before:rounded-3xl
                before:bg-gradient-to-br before:from-white/20 before:to-transparent
                before:pointer-events-none
            `}
        >
            <span className="relative z-10">{children}</span>
        </button>
    );
};

export default ButtonPrimary;