import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seedUserId = process.env.DEV_SEED_USER_ID ?? "11111111-1111-1111-1111-111111111111";
const seedUserEmail = process.env.DEV_SEED_USER_EMAIL ?? "dev@example.com";

const sampleDecks = [
  {
    name: "로얄 미드레인지",
    color: "#0e6d53",
    memo: "기본 테스트 덱",
  },
  {
    name: "드래곤 램프",
    color: "#8f5a20",
    memo: "램프 운영 테스트",
  },
  {
    name: "ナイトメア Aggro",
    color: "#5b325f",
    memo: "공격적 매치업 테스트",
  },
];

async function main() {
  await prisma.user.upsert({
    where: { id: seedUserId },
    update: {
      email: seedUserEmail,
      name: "Local Dev",
    },
    create: {
      id: seedUserId,
      email: seedUserEmail,
      name: "Local Dev",
    },
  });

  for (const deck of sampleDecks) {
    await prisma.deck.upsert({
      where: {
        userId_name: {
          userId: seedUserId,
          name: deck.name,
        },
      },
      update: {
        color: deck.color,
        memo: deck.memo,
        isActive: true,
      },
      create: {
        userId: seedUserId,
        name: deck.name,
        color: deck.color,
        memo: deck.memo,
      },
    });
  }

  console.log(`Seeded local user ${seedUserEmail} with ${sampleDecks.length} decks.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
