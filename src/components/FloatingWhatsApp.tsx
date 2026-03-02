import { MessageCircle } from "lucide-react";

const FloatingWhatsApp = () => {
  return (
    <a
      href="https://wa.me/263773724478"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all hover:scale-110"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
};

export default FloatingWhatsApp;
