const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

console.log('=== Testing MongoDB Connection ===\n');

const dbUrl = process.env.DATABASE_URL;
console.log('Current DATABASE_URL:', dbUrl);

// Check if URL ends with database name
if (!dbUrl.includes('mongodb.net/') || dbUrl.endsWith('mongodb.net/')) {
  console.log('❌ Issue found: DATABASE_URL is missing database name');
  console.log('Current format:', dbUrl);
  console.log('Should be: mongodb+srv://username:password@cluster.mongodb.net/database_name');
  
  // Suggest a fix
  const fixedUrl = dbUrl + 'notehive';
  console.log('Suggested fix:', fixedUrl);
  
  console.log('\n🔧 Testing with suggested database name...');
  testConnection(fixedUrl);
} else {
  console.log('✅ DATABASE_URL format looks correct');
  testConnection(dbUrl);
}

async function testConnection(url) {
  try {
    console.log('🔄 Connecting to:', url.replace(/:[^:@]*@/, ':***@'));
    
    const conn = await mongoose.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log('Host:', conn.connection.host);
    console.log('Database:', conn.connection.name);
    
    // Test creating a simple document
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = new TestModel({ test: 'connection_test' });
    await testDoc.save();
    console.log('✅ Test document created successfully');
    
    await TestModel.deleteOne({ test: 'connection_test' });
    console.log('✅ Test document deleted successfully');
    
    await mongoose.disconnect();
    console.log('🔌 Disconnected successfully');
    
  } catch (error) {
    console.log('❌ Connection failed:', error.message);
    
    if (error.message.includes('IP')) {
      console.log('\n💡 IP Whitelist Issue:');
      console.log('1. Go to MongoDB Atlas → Network Access');
      console.log('2. Add your current IP or use 0.0.0.0/0 for all IPs');
    }
    
    if (error.message.includes('authentication')) {
      console.log('\n💡 Authentication Issue:');
      console.log('1. Check username/password in connection string');
      console.log('2. Ensure database user has read/write permissions');
    }
  }
}
