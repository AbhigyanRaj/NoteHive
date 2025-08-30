const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('=== NoteHive Backend Debug Setup ===\n');

// Check environment variables
console.log('1. Environment Variables Check:');
console.log('   PORT:', process.env.PORT || 'NOT SET (will use 5001)');
console.log('   DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
console.log('   JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
console.log('   GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'SET' : 'NOT SET');
console.log('   GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'NOT SET');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'NOT SET');

console.log('\n2. Testing MongoDB Connection:');

if (!process.env.DATABASE_URL) {
  console.log('   ❌ DATABASE_URL is not set in .env file');
  console.log('   📝 Please add your MongoDB connection string to .env file');
  process.exit(1);
}

// Test MongoDB connection
async function testConnection() {
  try {
    console.log('   🔄 Attempting to connect to MongoDB...');
    
    const conn = await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });
    
    console.log('   ✅ MongoDB Connected Successfully!');
    console.log('   📍 Host:', conn.connection.host);
    console.log('   🗄️  Database:', conn.connection.name);
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('   📊 Available collections:', collections.length);
    
    await mongoose.disconnect();
    console.log('   🔌 Disconnected from MongoDB');
    
  } catch (error) {
    console.log('   ❌ MongoDB Connection Failed:');
    console.log('   Error:', error.message);
    
    if (error.message.includes('IP')) {
      console.log('\n   🔧 Possible Solutions:');
      console.log('   1. Add your current IP to MongoDB Atlas whitelist');
      console.log('   2. Or add 0.0.0.0/0 to allow all IPs (less secure)');
      console.log('   3. Check if your connection string is correct');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n   🔧 Authentication Issue:');
      console.log('   1. Check username/password in connection string');
      console.log('   2. Ensure user has proper database permissions');
    }
  }
}

testConnection();
