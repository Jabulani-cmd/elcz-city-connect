/** Number visitors chat with from the landing page: digits only, with country code. Set VITE_WHATSAPP_NUMBER to change it. */
const NUMBER = ((import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? "263789824741").replace(/\D/g, "");
const MESSAGE = "Hi, I'd like to know more about FarmHelper.";

export const whatsappLink = (number = NUMBER, message = MESSAGE) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;

/** Round green "chat on WhatsApp" button for the landing page, stacked just above the assistant button (bottom-right). */
export function WhatsAppButton() {
  if (!NUMBER) return null;
  return (
    <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp"
      className="fixed bottom-[max(4.75rem,calc(env(safe-area-inset-bottom)+4.75rem))] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl ring-4 ring-background/20 transition-transform hover:scale-105 active:scale-95 motion-reduce:transition-none sm:bottom-[5rem] sm:right-6">
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M16.004 3C9.38 3 4 8.376 4 14.998c0 2.12.553 4.19 1.604 6.015L4 29l8.2-1.576a12 12 0 0 0 3.804.616h.004C22.62 28.04 28 22.664 28 16.04 28 9.376 22.628 3 16.004 3Zm0 21.99h-.003a9.95 9.95 0 0 1-5.07-1.39l-.364-.216-4.866.935.97-4.74-.236-.376a9.94 9.94 0 0 1-1.52-5.2c0-5.5 4.48-9.98 9.99-9.98 2.665 0 5.17 1.04 7.05 2.926a9.9 9.9 0 0 1 2.92 7.06c-.003 5.5-4.48 9.98-9.99 9.98Zm5.48-7.47c-.3-.15-1.777-.877-2.052-.977-.275-.1-.475-.15-.675.15-.2.3-.775.977-.95 1.177-.175.2-.35.225-.65.075-.3-.15-1.268-.467-2.416-1.49-.893-.797-1.496-1.78-1.67-2.08-.175-.3-.018-.462.132-.612.135-.134.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.675-1.627-.925-2.227-.243-.585-.49-.506-.675-.515l-.575-.01c-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.116 3.23 5.126 4.53.716.31 1.275.495 1.71.633.72.228 1.375.196 1.892.12.577-.086 1.777-.726 2.027-1.427.25-.7.25-1.3.175-1.427-.075-.125-.275-.2-.575-.35Z"/>
      </svg>
    </a>
  );
}
