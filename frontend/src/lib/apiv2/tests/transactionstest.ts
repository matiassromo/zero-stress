// Simple runner to exercise the apiv2 transactions methods.
// This file is meant to be executed during development with ts-node.

import transactions from "../transactions";

async function run() {
  console.log("--- apiv2 transactions test start ---");

  try {
    console.log('\n1) listTransactions()');
    const all = await transactions.listTransactions();
    console.log('listTransactions ->', all);

    console.log('\n2) createTransaction()');
    // Note: You'll need valid clientId from your database
    const newTransaction = await transactions.createTransaction({
      clientId: "3a28b14c-4f9d-4d4c-9021-1894a8b6a2d1", // Replace with valid client ID
    });
    console.log('createTransaction ->', newTransaction);

    console.log('\n3) getTransaction(created.id)');
    const fetched = await transactions.getTransaction(newTransaction.id);
    console.log('getTransaction ->', fetched);

    console.log('\n4) updateTransaction(created.id)');
    if (!fetched) {
      throw new Error('Transaction not found after creation');
    }
    const updated = await transactions.updateTransaction(newTransaction.id, {
      clientId: fetched.client.id,
    });
    console.log('updateTransaction ->', updated);

    console.log('\n5) deleteTransaction(created.id)');
    await transactions.deleteTransaction(newTransaction.id);
    console.log('deleteTransaction -> done');

    console.log('\n6) verify getTransaction after delete');
    const after = await transactions.getTransaction(newTransaction.id);
    console.log('getTransaction after delete ->', after);

  } catch (err) {
    console.error('Test encountered error:', err);
  }

  console.log("--- apiv2 transactions test end ---");
}

if (require.main === module) {
  // Execute when run directly
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default run;
