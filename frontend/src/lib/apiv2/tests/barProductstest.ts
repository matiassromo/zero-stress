// Simple runner to exercise the apiv2 barProducts methods.
// This file is meant to be executed during development with ts-node.

import barProducts from "../barProducts";

async function run() {
  console.log("--- apiv2 barProducts test start ---");

  try {
    console.log('\n1) listBarProducts()');
    const all = await barProducts.listBarProducts();
    console.log('listBarProducts ->', all);

    console.log('\n2) createBarProduct()');
    const newBarProduct = await barProducts.createBarProduct({
      name: "Test Product",
      qty: 100,
      unitPrice: 5.99,
    });
    console.log('createBarProduct ->', newBarProduct);

    console.log('\n3) getBarProduct(created.id)');
    const fetched = await barProducts.getBarProduct(newBarProduct.id);
    console.log('getBarProduct ->', fetched);

    console.log('\n4) updateBarProduct(created.id)');
    const updated = await barProducts.updateBarProduct(newBarProduct.id, {
      name: newBarProduct.name + ' (updated)',
      qty: newBarProduct.qty + 50,
      unitPrice: newBarProduct.unitPrice + 1.00,
    });
    console.log('updateBarProduct ->', updated);

    console.log('\n5) deleteBarProduct(created.id)');
    await barProducts.deleteBarProduct(newBarProduct.id);
    console.log('deleteBarProduct -> done');

    console.log('\n6) verify getBarProduct after delete');
    const after = await barProducts.getBarProduct(newBarProduct.id);
    console.log('getBarProduct after delete ->', after);

  } catch (err) {
    console.error('Test encountered error:', err);
  }

  console.log("--- apiv2 barProducts test end ---");
}

if (require.main === module) {
  // Execute when run directly
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default run;
