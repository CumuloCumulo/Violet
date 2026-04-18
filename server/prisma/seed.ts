import { PrismaClient, WingmanMode } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test data...\n');

  // Clean existing data
  await prisma.message.deleteMany();
  await prisma.wingmanAssignment.deleteMany();
  await prisma.relationship.deleteMany();
  await prisma.matchRequest.deleteMany();
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

  // Create 4 test users with new fields
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
      interests: ['天文观测', '摄影', '独立游戏'],
      declaration: '希望遇到一个愿意一起看星星的人',
      creditScore: 20,
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
      interests: ['推理小说', '周杰伦', '咖啡'],
      declaration: '想找一个有趣的灵魂',
      creditScore: 20,
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
      interests: ['MBTI分析', '辩论', '篮球'],
      declaration: '帮人脱单，成就满满',
      creditScore: 15,
      roles: ['CLIENT', 'WINGMAN'],
      wingmanCertStatus: 'APPROVED',
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
      interests: ['情感咨询', '约饭达人', '心理学'],
      declaration: '恋爱也要有策略',
      creditScore: 25,
      roles: ['CLIENT', 'WINGMAN'],
      wingmanCertStatus: 'APPROVED',
    },
  });

  // Extra users for discovery list testing
  const client3 = await prisma.user.create({
    data: {
      id: 'test_client3',
      email: 'client3@smail.nju.edu.cn',
      nickname: '小华',
      password: '$2b$10$dummy_hash_not_for_production',
      gender: 'male',
      campus: '鼓楼',
      grade: '大三',
      major: '物理',
      interests: ['天文观测', '乒乓球', '科幻电影'],
      declaration: '想和一起看《星际穿越》的人',
      creditScore: 20,
      roles: ['CLIENT'],
    },
  });

  const client4 = await prisma.user.create({
    data: {
      id: 'test_client4',
      email: 'client4@smail.nju.edu.cn',
      nickname: '小雨',
      password: '$2b$10$dummy_hash_not_for_production',
      gender: 'female',
      campus: '仙林',
      grade: '大二',
      major: '新闻传播',
      interests: ['摄影', '独立摇滚', '旅行'],
      declaration: '人生苦短，不如勇敢一次',
      creditScore: 20,
      roles: ['CLIENT'],
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
  await prisma.wingmanAssignment.create({
    data: {
      relationshipId: relationship.id,
      userId: wingman1.id,
      side: 1,
      mode: WingmanMode.PRIVATE,
    },
  });

  await prisma.wingmanAssignment.create({
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

  // Create a pending match request for testing discovery flow
  await prisma.matchRequest.create({
    data: {
      id: 'test_match_request_1',
      fromUserId: client3.id,
      toUserId: client4.id,
      status: 'PENDING',
    },
  });

  console.log('✅ Seed data created:\n');
  console.log('  用户:');
  console.log(`    当事人1: ${client1.nickname} (id: ${client1.id})`);
  console.log(`    当事人2: ${client2.nickname} (id: ${client2.id})`);
  console.log(`    当事人3: ${client3.nickname} (id: ${client3.id})`);
  console.log(`    当事人4: ${client4.nickname} (id: ${client4.id})`);
  console.log(`    军师1:   ${wingman1.nickname} (id: ${wingman1.id})`);
  console.log(`    军师2:   ${wingman2.nickname} (id: ${wingman2.id})`);
  console.log();
  console.log('  关系:');
  console.log(`    ID: ${relationship.id}`);
  console.log(`    状态: ICEBREAKING (破冰中)`);
  console.log(`    军师1模式: PRIVATE (私聊)`);
  console.log(`    军师2模式: ASSIST (辅助)`);
  console.log();
  console.log('  牵线请求:');
  console.log(`    ${client3.nickname} → ${client4.nickname}: PENDING`);
  console.log();
  console.log('  消息: 6条已创建 (4 MAIN + 1 PRIVATE + 1 PENDING + 1 SYSTEM)');
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
