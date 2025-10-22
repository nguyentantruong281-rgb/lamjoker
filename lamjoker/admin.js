// === Load sản phẩm từ localStorage hoặc db.json ===
let products = JSON.parse(localStorage.getItem("products")) || [];

// Nếu localStorage trống => lấy từ db.json
if (products.length === 0) {
  fetch("db.json")
    .then(res => res.json())
    .then(data => {
      products = data.products;
      localStorage.setItem("products", JSON.stringify(products));
      renderTable();
    });
} else {
  renderTable();
}

// === Hiển thị danh sách sản phẩm ===
function renderTable() {
  const tbody = document.querySelector("#productTable tbody");
  tbody.innerHTML = "";
  products.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td style="padding:6px">${p.id}</td>
      <td>${p.name}</td>
      <td>${p.price.toLocaleString()}đ</td>
      <td><img src="${p.image}" width="70" style="border-radius:6px"></td>
      <td>${p.category}</td>
      <td>${p.description}</td>
      <td>
        <button style="background:#4f7cff;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer" onclick="editProduct(${p.id})">✏️</button>
        <button style="background:#ef4444;color:#fff;border:none;padding:6px 10px;border-radius:6px;cursor:pointer" onclick="deleteProduct(${p.id})">🗑️</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

// === Thêm / Cập nhật sản phẩm ===
document.getElementById("productForm").addEventListener("submit", e => {
  e.preventDefault();
  const id = document.getElementById("productId").value;
  const name = document.getElementById("name").value;
  const price = parseInt(document.getElementById("price").value);
  const image = document.getElementById("image").value;
  const category = document.getElementById("category").value;
  const description = document.getElementById("description").value;

  if (id) {
    // Sửa sản phẩm
    const index = products.findIndex(p => p.id == id);
    products[index] = { ...products[index], name, price, image, category, description };
  } else {
    // Thêm sản phẩm mới
    const newProduct = {
      id: Date.now(),
      name, price, image, category, description, hot: false
    };
    products.push(newProduct);
  }

  localStorage.setItem("products", JSON.stringify(products));
  renderTable();
  e.target.reset();
  document.getElementById("productId").value = "";
});

// === Sửa sản phẩm ===
function editProduct(id) {
  const p = products.find(p => p.id == id);
  document.getElementById("productId").value = p.id;
  document.getElementById("name").value = p.name;
  document.getElementById("price").value = p.price;
  document.getElementById("image").value = p.image;
  document.getElementById("category").value = p.category;
  document.getElementById("description").value = p.description;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// === Xóa sản phẩm ===
function deleteProduct(id) {
  if (confirm("Bạn có chắc muốn xóa sản phẩm này không?")) {
    products = products.filter(p => p.id != id);
    localStorage.setItem("products", JSON.stringify(products));
    renderTable();
  }
}
