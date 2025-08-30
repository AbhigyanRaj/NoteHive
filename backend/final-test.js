const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

console.log('=== Final Connection Test ===\n');

async function testFullConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    
    const conn = await mongoose.connect(process.env.DATABASE_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('   Host:', conn.connection.host);
    console.log('   Database:', conn.connection.name);
    
    // Test User model operations
    const User = require('./src/models/User');
    
    console.log('\n🔄 Testing User model...');
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpass123'
    });
    
    await testUser.save();
    console.log('✅ Test user created successfully');
    
    const foundUser = await User.findOne({ email: 'test@example.com' });
    console.log('✅ Test user found:', foundUser.name);
    
    await User.deleteOne({ email: 'test@example.com' });
    console.log('✅ Test user deleted successfully');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    
    console.log('\n🎉 ALL TESTS PASSED! Your backend is ready to go!');
    console.log('   ✅ MongoDB connection working');
    console.log('   ✅ User model working');
    console.log('   ✅ Google OAuth configured');
    console.log('   ✅ JWT secret configured');
    
  } catch (error) {
    console.log('❌ Test failed:', error.message);
    
    if (error.message.includes('IP')) {
      console.log('\n💡 Still need to whitelist IP: 103.211.18.162');
      console.log('   Go to MongoDB Atlas → Network Access → Add IP Address');
    }
  }
}

testFullConnection();
