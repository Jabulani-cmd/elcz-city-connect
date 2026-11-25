/**
 * General farming Q&A for the home page assistant (livestock, crops, money, using FarmHelper).
 * With the AI service connected (VITE_AI_ENDPOINT → farm-ai, kind "chat") answers come from the AI model;
 * otherwise – or offline – from the short built-in guide below.
 */
import { getAccessToken } from "./auth";

export type ChatMsg = { role: "user" | "assistant"; content: string };
export type ChatReply = { text: string; source: "ai" | "guide" };

export const CHAT_TOPICS: { topic: string; questions: string[] }[] = [
  { topic: "Livestock", questions: ["How often should I dip my cattle?", "What vaccines do cattle need in Zimbabwe?", "How do I feed cattle in the dry season?", "How do I start keeping broilers?"] },
  { topic: "Crops", questions: ["When should I plant maize?", "How do I control fall armyworm?", "How much fertilizer does maize need?", "Why should I test my soil?"] },
  { topic: "Finance", questions: ["How do I know if my farm makes a profit?", "How do I make a farm budget?", "When is the best time to sell cattle?", "How can I get a farm loan?"] },
  { topic: "Weather & safety", questions: ["What should I do before heavy rain?", "How do I protect animals during extreme heat?", "What is farm biosecurity?", "How should I store farm chemicals safely?"] },
  { topic: "Machinery", questions: ["How do I maintain my tractor?", "How do I calibrate a knapsack sprayer?", "What safety checks should I do before using farm equipment?"] },
  { topic: "FarmHelper", questions: ["What can FarmHelper do?", "Does it work without internet?", "How much does it cost?"] },
];

const VET_NOTE = "If an animal is sick, injured or dying, call your vet or the local veterinary officer now. After signing in, the Vet check in the AI Farm Assistant can help you decide whether to isolate the animal and how urgent it is.";

type Entry = { match: RegExp; answer: string };

export const GUIDE: Entry[] = [
  { match: /(sick|dying|died|dead|bleed|bloat|not eating|diarrh|scour|limp|lame|cough|fever|sudden death|disease) .*(cow|cattle|goat|sheep|pig|chicken|bird|calf|animal|bull)|(cow|cattle|goat|sheep|pig|chicken|bird|calf|animal|bull).* (sick|dying|died|dead|bleed|bloat|not eating|diarrh|scour|limp|lame|cough|fever)/i, answer: VET_NOTE },
  { match: /dip|tick|spray.*(cattle|cow)/i, answer: "In the rainy season (about November–April) dip or spray cattle every 7 days; in the dry season every 14 days is usually enough. Use an approved acaricide at the dose on the label, cover ears, tail and udder, and rotate products every season or two to slow resistance. Ticks spread redwater, heartwater and gallsickness, so watch for fever, red urine or nervous signs after a heavy tick load." },
  { match: /vaccin/i, answer: "Common cattle vaccines in Zimbabwe are anthrax and blackleg (yearly), lumpy skin disease (yearly, before the rains), botulism (where animals chew bones) and brucellosis for heifers (once, 4–8 months old). Foot-and-mouth vaccination is done by the veterinary department in risk areas. Ask your local vet or veterinary officer for the schedule for your area, and record every vaccination with its date and batch number." },
  { match: /dry season|winter feed|supplement|lick|feed (my )?(cattle|cow)|hay|silage/i, answer: "In the dry season grass loses protein, so cattle lose weight. Give a protein lick or supplement (for example a urea-based winter lick, following the label), keep clean water close by, and make hay or silage from good grass or maize stover while it is still green. Reduce stocking so the veld isn't overgrazed, and sell or cull poor-doing animals early instead of feeding them all winter." },
  { match: /broiler|chick|poultry|chicken|layer|egg/i, answer: "For broilers: prepare a clean, dry, draught-free house (about 10 birds per square metre), warm brooding at 32–35 °C for the first week, clean water always, and starter, grower then finisher feed. Birds are usually ready in 5–6 weeks. Vaccinate against Newcastle and Gumboro as your supplier advises, keep visitors out, and record feed used and birds lost so you can work out your profit per batch." },
  { match: /goat|sheep/i, answer: "Goats and sheep do well with good shelter from rain, clean water, regular deworming (check gums – pale means worms), hoof trimming and vaccination (e.g. pulpy kidney, as your vet advises). Keep bucks/rams apart until you want mating so you can plan kidding/lambing for when feed is plentiful." },
  { match: /\bpig|piglet|sow/i, answer: "Pigs need a dry, shaded pen, lots of clean water and balanced feed. A sow is pregnant for about 3 months, 3 weeks and 3 days (114 days). Give piglets an iron injection in the first days, keep them warm, and wean at about 4–6 weeks. Keep pens clean and limit visitors to stop African swine fever." },
  { match: /feed conversion|\bFCR\b/i, answer: "Feed conversion ratio (FCR) = total feed eaten ÷ total live-weight gained. For example, 300 kg of feed producing 60 kg of gain gives an FCR of 5. Lower usually means more efficient feeding, but compare animals of the same species, age and feeding system. FarmHelper calculates FCR automatically in Livestock → Feedlot." },
  { match: /carcass|price per kg|monthly throughput/i, answer: "Carcass weight is the dressed weight after slaughter, not the live weight. Carcass value = carcass kg × price per kg. Monthly throughput is the number of animals sold or processed in a month. Record these in Livestock → Sales & carcasses to compare monthly performance." },
  { match: /biosecurity|disease outbreak|outbreak/i, answer: "Biosecurity means keeping disease off the farm and stopping it spreading. Isolate new or sick animals, limit visitors, clean vehicles and equipment, do not share needles, and keep records of movements and illness. For a suspected outbreak, stop animal movements and call your vet or veterinary officer immediately; do not sell or slaughter affected animals for food unless the authorities say it is safe." },
  { match: /heavy rain|flood|thunderstorm|hail/i, answer: "Before heavy rain, move animals, feed, fertilizer and chemicals away from low ground, clear drainage, check roofs and fences, and secure loose equipment. Keep an emergency water and feed supply. Never walk or drive through floodwater, and avoid open fields and isolated trees during lightning." },
  { match: /extreme heat|heatwave|heat stress|hot weather/i, answer: "During extreme heat, provide shade and unlimited clean, cool water, handle or transport animals only in the cool early morning or evening, and improve airflow in poultry and pig houses. Watch for panting, drooling, weakness or collapse; move affected animals to shade and call a vet for severe signs." },
  { match: /chemical|pesticide|herbicide|fungicide/i, answer: "Store farm chemicals locked in their original labelled containers, upright in a cool, dry, ventilated place away from children, animals, food, feed, seed and water. Keep a stock list, wear the protective equipment on the label, never reuse containers for food or water, and use an approved disposal route for empty containers and old chemicals." },
  { match: /tractor|machinery/i, answer: "Before using a tractor or machine, check oil, coolant, fuel, tyres, brakes, lights, guards and hydraulic leaks. Follow the service manual for greasing and filter changes, keep a service log, switch off and remove the key before clearing blockages, and never carry passengers unless a safe seat is fitted." },
  { match: /calibrat.*sprayer|knapsack/i, answer: "To calibrate a knapsack sprayer, fill it with clean water, spray a measured test area at your normal walking speed and pressure, then measure how much water you used. Application rate (L/ha) = litres used ÷ test area in m² × 10,000. Use that rate and the product label to work out how much chemical and water goes in each tank. Calibrate with water only and wear protective clothing." },
  { match: /safety checks|using farm equipment/i, answer: "Walk around the equipment and check guards, brakes, tyres, hydraulic hoses, lights and loose parts. Keep people and animals clear, use the correct protective clothing, follow the manual, and never clear a blockage or adjust moving parts while the engine or power take-off is running." },
  { match: /fertili[sz]|compound d|top ?dress|\bAN\b|urea|manure/i, answer: "As a guide for maize on most soils: a basal fertilizer such as Compound D at planting (around 200–300 kg/ha) and a nitrogen top-dressing such as AN (around 150–250 kg/ha) at 4–6 weeks. The right amount depends on your soil and expected yield, so a soil test is the best way to avoid wasting money. Manure and compost improve the soil and reduce how much fertilizer you need." },
  { match: /maize|plant(ing)?.*(time|when)|when.*plant/i, answer: "Plant maize with the first effective rains – usually when about 25 mm has fallen and the soil is wet to a hand's depth, often mid-November to early December in most of Zimbabwe. Choose a seed variety suited to your region's rainfall (short-season for dry areas). Plant early in the season: yield drops for every week of delay after the first good rains." },
  { match: /armyworm|caterpillar|stalk borer|pest/i, answer: "Scout maize twice a week: walk a W across the field and check 20 plants in 5 places. If more than about 1 in 5 plants have fresh damage in the funnel (whorl), spray a registered insecticide into the funnel early in the morning or late afternoon. Early planting, good weeding and crop rotation also help. Always follow the label and wear protective clothing." },
  { match: /soil|ph\b|lime/i, answer: "A soil test tells you the pH and which nutrients are missing, so you only buy the fertilizer and lime you actually need. Many Zimbabwean soils are acidic; if the pH is low, lime applied before planting makes fertilizer work better. Test every 2–3 years, taking samples from many spots in each field and mixing them." },
  { match: /tobacco/i, answer: "Tobacco needs well-drained sandy soil, a clean seedbed, transplanting with the early rains, and careful fertilizer, topping and suckering. Cure in a well-managed barn and grade carefully – grading has a big effect on the price at the auction floors. Rotate with maize or a grass to reduce nematodes and disease." },
  { match: /tomato|vegetable|horticult|garden/i, answer: "For tomatoes and vegetables: raise seedlings in a clean nursery, transplant into well-prepared beds with manure, water regularly at the base (not the leaves), stake tomatoes, and scout for pests such as Tuta absoluta and whitefly. Plan planting so you harvest when market prices are higher, not when everyone else does." },
  { match: /irrigat|water(ing)? (my )?(crop|field)|drip/i, answer: "Drip irrigation uses much less water than sprinklers and puts it where the roots are. Water early in the morning, check soil moisture with your hand or a spade before watering, and keep channels and filters clean. Mulching the soil keeps moisture in during hot weather." },
  { match: /rotat/i, answer: "Crop rotation means not planting the same crop in the same field every year. A simple rotation is maize → a legume (soya beans, groundnuts or cowpeas) → maize. Legumes add nitrogen to the soil, and rotation breaks the cycle of pests and diseases." },
  { match: /profit|making money|loss/i, answer: "Profit = everything you earned from sales minus everything you spent (seed, feed, fertilizer, medicine, labour, fuel, transport). Work it out per crop or per batch of animals, not just for the whole farm, so you can see which parts make money. Write down every expense as it happens – most farmers underestimate their costs. FarmHelper does this calculation for you from your records." },
  { match: /budget|plan.*(money|cost)|cash ?flow/i, answer: "A farm budget lists, for each crop or livestock enterprise, the expected income (yield × price) and every expected cost, month by month. This shows how much cash you need before harvest and when. Compare the budget with what really happens during the season, and adjust next year's plan." },
  { match: /sell|market|price/i, answer: "Sell cattle when they are in good condition – usually at the end of the rainy season (around April–June) – rather than late in the dry season when many farmers sell thin animals and prices fall. Weigh animals before selling so you know their value, compare prices at auctions and abattoirs, and keep records of sale weights and prices." },
  { match: /loan|credit|financ|bank|fund/i, answer: "Banks and lenders want to see records: what you produced, your sales and your costs for past seasons, and a budget for the new season. Contract farming schemes and input-support programmes are other options. Borrow only for things that will earn more than the loan costs, and plan repayments for after harvest or sales." },
  { match: /offline|internet|signal|network|data/i, answer: "Yes – FarmHelper works without signal. Everything you record is saved on your phone and sent to your account automatically when you're back online." },
  { match: /cost|price|pay|subscription|trial|free/i, answer: "You can start with a 7-day free trial when you create an account. See Plan & billing inside the app for the current plans and prices." },
  { match: /farmhelper|this app|what can (it|you) do|feature/i, answer: "FarmHelper keeps all your farm records in one place: livestock (herd, weights, health, vaccinations, pastures), crops (planting, spraying, harvests, disease checks), inventory, money in and out, employees and tasks, plus reports and an AI assistant. It works on your phone, even with no signal. Tap Create an account to start a 7-day free trial." },
];

const FALLBACK = "I don't have a ready answer for that. I can help with livestock (dipping, vaccination, feeding, poultry, goats, pigs), crops (planting, pests, fertilizer, soil, irrigation) and farm money (profit, budgets, selling, loans). Try one of the suggested questions, or ask in different words. For anything serious, talk to your local extension officer (Agritex) or vet.";

/** Built-in answers for when the AI service isn't connected or there's no signal. */
export function guideAnswer(question: string): string {
  return GUIDE.find((e) => e.match.test(question))?.answer ?? FALLBACK;
}

const ENDPOINT = import.meta.env.VITE_AI_ENDPOINT as string | undefined;
const KEY = import.meta.env.VITE_AI_KEY as string | undefined;

export async function askFarmQuestion(history: ChatMsg[]): Promise<ChatReply> {
  const last = [...history].reverse().find((m) => m.role === "user")?.content ?? "";
  if (ENDPOINT && navigator.onLine) {
    try {
      const token = (await getAccessToken()) ?? KEY;
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(KEY ? { apikey: KEY } : {}) },
        body: JSON.stringify({ kind: "chat", messages: history.slice(-12).map((m) => ({ role: m.role, content: m.content.slice(0, 2000) })) }),
      });
      if (!res.ok) throw new Error(`AI service returned ${res.status}`);
      const data = (await res.json()) as { reply?: string };
      if (data.reply?.trim()) return { text: data.reply.trim(), source: "ai" };
    } catch {
      /* fall through to the built-in guide */
    }
  }
  return { text: guideAnswer(last), source: "guide" };
}
