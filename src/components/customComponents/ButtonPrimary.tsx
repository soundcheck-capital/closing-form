const ButtonPrimary = ({ children, onClick, disabled, className }: { children: React.ReactNode, onClick: () => void, disabled: boolean, className?: string }) => {
    return (
        <button onClick={onClick} disabled={disabled} 
        className={`${className} px-6 py-2 bg-gradient-to-bl from-rose-500 to-rose-700 hover:bg-gradient-to-bl
         hover:from-rose-600 hover:to-rose-800 rounded-3xl hover:text-white text-white font-bold active:translate-y-1 transition-all duration-300`}>
            {children}
        </button>
    );
};

export default ButtonPrimary;