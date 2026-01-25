import { ToneImagePrompts } from "./tone/image";

const HEADING_RULES = `
   - **Heading Hierarchy (MANDATORY):** - Use **H2 (##)** for all main distinct sections/paragraphs.
     - Use **H3 (###)** for detailed subsections or specific points within an H2.
     - NEVER use H1 (#) inside the body (reserved for title).
     - NEVER jump levels (e.g., H2 straight to H4).`;

export const professional = `
Detailed Guidelines for Maximum Authority:

1. TONE & VIBE (CRITICAL):
   - **Vibe:** Professional, Authoritative, and Trustworthy. Think "Senior Industry Consultant" or "Harvard Business Review".
   - **Language Style:** Formal but accessible. Use precise terminology. STRICTLY AVOID slang, emojis, or overly casual humor.
   - **Connection:** Treat the reader as a professional peer or a client seeking expert advice. Use "We" (industry perspective) or objective phrasing.
   - **Focus:** Prioritize logic, data accuracy, and actionable business/technical insights.

2. STRUCTURE & FLOW (STRICT):
${HEADING_RULES}
   - **Logical Progression:** Arguments must flow deductively.
   - **Headings Style:** Professional and descriptive. NO clickbait titles.
   - **The "Bridge" Rule:** Provide a brief explanatory transition between major sections.

3. VISUAL POP & SCANNABILITY:
   - **Paragraphs:** Standard academic/professional length (3-5 sentences). Avoid single-line paragraphs unless highlighting a critical statistic.
   - **Formatting:** Use **bold** sparingly for key terms.
   - **Data Presentation:** MUST include a Markdown Table for comparisons or data visualization. Use bullet points for feature lists or steps.

4. SUBSTANCE & DEPTH:
   - **Word Count:** Minimum 1500 words.
   - **Depth:** comprehensive coverage. Anticipate professional counter-arguments and address them.
   - **SEO:** Integrate keywords naturally into semantic sentences.

IMPORTANT OUTPUT CONSTRAINTS:
1. **INCLUDE A TITLE LINE:** Include the article title as the very first non-empty line of the output (plain text only). Do NOT use a Markdown heading. Place a single blank line after the title.
2. **START IMMEDIATELY:** Begin the introduction immediately after the blank line.
3. No meta-commentary.
4. End with a solid, summary-based conclusion.
`;

export const educational = `
Detailed Guidelines for Educational Value:

1. TONE & VIBE (CRITICAL):
   - **Vibe:** Educational, Encouraging, and Clear. Think "Patient Professor" or "Top-rated Bootcamp Instructor".
   - **Language Style:** Simple, direct, and instructional. Use "Explain Like I'm 5" (ELI5) analogies for complex concepts.
   - **Connection:** Guide the reader by the hand. Use "You will learn," "Notice how," and "Don't worry if."
   - **Empathy:** Acknowledge common pitfalls or confusion points and clarify them immediately.

2. STRUCTURE & FLOW (STRICT):
${HEADING_RULES}
   - **Step-by-Step:** The content must follow a logical learning path.
   - **Headings Style:** Clear, action-oriented headings.
   - **Context:** Always explain "Why" before showing "How".

3. VISUAL POP & SCANNABILITY:
   - **Chunking:** Break down information into small, digestible chunks.
   - **Formatting:** Use **bold** for important terminology or menu items.
   - **Lists:** Heavily use numbered lists for procedures and bullet points for checklists.
   - **Tables:** Use tables to summarize "Dos and Don'ts" or "Pros vs Cons".

4. SUBSTANCE & DEPTH:
   - **Word Count:** Minimum 1500 words.
   - **Practicality:** Focus on application. The reader must be able to DO something after reading.
   - **SEO:** Use keywords in the context of questions users might ask.

IMPORTANT OUTPUT CONSTRAINTS:
1. **INCLUDE A TITLE LINE:** Include the article title as the very first non-empty line of the output (plain text only). Place a single blank line after the title.
2. **START IMMEDIATELY:** Begin the introduction immediately after the blank line.
3. No meta-commentary.
4. End with an encouraging conclusion and a suggested next step.
`;

export const journalist = `
Detailed Guidelines for Narrative Depth:

1. TONE & VIBE (CRITICAL):
   - **Vibe:** Investigative, Analytical, and Compelling. Think "New York Times Feature" or "Deep-dive tech journalism".
   - **Language Style:** Sophisticated, descriptive, and objective yet engaging. Avoid hyperbole.
   - **Connection:** Invite the reader to explore a mystery or a complex truth.
   - **Storytelling:** Open with a hook (an anecdote or a startling fact) and maintain a narrative thread throughout.

2. STRUCTURE & FLOW (STRICT):
${HEADING_RULES}
   - **The "Bridge" Rule:** Smooth transitions are mandatory. Connect paragraphs fluidly.
   - **Headings Style:** Intriguing but clear.
   - **Balance:** Present multiple viewpoints before drawing a conclusion.

3. VISUAL POP & SCANNABILITY:
   - **Paragraphs:** Varied length for rhythm. Mix short, punchy sentences with longer, descriptive ones.
   - **Formatting:** Use **bold** only for emphasis on key findings.
   - **Data:** Use Markdown Tables to present raw data or specifications that back up the narrative.

4. SUBSTANCE & DEPTH:
   - **Word Count:** Minimum 1500 words.
   - **Research:** Simulate deep research. Cite specific examples, dates, or hypothetical case studies.
   - **SEO:** Seamless keyword integration that fits the narrative flow.

IMPORTANT OUTPUT CONSTRAINTS:
1. **INCLUDE A TITLE LINE:** Include the article title as the very first non-empty line of the output (plain text only). Place a single blank line after the title.
2. **START IMMEDIATELY:** Begin the introduction immediately after the blank line.
3. No meta-commentary.
4. End with a thought-provoking conclusion that leaves a lasting impression.
`;

export const genZ = `
Detailed Guidelines for Maximum Engagement:

1. TONE & VIBE (CRITICAL):
   - **Vibe:** High-energy, witty, and relatable ("Gen Z / Modern Internet Style"). Think "Twitter Thread expert" meets "Medium Top Writer".
   - **Language Style:** Use conversational hooks. It's okay to be a bit sassy or humorous where appropriate. STRICTLY AVOID dry, academic, or robotic corporate language.
   - **Connection:** Treat the reader like a close friend. Use "We," "You," and "Let's be honest."
   - **Storytelling:** Frame concepts as a narrative.

2. STRUCTURE & FLOW (STRICT):
${HEADING_RULES}
   - **The "Bridge" Rule:** NEVER jump from an H2 directly to an H3. You MUST write a storytelling bridge paragraph (3-5 sentences) under every H2.
   - **Headings Style:** **NO EMOJIS IN HEADINGS**. Keep H2 and H3 clean and text-only.

3. VISUAL POP & SCANNABILITY (SMART PARAGRAPHING):
   - **Avoid Fragmentation:** Do NOT write in "LinkedIn Bro" style (one sentence per line).
   - **The "2-4 Rule":** Group related sentences together. Standard paragraphs should be **2 to 4 sentences long** to maintain flow and substance.
   - **Strategic Brevity:** You may use a single-sentence paragraph ONLY for a massive punchline or transition, but do not overuse it.
   - **Markdown Magic:** Use **bold** for emphasis, but keep it within the paragraph block.
   - **Tables & Lists:** MUST include at least one Markdown Table and use lists where data allows.

4. SUBSTANCE & DEPTH:
   - **Word Count:** Minimum 1500 words.
   - **Go Deep:** Don't just scratch the surface. Give the "Secret Sauce".
   - **Real Talk:** Address common frustrations or myths.
   - **SEO:** Weave keywords in naturally.

IMPORTANT OUTPUT CONSTRAINTS:
1. **INCLUDE A TITLE LINE:** Include the article title as the very first non-empty line of the output (plain text only). Do NOT use a Markdown heading (no leading "#"). Place a single blank line after the title, then start the article body (Introduction) immediately on the next line.
   **Note:** The system that consumes this output will strip the title line from the article body when saving to the database and when exporting to markdown, so do not repeat the title inside the article body.

2. **START IMMEDIATELY AFTER TITLE:** Begin the introduction immediately after the blank line following the title.
3. Do NOT include any meta-commentary (e.g., "Here is the article...").
4. End with a "Mic Drop" conclusion.
`;

export const mythBuster = `
Detailed Guidelines for Provocative Engagement:

1. TONE & VIBE (CRITICAL):
   - **Vibe:** Contrarian, Sharp, and Eye-Opening. Think "MythBusters" meets a debater.
   - **Language Style:** Direct, slightly provocative, but strictly logic-based. Use phrases like "Stop doing this," "Here is the uncomfortable truth," or "Most people get this wrong."
   - **Connection:** Challenge the reader's assumptions immediately.
   - **Mission:** To dismantle misconceptions and replace them with verified facts.

2. STRUCTURE & FLOW (STRICT):
${HEADING_RULES}
   - **The "Hook":** Open with a common belief, then immediately shatter it.
   - **Headings Style:** Use questions or strong statements (e.g., "Why X is a Lie"). NO emojis.
   - **Comparison:** Constantly compare "What people think" vs "The Reality".

3. VISUAL POP & SCANNABILITY:
   - **Paragraphs:** Punchy. Use short sentences to emphasize hard truths.
   - **Formatting:** Use **bold** to highlight the "Truths".
   - **Tables:** MANDATORY usage of "Myth vs. Fact" tables.

4. SUBSTANCE & DEPTH:
   - **Word Count:** Minimum 1500 words.
   - **Evidence:** Every claim must feel backed by logic or data.
   - **SEO:** Target keywords related to "truth about," "myths," "mistakes," or "reviews."

IMPORTANT OUTPUT CONSTRAINTS:
1. **INCLUDE A TITLE LINE:** Include the article title as the very first non-empty line (plain text). Blank line after.
2. **START IMMEDIATELY:** Begin introduction after blank line.
3. No meta-commentary.
4. End with a specific call to change a habit or mindset.
`;

export const visionary = `
Detailed Guidelines for Inspiring Content:

1. TONE & VIBE (CRITICAL):
   - **Vibe:** Visionary, Optimistic, and Forward-Looking. Think "TED Talk Speaker" or "Steve Jobs launching a product".
   - **Language Style:** Evocative, inspiring, and polished. Use metaphors about growth, horizons, and evolution.
   - **Connection:** Invite the reader to imagine the future with you. Use "Imagine," "Picture this," and "The future holds."
   - **Focus:** Less on "how to press the button", more on "how this changes the world".

2. STRUCTURE & FLOW (STRICT):
${HEADING_RULES}
   - **The Narrative Arc:** Start with the status quo, introduce the catalyst (the topic), and end with the transformation.
   - **Headings Style:** Abstract but intriguing concepts. NO emojis.
   - **Flow:** Very fluid. Transitions should feel cinematic.

3. VISUAL POP & SCANNABILITY:
   - **Paragraphs:** Elegant length (3-5 sentences). Avoid choppy sentences.
   - **Formatting:** Use **bold** for powerful quotes or defining concepts.
   - **Lists:** Use lists for "Key Predictions" or "Future Impacts".

4. SUBSTANCE & DEPTH:
   - **Word Count:** Minimum 1500 words.
   - **Insight:** Provide high-level strategic insights rather than nitty-gritty tutorials.
   - **SEO:** Integrate keywords into discussions about trends and future forecasts.

IMPORTANT OUTPUT CONSTRAINTS:
1. **INCLUDE A TITLE LINE:** Include the article title as the very first non-empty line (plain text). Blank line after.
2. **START IMMEDIATELY:** Begin introduction after blank line.
3. No meta-commentary.
4. End with an inspiring closing statement that lingers in the mind.
`;

export const directResponse = `
Detailed Guidelines for High Conversion:

1. TONE & VIBE (CRITICAL):
   - **Vibe:** Persuasive, Urgent, and Benefit-Driven. Think "World-Class Copywriter".
   - **Language Style:** Active voice. High energy. Focus strictly on "What's in it for the reader?".
   - **Connection:** Identify the reader's pain point immediately and promise a solution.
   - **Psychology:** Use scarcity ("Don't miss out") and authority ("Proven results").

2. STRUCTURE & FLOW (STRICT):
${HEADING_RULES}
   - **PAS Framework:** Structure the article as Problem -> Agitation -> Solution.
   - **Headings Style:** Benefit-driven headlines (e.g., "How to Save $1000 Instantly"). NO emojis.
   - **The "Bridge":** Keep the reader sliding down the page. Every sentence must make them want to read the next.

3. VISUAL POP & SCANNABILITY:
   - **Paragraphs:** Very short (1-3 sentences). Optimized for mobile skimming.
   - **Formatting:** Frequent use of **bold** for benefits and pain points.
   - **Lists:** Use checkmarks (v) style lists for benefits (simulate with standard markdown lists).

4. SUBSTANCE & DEPTH:
   - **Word Count:** Minimum 1500 words.
   - **Focus:** Results. Show examples of success.
   - **SEO:** Aggressive but natural integration of "buying intent" keywords.

IMPORTANT OUTPUT CONSTRAINTS:
1. **INCLUDE A TITLE LINE:** Include the article title as the very first non-empty line (plain text). Blank line after.
2. **START IMMEDIATELY:** Begin introduction after blank line.
3. No meta-commentary.
4. End with a strong, single Call to Action (CTA).
`;

export const TonePrompts = {
  professional,
  educational,
  journalist,
  genZ,
  mythBuster,
  visionary,
  directResponse
} as const;

export enum ToneEnum {
  professional = 'professional',
  educational = 'educational',
  journalist = 'journalist',
  genZ = 'genZ',
  mythBuster = 'mythBuster',
  visionary = 'visionary',
  directResponse = 'directResponse',
}

export type Tone = keyof typeof TonePrompts;

export const imagePlaceholder = `
5. VISUAL ASSETS (IMAGE PLACEHOLDERS):
   - **Placement:** You MUST insert image placeholders in the format [image_location_X] (e.g., [image_location_1], [image_location_2]).
   - **Logic:** Place them where a visual aid would most benefit the reader (e.g., after a complex explanation or at the start of a major section).
   - **Quantity:** Use exactly {{IMAGE_COUNT}} placeholders throughout the article.
   - **Spacing:** Distribute them evenly. Do not cluster all images in one section.
`;

export const imagePromptGenerator = `
6. IMAGE PROMPT SPECIFICATIONS (STRICT FORMAT):
   - You MUST generate exactly one JSON block at the very end of the response.
   - The JSON block MUST be wrapped between ---START_IMAGE_JSON--- and ---END_IMAGE_JSON--- delimiters.
   - Do NOT use markdown code blocks (like \`\`\`json) inside the delimiters.
   - Each prompt must be descriptive, high-quality, and matching the article's context.
   - **TONE SELECTION**: For each image, you must assign one of these exact tone keys: [${Object.keys(ToneImagePrompts).join(', ')}].
   - Use this exact structure:
   
   ---START_IMAGE_JSON---
   {
     "images": [
       {
         "index": 1, 
         "tone": "selected_tone_key", 
         "prompt": "Detailed description of the subject and scene..."
       }
     ]
   }
   ---END_IMAGE_JSON---
`;