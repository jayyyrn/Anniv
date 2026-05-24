/**
 * Romantic Anniversary Web Game - Configuration File
 * 
 * Customize this structure to make the experience completely unique to you.
 * Change the photos, letters, quiz questions, and videos below!
 */

export interface PhotoAsset {
  src: string;
  caption: string;
}

export interface LoveLetter {
  title: string;
  body: string;
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: string;
  hint: string;
}

export interface GameConfig {
  /**
   * The name of your partner (e.g., girlfriend's name)
   */
  playerName: string;
  
  /**
   * Your names combined (e.g., "Alex & Sophia")
   */
  coupleNames: string;
  
  /**
   * Annversary date or key milestone (shown in headers or footers)
   */
  anniversaryDate: string;

  /**
   * Level 1 & 2 Photos: A list of beautiful memory photos.
   * For the 4x4 Memory Grid (Level 1), these will be used as the back of matching cards.
   * These also form the photo slideshow gallery on the Final page.
   * Customize 'src' with local file paths (e.g., '/images/memory1.jpg') or online CDN URLs.
   */
  photos: PhotoAsset[];

  /**
   * Level 2: Love Quiz Questions
   * Create 5 fun, emotional multiple-choice questions custom to your relationship.
   * On completing this stage, your partner will advance!
   */
  quizQuestions: QuizQuestion[];

  /**
   * Level 3: Sliding Puzzle Background Photo.
   * This is the photo that will be divided into a 3x3 grid for the sliding puzzle!
   * Recommended to use a highly recognizable photo of the two of you, under 1MB.
   */
  slidingPuzzlePhoto: string;

  /**
   * Final Reward Page: Cozy Letters
   * These will be revealed inside the envelope on click!
   * You can add multiple letters (the player can read through them).
   */
  letters: LoveLetter[];

  /**
   * Final Reward Page: YouTube or raw video URL.
   * Can be a beautiful drive link, a YouTube embed, or empty.
   * Default is a beautiful fireplace/sparkler atmosphere.
   */
  videoUrl: string;

  /**
   * Optional Anniversary Voice Message.
   * Can be an MP3/WAV/WebM URL or a Base64-encoded audio Data URI.
   */
  voiceMessageUrl?: string;
  voiceMessageBase64?: string;

  /**
   * Ambient Music track or sound synthesis description
   */
  musicEnabled: boolean;
}

export const ROMANTIC_GAME_CONFIG: GameConfig = {
  playerName: "Sophia",
  coupleNames: "Alex & Sophia",
  anniversaryDate: "October 14th",
  
  // Custom Photos for Level 1 (Memory Game pairs) and final gallery slideshow
  photos: [
    {
      src: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=600&auto=format&fit=crop",
      caption: "Under the starlight - where our forever adventure began."
    },
    {
      src: "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=600&auto=format&fit=crop",
      caption: "Our first fancy dinner. We talked for hours until the cafe closed."
    },
    {
      src: "https://images.unsplash.com/photo-1494774157365-9e04c6722e47?q=80&w=600&auto=format&fit=crop",
      caption: "Running on the beach, chasing the sunset together."
    },
    {
      src: "https://images.unsplash.com/photo-1533105079780-92b9be482077?q=80&w=600&auto=format&fit=crop",
      caption: "Making a wish with sparklers! Every single wish is about you."
    },
    {
      src: "https://images.unsplash.com/photo-1543257580-7269da773bf5?q=80&w=600&auto=format&fit=crop",
      caption: "Warm winter hot chocolates & endless laughter in the cold."
    },
    {
      src: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop",
      caption: "The beautiful shadow heart we cast on the brick walls of Paris."
    },
    {
      src: "https://images.unsplash.com/photo-1518895949257-7621c3c786d7?q=80&w=600&auto=format&fit=crop",
      caption: "A simple crimson rose, a symbol of my blossoming love for you."
    },
    {
      src: "https://images.unsplash.com/photo-1501901633658-555f3376cda2?q=80&w=600&auto=format&fit=crop",
      caption: "Holding hands by the lake, enjoying the silent peace of being side-by-side."
    }
  ],

  // Quiz questions that test your shared memory. Custom, romantic, and engaging.
  quizQuestions: [
    {
      id: 1,
      question: "Where did we go on our absolute first official date?",
      options: [
        "The cozy little Italian bistro downtown",
        "The botanical garden conservatory",
        "The rainy beach boardwalk",
        "The drive-in movie theater"
      ],
      correctAnswer: "The cozy little Italian bistro downtown",
      hint: "Think about the place with the red-and-white checkered tablecloths!"
    },
    {
      id: 2,
      question: "Who said 'I love you' first, and where?",
      options: [
        "Sophia said it under the umbrella in the rain",
        "Alex said it during the car ride home from our first trip",
        "Alex blurted it out over coffee on Saturday morning",
        "We both whispered it simultaneously during the fireworks"
      ],
      correctAnswer: "Alex said it during the car ride home from our first trip",
      hint: "It happened right when we crossed the state line, listening to our favorite indie playlist!"
    },
    {
      id: 3,
      question: "What is our absolute favorite shared comfort food?",
      options: [
        "Wood-fired Margherita Pizza with spicy honey",
        "Late-night spicy ramen and pork dumplings",
        "Triple chocolate fudge cookies with cold milk",
        "Loaded vegan nachos from the corner food truck"
      ],
      correctAnswer: "Late-night spicy ramen and pork dumplings",
      hint: "The bowl is always steaming hot, and we always argue over who gets the last dumpling!"
    },
    {
      id: 4,
      question: "Which song instantly reminds us of our travels?",
      options: [
        "Chasing Cars - Snow Patrol",
        "Yellow - Coldplay",
        "Sunset Lover - Petit Biscuit",
        "Sweater Weather - The Neighbourhood"
      ],
      correctAnswer: "Sunset Lover - Petit Biscuit",
      hint: "It has that beautiful breezy guitar intro we hummed while driving with the windows down."
    },
    {
      id: 5,
      question: "Where did we spend our favorite anniversary getaway?",
      options: [
        "The rustic cabin overlooking the foggy valley",
        "An artistic boutique hotel in the historic quarter",
        "A peaceful beachfront villa with a private pier",
        "Glamping under the giant redwood trees"
      ],
      correctAnswer: "The rustic cabin overlooking the foggy valley",
      hint: "Remember the fireplace, hot cider, and the board games that we played until 2 AM?"
    }
  ],

  // Photo for the 3x3 Sliding Tile Puzzle (Level 3)
  // Highly recommended to use a gorgeous romantic sunset or close-up memory
  slidingPuzzlePhoto: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop",

  // Handwritten letters for the Interactive Envelope reveal
  letters: [
    {
      title: "My Happiest Beginning",
      body: "My dearest Sophia,\n\nLooking back at our journey, I still pinched myself thinking about how incredibly lucky I am to have you in my life. Every single memory we've shared feels like a glowing star in my sky.\n\nFrom our very first date where you made me laugh so hard I spilled my water, to the quiet nights we spend just listening to the rain fall outside, being with you is my ultimate source of peace. You make my days brighter, my heart fuller, and my life infinitely more beautiful.\n\nThank you for your warmth, your patience, and your unconditional love. This little journey is just a tiny tribute to the beautiful story we are writing together.\n\nWith all my love, forever,\nAlex"
    },
    {
      title: "To Many More Adventures",
      body: "To my favorite travel partner,\n\nThere is no one else I would rather get lost with in a foreign city, share a steaming bowl of late-night ramen with, or count stars with in the middle of nowhere.\n\nYou have an extraordinary gift for bringing out the light in everyone around you, especially me. Our journey isn't just about the scenic sunsets or the exciting destinations; it is about the safety of holding your hand of every step of the way.\n\nAs we close this chapter and turn to the next, I want you to know that my love for you only grows deeper with every sunrise we share.\n\nHappy Anniversary, my love!\n❤️"
    }
  ],

  // Customizable final gift video URL (e.g., YouTube or a direct mp4)
  // Perfect for inserting a custom slideshow video, your personal greeting, or an ambient video!
  videoUrl: "https://www.youtube.com/embed/5H-S78g7_dI", // Romantic guitar instrumental backdrop scene

  musicEnabled: true
};
