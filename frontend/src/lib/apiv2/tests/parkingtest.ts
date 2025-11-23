// Simple runner to exercise the apiv2 parking methods.
// This file is meant to be executed during development with ts-node.

import parking from "../parkings";

async function run() {
  console.log("--- apiv2 parking test start ---");

  try {
    console.log('\n1) listParkings()');
    const all = await parking.listParkings();
    console.log('listParkings ->', all);

    console.log('\n2) createParking()');
    const newParking = await parking.createParking({
      parkingDate: "2025-11-23",
      parkingEntryTime: "09:00:00",
      parkingExitTime: null,
    });
    console.log('createParking ->', newParking);

    console.log('\n3) getParking(created.id)');
    const fetched = await parking.getParking(newParking.id);
    console.log('getParking ->', fetched);

    console.log('\n4) updateParking(created.id)');
    const updated = await parking.updateParking(newParking.id, {
      parkingDate: "2025-11-23",
      parkingEntryTime: "09:00:00",
      parkingExitTime: "17:00:00",
    });
    console.log('updateParking ->', updated);

    console.log('\n5) deleteParking(created.id)');
    await parking.deleteParking(newParking.id);
    console.log('deleteParking -> done');

    console.log('\n6) verify getParking after delete');
    const after = await parking.getParking(newParking.id);
    console.log('getParking after delete ->', after);

  } catch (err) {
    console.error('Test encountered error:', err);
  }

  console.log("--- apiv2 parking test end ---");
}

if (require.main === module) {
  // Execute when run directly
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default run;
