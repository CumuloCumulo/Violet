import { PrismaClient, WingmanMode } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test data...\n');

  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.wingmanAssignment.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.user.deleteMany();

  // Create system user (platform infrastructure)
  const system = await prisma.user.create({
    data: {
      id: 'system',
      email: 'system@violet.local',
      nickname: '系统',
      password: '$2b$10$dummy_hash_not_for_production',
      roles: [],
    },
  });

  // Create 4 test users
  const client1 = await prisma.user.create({
    data: {
      id: 'test_client1',
      email: 'client1@smail.nju.edu.cn',
      nickname: '小明',
      password: '$2b$10$dummy_hash_not_for_production',
      gender: 'male',
      campus: '仙林',
      grade: '大二',
      major: '计算机科学与技术',
      roles: ['CLIENT'],
    },
  });

  const client2 = await prisma.user.create({
    data: {
      id: 'test_client2',
      email: 'client2@smail.nju.edu.cn',
      nickname: '小红',
      password: '$2b$10$dummy_hash_not_for_production',
      gender: 'female',
      campus: '仙林',
      grade: '大一',
      major: '英语',
      roles: ['CLIENT'],
    },
  });

  const wingman1 = await prisma.user.create({
    data: {
      id: 'test_wingman1',
      email: 'wingman1@smail.nju.edu.cn',
      nickname: '军师·阿杰',
      password: '$2b$10$dummy_hash_not_for_production',
      gender: 'male',
      campus: '仙林',
      grade: '大三',
      major: '软件工程',
      roles: ['CLIENT', 'WINGMAN'],
    },
  });

  const wingman2 = await prisma.user.create({
    data: {
      id: 'test_wingman2',
      email: 'wingman2@smail.nju.edu.cn',
      nickname: '军师·小美',
      password: '$2b$10$dummy_hash_not_for_production',
      gender: 'female',
      campus: '鼓楼',
      grade: '研一',
      major: '心理学',
      roles: ['CLIENT', 'WINGMAN'],
    },
  });

  // Create relationship (ICEBREAKING = chatroom active)
  const relationship = await prisma.relationship.create({
    data: {
      id: 'test_relationship_1',
      user1Id: client1.id,
      user2Id: client2.id,
      status: 'ICEBREAKING',
    },
  });

  // Assign wingmen
  const assignment1 = await prisma.wingmanAssignment.create({
    data: {
      relationshipId: relationship.id,
      userId: wingman1.id,
      side: 1,
      mode: WingmanMode.PRIVATE,
    },
  });

  const assignment2 = await prisma.wingmanAssignment.create({
    data: {
      relationshipId: relationship.id,
      userId: wingman2.id,
      side: 2,
      mode: WingmanMode.ASSIST,
    },
  });

  // Create some sample messages
  const messages = [
    {
      senderId: client1.id,
      content: '嗨！看到你也喜欢看星星 🌟',
      type: 'MAIN' as const,
    },
    {
      senderId: client2.id,
      content: '对呀！你也对天文感兴趣吗？',
      type: 'MAIN' as const,
    },
    {
      senderId: client1.id,
      content: '嗯嗯，上次仙林那边观星活动你去了吗',
      type: 'MAIN' as const,
    },
    {
      senderId: wingman1.id,
      content: '兄弟你可以问问她周末有没有空，约一起去紫金山',
      type: 'PRIVATE' as const,
      targetUserId: client1.id,
    },
    {
      senderId: wingman2.id,
      content: '可以分享一下你最近看的书吗？',
      type: 'PENDING' as const,
      targetUserId: client2.id,
    },
    {
      content: '军师·小美 已加入聊天',
      type: 'SYSTEM' as const,
      senderId: system.id,
      isSystem: true,
    },
  ];

  for (let i = 0; i < messages.length; i++) {
    await prisma.message.create({
      data: {
        id: `test_msg_${i + 1}`,
        relationshipId: relationship.id,
        senderId: messages[i].senderId,
        content: messages[i].content,
        type: messages[i].type,
        targetUserId: 'targetUserId' in messages[i] ? messages[i].targetUserId : null,
        isSystem: messages[i].type === 'SYSTEM',
        requireConfirm: messages[i].type === 'PENDING',
      },
    });
  }

  console.log('✅ Seed data created:\n');
  console.log('  用户:');
  console.log(`    当事人1: ${client1.nickname} (id: ${client1.id})`);
  console.log(`    当事人2: ${client2.nickname} (id: ${client2.id})`);
  console.log(`    军师1:   ${wingman1.nickname} (id: ${wingman1.id})`);
  console.log(`    军师2:   ${wingman2.nickname} (id: ${wingman2.id})`);
  console.log();
  console.log('  关系:');
  console.log(`    ID: ${relationship.id}`);
  console.log(`    状态: ICEBREAKING (破冰中)`);
  console.log(`    军师1模式: PRIVATE (私聊)`);
  console.log(`    军师2模式: ASSIST (辅助)`);
  console.log();
  console.log('  消息: 6条已创建 (4 MAIN + 1 PRIVATE + 1 PENDING + 1 SYSTEM)');
  console.log();
  console.log('  📋 快速测试 - 前端输入这些 ID:');
  console.log(`    用户ID:   test_client1`);
  console.log(`    关系ID:   test_relationship_1`);
  console.log(`    军师ID:   test_wingman1`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
