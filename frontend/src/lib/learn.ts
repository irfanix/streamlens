/** Short, plain-language explainers for citizen scientists. Used by the Learn page and "What is this?" links. */
export interface Topic {
  id: string;
  title: string;
  emoji: string;
  what: string;
  why: { human: string; animal: string; ecosystem: string };
  spot: string;
  todo: string[];
  streamlens: string;
}

export const TOPICS: Topic[] = [
  {
    id: "turbidity",
    title: "Murky water (turbidity)",
    emoji: "🟤",
    what: "Water that looks cloudy, brown or milky because tiny particles like soil, silt or waste float in it.",
    why: {
      human: "Germs often stick to these particles, so murky water can carry more disease-causing microbes.",
      animal: "Fish gills can clog, and animals that drink from the stream get more germs.",
      ecosystem: "Less sunlight reaches water plants, and settling mud smothers fish eggs and small creatures."
    },
    spot: "You cannot see the bottom in shallow water, or the water looks like tea or milky coffee. After heavy rain it is often worse.",
    todo: [
      "Measure clarity with a transparency tube if you have one, and note if it rained recently.",
      "Look upstream for bare soil, construction or drain outlets.",
      "Avoid swallowing the water or swimming in it."
    ],
    streamlens: "Looks for brown and grey tones across the water, and uses your clarity measurement if you add one."
  },
  {
    id: "algae",
    title: "Algae and algal blooms",
    emoji: "🟢",
    what: "Tiny plant-like organisms that grow fast when water is warm, slow and full of nutrients from fertiliser or sewage.",
    why: {
      human: "Some blooms (cyanobacteria) make toxins that can cause skin rashes, stomach illness or liver damage.",
      animal: "Dogs and livestock can get very sick or die after drinking water with toxic blooms.",
      ecosystem: "When algae die and rot, they use up oxygen, which can kill fish."
    },
    spot: "Bright green, blue-green or pea-soup coloured water, green scum or mats on the surface, sometimes a bad smell.",
    todo: [
      "Keep children and pets out of the water, and wash skin after contact.",
      "Do not touch scum with bare hands.",
      "Report large or bright blue-green blooms to your local environment or health office."
    ],
    streamlens: "Looks for clearly green, saturated areas. Green nets, plants on the bank or shadows can fool it, so please check."
  },
  {
    id: "trash",
    title: "Trash and debris",
    emoji: "🧴",
    what: "Plastic bottles, bags, food packaging and other waste floating in or along the stream.",
    why: {
      human: "Trash blocks drains and causes flooding, and it often travels together with sewage.",
      animal: "Birds, fish and turtles get tangled in it or eat it by mistake.",
      ecosystem: "Plastic breaks into microplastics that stay in the water and food chain for many years."
    },
    spot: "Many small, sharp-edged objects in white, grey or bright colours, often piled up at bends and bridges.",
    todo: [
      "Do not pick up sharp items or needles with bare hands.",
      "Join or organise a local clean-up with gloves and bags.",
      "Report illegal dumping spots to your city or district office."
    ],
    streamlens: "Looks for many small, sharp-edged, plastic-coloured objects. More trash adds more points to the risk score."
  },
  {
    id: "sewage",
    title: "Sewage and outfall pipes",
    emoji: "🚰",
    what: "Untreated wastewater from homes or businesses that flows into the stream, often through a pipe in the bank.",
    why: {
      human: "Sewage carries germs like E. coli that cause diarrhoea and other infections.",
      animal: "Animals that drink or live in the water get the same infections.",
      ecosystem: "Extra nutrients feed algae blooms, and waste uses up oxygen in the water."
    },
    spot: "A pipe in the bank, grey or cloudy water near it, toilet paper, or a rotten-egg or toilet smell.",
    todo: [
      "Avoid all skin contact near the pipe, and keep children away.",
      "Note the smell in StreamLens (Odor: sewage). It raises the risk score a lot.",
      "Report it to your local water or environment authority with a photo and location."
    ],
    streamlens: "Uses your smell observation and looks for outfall pipes. A photo alone cannot prove sewage, so your nose matters."
  },
  {
    id: "stagnant",
    title: "Stagnant water and mosquitoes",
    emoji: "🦟",
    what: "Water that barely moves, like puddles, blocked drains, ponds or slow pools behind trash.",
    why: {
      human: "Mosquitoes lay eggs in still water, which can spread dengue, malaria and other diseases.",
      animal: "Animals that drink still, warm water are more likely to get sick.",
      ecosystem: "Still water holds less oxygen, so fewer fish and insects can live there."
    },
    spot: "No visible flow, a flat surface, warm water, and sometimes tiny wriggling larvae just below the surface.",
    todo: [
      "Empty or cover containers that hold water near homes.",
      "Report blocked drains so they can be cleared.",
      "Use mosquito repellent near still water, especially at dusk."
    ],
    streamlens: "Combines your flow choice with the photo. Still water plus warm temperature adds extra mosquito risk."
  },
  {
    id: "ph",
    title: "pH (acid or alkaline)",
    emoji: "🧪",
    what: "A number from 0 to 14 that shows how acidic or alkaline water is. 7 is neutral; most healthy streams are about 6.5 to 8.5.",
    why: {
      human: "Very unusual pH can be a sign of chemical pollution or waste entering the stream.",
      animal: "Fish and small water creatures get stressed or die when pH is too high or too low.",
      ecosystem: "Unusual pH can release metals from the soil and harm the whole food web."
    },
    spot: "You cannot see pH. Use a pH test strip or a small pH meter and compare the colour or number.",
    todo: [
      "Test at the same place and time of day if you check regularly.",
      "Retest if you get a value below 5 or above 10; strips can be misread.",
      "Report very unusual values together with any smell or colour you noticed."
    ],
    streamlens: "Uses your pH number. Values outside about 6.5 to 8.5 add points; impossible values are flagged so you can recheck."
  },
  {
    id: "foam-oil",
    title: "Foam and oil sheen",
    emoji: "🫧",
    what: "White or brown foam on the surface, or a rainbow-coloured shiny film.",
    why: {
      human: "Detergent foam and oil can irritate skin and signal other pollution nearby.",
      animal: "Oil coats feathers and fur and is toxic when swallowed.",
      ecosystem: "A surface film blocks oxygen from entering the water."
    },
    spot: "Tip: poke a shiny film with a stick. Oil swirls back together; a natural bacteria film breaks into small flat pieces.",
    todo: [
      "Note if the foam smells like soap or perfume, which suggests detergent.",
      "Avoid skin contact with oily water.",
      "Report oil spills quickly; they spread fast."
    ],
    streamlens: "Looks for bright white patches (foam) and colourful shiny areas (oil). Sunlight glare can look similar, so please check."
  },
  {
    id: "one-health",
    title: "What is One Health?",
    emoji: "🌍",
    what: "The idea that the health of people, animals and the environment is connected, so we protect all three together.",
    why: {
      human: "People get sick from germs and toxins that come from polluted water and the animals living around it.",
      animal: "Pets, livestock and wildlife share the same water and the same risks.",
      ecosystem: "A healthy stream cleans water, controls floods and supports life for everyone."
    },
    spot: "Every StreamLens result gives three scores: Human, Animal and Ecosystem, plus an overall One Health risk from 0 to 100.",
    todo: [
      "Check the stream you live near a few times a year and compare results.",
      "Share results with neighbours, schools and local officials.",
      "Remember: StreamLens is a screening tool. Lab tests are needed to know if water is safe."
    ],
    streamlens: "Combines what the photo shows with what you observed into one transparent score. See Methodology for the formula."
  }
];

/** Which Learn topic explains a finding label or risk factor. */
export const TOPIC_FOR: Record<string, string> = {
  turbid: "turbidity",
  turbidity: "turbidity",
  algae_mat: "algae",
  algal_bloom: "algae",
  algae: "algae",
  trash: "trash",
  polluted_debris: "trash",
  debris: "trash",
  outfall_pipe: "sewage",
  sewage: "sewage",
  stagnant: "stagnant",
  stagnation: "stagnant",
  warm_water: "stagnant",
  ph_deviation: "ph",
  foam: "foam-oil",
  oil_sheen: "foam-oil",
  oil: "foam-oil"
};
