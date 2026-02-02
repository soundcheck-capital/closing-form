import React from 'react';

const ButtonSecondary = ({ children, onClick, disabled }: { children: React.ReactNode, onClick: () => void, disabled: boolean }) => {
    return (
        <button 
            onClick={onClick} 
            disabled={disabled} 
            className="
                px-6 py-2.5
                rounded-3xl
                font-bold
                text-gray-700
                relative
                backdrop-blur-md
                border border-gray-300/50
                bg-white/40
                shadow-lg shadow-gray-200/50
                hover:bg-white/60
                hover:border-gray-400/60
                hover:shadow-xl hover:shadow-gray-300/60
                hover:text-gray-900
                active:translate-y-0.5
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-lg
                transition-all duration-300 ease-out
                before:absolute before:inset-0 before:rounded-3xl
                before:bg-gradient-to-br before:from-white/30 before:to-transparent
                before:pointer-events-none
            "
        >
            <span className="relative z-10">{children}</span>
        </button>
    );
};

export default ButtonSecondary;  