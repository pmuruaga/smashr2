const variants = {
  primary:
    "bg-[#2f6b08] text-white hover:bg-[#255506] font-semibold shadow-md border border-[#255506]",
  secondary:
    "bg-white text-[#1a241c] border-2 border-[#1a241c] hover:bg-[#eef3ea] font-semibold",
  ghost:
    "bg-transparent text-[#3d4f40] hover:text-[#1a241c] hover:bg-[#e8eee4] font-medium",
  danger: "bg-[#c43c2c] text-white hover:bg-[#a83224] font-semibold",
  gold: "bg-[#8a841f] text-white hover:bg-[#6f6a18] font-semibold",
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  type = "button",
  disabled,
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-45 ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
