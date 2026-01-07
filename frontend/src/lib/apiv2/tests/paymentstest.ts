// Simple runner to exercise the apiv2 payments methods.
// This file is meant to be executed during development with ts-node.

import payments from "../payments";
import transactions from "../transactions";
import { PaymentType } from "@/types/payment";

async function run() {
  console.log("--- apiv2 payments test start ---");

  try {
    console.log('\n1) listPayments()');
    const all = await payments.listPayments();
    console.log('listPayments ->', all);

    console.log('\n2) createTransaction() for payment test');
    const testTransaction = await transactions.createTransaction({
      clientId: "3a28b14c-4f9d-4d4c-9021-1894a8b6a2d1", // Valid client ID from transactionstest
    });
    console.log('createTransaction ->', testTransaction);

    console.log('\n3) createPayment()');
    const newPayment = await payments.createPayment({
      total: 99.99,
      type: PaymentType.Efectivo,
      transactionId: testTransaction.id,
    });
    console.log('createPayment ->', newPayment);

    console.log('\n4) getPayment(created.id)');
    const fetched = await payments.getPayment(newPayment.id);
    console.log('getPayment ->', fetched);

    console.log('\n5) updatePayment(created.id)');
    const updated = await payments.updatePayment(newPayment.id, {
      total: 149.99,
      type: PaymentType.Transferencia,
      transactionId: newPayment.transactionId,
    });
    console.log('updatePayment ->', updated);

    console.log('\n6) deletePayment(created.id)');
    await payments.deletePayment(newPayment.id);
    console.log('deletePayment -> done');

    console.log('\n7) verify getPayment after delete');
    const after = await payments.getPayment(newPayment.id);
    console.log('getPayment after delete ->', after);

    console.log('\n8) cleanup - delete test transaction');
    await transactions.deleteTransaction(testTransaction.id);
    console.log('deleteTransaction -> done');

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
