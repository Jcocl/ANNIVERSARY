/**
 * PERSONALIZE THE WHOLE EXPERIENCE HERE.
 * You do not need to edit index.html or app.js for normal customization.
 */
window.LOVE_CONFIG = {
  names: {
    myName: "John Clark O. Oclarit",
    girlfriendName: "Angelica C. Puri",
    nickname: "Dear"
  },

  dates: {
    anniversary: "2026-08-11",
    relationshipStart: "2022-08-11T00:00:00"
  },

  lock: {
    enabled: true,
    password: "Dear",
    question: "What do I call you?",
    hint: "Hint: it is the endearment you invented hihi."
  },

  intro: {
    greeting: "Hi, my Bubu Dear. 💙",
    subheading: "I made a little universe for you…"
  },

  // Audio never autoplays. Leave a path empty to show a friendly placeholder.
  media: {
    songTitle: "Dear",
    songArtist: "Ben & Ben",
    songVolume: 0.42,
    videoBackgroundMusicVolume: 0.16,
    voiceBackgroundMusicVolume: 0.20,
    videoVolume: 0.40,
    localSong: "audio/background-music.mp3", // Example: "audio/our-song.mp3"
    spotifyUrl: "",
    youtubeUrl: "",
    voiceMessage: "audio/voice-message.mp3", // Example: "audio/message.mp3"
    videoMessage: "Video/happy.mp4", // Example: "videos/message.mp4"
    meaningfulPhoto: "images/special/JOGG.jpg", // Example: "images/memories/meaningful.jpg"
    finalePhoto: "images/special/po.jpg" // Example: "images/memories/favorite.jpg"
  },

  // Sound effects are created in the browser, so no extra audio files are needed.
  soundEffects: {
    enabled: true,
    volume: 0.32,
    buttonFile: "audio/button-bubble-sfx.mp3",
    confettiFile: "audio/confetti-sfx.mp3",
    fireworksFile: "audio/fireworks-sfx.mp3"
  },

  // Occasional decorative Bubu & Dudu appearances while exploring the main website.
  wanderingSurprises: {
    enabled: true,
    initialDelay: 9000,
    minDelay: 16000,
    maxDelay: 30000,
    items: [
      { image: "images/surprises/bubu-dudu-chase.gif", motion: "cross", message: "Catch us if you can!" },
      { image: "images/surprises/bubu-dudu-nose-touch.gif", motion: "peek", message: "A tiny love check-in 💙" },
      { image: "images/surprises/bubu-dudu-cuddle.gif", motion: "float", message: "Emergency cuddle delivery" }
    ]
  },

  loveLetter: [
    "To My Dear,",
    "Somehow, ordinary days became my favorite memories the moment we bond at any place especially when only two of us.",
    "Thank you for every laugh, every quiet moment, every kulitan, and every version of us that chose to keep growing together.",
    "You make love feel safe, silly, soft, min, and real. If I could go back to the beginning, I would still find you. I would still choose you.",
    "Happy anniversary, my Dear. Here is another new chapter, the next one, and every new adventure begins.",
    "Love always,\n Bubu a.k.a Dear 💙"
  ],

  timeline: [
    { date: "The beginning", title: "The Day We Met", emoji: "✨", description: "The day I captured a picture of you and can't stop staring at it.", secret: "I did not know it yet, but I think I fall in love.", image: "images/timeline/beginning.jpg" },
    { date: "Soon after", title: "Our First Conversation", emoji: "💬", description: "One conversation is from our 10-PEARL Group, and because of little chikahan we then started to play Mobile Legends.", secret: "I already have a crush on you and I made an ML account named for you.", image: "" },
    { date: "Our first date", title: "The First Meet UP", emoji: "🌷", description: "A little nervous, a lot excited, that day is when we are at Bagsic place.", secret: "My favorite part was the time you looked at me and I wink😉.", image: "" },
    { date: "A camera-roll", title: "Our First Picture", emoji: "📸", description: "Proof that the cutest story had officially begun.", secret: "This picture is our first romatic pic this photograph belongs to my mind and heart.", image: "images/timeline/firstpics.jpg" },
    { date: "A very good day", title: "One of Adventures", emoji: "🗺️", description: "We like to go around tarlac and even outside tarlac discovering more places to make memories of each other too.", secret: "The place is not the reason why it's special, it is being with you.", image: "images/timeline/IMG_20240403_195020.jpg" },
    { date: "The heart knew", title: "When I Realized", emoji: "💙", description: "The important thing is the memories we build. Even if we are short of budget; having only cheap things; or even no money at all.", secret: "It was you. Every memories is special just being with you.", image: "" },
    { date: "We still laugh about it", title: "Our Funniest Moment", emoji: "😂", description: "Every GAY that pass by I immediately laugh.", secret: "Kahit ikaw nadadamay tumawa, damay ka sa pagiging judgemental blee.", image: "" },
    { date: "We chose us", title: "Our Hardest Moment", emoji: "🌧️", description: "We learned that love is not about always happiness, always comfort, and only those good things.", secret: "Even our tampo, away, misunderstanding is also LOVE.", image: "" },
    { date: "Today", title: "Another Anniversary", emoji: "🎉", description: "Another chapter, another year, and still my easiest favorite person and only KAKAMPI and ENEMY.", secret: "Nothing is more special than you Dear ko.", image: "" }
  ],

  memories: [
    { title: "Captured Accidentally", date: "with JAM", location: "Robinson", caption: "We were just walking along the sidewalk but someone captured our cute moments.", secret: "Looks like a love story book cover.", image: "images/memories/starbucks.jpg", accent: "sky" },
    { title: "Fancy Restaurant", date: "SeaFood", location: "Merry Seafood", caption: "One of our favorite restaurant but not for our wallet.", secret: "mas masarap pa luto kong shrimp na cheese jan.", image: "images/memories/resto.jpg", accent: "lavender" },
    { title: "Freshman Year", date: "1st Year Students", location: "Anabel's House", caption: "Our first anniversary. You and me are only first year that time", secret: "I hope that bear is still alive.", image: "images/memories/Freshman Year.jpg", accent: "ocean" },
    { title: "Silly Bubu", date: "During our first PIC", location: "Anabel's Bakuran", caption: "This is during pandemic we are still shy that time.", secret: "This is the first picture that was being public and seen by our classmates.", image: "images/memories/Silly Bubu.jpg", accent: "cream" },
    { title: "Lucinda Lovers", date: "Libot langs", location: "Lucinda", caption: "We are roaming around lucinda as I am submitting my requirements.", secret: "Do you remember pumitas me ng bulaklak and tinago ko sa bag?",
      image: "images/memories/Lucinda.jpg", accent: "midnight" },
    { title: "Monthsarry", date: "Surprise Visit", location: "Anabel's House", caption: "CCS student visited an architecture pretty student.", secret: "Sana nadidiligan mopayang flowers.", image: "images/memories/Monthsarry.jpg", accent: "pink" },
    { title: "ALMOND", date: "lenovo", location: "Anabel's House", caption: "You finally have a laptop that will help you finish your course.", secret: "I hope that will last till we have our own jobs and fam.", image: "images/memories/Laptop.jpg", accent: "sky" },
    { title: "Date na may konting Jogging", date: "Morning", location: "Bypass Road", caption: "We wake up early just to get sun kissed.", secret: "Unfair for me since Maligaya to Bypass, ikaw Atioc to Bypass.", image: "images/memories/Jogging.jpg", accent: "lavender" }
  ],

  memoryMatchImages: [
    { id: "memory-01", image: "images/match/memory-01.jpg", alt: "Our close-up illustrated selfie" },
    { id: "memory-02", image: "images/match/memory-02.jpg", alt: "Our outdoor illustrated selfie beneath the trees" },
    { id: "memory-03", image: "images/match/memory-03.jpg", alt: "Our illustrated café selfie at night" },
    { id: "memory-04", image: "images/match/memory-04.jpg", alt: "Our smiling illustrated indoor selfie" },
    { id: "memory-05", image: "images/match/memory-05.jpg", alt: "Our playful illustrated portrait" },
    { id: "memory-06", image: "images/match/memory-06.jpg", alt: "Our cute illustrated bear-filter portrait" },
    { id: "memory-07", image: "images/match/memory-07.jpg", alt: "Our colorful illustrated selfie" },
    { id: "memory-08", image: "images/match/memory-08.jpg", alt: "Our silly illustrated shoulder selfie" }
  ],

  // Picture used by the 3x3 "Piece Us Together" sliding puzzle.
  puzzleGame: {
    image: "images/puzzle/pieces-us-together.jpg",
    alt: "A playful illustrated portrait of us wearing funny sunglasses",
    aspectRatio: "1341 / 1173"
  },

  quizQuestions: [
    { question: "During Pandemic, where did we first meet?", options: ["Zone C", "Maligaya", "Paraiso", "San Miguel"], answer: 0 },
    { question: "What food do we always crave?", options: ["Cake", "French Fries", "Ice Cream", "Pancit Canton"], answer: 2 },
      { question: "Who is more Cute?", options: ["Me", "You", "Kokey", "Hotdog"], answer: 0 },
    { question: "Who is more clingy?", options: ["Me", "You", "Both", "The bears"], answer: 0 },
    { question: "Who takes longer to reply? 😂", options: ["Me", "You", "The Wi-Fi", "No comment"], answer: 1 },
    { question: "Where did we make our Love Official?", options: ["Anabel's House", "Magic Star", "SM", "Market City"], answer: 3 }
  ],

  hiddenHeartReasons: [
    "Isn't she lovely.",
    "I love you too much.",
    "I love when you wear pajamas.",
    "Lab mo me?.",
    "Hakdog."
  ],

  funnyHabits: [
    "Takes forever to decide what to eat.",
    "Always allthetime often anywhere anytime hungry.",
    "Gets mad but even knowing inaasar lang.",
    "Replies ‘👍’ and alam kona mood nya.",
    "Clumsy as always."
  ],

  coupons: [
    { id: "hugs", icon: "🫂", title: "Unlimited Hugs", note: "Valid forever. No expiry. No hug limit." },
    { id: "kiss", icon: "💋", title: "One Free Kiss", note: "Redeemable anywhere that makes us smile." },
    { id: "date", icon: "🌷", title: "Your Choice of Date", note: "You pick the plan. I bring the love." },
    { id: "movie", icon: "🎬", title: "Movie Night, Your Pick", note: "Yes, even the one movie you like I pretend not to like." },
    { id: "peace", icon: "😇", title: "One Day Without Annoying You", note: "This Terms and conditions may be impossible to fulfill 😂" },
    { id: "Min-ute", icon: "🐻", title: "Min", note: "Anytime, Anywhere." },
    { id: "food", icon: "🍓", title: "Food Treat From Me", note: "Your craving, my treat, You pay. Chars" },
    { id: "lambing", icon: "💙", title: "One Lambing Session", note: "Includes extra sweetness and zero teasing." }
  ],

  reasonsILoveYou: [
    "Your smile.", "The way you laugh.", "How you listen to me.", "Your random stories.", "How cute you look when you are mad.",
    "Because being with you feels like home.", "Your kindness when nobody is watching.", "The way your eyes light up when you are excited.", "How you remember the little things.", "Your cute voice.",
    "The way you make ordinary days special.", "How safe I feel telling you anything.", "Your cute lips.", "How you care for the people you love.", "The way you believe in me.",
    "Your strength on difficult days.", "How we can be silly together.", "Your hugs.", "Your good morning messages.", "Your good night messages.",
    "The way you make me want to be better.", "How beautiful you are without even trying.", "The expressions you make when thinking.", "The way you pretend not to want my food.", "How every song can somehow remind me of you.",
    "The calm I feel when you are near.", "The adventures we have not taken yet.", "The memories we already made.", "How you turn mistakes into lessons with me.", "Your patience with my chaos.",
    "The way you say my name.", "Your soft heart.", "Your honest opinions.", "How proud I am to call you mine.", "The way you fit into my future dreams.",
    "Your beautiful Hair.", "How you make me smile at the worst times.", "The comfort of comfortable silence with you.", "How you make love feel like friendship too.", "The way you I look at you and you look innocent.",
    "Your courage.", "Your tenderness.", "Your curiosity.", "Your determination.", "The way you make me feel chosen.",
    "How you let me choose you back.", "The life we are building one day at a time.", "Every version of you I have met.", "Every version of you still to come.", "Simply because you are you."
  ],

  nightMessages: [
    "You are my favorite person Dear ko .",
    "You make ordinary days special.",
    "My safest place.",
    "My favorite person.",
    "My home.",
    "My only Treasure.",
    "In every universe, I would look for you."
  ],

  surpriseRewards: {
    catch: "Secret reward: a lifetime supply of kisses plus one extra right now. 💋",
    match: "Memory unlocked: I still smile every time I think about how our story began.",
    hearts: "You found the map to my heart. Plot twist: it has always pointed to you.",
    finale: "Promise unlocked: no matter how many chapters change, I will keep choosing us."
  },

  finale: {
    title: "Happy Anniversary, My Dear Angelica. 💙",
    lines: [
      "Thank you for being part of my life.",
      "Thank you for every laugh, every memory, every hug, every random conversation, every naughty things, and even every our little tampo's.",
      "If I had the chance to start everything again…",
      "I WOULD STILL CHOOSE YOU.",
      "Again. And again. And again.",
      "In every lifetime."
    ]
  }
};
