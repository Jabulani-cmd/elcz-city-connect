/** Number visitors chat with from the link on the landing page: digits only, with country code. Set VITE_WHATSAPP_NUMBER to change it. */
const NUMBER = ((import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) ?? "263789824741").replace(/\D/g, "");
const MESSAGE = "Hi, I'd like to know more about FarmHelper.";

export const whatsappLink = (number = NUMBER, message = MESSAGE) => `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
