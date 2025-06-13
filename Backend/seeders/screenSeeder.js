
const Screen = require('../models/Screen');

const screensData = [
  {
    name: "Standard Screen 1",
    description: "A great all-around gaming setup.",
    features: ["PS5", "4K Monitor", "Comfortable Chair"],
    imagePlaceholderUrl: "https://placehold.co/600x400.png",
    imageAiHint: "gaming monitor",
    isActive: true
  },
  {
    name: "Premium Screen A",
    description: "Top-tier experience with premium peripherals.",
    features: ["PS5 Pro", "OLED 4K TV", "Racing Wheel Setup", "Surround Sound"],
    imagePlaceholderUrl: "https://placehold.co/600x400.png",
    imageAiHint: "console gaming",
    isActive: true
  },
  {
    name: "Arcade Zone Alpha",
    description: "Classic arcade games and modern fighters. Perfect for retro fans.",
    features: ["Arcade Cabinet Multi-Game", "Fight Stick Ready", "Retro Theme"],
    imagePlaceholderUrl: "https://placehold.co/600x400.png",
    imageAiHint: "arcade machine",
    isActive: true
  },
  {
    name: "VR Experience Pod",
    description: "Immerse yourself in virtual reality.",
    features: ["High-end VR Headset", "Motion Controllers", "Dedicated VR Space"],
    imagePlaceholderUrl: "https://placehold.co/600x400.png",
    imageAiHint: "virtual reality",
    isActive: true
  }
];

const seedScreens = async () => {
  try {
    // Check if there are any screens already to prevent duplicate seeding
    const existingScreensCount = await Screen.countDocuments();
    if (existingScreensCount > 0) {
      console.log('Screens collection already contains data. Seeding skipped.');
      return;
    }

    // Add timestamps to data
    const screensToSeed = screensData.map(screen => ({
      ...screen,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await Screen.insertMany(screensToSeed);
    console.log('Screens seeded successfully!');
  } catch (error) {
    console.error('Error seeding screens:', error);
    // process.exit(1); // Optional: exit if seeding fails critically
  }
};

module.exports = seedScreens;
