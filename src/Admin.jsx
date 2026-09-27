import { useEffect, useState } from "react";
import "./AdminEnhanced.css";

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "auran123";



function AdminLogin({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  function handleLogin(e) {
    e.preventDefault();

    if (
      username === ADMIN_USERNAME &&
      password === ADMIN_PASSWORD
    ) {
      localStorage.setItem("auran_admin_auth", "true");
      setLoginError("");
      onLogin();
      return;
    }

    setLoginError("Invalid username or password.");
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        <p className="admin-login-brand">AURAN</p>

        <h1>ADMIN LOGIN</h1>

        <p className="admin-login-subtitle">
          Sign in to manage orders and products.
        </p>

        <form onSubmit={handleLogin} className="admin-login-form">
          <label>USERNAME</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            autoComplete="username"
          />

          <label>PASSWORD</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
          />

          {loginError && (
            <p className="admin-login-error">{loginError}</p>
          )}

          <button type="submit">LOGIN</button>
        </form>

        <p className="admin-login-hint">
          Default: admin / auran123
        </p>
      </div>
    </div>
  );
}

function Admin() {
  const [authenticated, setAuthenticated] = useState(
    () => localStorage.getItem("auran_admin_auth") === "true"
  );

  function logout() {
    localStorage.removeItem("auran_admin_auth");
    setAuthenticated(false);
  }

  if (!authenticated) {
    return (
      <AdminLogin
        onLogin={() => setAuthenticated(true)}
      />
    );
  }

  // ==================================================
  // ORDERS
  // ==================================================

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [updatingOrder, setUpdatingOrder] = useState(null);

  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // ==================================================
  // PRODUCTS
  // ==================================================

  const [products, setProducts] = useState([]);
  const [productLoading, setProductLoading] = useState(true);

  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const [productForm, setProductForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "T-Shirts",
    image: "",
    stock: "",
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // ==================================================
  // LOAD DATA
  // ==================================================

  useEffect(() => {
    fetchOrders();
    fetchProducts();
  }, []);

  // ==================================================
  // FETCH ORDERS
  // ==================================================

  async function fetchOrders() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "http://https://auran-backend.onrender.com/api/orders"
      );

      if (!response.ok) {
        throw new Error("Failed to load orders");
      }

      const data = await response.json();

      setOrders(data);
    } catch (error) {
      console.error(error);

      setError(
        "Unable to load orders. Check your Flask backend."
      );
    } finally {
      setLoading(false);
    }
  }

  // ==================================================
  // VIEW ORDER DETAILS
  // ==================================================

  async function viewOrder(order) {
    try {
      setSelectedOrder({
        ...order,
        items: [],
        itemsLoading: true,
      });

      const response = await fetch(
        `http://https://auran-backend.onrender.com/api/orders/${order.id}/items`
      );

      if (!response.ok) {
        throw new Error("Failed to load order products");
      }

      const data = await response.json();

      const rawItems = Array.isArray(data)
        ? data
        : Array.isArray(data.items)
        ? data.items
        : [];

      const items = rawItems.map((item) => {
        const productId =
          item.product_id ??
          item.productId ??
          item.productID ??
          item.id;

        const product = products.find(
          (p) => Number(p.id) === Number(productId)
        );

        return {
          ...item,

          image:
            item.image ||
            product?.image ||
            "",

          name:
            item.name ||
            item.product_name ||
            product?.name ||
            "Product",

          price:
            item.price !== undefined &&
            item.price !== null
              ? item.price
              : product?.price || 0,
        };
      });

      setSelectedOrder({
        ...order,
        items,
        itemsLoading: false,
      });
    } catch (error) {
      console.error(
        "Order items error:",
        error
      );

      setSelectedOrder({
        ...order,
        items: [],
        itemsLoading: false,
      });

      alert(
        "Unable to load ordered products. Check the Flask order-items API."
      );
    }
  }

  // ==================================================
  // UPDATE ORDER STATUS
  // ==================================================

  async function updateStatus(orderId, newStatus) {
    setUpdatingOrder(orderId);

    try {
      const response = await fetch(
        `http://https://auran-backend.onrender.com/api/orders/${orderId}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Failed to update status."
        );

        return;
      }

      // Update order table
      setOrders((currentOrders) =>
        currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                status: newStatus,
              }
            : order
        )
      );

      // Update popup
      setSelectedOrder((currentOrder) =>
        currentOrder &&
        currentOrder.id === orderId
          ? {
              ...currentOrder,
              status: newStatus,
            }
          : currentOrder
      );

    } catch (error) {
      console.error(error);

      alert(
        "Unable to connect to the Flask backend."
      );
    } finally {
      setUpdatingOrder(null);
    }
  }

  // ==================================================
  // FETCH PRODUCTS
  // ==================================================

  async function fetchProducts() {
    setProductLoading(true);

    try {
      const response = await fetch(
        "http://https://auran-backend.onrender.com/api/products"
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load products"
        );
      }

      const data = await response.json();

      setProducts(data);
    } catch (error) {
      console.error(error);

      alert(
        "Unable to load products. Check your Flask backend."
      );
    } finally {
      setProductLoading(false);
    }
  }

  // ==================================================
  // PRODUCT FORM CHANGE
  // ==================================================

  function handleProductChange(e) {
    const { name, value } = e.target;

    setProductForm({
      ...productForm,
      [name]: value,
    });
  }

  // ==================================================
  // IMAGE CHANGE
  // ==================================================

  function handleImageChange(e) {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    setImageFile(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  }

  // ==================================================
  // OPEN ADD PRODUCT
  // ==================================================

  function openAddProduct() {
    setEditingProduct(null);

    setProductForm({
      name: "",
      price: "",
      description: "",
      category: "T-Shirts",
      image: "",
      stock: "",
    });

    setImageFile(null);
    setImagePreview("");

    setShowProductForm(true);
  }

  // ==================================================
  // OPEN EDIT PRODUCT
  // ==================================================

  function openEditProduct(product) {
    setEditingProduct(product);

    setProductForm({
      name: product.name,
      price: product.price,
      description: product.description || "",
      category:
        product.category || "T-Shirts",
      image: product.image || "",
      stock: product.stock,
    });

    setImageFile(null);

    setImagePreview(
      product.image || ""
    );

    setShowProductForm(true);
  }

  // ==================================================
  // UPLOAD IMAGE
  // ==================================================

  async function uploadImage() {
    if (!imageFile) {
      return productForm.image;
    }

    const formData = new FormData();

    formData.append(
      "image",
      imageFile
    );

    const response = await fetch(
      "http://https://auran-backend.onrender.com/api/upload-image",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Image upload failed"
      );
    }

    return data.image_url;
  }

  // ==================================================
  // SAVE PRODUCT
  // ==================================================

  async function saveProduct(e) {
    e.preventDefault();

    if (
      !productForm.name ||
      productForm.price === "" ||
      productForm.stock === ""
    ) {
      alert(
        "Please enter product name, price and stock."
      );

      return;
    }

    try {
      // Upload image
      let imageUrl =
        productForm.image;

      if (imageFile) {
        imageUrl =
          await uploadImage();
      }

      let response;

      // ==================================================
      // EDIT PRODUCT
      // ==================================================

      if (editingProduct) {
        response = await fetch(
          `http://https://auran-backend.onrender.com/api/products/${editingProduct.id}`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: productForm.name,

              price: Number(
                productForm.price
              ),

              description:
                productForm.description,

              category:
                productForm.category,

              image: imageUrl,

              stock: Number(
                productForm.stock
              ),
            }),
          }
        );
      }

      // ==================================================
      // ADD PRODUCT
      // ==================================================

      else {
        response = await fetch(
          "http://https://auran-backend.onrender.com/api/products",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: productForm.name,

              price: Number(
                productForm.price
              ),

              description:
                productForm.description,

              category:
                productForm.category,

              image: imageUrl,

              stock: Number(
                productForm.stock
              ),
            }),
          }
        );
      }

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Unable to save product."
        );

        return;
      }

      alert(
        editingProduct
          ? "Product updated successfully!"
          : "Product added successfully!"
      );

      setShowProductForm(false);

      setEditingProduct(null);

      setImageFile(null);

      setImagePreview("");

      await fetchProducts();

    } catch (error) {
      console.error(error);

      alert(
        error.message ||
          "Unable to connect to the Flask backend."
      );
    }
  }

  // ==================================================
  // DELETE PRODUCT
  // ==================================================

  async function deleteProduct(productId) {
    const confirmDelete =
      window.confirm(
        "Are you sure you want to delete this product?"
      );

    if (!confirmDelete) {
      return;
    }

    try {
      const response = await fetch(
        `http://https://auran-backend.onrender.com/api/products/${productId}`,
        {
          method: "DELETE",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        alert(
          data.message ||
            "Unable to delete product."
        );

        return;
      }

      alert(
        "Product deleted successfully!"
      );

      await fetchProducts();

    } catch (error) {
      console.error(error);

      alert(
        "Unable to connect to the Flask backend."
      );
    }
  }

  // ==================================================
  // STATISTICS
  // ==================================================

  const totalSales =
    orders.reduce(
      (total, order) =>
        total + Number(order.total),
      0
    );

  const pendingOrders = orders.filter(
    (order) => (order.status || "Pending") === "Pending"
  ).length;

  const confirmedOrders = orders.filter(
    (order) => (order.status || "Pending") === "Confirmed"
  ).length;

  const deliveredOrders = orders.filter(
    (order) => (order.status || "Pending") === "Delivered"
  ).length;

  const cancelledOrders = orders.filter(
    (order) => (order.status || "Pending") === "Cancelled"
  ).length;

  const deliveredSales = orders
    .filter((order) => (order.status || "Pending") === "Delivered")
    .reduce(
      (total, order) => total + Number(order.total),
      0
    );

  const averageOrderValue =
    orders.length > 0
      ? totalSales / orders.length
      : 0;

  const lowStockProducts = products.filter(
    (product) => Number(product.stock) <= 5
  ).length;

  const filteredOrders = orders.filter((order) => {
    const search = orderSearch.trim().toLowerCase();

    const matchesSearch =
      !search ||
      String(order.order_id || "").toLowerCase().includes(search) ||
      String(order.name || "").toLowerCase().includes(search) ||
      String(order.mobile || "").toLowerCase().includes(search) ||
      String(order.city || "").toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "All" ||
      (order.status || "Pending") === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // ==================================================
  // RETURN
  // ==================================================

  return (
    <div className="admin-page">

      {/* ==================================================
          HEADER
      ================================================== */}

      <header className="admin-header">

        <div>
          <p>AURAN</p>

          <h1>
            ADMIN DASHBOARD
          </h1>
        </div>

        <div className="admin-header-actions">
          <button
            onClick={() => {
              fetchOrders();
              fetchProducts();
            }}
          >
            ↻ REFRESH
          </button>

          <button
            className="admin-logout-btn"
            onClick={logout}
          >
            LOGOUT
          </button>
        </div>

      </header>


      {/* ==================================================
          STATISTICS
      ================================================== */}

      <div className="admin-stats admin-stats-grid">

        <div className="stat-card">
          <span>TOTAL ORDERS</span>
          <strong>{orders.length}</strong>
        </div>

        <div className="stat-card">
          <span>TOTAL SALES</span>
          <strong>₹{totalSales.toLocaleString("en-IN")}</strong>
        </div>

        <div className="stat-card">
          <span>PENDING</span>
          <strong>{pendingOrders}</strong>
        </div>

        <div className="stat-card">
          <span>DELIVERED</span>
          <strong>{deliveredOrders}</strong>
        </div>

        <div className="stat-card">
          <span>DELIVERED SALES</span>
          <strong>₹{deliveredSales.toLocaleString("en-IN")}</strong>
        </div>

        <div className="stat-card">
          <span>AVG ORDER VALUE</span>
          <strong>₹{Math.round(averageOrderValue).toLocaleString("en-IN")}</strong>
        </div>

      </div>

      <div className="admin-mini-stats">
        <div>
          <span>CONFIRMED</span>
          <strong>{confirmedOrders}</strong>
        </div>

        <div>
          <span>CANCELLED</span>
          <strong>{cancelledOrders}</strong>
        </div>

        <div>
          <span>LOW STOCK (≤5)</span>
          <strong>{lowStockProducts}</strong>
        </div>

        <div>
          <span>TOTAL PRODUCTS</span>
          <strong>{products.length}</strong>
        </div>
      </div>


      {/* ==================================================
          ORDERS
      ================================================== */}

      <div className="admin-orders">

        <div className="orders-header">

          <div>
            <h2>
              ORDERS
            </h2>

            <span>
              {filteredOrders.length} of {orders.length} Orders
            </span>
          </div>

          <div className="order-filters">
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search order, customer, mobile..."
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Packed">Packed</option>
              <option value="Shipped">Shipped</option>
              <option value="Out for Delivery">Out for Delivery</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>

            {(orderSearch || statusFilter !== "All") && (
              <button
                className="clear-filter-btn"
                onClick={() => {
                  setOrderSearch("");
                  setStatusFilter("All");
                }}
              >
                CLEAR
              </button>
            )}
          </div>

        </div>


        {loading ? (

          <p className="admin-message">
            Loading orders...
          </p>

        ) : error ? (

          <p className="admin-message">
            {error}
          </p>

        ) : orders.length === 0 ? (

          <p className="admin-message">
            No orders found.
          </p>

        ) : filteredOrders.length === 0 ? (

          <p className="admin-message">
            No orders match your search/filter.
          </p>

        ) : (

          <div className="orders-table">

            {/* TABLE HEADER */}

            <div className="table-header">

              <span>
                ORDER ID
              </span>

              <span>
                CUSTOMER
              </span>

              <span>
                MOBILE
              </span>

              <span>
                CITY
              </span>

              <span>
                TOTAL
              </span>

              <span>
                STATUS
              </span>

              <span>
                ACTION
              </span>

            </div>


            {/* ORDERS */}

            {filteredOrders.map((order) => (

              <div
                className="table-row"
                key={order.id}
              >

                <strong>
                  {order.order_id}
                </strong>


                <span>
                  {order.name}
                </span>


                <span>
                  {order.mobile}
                </span>


                <span>
                  {order.city}
                </span>


                <strong>
                  ₹{order.total}
                </strong>


                {/* STATUS */}

                <select
                  className={`order-status status-${(
                    order.status ||
                    "Pending"
                  )
                    .toLowerCase()
                    .replaceAll(
                      " ",
                      "-"
                    )}`}
                  value={
                    order.status ||
                    "Pending"
                  }
                  disabled={
                    updatingOrder ===
                    order.id
                  }
                  onChange={(e) =>
                    updateStatus(
                      order.id,
                      e.target.value
                    )
                  }
                >

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Confirmed">
                    Confirmed
                  </option>

                  <option value="Packed">
                    Packed
                  </option>

                  <option value="Shipped">
                    Shipped
                  </option>

                  <option value="Out for Delivery">
                    Out for Delivery
                  </option>

                  <option value="Delivered">
                    Delivered
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>

                </select>


                {/* VIEW */}

                <button
                  className="view-order-btn"
                  onClick={() =>
                    viewOrder(order)
                  }
                >
                  VIEW
                </button>

              </div>

            ))}

          </div>

        )}

      </div>


      {/* ==================================================
          PRODUCTS
      ================================================== */}

      <div className="admin-products">

        <div className="products-admin-header">

          <div>

            <p>
              AURAN
            </p>

            <h2>
              PRODUCTS
            </h2>

          </div>


          <button
            className="add-product-btn"
            onClick={
              openAddProduct
            }
          >
            + ADD PRODUCT
          </button>

        </div>


        {productLoading ? (

          <p className="admin-message">
            Loading products...
          </p>

        ) : products.length === 0 ? (

          <p className="admin-message">
            No products found.
          </p>

        ) : (

          <div className="products-admin-table">

            <div className="product-table-header">

              <span>
                PRODUCT
              </span>

              <span>
                CATEGORY
              </span>

              <span>
                PRICE
              </span>

              <span>
                STOCK
              </span>

              <span>
                ACTION
              </span>

            </div>


            {products.map(
              (product) => (

                <div
                  className="product-table-row"
                  key={product.id}
                >

                  {/* PRODUCT */}

                  <div className="admin-product-name">

                    {product.image ? (

                      <img
                        src={
                          product.image
                        }
                        alt={
                          product.name
                        }
                      />

                    ) : (

                      <div className="admin-product-placeholder">
                        AURAN
                      </div>

                    )}


                    <strong>
                      {product.name}
                    </strong>

                  </div>


                  {/* CATEGORY */}

                  <span>
                    {product.category}
                  </span>


                  {/* PRICE */}

                  <strong>
                    ₹{product.price}
                  </strong>


                  {/* STOCK */}

                  <span>
                    {product.stock}
                  </span>


                  {/* ACTION */}

                  <div className="product-actions">

                    <button
                      className="edit-product-btn"
                      onClick={() =>
                        openEditProduct(
                          product
                        )
                      }
                    >
                      EDIT
                    </button>


                    <button
                      className="delete-product-btn"
                      onClick={() =>
                        deleteProduct(
                          product.id
                        )
                      }
                    >
                      DELETE
                    </button>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>


      {/* ==================================================
          ADD / EDIT PRODUCT MODAL
      ================================================== */}

      {showProductForm && (

        <div
          className="admin-modal-overlay"
          onClick={() =>
            setShowProductForm(false)
          }
        >

          <div
            className="admin-modal product-form-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="admin-modal-header">

              <div>

                <p>
                  AURAN
                </p>

                <h2>
                  {editingProduct
                    ? "EDIT PRODUCT"
                    : "ADD PRODUCT"}
                </h2>

              </div>


              <button
                onClick={() =>
                  setShowProductForm(
                    false
                  )
                }
              >
                ✕
              </button>

            </div>


            {/* FORM */}

            <form
              className="product-admin-form"
              onSubmit={
                saveProduct
              }
            >

              <label>
                Product Name
              </label>

              <input
                type="text"
                name="name"
                value={
                  productForm.name
                }
                onChange={
                  handleProductChange
                }
                placeholder="Example: Classic White Tee"
              />


              <label>
                Price
              </label>

              <input
                type="number"
                name="price"
                value={
                  productForm.price
                }
                onChange={
                  handleProductChange
                }
                placeholder="699"
              />


              <label>
                Category
              </label>

              <select
                name="category"
                value={
                  productForm.category
                }
                onChange={
                  handleProductChange
                }
              >

                <option value="T-Shirts">
                  T-Shirts
                </option>

                <option value="Oversized">
                  Oversized
                </option>

                <option value="Streetwear">
                  Streetwear
                </option>

                <option value="New Arrivals">
                  New Arrivals
                </option>

              </select>


              <label>
                Description
              </label>

              <textarea
                name="description"
                value={
                  productForm.description
                }
                onChange={
                  handleProductChange
                }
                placeholder="Enter product description"
              />


              {/* IMAGE */}

              <label>
                Product Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={
                  handleImageChange
                }
              />


              {/* IMAGE PREVIEW */}

              {imagePreview && (

                <div className="product-image-preview">

                  <img
                    src={
                      imagePreview
                    }
                    alt="Product Preview"
                  />

                </div>

              )}


              <label>
                Stock
              </label>

              <input
                type="number"
                name="stock"
                value={
                  productForm.stock
                }
                onChange={
                  handleProductChange
                }
                placeholder="50"
                min="0"
              />


              <button
                type="submit"
                className="save-product-btn"
              >

                {editingProduct
                  ? "UPDATE PRODUCT"
                  : "ADD PRODUCT"}

              </button>

            </form>

          </div>

        </div>

      )}


      {/* ==================================================
          ORDER DETAILS POPUP
      ================================================== */}

      {selectedOrder && (

        <div
          className="admin-modal-overlay"
          onClick={() =>
            setSelectedOrder(null)
          }
        >

          <div
            className="admin-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="admin-modal-header">

              <div>

                <p>
                  AURAN
                </p>

                <h2>
                  ORDER DETAILS
                </h2>

              </div>


              <button
                onClick={() =>
                  setSelectedOrder(
                    null
                  )
                }
              >
                ✕
              </button>

            </div>


            {/* CONTENT */}

            <div className="admin-modal-content">

              {/* ORDER INFORMATION */}

              <div className="admin-detail-section">

                <h3>
                  Order Information
                </h3>

                <p>
                  <strong>
                    Order ID:
                  </strong>{" "}
                  {
                    selectedOrder.order_id
                  }
                </p>

                <p>
                  <strong>
                    Status:
                  </strong>{" "}
                  {
                    selectedOrder.status
                  }
                </p>

              </div>


              {/* CUSTOMER */}

              <div className="admin-detail-section">

                <h3>
                  Customer Details
                </h3>

                <p>
                  <strong>
                    Name:
                  </strong>{" "}
                  {
                    selectedOrder.name
                  }
                </p>

                <p>
                  <strong>
                    Mobile:
                  </strong>{" "}
                  {
                    selectedOrder.mobile
                  }
                </p>

                <p>
                  <strong>
                    Email:
                  </strong>{" "}
                  {
                    selectedOrder.email
                  }
                </p>

              </div>


              {/* ADDRESS */}

              <div className="admin-detail-section">

                <h3>
                  Delivery Address
                </h3>

                <p>
                  {
                    selectedOrder.address
                  }
                </p>

                <p>
                  {
                    selectedOrder.city
                  }
                  ,{" "}
                  {
                    selectedOrder.state
                  }
                </p>

                <p>
                  <strong>
                    Pincode:
                  </strong>{" "}
                  {
                    selectedOrder.pincode
                  }
                </p>

              </div>


              {/* ORDERED PRODUCTS */}

              <div className="admin-detail-section">

                <h3>
                  Ordered Products
                </h3>


                {selectedOrder.itemsLoading ? (

                  <p className="admin-no-items">
                    Loading ordered products...
                  </p>

                ) : selectedOrder.items &&
                  selectedOrder.items.length >
                    0 ? (

                  <div className="admin-order-items">

                    {selectedOrder.items.map(
                      (item, index) => (

                        <div
                          className="admin-order-item"
                          key={
                            item.id ||
                            `${item.name}-${index}`
                          }
                        >

                          {/* IMAGE */}

                          <div className="admin-order-item-image">

                            {item.image ? (

                              <img
                                src={
                                  item.image
                                }
                                alt={
                                  item.name
                                }
                              />

                            ) : (

                              <div>
                                AURAN
                              </div>

                            )}

                          </div>


                          {/* DETAILS */}

                          <div className="admin-order-item-info">

                            <strong>
                              {item.name}
                            </strong>

                            <p>
                              Size:{" "}
                              {
                                item.size ||
                                "N/A"
                              }
                            </p>

                            <p>
                              Quantity:{" "}
                              {
                                item.quantity ||
                                1
                              }
                            </p>

                            <p>
                              Price: ₹
                              {Number(
                                item.price
                              ) *
                                Number(
                                  item.quantity ||
                                    1
                                )}
                            </p>

                          </div>

                        </div>

                      )
                    )}

                  </div>

                ) : (

                  <p className="admin-no-items">
                    Product details are not available
                    for this order yet.
                  </p>

                )}

              </div>


              {/* PAYMENT */}

              <div className="admin-detail-section">

                <h3>
                  Payment Details
                </h3>

                <p>
                  <strong>
                    Method:
                  </strong>{" "}
                  {
                    selectedOrder.payment_method
                  }
                </p>

                <p className="admin-detail-total">

                  <strong>
                    Total:
                  </strong>{" "}

                  ₹
                  {
                    selectedOrder.total
                  }

                </p>

              </div>


              {/* CHANGE STATUS */}

              <div className="admin-detail-section">

                <h3>
                  Update Order Status
                </h3>


                <select
                  className="modal-status-select"
                  value={
                    selectedOrder.status ||
                    "Pending"
                  }
                  disabled={
                    updatingOrder ===
                    selectedOrder.id
                  }
                  onChange={(e) =>
                    updateStatus(
                      selectedOrder.id,
                      e.target.value
                    )
                  }
                >

                  <option value="Pending">
                    Pending
                  </option>

                  <option value="Confirmed">
                    Confirmed
                  </option>

                  <option value="Packed">
                    Packed
                  </option>

                  <option value="Shipped">
                    Shipped
                  </option>

                  <option value="Out for Delivery">
                    Out for Delivery
                  </option>

                  <option value="Delivered">
                    Delivered
                  </option>

                  <option value="Cancelled">
                    Cancelled
                  </option>

                </select>

              </div>

            </div>


            {/* CLOSE */}

            <button
              className="admin-modal-close"
              onClick={() =>
                setSelectedOrder(
                  null
                )
              }
            >
              CLOSE
            </button>

          </div>

        </div>

      )}

    </div>
  );
}

export default Admin;