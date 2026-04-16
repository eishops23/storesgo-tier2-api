const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Fixing Category Structure Dynamically ===\n');
  
  // Find all top-level categories (parentId: null)
  const topLevel = await prisma.category.findMany({
    where: { parentId: null }
  });
  
  console.log('Top-level categories:', topLevel.length);
  
  let fixed = 0;
  
  for (const parent of topLevel) {
    // Find direct children of this parent
    const children = await prisma.category.findMany({
      where: { parentId: parent.id }
    });
    
    // Check if any child has the same or similar name as parent (duplicate nesting)
    for (const child of children) {
      const childNameLower = child.name.toLowerCase().replace(/s$/, '');
      const parentNameLower = parent.name.toLowerCase().replace(/s$/, '').replace(' products', '');
      
      // If child name is same/subset of parent name, it's likely a duplicate
      if (childNameLower === parentNameLower || 
          parentNameLower.includes(childNameLower) || 
          childNameLower.includes(parentNameLower)) {
        
        console.log('\nFound nested duplicate: "' + parent.name + '" > "' + child.name + '"');
        
        // Find grandchildren (real subcategories)
        const grandchildren = await prisma.category.findMany({
          where: { parentId: child.id }
        });
        
        if (grandchildren.length > 0) {
          console.log('  Moving ' + grandchildren.length + ' subcategories up to "' + parent.name + '"');
          
          // Move grandchildren to parent
          await prisma.category.updateMany({
            where: { parentId: child.id },
            data: { parentId: parent.id }
          });
          
          // Delete the duplicate middle category
          try {
            await prisma.category.delete({ where: { id: child.id } });
            console.log('  Deleted duplicate "' + child.name + '" (id:' + child.id + ')');
          } catch (e) {
            console.log('  Could not delete (may have products): ' + e.message.slice(0, 50));
          }
          
          fixed++;
        }
      }
    }
  }
  
  console.log('\n=== Summary ===');
  console.log('Fixed nested duplicates:', fixed);
  
  // Show current structure
  const updated = await prisma.category.findMany({
    where: { parentId: null }
  });
  
  console.log('\nTop-level categories now:');
  for (const cat of updated.slice(0, 15)) {
    const count = await prisma.category.count({ where: { parentId: cat.id } });
    console.log('  ' + cat.name + ': ' + count + ' subcategories');
  }
  
  await prisma.$disconnect();
}
main();
