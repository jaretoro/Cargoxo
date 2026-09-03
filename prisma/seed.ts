import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// The password for every seeded account, so you only need to remember one.
// Re-applied on every run, so an account whose password was changed while
// testing (the reset flow, say) is restored by `npm run db:seed`.
const DEMO_PASSWORD = "Cargoxo123!";

// Backdated dates so subscriptions.createdAt spans real months — this is
// what lets the admin MRR trend chart aggregate genuine historical data
// instead of faking a line.
function monthsAgo(n: number): Date {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d;
}

const CARGO_TYPES = [
  "Agricultural Products",
  "Crude Oil & Petroleum",
  "Solid Minerals",
  "Manufactured Goods",
  "Textiles & Apparel",
  "Timber & Wood Products",
  "Cocoa & Coffee",
  "Chemicals",
  "Frozen Foods",
  "Machinery & Equipment",
];

// Extra verified logistics companies beyond the core three, purely to give
// the browse/filter/sort experience something real to work with.
const EXTRA_LOGISTICS = [
  {
    email: "sealinkfreight@cargoxo.com",
    name: "Bola Adeyemi",
    phone: "+2348066666666",
    companyName: "SeaLink Freight Forwarders",
    anclaNumber: "ANCLA/LAG/00142",
    address: "14 Marina Road, Lagos",
    location: "Lagos",
    establishedYear: 2018,
    shipmentCount: 1240,
    cargoTypes: ["Agricultural Products", "Cocoa & Coffee", "Frozen Foods"],
    routes: [
      { origin: "Lagos", destination: "Rotterdam" },
      { origin: "Apapa", destination: "Hamburg" },
    ],
    membership: "YEARLY" as const,
    membershipMonthsAgo: 9,
  },
  {
    email: "nigerdeltacargo@cargoxo.com",
    name: "Ifeoma Chukwu",
    phone: "+2348077777777",
    companyName: "NigerDelta Cargo Solutions",
    anclaNumber: "ANCLA/RIV/00089",
    address: "8 Trans Amadi Industrial Layout, Port Harcourt",
    location: "Rivers",
    establishedYear: 2016,
    shipmentCount: 2100,
    cargoTypes: ["Crude Oil & Petroleum", "Chemicals", "Machinery & Equipment"],
    routes: [
      { origin: "Port Harcourt", destination: "Rotterdam" },
      { origin: "Onne", destination: "Houston" },
    ],
    membership: "YEARLY" as const,
    membershipMonthsAgo: 7,
  },
  {
    email: "kanonorthern@cargoxo.com",
    name: "Aisha Bello",
    phone: "+2348088888888",
    companyName: "Kano Northern Logistics",
    anclaNumber: "ANCLA/KAN/00211",
    address: "22 Zaria Road, Kano",
    location: "Kano",
    establishedYear: 2020,
    shipmentCount: 430,
    cargoTypes: ["Textiles & Apparel", "Agricultural Products", "Manufactured Goods"],
    routes: [
      { origin: "Lagos", destination: "Dubai" },
      { origin: "Lagos", destination: "Shanghai" },
    ],
    membership: "MONTHLY" as const,
    membershipMonthsAgo: 5,
  },
  {
    email: "atlanticcargo@cargoxo.com",
    name: "Emeka Obi",
    phone: "+2348099999999",
    companyName: "Atlantic Cargo & Freight",
    anclaNumber: "ANCLA/DEL/00317",
    address: "3 Warri Port Road, Warri",
    location: "Delta",
    establishedYear: 2015,
    shipmentCount: 980,
    cargoTypes: ["Solid Minerals", "Timber & Wood Products", "Machinery & Equipment"],
    routes: [{ origin: "Warri", destination: "Antwerp" }],
    membership: null,
    membershipMonthsAgo: 0,
  },
  {
    email: "onneportlogistics@cargoxo.com",
    name: "Funmi Adisa",
    phone: "+2348010101010",
    companyName: "Onne Port Logistics",
    anclaNumber: "ANCLA/RIV/00402",
    address: "Onne Oil & Gas Free Zone, Rivers",
    location: "Rivers",
    establishedYear: 2019,
    shipmentCount: 610,
    cargoTypes: ["Crude Oil & Petroleum", "Chemicals"],
    routes: [{ origin: "Onne", destination: "Rotterdam" }],
    membership: "MONTHLY" as const,
    membershipMonthsAgo: 3,
  },
  {
    email: "ogunstatefreight@cargoxo.com",
    name: "Segun Alabi",
    phone: "+2348020202020",
    companyName: "Ogun State Freight Co.",
    anclaNumber: "ANCLA/OGU/00558",
    address: "17 Abeokuta Expressway, Ogun",
    location: "Ogun",
    establishedYear: 2021,
    shipmentCount: 150,
    cargoTypes: ["Manufactured Goods", "Textiles & Apparel"],
    routes: [{ origin: "Lagos", destination: "Accra" }],
    membership: null,
    membershipMonthsAgo: 0,
    verificationStatus: "PENDING" as const,
  },
];

// A few extra exporter accounts purely so the admin dashboard's user counts
// and subscription trend have more than a single data point to show.
const EXTRA_EXPORTERS = [
  { email: "exporter3@cargoxo.com", name: "Yusuf Danladi", phone: "+2348012121212", companyName: "Danladi Sesame Traders", plan: "MONTHLY" as const, monthsAgo: 6 },
  { email: "exporter4@cargoxo.com", name: "Blessing Adeyemi", phone: "+2348013131313", companyName: "Adeyemi Rubber Exports", plan: "YEARLY" as const, monthsAgo: 2 },
];

// Applies the descriptive half of a logistics profile to an account that
// already exists.
//
// Nested `create` under `user.upsert` only fires when the *user* is new, so
// on a re-seed (or after new columns are added to the schema) existing
// companies silently keep their old, emptier profile. Doing it explicitly
// here keeps the seed genuinely idempotent — re-running it converges every
// company on the intended state instead of only the ones created that run.
async function applyLogisticsDetails(
  userId: string,
  details: {
    establishedYear?: number;
    shipmentCount?: number;
    cargoTypeIds: string[];
    routes: { origin: string; destination: string }[];
    verificationStatus?: "PENDING" | "VERIFIED" | "REJECTED";
  },
) {
  const profile = await prisma.logisticsProfile.findUniqueOrThrow({ where: { userId } });
  const status = details.verificationStatus ?? "VERIFIED";

  await prisma.logisticsProfile.update({
    where: { id: profile.id },
    data: {
      establishedYear: details.establishedYear ?? null,
      shipmentCount: details.shipmentCount ?? 0,
      cargoTypes: { set: details.cargoTypeIds.map((id) => ({ id })) },
      // Reset verification too, so re-seeding restores the demo scenario the
      // README promises (one company still pending review) rather than
      // leaving whatever an admin clicked through while testing.
      verificationStatus: status,
      verifiedAt: status === "VERIFIED" ? profile.verifiedAt ?? new Date() : null,
    },
  });

  // Routes have no natural key, so replace rather than diff.
  await prisma.tradeRoute.deleteMany({ where: { logisticsProfileId: profile.id } });
  if (details.routes.length > 0) {
    await prisma.tradeRoute.createMany({
      data: details.routes.map((r) => ({ ...r, logisticsProfileId: profile.id })),
    });
  }
}

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const cargoTypes = await Promise.all(
    CARGO_TYPES.map((name) => prisma.cargoType.upsert({ where: { name }, update: {}, create: { name } })),
  );
  const cargoTypeId = (name: string) => cargoTypes.find((c) => c.name === name)!.id;

  await prisma.user.upsert({
    where: { email: "admin@cargoxo.com" },
    update: { passwordHash },
    create: {
      email: "admin@cargoxo.com",
      passwordHash,
      name: "Cargoxo Admin",
      phone: "+2348000000000",
      role: "ADMIN",
    },
  });

  const subscribedExporter = await prisma.user.upsert({
    where: { email: "exporter@cargoxo.com" },
    update: { passwordHash },
    create: {
      email: "exporter@cargoxo.com",
      passwordHash,
      name: "Ade Ogundimu",
      phone: "+2348011111111",
      role: "EXPORTER",
      exporterProfile: {
        create: { companyName: "Ogundimu Cocoa Exports", address: "12 Marina Road, Lagos" },
      },
    },
  });

  await prisma.subscription.upsert({
    where: { userId: subscribedExporter.id },
    update: { createdAt: monthsAgo(1) },
    create: {
      userId: subscribedExporter.id,
      plan: "MONTHLY",
      status: "ACTIVE",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      createdAt: monthsAgo(1),
    },
  });

  const unsubscribedExporter = await prisma.user.upsert({
    where: { email: "exporter2@cargoxo.com" },
    update: { passwordHash },
    create: {
      email: "exporter2@cargoxo.com",
      passwordHash,
      name: "Chioma Nwosu",
      phone: "+2348022222222",
      role: "EXPORTER",
      exporterProfile: {
        create: { companyName: "Nwosu Sesame Traders", address: "5 Ahmadu Bello Way, Kano" },
      },
      // no subscription record -> defaults to NONE, so this account demos the "locked" view
    },
  });

  const verifiedLogistics = await prisma.user.upsert({
    where: { email: "swiftcargo@cargoxo.com" },
    update: { passwordHash },
    create: {
      email: "swiftcargo@cargoxo.com",
      passwordHash,
      name: "Tunde Bakare",
      phone: "+2348033333333",
      role: "LOGISTICS",
      logisticsProfile: {
        create: {
          companyName: "SwiftCargo Logistics Ltd",
          anclaNumber: "ANCLA/LAG/00123",
          address: "45 Apapa Wharf Road, Lagos",
          location: "Lagos",
          verificationStatus: "VERIFIED",
          verifiedAt: new Date(),
        },
      },
    },
  });

  await applyLogisticsDetails(verifiedLogistics.id, {
    establishedYear: 2017,
    shipmentCount: 860,
    cargoTypeIds: [cargoTypeId("Agricultural Products"), cargoTypeId("Manufactured Goods")],
    routes: [
      { origin: "Lagos", destination: "Rotterdam" },
      { origin: "Lagos", destination: "Dubai" },
    ],
  });

  const portlink = await prisma.user.upsert({
    where: { email: "portlinkfreight@cargoxo.com" },
    update: { passwordHash },
    create: {
      email: "portlinkfreight@cargoxo.com",
      passwordHash,
      name: "Grace Effiong",
      phone: "+2348044444444",
      role: "LOGISTICS",
      logisticsProfile: {
        create: {
          companyName: "PortLink Freight Services",
          anclaNumber: "ANCLA/RIV/00456",
          address: "8 Trans Amadi Industrial Layout, Port Harcourt",
          location: "Port Harcourt",
          verificationStatus: "VERIFIED",
          verifiedAt: new Date(),
        },
      },
    },
  });

  await applyLogisticsDetails(portlink.id, {
    establishedYear: 2014,
    shipmentCount: 1500,
    cargoTypeIds: [cargoTypeId("Crude Oil & Petroleum"), cargoTypeId("Chemicals")],
    routes: [{ origin: "Port Harcourt", destination: "Houston" }],
  });

  const newAgent = await prisma.user.upsert({
    where: { email: "newagentco@cargoxo.com" },
    update: { passwordHash },
    create: {
      email: "newagentco@cargoxo.com",
      passwordHash,
      name: "Musa Ibrahim",
      phone: "+2348055555555",
      role: "LOGISTICS",
      logisticsProfile: {
        create: {
          companyName: "NewAgent Cargo Co.",
          anclaNumber: "ANCLA/KAN/00789",
          address: "22 Zaria Road, Kano",
          location: "Kano",
          verificationStatus: "PENDING", // demos the admin approval queue
        },
      },
    },
  });

  // Deliberately left with no cargo types or routes: this is the "brand new
  // signup" case, and it's what an unfinished listing actually looks like.
  await applyLogisticsDetails(newAgent.id, {
    cargoTypeIds: [],
    routes: [],
    verificationStatus: "PENDING",
  });

  for (const c of EXTRA_LOGISTICS) {
    const user = await prisma.user.upsert({
      where: { email: c.email },
      update: { passwordHash },
      create: {
        email: c.email,
        passwordHash,
        name: c.name,
        phone: c.phone,
        role: "LOGISTICS",
        logisticsProfile: {
          create: {
            companyName: c.companyName,
            anclaNumber: c.anclaNumber,
            address: c.address,
            location: c.location,
            verificationStatus: c.verificationStatus ?? "VERIFIED",
            verifiedAt: c.verificationStatus === "PENDING" ? null : new Date(),
          },
        },
      },
    });

    await applyLogisticsDetails(user.id, {
      establishedYear: c.establishedYear,
      shipmentCount: c.shipmentCount,
      cargoTypeIds: c.cargoTypes.map((name) => cargoTypeId(name)),
      routes: c.routes,
      verificationStatus: c.verificationStatus ?? "VERIFIED",
    });

    if (c.membership) {
      await prisma.subscription.upsert({
        where: { userId: user.id },
        update: { createdAt: monthsAgo(c.membershipMonthsAgo) },
        create: {
          userId: user.id,
          plan: c.membership,
          status: "ACTIVE",
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: monthsAgo(c.membershipMonthsAgo),
        },
      });
    }

    // A couple of seeded reviews per company so the rating/review-count
    // shown on cards reflects real aggregated rows, not a cached number.
    const profile = await prisma.logisticsProfile.findUniqueOrThrow({ where: { userId: user.id } });
    const reviewers = [subscribedExporter, unsubscribedExporter];
    for (const [i, reviewer] of reviewers.entries()) {
      await prisma.review.upsert({
        where: { logisticsProfileId_exporterId: { logisticsProfileId: profile.id, exporterId: reviewer.id } },
        update: {},
        create: {
          logisticsProfileId: profile.id,
          exporterId: reviewer.id,
          rating: 4 + ((i + c.shipmentCount) % 2),
          comment: i === 0 ? "Reliable and fast customs clearance." : "Good communication throughout the shipment.",
        },
      });
    }
  }

  for (const e of EXTRA_EXPORTERS) {
    const exporter = await prisma.user.upsert({
      where: { email: e.email },
      update: { passwordHash },
      create: {
        email: e.email,
        passwordHash,
        name: e.name,
        phone: e.phone,
        role: "EXPORTER",
        exporterProfile: { create: { companyName: e.companyName } },
      },
    });

    await prisma.subscription.upsert({
      where: { userId: exporter.id },
      update: { createdAt: monthsAgo(e.monthsAgo) },
      create: {
        userId: exporter.id,
        plan: e.plan,
        status: "ACTIVE",
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: monthsAgo(e.monthsAgo),
      },
    });
  }

  const openingMessage =
    "Hi, I have a 2-container shipment of cocoa beans headed to Rotterdam next month. Can you handle customs clearance and freight booking?";

  const connection = await prisma.connection.upsert({
    where: { exporterId_logisticsId: { exporterId: subscribedExporter.id, logisticsId: verifiedLogistics.id } },
    // Converge on the declared state instead of leaving whatever an earlier
    // run created — this thread is meant to demo an accepted connection.
    update: { message: openingMessage, status: "ACCEPTED" },
    create: {
      exporterId: subscribedExporter.id,
      logisticsId: verifiedLogistics.id,
      message: openingMessage,
      status: "ACCEPTED",
    },
  });

  // Replace rather than append: createMany has no upsert, so re-running the
  // seed was stacking another copy of this exchange onto the thread every
  // time (it had reached eleven messages).
  await prisma.message.deleteMany({ where: { connectionId: connection.id } });
  await prisma.message.createMany({
    data: [
      {
        connectionId: connection.id,
        senderId: subscribedExporter.id,
        body: openingMessage,
      },
      {
        connectionId: connection.id,
        senderId: verifiedLogistics.id,
        body: "Yes, we handle that route weekly. Send over the container specs and target ship date and I'll get you a quote.",
        readAt: new Date(),
      },
    ],
  });

  await prisma.savedAgent.upsert({
    where: { exporterId_logisticsId: { exporterId: subscribedExporter.id, logisticsId: verifiedLogistics.id } },
    update: {},
    create: { exporterId: subscribedExporter.id, logisticsId: verifiedLogistics.id },
  });

  console.log("Seed complete. All accounts use the password:", DEMO_PASSWORD);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
