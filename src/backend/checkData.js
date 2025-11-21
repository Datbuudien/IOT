const { MongoClient } = require('mongodb');
require('dotenv').config();

async function checkData() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(process.env.DB_NAME);
  
  console.log('📊 Kiểm tra dữ liệu sensor mới nhất:\n');
  
  const data = await db.collection('sensordata')
    .find()
    .sort({ timestamp: -1 })
    .limit(3)
    .toArray();
  
  data.forEach((item, index) => {
    console.log(`\n--- Sensor Data ${index + 1} ---`);
    console.log('Device ID:', item.deviceId);
    console.log('Temperature:', item.temperature);
    console.log('Humidity:', item.humidity);
    console.log('Soil Moisture:', item.soil_moisture);
    console.log('Weather Condition:', item.weather_condition || '❌ KHÔNG CÓ');
    console.log('Water Level:', item.water_level || '❌ KHÔNG CÓ');
    console.log('Timestamp:', item.timestamp);
  });
  
  await client.close();
}

checkData().catch(console.error);
