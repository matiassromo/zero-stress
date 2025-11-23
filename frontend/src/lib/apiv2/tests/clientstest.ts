// Simple runner to exercise the apiv2 clients methods.
// This file is meant to be executed during development with ts-node.

import clients from "../clients";

async function run() {
  console.log("--- apiv2 clients test start ---");

  try {
    console.log('\n1) listClients()');
    const all = await clients.listClients();
    console.log('listClients ->', all);

    console.log('\n2) createClient()');
    const newClient = await clients.createClient({
      nationalId: `1724725492`,
      name: "Test Client",
      email: `test+${Date.now()}@example.com`,
      address: "123 Test St",
      number: "555-0000",
    });
    console.log('createClient ->', newClient);

    console.log('\n3) getClient(created.id)');
    const fetched = await clients.getClient(newClient.id);
    console.log('getClient ->', fetched);

    console.log('\n4) updateClient(created.id)');
    const updated = await clients.updateClient(newClient.id, {
      nationalId: newClient.nationalId,
      name: newClient.name + ' (updated)',
      email: newClient.email,
      address: newClient.address,
      number: newClient.number,
    });
    console.log('updateClient ->', updated);

    console.log('\n5) deleteClient(created.id)');
    await clients.deleteClient(newClient.id);
    console.log('deleteClient -> done');

    console.log('\n6) verify getClient after delete');
    const after = await clients.getClient(newClient.id);
    console.log('getClient after delete ->', after);

  } catch (err) {
    console.error('Test encountered error:', err);
  }

  console.log("--- apiv2 clients test end ---");
}

if (require.main === module) {
  // Execute when run directly
  run().then(() => process.exit(0)).catch(() => process.exit(1));
}

export default run;
