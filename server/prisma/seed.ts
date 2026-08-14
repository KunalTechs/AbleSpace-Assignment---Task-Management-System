import { PrismaClient, Priority, TaskStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing collections
  await prisma.taskUpdate.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.subtask.deleteMany();
  await prisma.task.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // Create default User
  const user = await prisma.user.create({
    data: {
      email: 'Dexter@gmail.com',
      fullName: 'Dexter',
      title: 'Designer',
      username: 'Dexuser',
      isGuest: false,
    },
  });

  // Create Projects
  const proj1 = await prisma.project.create({
    data: {
      title: 'Design Homepage',
      priority: Priority.HIGH,
      leadName: 'Dexter',
      dueDate: new Date('2026-09-12'),
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      title: 'Develop Login Feature',
      priority: Priority.LOW,
      leadName: 'CN',
      dueDate: new Date('2026-09-15'),
    },
  });

  const proj3 = await prisma.project.create({
    data: {
      title: 'Test Payment Gateway',
      priority: Priority.MEDIUM,
      leadName: 'Dexter',
      dueDate: new Date('2026-09-18'),
    },
  });

  // Task 1: Detailed Task matching Figma drawer
  await prisma.task.create({
    data: {
      title: 'Write API Documentation',
      description:
        'Create clear and detailed API documentation to guide developers in using the inventory and sales metrics features effectively.',
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      role: 'Designer',
      dueDate: new Date('2026-07-31'),
      labels: ['Research', 'Design', 'Development', 'Testing', 'Deployment'],
      projectId: proj1.id,
      userIds: [user.id],
      subtasks: {
        create: [
          { title: 'Subtask 1', priority: Priority.HIGH, dueDate: new Date('2026-09-12'), completed: false },
          { title: 'Subtask 2', priority: Priority.LOW, dueDate: new Date('2026-09-15'), completed: false },
          { title: 'Subtask 3', priority: Priority.MEDIUM, dueDate: new Date('2026-09-18'), completed: false },
        ],
      },
      comments: {
        create: [
          { author: 'Ankit Dutta', content: 'dsds' },
        ],
      },
      updates: {
        create: [
          { action: 'changed priority from No Priority to Urgent', author: 'You' },
          { action: 'posted an update', author: 'You' },
        ],
      },
    },
  });

  // Additional tasks matching Figma Kanban board
  await prisma.task.createMany({
    data: [
      {
        title: 'Implement Search Function',
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        role: 'Admin',
        dueDate: new Date('2026-07-29'),
        labels: ['Deployment'],
      },
      {
        title: 'Deploy to Production',
        status: TaskStatus.TODO,
        priority: Priority.HIGH,
        role: 'Admin',
        dueDate: new Date('2026-07-29'),
        labels: ['Deployment'],
      },
      {
        title: 'Code Review Completed',
        status: TaskStatus.DOING,
        priority: Priority.MEDIUM,
        role: 'Admin',
        dueDate: new Date('2026-07-29'),
        labels: ['Deployment'],
      },
      {
        title: 'Design Mockups Finalized',
        status: TaskStatus.DOING,
        priority: Priority.HIGH,
        role: 'Admin',
        dueDate: new Date('2026-07-29'),
        labels: ['Deployment'],
      },
      {
        title: 'Feature Testing Passed',
        status: TaskStatus.COMPLETED,
        priority: Priority.LOW,
        role: 'QA Team',
        dueDate: new Date('2026-07-30'),
        labels: ['Testing'],
      },
      {
        title: 'UI Design Updated',
        status: TaskStatus.COMPLETED,
        priority: Priority.MEDIUM,
        role: 'Designer',
        dueDate: new Date('2026-07-31'),
        labels: ['Design'],
      },
      {
        title: 'Security Audit Scheduled',
        status: TaskStatus.COMPLETED,
        priority: Priority.HIGH,
        role: 'Security',
        dueDate: new Date('2026-08-01'),
        labels: ['Audit'],
      },
    ],
  });

  console.log('✅ Seed completed successfully with initial Figma data!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });