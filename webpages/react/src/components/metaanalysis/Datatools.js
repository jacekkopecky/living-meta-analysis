// find the corresponding order of values to match sourceColumnMap
export default function columnOrders(papers, columns) {
  const orders = [];
  for (const paper of papers) {
    const { id } = paper;
    const columnOrder = [];
    for (const col of columns) {
      if (col.id) {
        let found = false;
        Object.entries(col.sourceColumnMap).forEach((row) => {
          if (id === row[0]) {
            columnOrder.push(row[1]);
            found = true;
          }
        });
        if (!found) columnOrder.push(undefined);
      }
    }
    orders.push(columnOrder);
  }
  return orders;
}
