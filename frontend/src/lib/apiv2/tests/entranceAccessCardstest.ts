// Simple runner to exercise the apiv2 entranceAccessCards methods.
// This file is meant to be executed during development with ts-node.

import entranceAccessCards from "../entranceAccessCards";

async function run() {
  console.log("--- apiv2 entranceAccessCards test start ---");

  try {
    console.log('\n1) listEntranceAccessCards()');
    const all = await entranceAccessCards.listEntranceAccessCards();
    console.log('listEntranceAccessCards ->', all);

    console.log('\n2) createEntranceAccessCard()');
    const newEntranceAccessCard = await entranceAccessCards.createEntranceAccessCard({
      accessCardId: "513cb828-f1ae-458d-86cf-6f2ac2b1bdf5",
      entranceDate: "2025-11-23",
      entranceEntryTime: "09:00:00",
      entranceExitTime: null,
    });
    console.log('createEntranceAccessCard ->', newEntranceAccessCard);

    console.log('\n3) getEntranceAccessCard(created.id)');
    const fetched = await entranceAccessCards.getEntranceAccessCard(newEntranceAccessCard.id);
    console.log('getEntranceAccessCard ->', fetched);

    console.log('\n4) updateEntranceAccessCard(created.id)');
    const updated = await entranceAccessCards.updateEntranceAccessCard(newEntranceAccessCard.id, {
      accessCardId: "513cb828-f1ae-458d-86cf-6f2ac2b1bdf5",
      entranceDate: "2025-11-23",
      entranceEntryTime: "09:00:00",
      entranceExitTime: "17:30:00",
    });
    console.log('updateEntranceAccessCard ->', updated);

    console.log('\n5) deleteEntranceAccessCard(created.id)');
    await entranceAccessCards.deleteEntranceAccessCard(newEntranceAccessCard.id);
    console.log('deleteEntranceAccessCard -> done');

    console.log('\n6) verify getEntranceAccessCard after delete');
    const after = await entranceAccessCards.getEntranceAccessCard(newEntranceAccessCard.id);
    console.log('getEntranceAccessCard after delete ->', after);

  } catch (err) {
    console.error('Test encountered error:', err);
  }

  console.log("--- apiv2 entranceAccessCards test end ---");
}

if (require.main === module) {
  // Execute when run directly
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default run;
