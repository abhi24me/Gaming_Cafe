
const Screen = require('../models/Screen');

const screensData = [
  {
    name: "Standard Screen 1",
    description: "A great all-around gaming setup.",
    features: ["PS5", "4K Monitor", "Comfortable Chair"],
    imagePlaceholderUrl: "https://placehold.co/600x400.png",
    imageAiHint: "gaming monitor",
    basePrice: 100, // Standard price
    priceOverrides: [
      { // Weekend evening surge
        daysOfWeek: [0, 6], // Sunday, Saturday
        startTimeUTC: "18:00",
        endTimeUTC: "23:59",
        price: 150
      },
      { // Weekday morning discount
        daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
        startTimeUTC: "09:00",
        endTimeUTC: "12:00",
        price: 80
      }
    ],
    isActive: true
  },
  {
    name: "Premium Screen A",
    description: "Top-tier experience with premium peripherals.",
    features: ["PS5 Pro", "OLED 4K TV", "Racing Wheel Setup", "Surround Sound"],
    imagePlaceholderUrl: "https://placehold.co/600x400.png",
    imageAiHint: "console gaming",
    basePrice: 200,
    priceOverrides: [
      { // All day weekend price
        daysOfWeek: [0, 6], // Sunday, Saturday
        startTimeUTC: "00:00",
        endTimeUTC: "23:59",
        price: 250
      }
    ],
    isActive: true
  }
];

const seedScreens = async () => {
  try {
    const existingScreensCount = await Screen.countDocuments();
    if (existingScreensCount > 0) {
      console.log('Screens collection already contains data. Seeding skipped.');
      return;
    }

    const screensToSeed = screensData.map(screen => ({
      ...screen,
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    await Screen.insertMany(screensToSeed);
    console.log('Screens seeded successfully with base prices and example overrides!');
  } catch (error) {
    console.error('Error seeding screens:', error);
  }
};

module.exports = seedScreens;
