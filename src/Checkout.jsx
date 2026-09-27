import { useState } from "react";

function Checkout({ cart, cartTotal, onClose }) {

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);


  // ==================================================
  // HANDLE INPUT
  // ==================================================

  function handleChange(e) {

    const { name, value } = e.target;

    setFormData({
      ...formData,
      [name]: value,
    });

  }


  // ==================================================
  // PLACE ORDER
  // ==================================================

  async function placeOrder(e) {

    e.preventDefault();


    // ----------------------------------------------
    // CHECK CART
    // ----------------------------------------------

    if (!cart || cart.length === 0) {

      alert("Your cart is empty.");

      return;
    }


    // ----------------------------------------------
    // CHECK CUSTOMER DETAILS
    // ----------------------------------------------

    if (
      !formData.name.trim() ||
      !formData.mobile.trim() ||
      !formData.email.trim() ||
      !formData.address.trim() ||
      !formData.city.trim() ||
      !formData.state.trim() ||
      !formData.pincode.trim()
    ) {

      alert("Please fill all the details.");

      return;
    }


    // ----------------------------------------------
    // MOBILE VALIDATION
    // ----------------------------------------------

    if (!/^[0-9]{10}$/.test(formData.mobile)) {

      alert(
        "Please enter a valid 10-digit mobile number."
      );

      return;
    }


    // ----------------------------------------------
    // PINCODE VALIDATION
    // ----------------------------------------------

    if (!/^[0-9]{6}$/.test(formData.pincode)) {

      alert(
        "Please enter a valid 6-digit pincode."
      );

      return;
    }


    try {

      setLoading(true);


      // ==================================================
      // PREPARE ORDER ITEMS
      // ==================================================

      const orderItems = cart.map((item) => ({

        product_id: item.id,

        name: item.name,

        price: Number(item.price),

        quantity: Number(item.quantity),

        size: item.size || "",

        image: item.image || "",

      }));


      console.log(
        "ORDER ITEMS:",
        orderItems
      );


      // ==================================================
      // SEND ORDER TO FLASK
      // ==================================================

      const response = await fetch(
        "http://127.0.0.1:5000/api/orders",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({

            // ------------------------------------------
            // CUSTOMER
            // ------------------------------------------

            name: formData.name.trim(),

            mobile: formData.mobile.trim(),

            email: formData.email.trim(),


            // ------------------------------------------
            // DELIVERY
            // ------------------------------------------

            address: formData.address.trim(),

            city: formData.city.trim(),

            state: formData.state.trim(),

            pincode: formData.pincode.trim(),


            // ------------------------------------------
            // ORDER TOTAL
            // ------------------------------------------

            total: Number(cartTotal),


            // ------------------------------------------
            // PAYMENT
            // ------------------------------------------

            payment_method: "Cash on Delivery",


            // ------------------------------------------
            // PRODUCTS
            // ------------------------------------------

            items: orderItems,

          }),
        }
      );


      // ==================================================
      // READ RESPONSE
      // ==================================================

      const data = await response.json();


      // ==================================================
      // ERROR
      // ==================================================

      if (!response.ok) {

        alert(
          data.message ||
          "Unable to place order."
        );

        return;
      }


      // ==================================================
      // SUCCESS
      // ==================================================

      console.log(
        "ORDER CREATED:",
        data
      );


      setOrderId(
        data.order_id
      );


      setOrderPlaced(true);


    } catch (error) {

      console.error(
        "Order Error:",
        error
      );


      alert(
        "Unable to connect to the server.\n\n" +
        "Please make sure Flask backend is running."
      );


    } finally {

      setLoading(false);

    }

  }


  // ==================================================
  // ORDER SUCCESS PAGE
  // ==================================================

  if (orderPlaced) {

    return (

      <div className="checkout-page">

        <div className="order-success">


          {/* SUCCESS ICON */}

          <div className="success-icon">
            ✓
          </div>


          {/* TITLE */}

          <h1>
            ORDER PLACED
          </h1>


          <p>
            Thank you for shopping with AURAN.
          </p>


          {/* ORDER NUMBER */}

          <div className="order-number">

            <span>
              ORDER ID
            </span>

            <strong>
              {orderId}
            </strong>

          </div>


          {/* SUCCESS DETAILS */}

          <div className="success-details">

            <p>

              <strong>
                Total:
              </strong>{" "}

              ₹{cartTotal}

            </p>


            <p>

              <strong>
                Payment:
              </strong>{" "}

              Cash on Delivery

            </p>


            <p>

              <strong>
                Delivery:
              </strong>{" "}

              {formData.city},{" "}

              {formData.state} -{" "}

              {formData.pincode}

            </p>

          </div>


          {/* CONTINUE SHOPPING */}

          <button
            className="place-order-btn"
            onClick={onClose}
          >

            CONTINUE SHOPPING

          </button>

        </div>

      </div>

    );

  }


  // ==================================================
  // CHECKOUT PAGE
  // ==================================================

  return (

    <div className="checkout-page">


      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="checkout-header">

        <h1>
          AURAN CHECKOUT
        </h1>


        <button
          type="button"
          onClick={onClose}
        >
          ✕
        </button>

      </div>


      {/* ==================================================
          CHECKOUT CONTAINER
      ================================================== */}

      <form
        className="checkout-container"
        onSubmit={placeOrder}
      >


        {/* ==================================================
            CUSTOMER FORM
        ================================================== */}

        <div className="checkout-form">


          <h2>
            Customer Details
          </h2>


          {/* NAME */}

          <label>
            Full Name
          </label>

          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your full name"
          />


          {/* MOBILE */}

          <label>
            Mobile Number
          </label>

          <input
            type="tel"
            name="mobile"
            value={formData.mobile}
            onChange={handleChange}
            placeholder="10 digit mobile number"
            maxLength="10"
          />


          {/* EMAIL */}

          <label>
            Email
          </label>

          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Enter your email"
          />


          {/* ==================================================
              DELIVERY ADDRESS
          ================================================== */}

          <h2>
            Delivery Address
          </h2>


          {/* ADDRESS */}

          <label>
            Address
          </label>

          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter your full delivery address"
            rows="4"
          />


          {/* CITY */}

          <label>
            City
          </label>

          <input
            type="text"
            name="city"
            value={formData.city}
            onChange={handleChange}
            placeholder="Enter city"
          />


          {/* STATE */}

          <label>
            State
          </label>

          <input
            type="text"
            name="state"
            value={formData.state}
            onChange={handleChange}
            placeholder="Enter state"
          />


          {/* PINCODE */}

          <label>
            Pincode
          </label>

          <input
            type="text"
            name="pincode"
            value={formData.pincode}
            onChange={handleChange}
            placeholder="6 digit pincode"
            maxLength="6"
          />


          {/* ==================================================
              PAYMENT
          ================================================== */}

          <h2>
            Payment Method
          </h2>


          <div className="payment-option">

            <input
              type="radio"
              name="payment"
              value="Cash on Delivery"
              defaultChecked
            />

            <span>
              Cash on Delivery
            </span>

          </div>


          {/* ==================================================
              PLACE ORDER
          ================================================== */}

          <button
            type="submit"
            className="place-order-btn"
            disabled={loading}
          >

            {loading
              ? "PLACING ORDER..."
              : `PLACE ORDER — ₹${cartTotal}`}

          </button>

        </div>


        {/* ==================================================
            ORDER SUMMARY
        ================================================== */}

        <div className="checkout-summary">


          <h2>
            Order Summary
          </h2>


          {/* EMPTY CART */}

          {cart.length === 0 && (

            <p>
              Your cart is empty.
            </p>

          )}


          {/* ==================================================
              PRODUCTS
          ================================================== */}

          {cart.map((item) => (

            <div
              className="checkout-item"
              key={`${item.id}-${item.size}`}
            >


              {/* PRODUCT IMAGE */}

              <img
                src={item.image}
                alt={item.name}
              />


              {/* PRODUCT INFORMATION */}

              <div>

                <h3>
                  {item.name}
                </h3>


                <p>
                  Size: {item.size || "N/A"}
                </p>


                <p>
                  Quantity: {item.quantity}
                </p>


                <strong>
                  ₹{item.price * item.quantity}
                </strong>

              </div>

            </div>

          ))}


          {/* ==================================================
              TOTAL
          ================================================== */}

          <div className="checkout-total">

            <span>
              TOTAL
            </span>

            <strong>
              ₹{cartTotal}
            </strong>

          </div>

        </div>

      </form>

    </div>

  );

}

export default Checkout;