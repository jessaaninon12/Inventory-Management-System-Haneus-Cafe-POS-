document.getElementById('addBtn').addEventListener('click', addItem);

function addItem() {
  const name = document.getElementById('itemName').value.trim();
  const quantity = document.getElementById('itemQuantity').value.trim();

  if (name && quantity) {
    const tableBody = document.querySelector('#inventoryTable tbody');
    const newRow = tableBody.insertRow();

    const nameCell = newRow.insertCell(0);
    const quantityCell = newRow.insertCell(1);

    nameCell.textContent = name;
    quantityCell.textContent = quantity;

    clearForm();
  } else {
    alert("Please enter both name and quantity!");
  }
}

function clearForm() {
  document.getElementById('itemName').value = '';
  document.getElementById('itemQuantity').value = '';
}
