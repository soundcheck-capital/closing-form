const ButtonSecondary = ({ children, onClick, disabled }: { children: React.ReactNode, onClick: () => void, disabled: boolean }) => {
    return (
        <button onClick={onClick} disabled={disabled} className="px-6 py-2
        shadow-md rounded-3xl border border-orange-600  text-orange-600 hover:bg-orange-500 hover:text-white
         font-bold text-orange-700 active:translate-y-1 transition-all duration-300 ">
            {children}
        </button>
    );
};

export default ButtonSecondary;  