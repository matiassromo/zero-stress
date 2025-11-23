// Simple runner to exercise the apiv2 entranceTransactions methods.
// This file is meant to be executed during development with ts-node.

import entranceTransactions from "../entranceTransactions";

async function run() {
  console.log("--- apiv2 entranceTransactions test start ---");

  try {
    console.log('\n1) listEntranceTransactions()');
    const all = await entranceTransactions.listEntranceTransactions();
    console.log('listEntranceTransactions ->', all);

    console.log('\n2) createEntranceTransaction()');
    const newEntranceTransaction = await entranceTransactions.createEntranceTransaction({
      entranceDate: "2025-11-23",
      entranceEntryTime: "09:00:00",
      entranceExitTime: null,
      numberAdults: 2,
      numberChildren: 1,
      numberSeniors: 0,
      numberDisabled: 0,
    });
    console.log('createEntranceTransaction ->', newEntranceTransaction);

    console.log('\n3) getEntranceTransaction(created.id)');
    const fetched = await entranceTransactions.getEntranceTransaction(newEntranceTransaction.id);
    console.log('getEntranceTransaction ->', fetched);

    console.log('\n4) updateEntranceTransaction(created.id)');
    const updated = await entranceTransactions.updateEntranceTransaction(newEntranceTransaction.id, {
      entranceDate: newEntranceTransaction.entranceDate,
      entranceEntryTime: newEntranceTransaction.entranceEntryTime,
      entranceExitTime: "17:00:00",
      numberAdults: 2,
      numberChildren: 1,
      numberSeniors: 1,
      numberDisabled: 0,
    });
    console.log('updateEntranceTransaction ->', updated);

    console.log('\n5) deleteEntranceTransaction(created.id)');
    await entranceTransactions.deleteEntranceTransaction(newEntranceTransaction.id);
    console.log('deleteEntranceTransaction -> done');

    console.log('\n6) verify getEntranceTransaction after delete');
    const after = await entranceTransactions.getEntranceTransaction(newEntranceTransaction.id);
    console.log('getEntranceTransaction after delete ->', after);

  } catch (err) {
    console.error('Test encountered error:', err);
  }

  console.log("--- apiv2 entranceTransactions test end ---");
}

if (require.main === module) {
  // Execute when run directly
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default run;
