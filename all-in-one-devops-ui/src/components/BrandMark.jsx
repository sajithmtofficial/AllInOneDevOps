import { InfinityLogo } from "./icons";

export default function BrandMark({
  className = "h-11 w-11",
  iconClassName = "h-7 w-7",
}) {
  return (
    <div
      className={`relative grid shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#8b5cf6] via-[#6366f1] to-[#0ea5e9] shadow-[0_12px_30px_-12px_rgba(124,58,237,0.9)] ${className}`}
    >
      <span className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_28%_18%,rgba(255,255,255,0.4),transparent_58%)]" />
      <InfinityLogo
        monochrome
        className={`relative text-white drop-shadow-[0_2px_8px_rgba(15,23,42,0.35)] ${iconClassName}`}
      />
    </div>
  );
}
