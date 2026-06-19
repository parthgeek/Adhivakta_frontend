import PrepNav from "@/components/cases/ai-prep-room/PrepNav";

/**
 * Shared chrome for every AI Prep Room page — centered container + sticky nav.
 * Each feature lives on its own route under this layout.
 */
export default function AIPrepRoomLayout({ children }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6">
      <PrepNav />
      {children}
    </div>
  );
}
