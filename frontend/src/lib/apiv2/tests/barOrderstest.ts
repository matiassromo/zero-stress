// Simple runner to exercise the apiv2 barOrders methods.
// This file is meant to be executed during development with ts-node.

import barOrders from "../barOrders";
import transactions from "../transactions";

async function run() {
  console.log("--- apiv2 barOrders test start ---");

  try {
    console.log('\n1) listBarOrders()');
    const all = await barOrders.listBarOrders();
    console.log('listBarOrders ->', all);

    console.log('\n2) createTransaction() for bar order test');
    const testTransaction = await transactions.createTransaction({
      clientId: "3a28b14c-4f9d-4d4c-9021-1894a8b6a2d1", // Valid client ID from transactionstest
    });
    console.log('createTransaction ->', testTransaction);

    console.log('\n3) createBarOrder()');
    const newOrder = await barOrders.createBarOrder({
      transactionId: testTransaction.id,
    });
    console.log('createBarOrder ->', newOrder);

    console.log('\n4) getBarOrder(created.id)');
    const fetched = await barOrders.getBarOrder(newOrder.id);
    console.log('getBarOrder ->', fetched);

    console.log('\n5) createBarOrderDetail() - add first product');
    const detail1 = await barOrders.createBarOrderDetail(newOrder.id, {
      barProductId: "16a4efed-7353-48ed-b046-2532bdc62c74", // placeholder UUID
      unitPrice: 15.99,
      qty: 2,
    });
    console.log('createBarOrderDetail (1) ->', detail1);

    console.log('\n6) createBarOrderDetail() - add second product');
    const detail2 = await barOrders.createBarOrderDetail(newOrder.id, {
      barProductId: "626e7d51-6573-4b46-b789-36756d9cffb5", // placeholder UUID
      unitPrice: 8.50,
      qty: 3,
    });
    console.log('createBarOrderDetail (2) ->', detail2);

    console.log('\n7) getBarOrderDetail(orderId, productId)');
    const fetchedDetail = await barOrders.getBarOrderDetail(
      newOrder.id,
      detail1.barProduct.id,
    );
    console.log('getBarOrderDetail ->', fetchedDetail);

    console.log('\n8) updateBarOrderDetail() - update qty and price');
    console.log("neworderid:",newOrder.id);
    console.log("detail1productid:",detail1.barProduct.id);
    const updatedDetail = await barOrders.updateBarOrderDetail(
      newOrder.id,
      detail1.barProduct.id,
      {
        unitPrice: 17.99,
        qty: 5,
      }
    );
    console.log('updateBarOrderDetail ->', updatedDetail);

    console.log('\n9) getBarOrder() - verify updated details');
    const orderWithDetails = await barOrders.getBarOrder(newOrder.id);
    console.log('getBarOrder with details ->', orderWithDetails);

    console.log('\n10) deleteBarOrderDetail() - remove first product');
    await barOrders.deleteBarOrderDetail(newOrder.id, detail1.barProduct.id);
    console.log('deleteBarOrderDetail (1) -> done');

    console.log('\n11) deleteBarOrderDetail() - remove second product');
    await barOrders.deleteBarOrderDetail(newOrder.id, detail2.barProduct.id);
    console.log('deleteBarOrderDetail (2) -> done');

    console.log('\n12) deleteBarOrder(created.id)');
    await barOrders.deleteBarOrder(newOrder.id);
    console.log('deleteBarOrder -> done');

    console.log('\n13) verify getBarOrder after delete');
    const after = await barOrders.getBarOrder(newOrder.id);
    console.log('getBarOrder after delete ->', after);

    console.log('\n14) verify getBarOrderDetail after order delete');
    const afterDetail = await barOrders.getBarOrderDetail(
      newOrder.id,
      detail1.barProduct.id
    );
    console.log('getBarOrderDetail after order delete ->', afterDetail);

    console.log('\n15) cleanup - delete test transaction');
    await transactions.deleteTransaction(testTransaction.id);
    console.log('deleteTransaction -> done');

  } catch (err) {
    console.error('Test encountered error:', err);
  }

  console.log("--- apiv2 barOrders test end ---");
}

if (require.main === module) {
  // Execute when run directly
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default run;
