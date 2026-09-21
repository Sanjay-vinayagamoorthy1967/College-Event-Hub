require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Admin = require('./models/Admin');
const Event = require('./models/Event');
const StudentInternal = require('./models/StudentInternal');

// Connect to database
connectDB();

const seedData = async () => {
  try {
    // Clear existing
    await Admin.deleteMany();
    await Event.deleteMany();
    await StudentInternal.deleteMany();

    // Create Admin
    const admin = await Admin.create({
      name: 'Admin',
      email: 'admin@college.edu',
      password: 'password123',
      role: 'admin'
    });

    const StudentExternal = require('./models/StudentExternal');
    await StudentExternal.deleteMany();

    // Create StudentInternal
    await StudentInternal.create({
      name: 'Sanjay',
      registerNumber: '12345678',
      department: 'CSE',
      year: '3rd',
      phone: '9876543210',
      email: 'sanjay@shanmugha.edu.in',
      gender: 'Male',
      password: 'password123',
      type: 'student_internal'
    });

    // Create StudentExternal
    await StudentExternal.create({
      name: 'External Student',
      collegeName: 'Other University',
      department: 'ECE',
      year: 2,
      phone: '9876543210',
      email: 'external@gmail.com',
      gender: 'Female',
      password: 'password123',
      type: 'student_external'
    });

    // Create Events
    const events = [
      // Tech Conferences
      {
        title: 'Global Tech Summit 2026',
        description: 'Explore the future of AI and Web3 with industry leaders.',
        category: 'Tech',
        date: new Date('2026-09-10'),
        time: '10:00 AM',
        venue: 'Main Auditorium',
        internalPrice: 200,
        externalPrice: 500,
        seatLimit: 800,
        poster: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
        isFeatured: true
      },
      {
        title: 'Cloud Computing Expo',
        description: 'Deep dive into AWS, Azure, and Google Cloud architectures.',
        category: 'Tech',
        date: new Date('2026-09-25'),
        time: '09:00 AM',
        venue: 'Seminar Hall 1',
        internalPrice: 150,
        externalPrice: 300,
        seatLimit: 300,
        poster: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&auto=format&fit=crop&q=80'
      },
      
      // Hackathons
      {
        title: 'National CodeFest 2026',
        description: 'Compete with top coders nationwide for a grand prize.',
        category: 'Hackathon',
        date: new Date('2026-10-05'),
        time: '08:00 AM',
        venue: 'CS Lab Complex',
        internalPrice: 300,
        externalPrice: 600,
        seatLimit: 200,
        poster: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop&q=80',
        isFeatured: true
      },
      {
        title: 'Web3 Innovators Hackathon',
        description: 'Build decentralized applications on Ethereum and Solana.',
        category: 'Hackathon',
        date: new Date('2026-11-12'),
        time: '09:00 AM',
        venue: 'IT Block',
        internalPrice: 250,
        externalPrice: 500,
        seatLimit: 150,
        poster: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=1200&auto=format&fit=crop&q=80'
      },

      // Seminars
      {
        title: 'Open Source Contribution Guide',
        description: 'Learn how to contribute to major open-source projects.',
        category: 'Seminar',
        date: new Date('2026-08-20'),
        time: '11:00 AM',
        venue: 'Virtual',
        internalPrice: 0,
        externalPrice: 0,
        seatLimit: 1000,
        poster: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=1200&auto=format&fit=crop&q=80'
      },
      {
        title: 'Career Paths in Data Science',
        description: 'An expert seminar by senior data scientists from FAANG.',
        category: 'Seminar',
        date: new Date('2026-08-28'),
        time: '02:00 PM',
        venue: 'Auditorium 2',
        internalPrice: 50,
        externalPrice: 100,
        seatLimit: 400,
        poster: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&auto=format&fit=crop&q=80'
      },

      // Sports
      {
        title: 'Annual Inter-College Athletic Meet',
        description: 'Track and field events, relays, and long jump competitions.',
        category: 'Sports',
        date: new Date('2026-12-01'),
        time: '06:00 AM',
        venue: 'College Stadium',
        internalPrice: 100,
        externalPrice: 150,
        seatLimit: 1000,
        poster: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=1200&auto=format&fit=crop&q=80',
        isFeatured: true
      },
      {
        title: 'E-Sports Tournament (Valorant)',
        description: '5v5 Valorant tournament. Bring your own peripherals.',
        category: 'Sports',
        date: new Date('2026-11-20'),
        time: '10:00 AM',
        venue: 'IT Lab 4',
        internalPrice: 200,
        externalPrice: 400,
        seatLimit: 60,
        poster: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=1200&auto=format&fit=crop&q=80'
      },

      // Cultural
      {
        title: 'Annual Gala Night',
        description: 'The biggest cultural night of the year with DJ and dinner.',
        category: 'Cultural',
        date: new Date('2026-12-25'),
        time: '06:00 PM',
        venue: 'Open Air Theater',
        internalPrice: 400,
        externalPrice: 600,
        seatLimit: 1500,
        poster: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
        isFeatured: true
      },
      {
        title: 'Intra-College Debate',
        description: 'Debate on the latest technological ethics.',
        category: 'Cultural',
        date: new Date('2026-09-15'),
        time: '10:00 AM',
        venue: 'Seminar Hall 2',
        internalPrice: 0,
        externalPrice: 0,
        seatLimit: 150,
        poster: 'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1200&auto=format&fit=crop&q=80'
      }
    ];

    await Event.insertMany(events);

    console.log('Data seeded successfully!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
