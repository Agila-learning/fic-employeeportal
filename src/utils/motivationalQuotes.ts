export const motivationalQuotes = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The only way to do great work is to love what you do.",
  "Believe you can and you're halfway there.",
  "Your limitation—it's only your imagination.",
  "Push yourself, because no one else is going to do it for you.",
  "Great things never come from comfort zones.",
  "Dream it. Wish it. Do it.",
  "Success doesn't just find you. You have to go out and get it.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Don't stop when you're tired. Stop when you're done.",
  "Wake up with determination. Go to bed with satisfaction.",
  "Do something today that your future self will thank you for.",
  "Little things make big days.",
  "It's going to be hard, but hard does not mean impossible.",
  "Don't wait for opportunity. Create it.",
  "Sometimes we're tested not to show our weaknesses, but to discover our strengths.",
  "The key to success is to focus on goals, not obstacles.",
  "Dream bigger. Do bigger.",
  "Your only limit is you.",
  "Stay positive, work hard, make it happen.",
  "Don't be afraid to give up the good to go for the great.",
  "Every champion was once a contender that refused to give up.",
  "You are capable of more than you know.",
  "Work hard in silence, let success make the noise.",
  "The future depends on what you do today.",
  "Success is walking from failure to failure with no loss of enthusiasm.",
  "The only impossible journey is the one you never begin.",
  "If you want to achieve greatness, stop asking for permission.",
  "Things may come to those who wait, but only the things left by those who hustle.",
  "A goal without a plan is just a wish."
];

export const getRandomQuote = () => {
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  return motivationalQuotes[dayOfYear % motivationalQuotes.length];
};
