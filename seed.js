// run: node seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Report = require('./models/Report');

const PUNE_LOCATIONS = [
  { lat: 18.5204, lng: 73.8567, address: 'Shivajinagar, FC Road, Pune', ward: 'Shivajinagar' },
  { lat: 18.5642, lng: 73.7769, address: 'Kothrud Depot, Pune', ward: 'Kothrud' },
  { lat: 18.4793, lng: 73.9263, address: 'Hadapsar IT Park Road, Pune', ward: 'Hadapsar' },
  { lat: 18.5975, lng: 73.7898, address: 'Wakad Flyover, Pune', ward: 'Wakad' },
  { lat: 18.5590, lng: 73.7868, address: 'Baner Road, Pune', ward: 'Baner' },
  { lat: 18.4528, lng: 73.8736, address: 'Kondhwa Main Road, Pune', ward: 'Kondhwa' },
  { lat: 18.6181, lng: 73.8027, address: 'Pimpri-Chinchwad Highway', ward: 'Pimpri-Chinchwad' },
  { lat: 18.5537, lng: 73.8087, address: 'Aundh ITI Road, Pune', ward: 'Aundh' },
  { lat: 18.5667, lng: 73.9111, address: 'Viman Nagar, Dhole Patil Road', ward: 'Viman Nagar' },
  { lat: 18.4575, lng: 73.8518, address: 'Katraj Chowk, Sinhagad Road', ward: 'Katraj' },
  { lat: 18.5150, lng: 73.8469, address: 'Swargate Bus Stand, Pune', ward: 'Swargate' },
  { lat: 18.5203, lng: 73.8415, address: 'Deccan Gymkhana, JM Road', ward: 'Deccan' },
];

const HAZARD_DATA = [
  { title: 'Deep pothole causing accidents daily', category: 'pothole', severity: 'critical', description: '3-foot wide, 8-inch deep pothole right after the traffic signal. Multiple bikes have fallen. Extremely dangerous during rain.' },
  { title: 'Waterlogging blocks entire road', category: 'waterlogging', severity: 'high', description: 'Road gets completely flooded after even 30 minutes of rain. Causes major traffic jam and vehicle damage.' },
  { title: 'Missing manhole cover - accident risk', category: 'missing_manhole', severity: 'critical', description: 'Open manhole in the middle of the lane. No barricade or warning. Extremely dangerous at night.' },
  { title: 'Large road crack across 2 lanes', category: 'crack', severity: 'high', description: 'Road has developed massive cracks spanning both lanes. Surface breaking apart. Urgent repairs needed.' },
  { title: 'Broken road divider near school', category: 'broken_divider', severity: 'high', description: 'Divider has been broken for 3 weeks near the primary school. Students and parents at risk.' },
  { title: 'Multiple potholes on stretch of 200m', category: 'pothole', severity: 'high', description: 'The 200m stretch has 12+ potholes. Daily commuters forced to zigzag dangerously. Several near-misses.' },
  { title: 'Road surface completely eroded', category: 'crack', severity: 'medium', description: 'Entire road surface has eroded revealing stones and base layer. Very bumpy and damaging to vehicles.' },
  { title: 'Pothole filling up with rainwater', category: 'pothole', severity: 'medium', description: 'Pothole fills with water making depth invisible to riders. 2 motorcyclists fell last week.' },
  { title: 'Waterlogging near hospital entrance', category: 'waterlogging', severity: 'critical', description: 'Hospital entrance always flooded. Ambulances having difficulty. Patient transport severely affected.' },
  { title: 'Small pothole near apartment complex', category: 'pothole', severity: 'low', description: 'Small pothole on internal road. Could grow larger without attention. Currently minor inconvenience.' },
  { title: 'Road work debris left without clearing', category: 'other', severity: 'medium', description: 'Old road work left stones and debris on the road for 2 weeks. Puncture risk and navigation hazard.' },
  { title: 'Speed breaker damaged, sharp edge exposed', category: 'broken_divider', severity: 'high', description: 'Speed breaker has cracked and sharp metal rod is exposed. Tyre damage risk for all vehicles.' },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Report.deleteMany({});
    console.log('🧹 Cleared existing data');

    // Create admin user
    const admin = await User.create({
      name: 'PMC Admin',
      email: 'admin@pune.gov.in',
      password: 'admin123',
      role: 'admin',
      ward: 'All Pune'
    });

    // Create citizen users
    const citizens = await User.create([
      { name: 'Rahul Patil', email: 'rahul@gmail.com', password: 'pass123', ward: 'Shivajinagar', phone: '9876543210' },
      { name: 'Priya Sharma', email: 'priya@gmail.com', password: 'pass123', ward: 'Kothrud', phone: '9765432109' },
      { name: 'Amit Kumar', email: 'amit@gmail.com', password: 'pass123', ward: 'Hadapsar', phone: '9654321098' },
      { name: 'Sneha Desai', email: 'sneha@gmail.com', password: 'pass123', ward: 'Baner', phone: '9543210987' },
    ]);

    // Create reports with random data
    const statuses = ['pending', 'pending', 'pending', 'verified', 'in_progress', 'resolved'];
    const reports = [];

    for (let i = 0; i < HAZARD_DATA.length; i++) {
      const loc = PUNE_LOCATIONS[i % PUNE_LOCATIONS.length];
      const hazard = HAZARD_DATA[i];
      const citizen = citizens[i % citizens.length];
      const status = statuses[i % statuses.length];

      reports.push({
        ...hazard,
        location: {
          lat: loc.lat + (Math.random() - 0.5) * 0.01,
          lng: loc.lng + (Math.random() - 0.5) * 0.01,
          address: loc.address,
          ward: loc.ward,
        },
        status,
        upvotes: Math.floor(Math.random() * 30),
        reportedBy: citizen._id,
        resolvedAt: status === 'resolved' ? new Date() : undefined,
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
      });
    }

    await Report.create(reports);

    console.log(`✅ Created ${reports.length} sample reports across Pune`);
    console.log('👤 Admin login: admin@pune.gov.in / admin123');
    console.log('👤 Citizen login: rahul@gmail.com / pass123');
    console.log('🎉 Seed complete!');

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
