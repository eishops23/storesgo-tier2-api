const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categoryIcons = {
  // Food & Grocery
  'Grocery': '🛒', 'Food': '🍽️', 'Snacks': '🍿', 'Chips': '🥔', 'Cookies': '🍪',
  'Crackers': '🥨', 'Candy': '🍬', 'Chocolate': '🍫', 'Gum': '🍬', 'Nuts': '🥜',
  'Popcorn': '🍿', 'Pretzels': '🥨', 'Jerky': '🥩', 'Granola': '🥣', 'Trail Mix': '🥜',
  
  // Beverages
  'Beverages': '🥤', 'Drinks': '🥤', 'Water': '💧', 'Soda': '🥤', 'Juice': '🧃',
  'Coffee': '☕', 'Tea': '🍵', 'Energy Drinks': '⚡', 'Sports Drinks': '🏃',
  'Milk': '🥛', 'Wine': '🍷', 'Beer': '🍺', 'Spirits': '🥃', 'Cocktails': '🍸',
  
  // Dairy & Eggs
  'Dairy': '🥛', 'Eggs': '🥚', 'Cheese': '🧀', 'Yogurt': '🥛', 'Butter': '🧈',
  'Cream': '🥛', 'Milk Alternatives': '🥛', 'Sour Cream': '🥛', 'Cottage Cheese': '🧀',
  
  // Meat & Seafood
  'Meat': '🥩', 'Beef': '🥩', 'Chicken': '🍗', 'Pork': '🥓', 'Turkey': '🦃',
  'Lamb': '🍖', 'Seafood': '🦐', 'Fish': '🐟', 'Shrimp': '🦐', 'Salmon': '🐟',
  'Crab': '🦀', 'Lobster': '🦞', 'Sausage': '🌭', 'Bacon': '🥓', 'Ham': '🍖',
  'Hot Dogs': '🌭', 'Deli': '🥪', 'Lunch Meat': '🥪',
  
  // Produce
  'Produce': '🥬', 'Fruits': '🍎', 'Vegetables': '🥦', 'Fresh': '🥗',
  'Apples': '🍎', 'Bananas': '🍌', 'Oranges': '🍊', 'Grapes': '🍇', 'Berries': '🍓',
  'Strawberries': '🍓', 'Blueberries': '🫐', 'Lemons': '🍋', 'Limes': '🍋',
  'Avocados': '🥑', 'Tomatoes': '🍅', 'Potatoes': '🥔', 'Onions': '🧅', 'Garlic': '🧄',
  'Carrots': '🥕', 'Broccoli': '🥦', 'Lettuce': '🥬', 'Spinach': '🥬', 'Peppers': '🌶️',
  'Corn': '🌽', 'Mushrooms': '🍄', 'Celery': '🥬', 'Cucumbers': '🥒',
  
  // Bakery
  'Bakery': '🍞', 'Bread': '🍞', 'Bagels': '🥯', 'Muffins': '🧁', 'Donuts': '🍩',
  'Cakes': '🎂', 'Cookies': '🍪', 'Pies': '🥧', 'Pastries': '🥐', 'Rolls': '🥖',
  'Croissants': '🥐', 'Tortillas': '🌮', 'English Muffins': '🥯', 'Buns': '🍔',
  
  // Frozen
  'Frozen': '🧊', 'Ice Cream': '🍦', 'Frozen Pizza': '🍕', 'Frozen Meals': '🍱',
  'Frozen Vegetables': '🥦', 'Frozen Fruits': '🍓', 'Frozen Breakfast': '🥞',
  
  // Pantry
  'Pantry': '🥫', 'Canned': '🥫', 'Pasta': '🍝', 'Rice': '🍚', 'Beans': '🫘',
  'Soup': '🍲', 'Sauce': '🥫', 'Condiments': '🧂', 'Spices': '🌿', 'Oil': '🫒',
  'Vinegar': '🍶', 'Flour': '🌾', 'Sugar': '🧂', 'Baking': '🧁', 'Cereal': '🥣',
  'Oatmeal': '🥣', 'Breakfast': '🍳', 'Syrup': '🍯', 'Honey': '🍯', 'Jam': '🍯',
  'Peanut Butter': '🥜', 'Jelly': '🍇',
  
  // Baby
  'Baby': '👶', 'Baby Food': '🍼', 'Diapers': '👶', 'Baby Formula': '🍼',
  'Baby Care': '👶', 'Baby Bath': '🛁', 'Baby Health': '💊',
  
  // Pet
  'Pet': '🐾', 'Pets': '🐾', 'Dog': '🐕', 'Cat': '🐱', 'Pet Food': '🦴',
  'Dog Food': '🐕', 'Cat Food': '🐱', 'Pet Treats': '🦴', 'Pet Supplies': '🐾',
  
  // Health & Medicine
  'Health': '💊', 'Medicine': '💊', 'Vitamins': '💊', 'First Aid': '🩹',
  'Pain Relief': '💊', 'Cold & Flu': '🤧', 'Allergy': '🤧', 'Digestive': '💊',
  'Sleep': '😴', 'Supplements': '💪',
  
  // Personal Care (more)
  'Personal Care': '🧴', 'Bath': '🛁', 'Soap': '🧼', 'Shampoo': '🧴',
  'Conditioner': '💇', 'Body Wash': '🧴', 'Lotion': '🧴', 'Deodorant': '🧴',
  'Oral Care': '🦷', 'Toothpaste': '🦷', 'Mouthwash': '💧', 'Dental': '🦷',
  'Shaving': '🪒', 'Razors': '🪒', 'Hair': '💇', 'Skin': '✨', 'Face': '😊',
  'Feminine': '🌸', 'Makeup': '💄', 'Cosmetics': '💄', 'Fragrance': '🌹',
  
  // Household
  'Household': '🏠', 'Cleaning': '🧹', 'Laundry': '🧺', 'Paper': '🧻',
  'Trash Bags': '🗑️', 'Dish': '🍽️', 'Dishwasher': '🍽️', 'Air Fresheners': '🌸',
  'Batteries': '🔋', 'Light Bulbs': '💡', 'Storage': '📦', 'Aluminum Foil': '🥫',
  'Plastic Wrap': '📦', 'Paper Towels': '🧻', 'Toilet Paper': '🧻', 'Tissues': '🧻',
  'Napkins': '🧻', 'Bleach': '🧴', 'Detergent': '🧴',
  
  // Kitchen
  'Kitchen': '🍳', 'Cookware': '🍳', 'Utensils': '🥄', 'Food Storage': '📦',
  
  // Office
  'Office': '📎', 'Stationery': '✏️', 'Paper': '📄',
  
  // Electronics
  'Electronics': '📱', 'Batteries': '🔋', 'Cables': '🔌',
  
  // Seasonal
  'Seasonal': '🎄', 'Holiday': '🎉', 'Party': '🎈', 'Summer': '☀️', 'Winter': '❄️',
  
  // International/Ethnic
  'International': '🌍', 'Mexican': '🌮', 'Asian': '🍜', 'Italian': '🍝',
  'Indian': '🍛', 'Chinese': '🥡', 'Japanese': '🍣', 'Korean': '🍜',
  'Latin': '🌮', 'Caribbean': '🏝️', 'Middle Eastern': '🧆', 'Mediterranean': '🫒',
  
  // Generic fallbacks
  'Other': '📦', 'More': '➕', 'Misc': '📦', 'Specialty': '⭐'
};

async function main() {
  console.log('Fixing ALL category icons...\n');
  
  // Get all categories with folder icon
  const folders = await prisma.category.findMany({
    where: { icon: '📂' }
  });
  
  console.log('Categories with folder icon:', folders.length);
  
  let updated = 0;
  let notFound = [];
  
  for (const cat of folders) {
    let newIcon = null;
    
    // Try exact match first
    if (categoryIcons[cat.name]) {
      newIcon = categoryIcons[cat.name];
    } else {
      // Try partial match
      for (const [keyword, icon] of Object.entries(categoryIcons)) {
        if (cat.name.toLowerCase().includes(keyword.toLowerCase())) {
          newIcon = icon;
          break;
        }
      }
    }
    
    if (newIcon) {
      await prisma.category.update({
        where: { id: cat.id },
        data: { icon: newIcon }
      });
      updated++;
    } else {
      notFound.push(cat.name);
    }
  }
  
  console.log('Updated:', updated);
  console.log('Not matched:', notFound.length);
  
  if (notFound.length > 0 && notFound.length <= 50) {
    console.log('\nUnmatched categories:');
    notFound.forEach(n => console.log('  - ' + n));
  }
  
  // Check remaining
  const remaining = await prisma.category.count({ where: { icon: '📂' } });
  console.log('\nStill with folder icon:', remaining);
  
  await prisma.$disconnect();
}
main();
