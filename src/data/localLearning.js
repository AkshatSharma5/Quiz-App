// Curated offline content keeps quizzes and study mode useful without API keys.
const items = [
  ['General Knowledge', 'What is the largest planet in our solar system?', ['Earth', 'Jupiter', 'Saturn', 'Neptune'], 1],
  ['General Knowledge', 'Which ocean is the largest?', ['Atlantic', 'Indian', 'Arctic', 'Pacific'], 3],
  ['General Knowledge', 'How many sides does a hexagon have?', ['Five', 'Six', 'Seven', 'Eight'], 1],
  ['General Knowledge', 'What is the currency of Japan?', ['Yen', 'Won', 'Yuan', 'Ringgit'], 0],
  ['Science & Nature', 'Which gas do plants absorb during photosynthesis?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], 2],
  ['Science & Nature', 'What is the chemical symbol for water?', ['CO2', 'H2O', 'O2', 'NaCl'], 1],
  ['Science & Nature', 'Which part of a cell contains most of its DNA?', ['Nucleus', 'Ribosome', 'Membrane', 'Cytoplasm'], 0],
  ['Science & Nature', 'What force keeps planets in orbit around the Sun?', ['Magnetism', 'Friction', 'Gravity', 'Electricity'], 2],
  ['Computers', 'What does CPU stand for?', ['Central Processing Unit', 'Computer Personal Utility', 'Core Program Unit', 'Central Power User'], 0],
  ['Computers', 'Which language is used to structure web pages?', ['HTML', 'SQL', 'Python', 'Bash'], 0],
  ['Computers', 'What does URL identify?', ['A web resource address', 'A processor type', 'A file format', 'A network cable'], 0],
  ['Mathematics', 'What is 12 × 8?', ['86', '92', '96', '108'], 2],
  ['Mathematics', 'What is the square root of 144?', ['10', '11', '12', '14'], 2],
  ['Geography', 'What is the capital of Japan?', ['Kyoto', 'Tokyo', 'Osaka', 'Sapporo'], 1],
  ['Geography', 'Which is the longest river in South America?', ['Amazon', 'Orinoco', 'Paraná', 'São Francisco'], 0],
  ['History', 'The ancient Olympic Games began in which country?', ['Italy', 'Greece', 'Egypt', 'Turkey'], 1],
  ['History', 'In which year did the Berlin Wall fall?', ['1987', '1989', '1991', '1993'], 1],
  ['Animals', 'What is the largest mammal on Earth?', ['African elephant', 'Blue whale', 'Giraffe', 'Hippopotamus'], 1],
  ['Animals', 'A group of lions is commonly called a…', ['Pack', 'Pride', 'Colony', 'Flock'], 1],
  ['Sports', 'How many players does a soccer team have on the field?', ['9', '10', '11', '12'], 2],
  ['Books', 'Who wrote "Pride and Prejudice"?', ['Charlotte Brontë', 'Jane Austen', 'Mary Shelley', 'George Eliot'], 1],
  ['Music', 'How many strings does a standard violin have?', ['Four', 'Five', 'Six', 'Seven'], 0],
  ['Film', 'Which device captures moving images for a film?', ['Projector', 'Camera', 'Microphone', 'Mixer'], 1],
  ['Mythology', 'In Greek mythology, who is the god of the sea?', ['Apollo', 'Ares', 'Poseidon', 'Hermes'], 2],
  ['Art', 'Which primary colors are used in traditional painting?', ['Red, yellow, blue', 'Red, green, blue', 'Cyan, magenta, yellow', 'Orange, purple, green'], 0],
];

export const LOCAL_QUESTIONS = items.map(([topic, description, answers, correct]) => ({
  topic,
  description,
  difficulty_level: 'medium',
  options: answers.map((answer, id) => ({ id, description: answer, is_correct: id === correct })),
}));
export const LOCAL_TOPICS = [...new Set(LOCAL_QUESTIONS.map((question) => question.topic))];

export const LOCAL_FLASHCARDS = [
  { front: 'What is photosynthesis?', back: 'The process by which plants use light, water, and carbon dioxide to make sugars and release oxygen.', difficulty: 1 },
  { front: 'What does CPU stand for?', back: 'Central Processing Unit: the component that executes instructions in a computer.', difficulty: 1 },
  { front: 'What is a prime number?', back: 'A whole number greater than 1 that has exactly two factors: 1 and itself.', difficulty: 1 },
  { front: 'What is an ecosystem?', back: 'A community of organisms interacting with each other and with their physical environment.', difficulty: 2 },
  { front: 'What is the role of DNA?', back: 'DNA stores hereditary instructions used in the growth, function, and reproduction of organisms.', difficulty: 2 },
  { front: 'What is evaporation?', back: 'The change of a liquid into gas at its surface, usually as it gains heat energy.', difficulty: 1 },
  { front: 'What is an algorithm?', back: 'A finite, ordered set of steps for solving a problem or completing a task.', difficulty: 2 },
  { front: 'What causes the seasons on Earth?', back: 'Earth’s axial tilt as it orbits the Sun changes the angle and duration of sunlight through the year.', difficulty: 2 },
  { front: 'What is a metaphor?', back: 'A figure of speech that describes one thing as another to suggest a shared quality.', difficulty: 1 },
  { front: 'What is the water cycle?', back: 'The ongoing movement of water through evaporation, condensation, precipitation, and collection.', difficulty: 2 },
];

export function getLocalQuestions(categoryId, amount) {
  const categoryNames = { 9: 'General Knowledge', 10: 'Books', 11: 'Film', 12: 'Music', 17: 'Science & Nature', 18: 'Computers', 19: 'Mathematics', 20: 'Mythology', 21: 'Sports', 22: 'Geography', 23: 'History', 25: 'Art', 27: 'Animals' };
  const category = categoryNames[categoryId];
  let pool = category ? LOCAL_QUESTIONS.filter(q => q.topic === category) : LOCAL_QUESTIONS;
  if (pool.length < 3) pool = LOCAL_QUESTIONS;
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return Array.from({ length: Math.min(amount || 10, Math.max(shuffled.length, 10)) }, (_, i) => ({ ...shuffled[i % shuffled.length], id: i, options: shuffled[i % shuffled.length].options.map(o => ({ ...o })) }));
}

export function getLocalTutorReply(prompt) {
  const topic = prompt.trim().replace(/[?!.]+$/, '');
  return `## Study help: ${topic || 'your question'}\n\nI’m in offline study mode right now, so I can’t look up new facts. Here’s a practical way to work on it:\n\n1. **Break it into parts.** Write down the key terms or steps you need to understand.\n2. **Recall before rereading.** Try explaining each part from memory, then check your notes.\n3. **Use a quick quiz.** Make one question for each key idea and revisit the ones you miss.\n\nTry the built-in quiz or flashcards for a quick practice session. For a specific answer, add your notes or source text to your question and I can help organize it when an AI provider is configured.`;
}
