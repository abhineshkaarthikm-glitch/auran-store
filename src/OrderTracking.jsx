import { useEffect, useState } from "react";

function OrderTracking() {
  const [orderId, setOrderId] = useState("");
  const [mobile, setMobile] = useState("");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  // =========================
  // FETCH ORDER
  // =========================

  async function fetchOrder(currentOrderId, currentMobile) {
    try {
      const response = await fetch(
        `http://https://auran-backend.onrender.com/api/orders/track?order_id=${encodeURIComponent(
          currentOrderId
        )}&mobile=${encodeURIComponent(currentMobile)}`
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return;
      }

      setOrder(data);
    } catch (error) {
      console.error("Tracking error:", error);
    }
  }

  // =========================
  // TRACK ORDER
  // =========================

  async function trackOrder(e) {
    e.preventDefault();

    if (!orderId.trim() || !mobile.trim()) {
      alert("Please enter Order ID and Mobile Number.");
      return;
    }

    if (!/^[0-9]{10}$/.test(mobile)) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setLoading(true);
      setOrder(null);

      await fetchOrder(orderId.trim(), mobile.trim());
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // AUTO REFRESH
  // =========================

  useEffect(() => {
    if (!order) {
      return;
    }

    const interval = setInterval(() => {
      fetchOrder(orderId.trim(), mobile.trim());
    }, 10000);

    return () => {
      clearInterval(interval);
    };
  }, [order, orderId, mobile]);

  // =========================
  // STATUS
  // =========================

  const statuses = [
    "Pending",
    "Confirmed",
    "Packed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];

  function getStatusIndex(status) {
    return statuses.findIndex(
      (item) => item.toLowerCase() === status?.toLowerCase()
    );
  }

  // =========================
  // STATUS CLASS
  // =========================

  function getStatusClass(status) {
    if (!status) return "";

    return status.toLowerCase().replace(/\s+/g, "-");
  }

  // =========================
  // REFRESH BUTTON
  // =========================

  async function refreshStatus() {
    if (!orderId || !mobile) {
      return;
    }

    await fetchOrder(orderId.trim(), mobile.trim());
  }

  return (
    <div className="tracking-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="tracking-header">

        <div className="tracking-brand">
          AURAN
        </div>

        <h1>
          TRACK YOUR ORDER
        </h1>

        <p>
          Enter your Order ID and mobile number to check your order status.
        </p>

      </div>

      {/* =========================
          SEARCH FORM
      ========================= */}

      <form
        className="tracking-form"
        onSubmit={trackOrder}
      >

        <div className="tracking-field">

          <label>
            ORDER ID
          </label>

          <input
            type="text"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Example: AURAN000006"
          />

        </div>

        <div className="tracking-field">

          <label>
            MOBILE NUMBER
          </label>

          <input
            type="tel"
            value={mobile}
            onChange={(e) =>
              setMobile(
                e.target.value.replace(/\D/g, "").slice(0, 10)
              )
            }
            placeholder="Enter 10 digit mobile number"
            maxLength="10"
          />

        </div>

        <button
          type="submit"
          className="track-order-btn"
          disabled={loading}
        >
          {loading ? "CHECKING..." : "TRACK ORDER"}
        </button>

      </form>

      {/* =========================
          ORDER RESULT
      ========================= */}

      {order && (

        <div className="tracking-result">

          {/* =========================
              CURRENT STATUS
          ========================= */}

          <div className="tracking-status">

            <span>
              CURRENT STATUS
            </span>

            <strong className={getStatusClass(order.status)}>
              {order.status}
            </strong>

          </div>

          {/* =========================
              REFRESH
          ========================= */}

          <div className="tracking-refresh">

            <button
              type="button"
              onClick={refreshStatus}
            >
              ↻ REFRESH STATUS
            </button>

            <span>
              Status automatically refreshes every 10 seconds
            </span>

          </div>

          {/* =========================
              ORDER STATUS TIMELINE
          ========================= */}

          <div className="tracking-section">

            <h2>
              ORDER STATUS
            </h2>

            <div className="status-timeline">

              {statuses.map((status, index) => {

                const currentIndex =
                  getStatusIndex(order.status);

                const completed =
                  index <= currentIndex;

                return (
                  <div
                    className={`status-step ${
                      completed ? "completed" : ""
                    } ${
                      index === currentIndex
                        ? "current"
                        : ""
                    }`}
                    key={status}
                  >

                    <div className="status-circle">

                      {completed && index !== currentIndex
                        ? "✓"
                        : index + 1}

                    </div>

                    <span>
                      {status}
                    </span>

                  </div>
                );

              })}

            </div>

          </div>

          {/* =========================
              ORDER INFORMATION
          ========================= */}

          <div className="tracking-section">

            <h2>
              ORDER INFORMATION
            </h2>

            <p>
              <strong>Order ID:</strong>{" "}
              {order.order_id}
            </p>

            <p>
              <strong>Customer:</strong>{" "}
              {order.name}
            </p>

            <p>
              <strong>Mobile:</strong>{" "}
              {order.mobile}
            </p>

            <p>
              <strong>Email:</strong>{" "}
              {order.email}
            </p>

          </div>

          {/* =========================
              PRODUCTS
          ========================= */}

          <div className="tracking-section">

            <h2>
              ORDERED PRODUCTS
            </h2>

            {order.items &&
            order.items.length > 0 ? (

              order.items.map((item, index) => (

                <div
                  className="tracking-product"
                  key={`${item.product_id}-${item.size}-${index}`}
                >

                  <div className="tracking-product-image">

                    {item.image ? (

                      <img
                        src={item.image}
                        alt={item.product_name}
                      />

                    ) : (

                      <div className="no-image">
                        AURAN
                      </div>

                    )}

                  </div>

                  <div className="tracking-product-info">

                    <h3>
                      {item.product_name}
                    </h3>

                    <p>
                      Size: {item.size}
                    </p>

                    <p>
                      Quantity: {item.quantity}
                    </p>

                    <p>
                      Price: ₹{item.price}
                    </p>

                    <strong>
                      ₹{item.price * item.quantity}
                    </strong>

                  </div>

                </div>

              ))

            ) : (

              <p>
                Product details are not available.
              </p>

            )}

          </div>

          {/* =========================
              DELIVERY
          ========================= */}

          <div className="tracking-section">

            <h2>
              DELIVERY ADDRESS
            </h2>

            <p>
              {order.address}
            </p>

            <p>
              {order.city}, {order.state}
            </p>

            <p>
              Pincode: {order.pincode}
            </p>

          </div>

          {/* =========================
              PAYMENT
          ========================= */}

          <div className="tracking-payment">

            <div>

              <span>
                PAYMENT METHOD
              </span>

              <strong>
                {order.payment_method}
              </strong>

            </div>

            <div>

              <span>
                TOTAL
              </span>

              <strong>
                ₹{order.total}
              </strong>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default OrderTracking;