// Simple runner to exercise the apiv2 accessCards methods.
// This file is meant to be executed during development with ts-node.

import accessCards from "../accessCards";

async function run() {
  console.log("--- apiv2 accessCards test start ---");

  try {
    console.log('\n1) listAccessCards()');
    const all = await accessCards.listAccessCards();
    console.log('listAccessCards ->', all);

    console.log('\n2) createAccessCard()');
    const newAccessCard = await accessCards.createAccessCard({
      total: 150.00,
    });
    console.log('createAccessCard ->', newAccessCard);

    console.log('\n3) getAccessCard(created.id)');
    const fetched = await accessCards.getAccessCard(newAccessCard.id);
    console.log('getAccessCard ->', fetched);

    console.log('\n4) updateAccessCard(created.id)');
    const updated = await accessCards.updateAccessCard(newAccessCard.id, {
      total: 200.00,
    });
    console.log('updateAccessCard ->', updated);

    console.log('\n5) deleteAccessCard(created.id)');
    await accessCards.deleteAccessCard(newAccessCard.id);
    console.log('deleteAccessCard -> done');

    console.log('\n6) verify getAccessCard after delete');
    const after = await accessCards.getAccessCard(newAccessCard.id);
    console.log('getAccessCard after delete ->', after);

  } catch (err) {
    console.error('Test encountered error:', err);
  }

  console.log("--- apiv2 accessCards test end ---");
}

if (require.main === module) {
  // Execute when run directly
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default run;
