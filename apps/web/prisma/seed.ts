import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data
  console.log("🗑️  Cleaning existing data...");
  await prisma.feedbackSubmission.deleteMany();
  await prisma.menteeAssignment.deleteMany();
  await prisma.event.deleteMany();
  await prisma.feedbackForm.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  console.log("👥 Creating test users...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@test.com",
      name: "Admin User",
      roles: ["admin", "organizer", "mentor"],
      status: "active",
    },
  });

  const organizer = await prisma.user.create({
    data: {
      email: "organizer@test.com",
      name: "Sarah Organizer",
      roles: ["organizer"],
      status: "active",
      companyName: "Tech Mentorship Inc",
    },
  });

  const mentor1 = await prisma.user.create({
    data: {
      email: "mentor@test.com",
      name: "John Mentor",
      roles: ["mentor"],
      status: "active",
      companyName: "Senior Solutions LLC",
      description: "10+ years of experience in software architecture",
    },
  });

  const mentor2 = await prisma.user.create({
    data: {
      email: "mentor2@test.com",
      name: "Emily Coach",
      roles: ["mentor"],
      status: "active",
      companyName: "Engineering Excellence Co",
      description: "Specializing in frontend development and UX",
    },
  });

  const mentee1 = await prisma.user.create({
    data: {
      email: "mentee@test.com",
      name: "Alice Mentee",
      roles: ["mentee"],
      status: "active",
      companyName: "StartupXYZ",
      description: "Junior developer looking to grow",
    },
  });

  const mentee2 = await prisma.user.create({
    data: {
      email: "mentee2@test.com",
      name: "Bob Student",
      roles: ["mentee"],
      status: "active",
      companyName: "CodeNewbie Inc",
      description: "Career changer into tech",
    },
  });

  const mentee3 = await prisma.user.create({
    data: {
      email: "mentee3@test.com",
      name: "Charlie Developer",
      roles: ["mentee"],
      status: "active",
      companyName: "TechCorp",
    },
  });

  console.log(`✅ Created ${await prisma.user.count()} users`);

  // Create feedback forms
  console.log("📋 Creating feedback forms...");
  const comprehensiveForm = await prisma.feedbackForm.create({
    data: {
      name: "Comprehensive Mentorship Feedback",
      description: "Detailed feedback form for mentorship program evaluation",
      createdBy: organizer.id,
      questions: [
        {
          id: "q1",
          type: "rating",
          label: "How would you rate the mentee's communication skills?",
          required: true,
          minRating: 1,
          maxRating: 10,
        },
        {
          id: "q2",
          type: "rating",
          label: "How would you rate the mentee's technical skills?",
          required: true,
          minRating: 1,
          maxRating: 10,
        },
        {
          id: "q3",
          type: "rating",
          label: "How would you rate the mentee's problem-solving abilities?",
          required: true,
          minRating: 1,
          maxRating: 10,
        },
        {
          id: "q4",
          type: "select",
          label: "What was the mentee's level of engagement?",
          required: true,
          options: ["Highly engaged", "Moderately engaged", "Somewhat engaged", "Not engaged"],
        },
        {
          id: "q5",
          type: "textarea",
          label: "What were the mentee's key strengths during this period?",
          required: true,
        },
        {
          id: "q6",
          type: "textarea",
          label: "What areas should the mentee focus on for improvement?",
          required: true,
        },
        {
          id: "q7",
          type: "radio",
          label: "Would you recommend this mentee for advanced projects?",
          required: true,
          options: ["Strongly recommend", "Recommend", "Neutral", "Do not recommend"],
        },
        {
          id: "q8",
          type: "textarea",
          label: "Additional comments or observations",
          required: false,
        },
      ],
    },
  });

  const quickForm = await prisma.feedbackForm.create({
    data: {
      name: "Quick Check-in Feedback",
      description: "Short form for regular check-ins",
      createdBy: admin.id,
      questions: [
        {
          id: "q1",
          type: "rating",
          label: "Overall performance this week",
          required: true,
          minRating: 1,
          maxRating: 5,
        },
        {
          id: "q2",
          type: "textarea",
          label: "What went well this week?",
          required: true,
        },
        {
          id: "q3",
          type: "textarea",
          label: "What challenges did you face?",
          required: false,
        },
        {
          id: "q4",
          type: "select",
          label: "Progress towards goals",
          required: true,
          options: ["Ahead of schedule", "On track", "Slightly behind", "Needs attention"],
        },
      ],
    },
  });

  console.log(`✅ Created ${await prisma.feedbackForm.count()} feedback forms`);

  // Create events
  console.log("📅 Creating events...");
  const currentDate = new Date();
  const lastMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
  const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);

  const springEvent = await prisma.event.create({
    data: {
      name: "Spring 2025 Mentorship Program",
      description: "Comprehensive mentorship program for Q1 2025",
      startDate: lastMonth,
      endDate: nextMonth,
      organizerId: organizer.id,
      feedbackFormId: comprehensiveForm.id,
    },
  });

  const weeklyEvent = await prisma.event.create({
    data: {
      name: "Weekly Check-ins - January",
      description: "Regular weekly check-in sessions",
      startDate: new Date(currentDate.getFullYear(), 0, 1),
      endDate: new Date(currentDate.getFullYear(), 0, 31),
      organizerId: admin.id,
      feedbackFormId: quickForm.id,
    },
  });

  const futureEvent = await prisma.event.create({
    data: {
      name: "Summer 2025 Program",
      description: "Upcoming summer mentorship cohort",
      startDate: new Date(currentDate.getFullYear(), 5, 1),
      endDate: new Date(currentDate.getFullYear(), 7, 31),
      organizerId: organizer.id,
      feedbackFormId: comprehensiveForm.id,
    },
  });

  console.log(`✅ Created ${await prisma.event.count()} events`);

  // Create mentee assignments
  console.log("🔗 Creating mentee assignments...");
  const assignment1 = await prisma.menteeAssignment.create({
    data: {
      eventId: springEvent.id,
      mentorId: mentor1.id,
      menteeId: mentee1.id,
    },
  });

  const assignment2 = await prisma.menteeAssignment.create({
    data: {
      eventId: springEvent.id,
      mentorId: mentor1.id,
      menteeId: mentee2.id,
    },
  });

  const assignment3 = await prisma.menteeAssignment.create({
    data: {
      eventId: springEvent.id,
      mentorId: mentor2.id,
      menteeId: mentee3.id,
    },
  });

  const assignment4 = await prisma.menteeAssignment.create({
    data: {
      eventId: weeklyEvent.id,
      mentorId: mentor2.id,
      menteeId: mentee1.id,
    },
  });

  const assignment5 = await prisma.menteeAssignment.create({
    data: {
      eventId: futureEvent.id,
      mentorId: mentor1.id,
      menteeId: mentee3.id,
    },
  });

  console.log(`✅ Created ${await prisma.menteeAssignment.count()} assignments`);

  // Create sample feedback submissions
  console.log("📝 Creating sample feedback submissions...");
  await prisma.feedbackSubmission.create({
    data: {
      menteeId: mentee1.id,
      mentorId: mentor1.id,
      eventId: springEvent.id,
      feedbackFormId: comprehensiveForm.id,
      answers: {
        q1: 9,
        q2: 8,
        q3: 9,
        q4: "Highly engaged",
        q5: "Excellent communication skills, proactive in seeking feedback, strong problem-solving mindset, and great team collaboration.",
        q6: "Could benefit from deeper knowledge of system design patterns and more experience with performance optimization techniques.",
        q7: "Strongly recommend",
        q8: "Alice has shown exceptional growth throughout the program. She consistently takes initiative and demonstrates a genuine passion for learning.",
      },
      submissionDate: new Date(),
    },
  });

  await prisma.feedbackSubmission.create({
    data: {
      menteeId: mentee1.id,
      mentorId: mentor2.id,
      eventId: weeklyEvent.id,
      feedbackFormId: quickForm.id,
      answers: {
        q1: 4,
        q2: "Completed all assigned tasks on time, participated actively in code reviews.",
        q3: "Some difficulty with the new testing framework, but made good progress by end of week.",
        q4: "On track",
      },
      submissionDate: new Date(currentDate.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    },
  });

  await prisma.feedbackSubmission.create({
    data: {
      menteeId: mentee3.id,
      mentorId: mentor2.id,
      eventId: springEvent.id,
      feedbackFormId: comprehensiveForm.id,
      answers: {
        q1: 7,
        q2: 8,
        q3: 7,
        q4: "Moderately engaged",
        q5: "Strong technical foundation, good debugging skills, and attention to detail.",
        q6: "Work on communication clarity, especially in written documentation. Also, increase participation in team discussions.",
        q7: "Recommend",
        q8: "Charlie shows solid technical abilities and is making steady progress.",
      },
      submissionDate: new Date(currentDate.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    },
  });

  console.log(`✅ Created ${await prisma.feedbackSubmission.count()} feedback submissions`);

  // Summary
  console.log("\n✨ Database seed completed successfully!");
  console.log("\n📊 Summary:");
  console.log(`   Users: ${await prisma.user.count()}`);
  console.log(`   Feedback Forms: ${await prisma.feedbackForm.count()}`);
  console.log(`   Events: ${await prisma.event.count()}`);
  console.log(`   Assignments: ${await prisma.menteeAssignment.count()}`);
  console.log(`   Submissions: ${await prisma.feedbackSubmission.count()}`);
  console.log("\n🔑 Test Accounts:");
  console.log("   admin@test.com (Admin)");
  console.log("   organizer@test.com (Organizer)");
  console.log("   mentor@test.com (Mentor)");
  console.log("   mentor2@test.com (Mentor)");
  console.log("   mentee@test.com (Mentee)");
  console.log("   mentee2@test.com (Mentee - no submissions yet)");
  console.log("   mentee3@test.com (Mentee)");
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
