// Simple runner to exercise the apiv2 payments methods.
// This file is meant to be executed during development with ts-node.

import payments from "../payments";

async function run() {
  console.log("--- apiv2 payments test start ---");

  try {
    console.log('\n1) listPayments()');
    const all = await payments.listPayments();
    console.log('listPayments ->', all);

    console.log('\n2) createPayment()');
    const newPayment = await payments.createPayment({
      total: 99.99,
    });
    console.log('createPayment ->', newPayment);

    console.log('\n3) getPayment(created.id)');
    const fetched = await payments.getPayment(newPayment.id);
    console.log('getPayment ->', fetched);

    console.log('\n4) updatePayment(created.id)');
    const updated = await payments.updatePayment(newPayment.id, {
      total: 149.99,
    });
    console.log('updatePayment ->', updated);

    console.log('\n5) deletePayment(created.id)');
    await payments.deletePayment(newPayment.id);
    console.log('deletePayment -> done');

    console.log('\n6) verify getPayment after delete');
    const after = await payments.getPayment(newPayment.id);
    console.log('getPayment after delete ->', after);

  } catch (err) {
    console.error('Test encountered error:', err);
  }

  console.log("--- apiv2 payments test end ---");
}

if (require.main === module) {
  // Execute when run directly
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default run;
