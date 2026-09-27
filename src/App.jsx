import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import logo from "./assets/auran-logo.png";
import Checkout from "./Checkout";
import OrderTracking from "./OrderTracking";
import Admin from "./Admin";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // ==================================================
  // ROUTES
  // ==================================================

  if (location.pathname === "/admin") {
    return <Admin />;
  }

  if (location.pathname === "/track-order") {
    return (
      <OrderTracking
        onClose={() => navigate("/")}
      />
    );
  }

  // ==================================================
  // PRODUCTS
  // ==================================================

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);

  useEffect(() => {
    fetch("http://https://auran-backend.onrender.com/api/products")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        return response.json();
      })
      .then((data) => {
        setProducts(data);
        setLoadingProducts(false);
      })
      .catch((error) => {
        console.error("Error loading products:", error);
        setLoadingProducts(false);
      });
  }, []);

  // ==================================================
  // CART
  // ==================================================

  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);

  // ==================================================
  // PRODUCT DETAILS
  // ==================================================

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedSize, setSelectedSize] = useState("");
  const [productQuantity, setProductQuantity] = useState(1);

  // ==================================================
  // IMAGE URL
  // ==================================================

  function getImageUrl(image) {
    if (!image) {
      return "";
    }

    if (
      image.startsWith("http://") ||
      image.startsWith("https://")
    ) {
      return image;
    }

    if (image.startsWith("/uploads/")) {
      return `http://https://auran-backend.onrender.com${image}`;
    }

    if (image.startsWith("/")) {
      return image;
    }

    return image;
  }

  // ==================================================
  // OPEN PRODUCT
  // ==================================================

  function openProduct(product) {
    setSelectedProduct(product);
    setSelectedSize("");
    setProductQuantity(1);
  }

  // ==================================================
  // ADD TO CART
  // ==================================================

  function addToCart(product, size, quantity = 1) {
    if (!size) {
      alert("Please select a size.");
      return;
    }

    if (product.stock <= 0) {
      alert("This product is out of stock.");
      return;
    }

    if (quantity > product.stock) {
      alert(`Only ${product.stock} item(s) available in stock.`);
      return;
    }

    setCart((currentCart) => {
      const existing = currentCart.find(
        (item) =>
          item.id === product.id &&
          item.size === size
      );

      if (existing) {
        const newQuantity =
          existing.quantity + quantity;

        if (newQuantity > product.stock) {
          alert(
            `Only ${product.stock} item(s) available for ${product.name}.`
          );

          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id &&
          item.size === size
            ? {
                ...item,
                quantity: newQuantity,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          image: getImageUrl(product.image),
          size,
          quantity,
        },
      ];
    });

    setSelectedProduct(null);
    setSelectedSize("");
    setProductQuantity(1);

    setCartOpen(true);
  }

  // ==================================================
  // INCREASE QUANTITY
  // ==================================================

  function increaseQuantity(id, size) {
    setCart((currentCart) =>
      currentCart.map((item) => {
        if (
          item.id === id &&
          item.size === size
        ) {
          if (item.quantity >= item.stock) {
            alert(
              `Only ${item.stock} item(s) available in stock.`
            );

            return item;
          }

          return {
            ...item,
            quantity: item.quantity + 1,
          };
        }

        return item;
      })
    );
  }

  // ==================================================
  // DECREASE QUANTITY
  // ==================================================

  function decreaseQuantity(id, size) {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.id === id &&
          item.size === size
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  // ==================================================
  // REMOVE FROM CART
  // ==================================================

  function removeFromCart(id, size) {
    setCart((currentCart) =>
      currentCart.filter(
        (item) =>
          !(
            item.id === id &&
            item.size === size
          )
      )
    );
  }

  // ==================================================
  // CART COUNT
  // ==================================================

  const cartCount = cart.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  // ==================================================
  // CART TOTAL
  // ==================================================

  const cartTotal = cart.reduce(
    (total, item) =>
      total +
      item.price * item.quantity,
    0
  );

  // ==================================================
  // MAIN PAGE
  // ==================================================

  return (
    <div className="app">

      {/* ==================================================
          NAVBAR
      ================================================== */}

      <header className="navbar">

        <div className="logo-container">

          <img
            src={logo}
            alt="AURAN"
          />

        </div>

        <nav>

          <a href="#home">
            HOME
          </a>

          <a href="#shop">
            SHOP
          </a>

          <a href="#new">
            NEW ARRIVALS
          </a>

          <a href="#about">
            ABOUT
          </a>

          <a href="#contact">
            CONTACT
          </a>

        </nav>

        <div className="nav-actions">

          <button>
            ⌕
          </button>

          <button>
            ♡
          </button>

          {/* TRACK ORDER */}

          <button
            className="track-nav-btn"
            onClick={() =>
              navigate("/track-order")
            }
          >
            TRACK
          </button>

          {/* CART */}

          <button
            className="cart-button"
            onClick={() =>
              setCartOpen(true)
            }
          >
            🛒

            {cartCount > 0 && (
              <span className="cart-count">
                {cartCount}
              </span>
            )}

          </button>

        </div>

      </header>


      {/* ==================================================
          HERO
      ================================================== */}

      <section
        className="hero"
        id="home"
      >

        <div className="hero-content">

          <p className="eyebrow">
            AURAN CLOTHING
          </p>

          <h1>
            WEAR YOUR
            <br />
            IDENTITY.
          </h1>

          <p className="hero-text">
            Premium everyday clothing designed
            for those who create their own style.
          </p>

          <a href="#shop">

            <button className="primary-btn">
              SHOP COLLECTION
            </button>

          </a>

        </div>

      </section>


      {/* ==================================================
          CATEGORIES
      ================================================== */}

      <section className="categories">

        <p className="section-label">
          EXPLORE
        </p>

        <h2>
          SHOP BY CATEGORY
        </h2>

        <div className="category-grid">

          <div className="category-card">

            <div className="category-content">

              <h3>
                OVERSIZED
              </h3>

              <a href="#shop">

                <button>
                  SHOP NOW →
                </button>

              </a>

            </div>

          </div>


          <div className="category-card category-two">

            <div className="category-content">

              <h3>
                T-SHIRTS
              </h3>

              <a href="#shop">

                <button>
                  SHOP NOW →
                </button>

              </a>

            </div>

          </div>


          <div className="category-card category-three">

            <div className="category-content">

              <h3>
                NEW ARRIVALS
              </h3>

              <a href="#shop">

                <button>
                  SHOP NOW →
                </button>

              </a>

            </div>

          </div>

        </div>

      </section>


      {/* ==================================================
          PRODUCTS
      ================================================== */}

      <section
        className="products"
        id="shop"
      >

        <p className="section-label">
          AURAN COLLECTION
        </p>

        <h2>
          BEST SELLERS
        </h2>


        {loadingProducts ? (

          <div className="products-loading">

            <p>
              Loading products...
            </p>

          </div>

        ) : products.length === 0 ? (

          <div className="products-loading">

            <p>
              No products available.
            </p>

          </div>

        ) : (

          <div className="product-grid">

            {products.map((product) => (

              <div
                className="product-card"
                key={product.id}
                onClick={() =>
                  openProduct(product)
                }
              >

                {/* PRODUCT IMAGE */}

                <div className="product-image">

                  {product.image ? (

                    <img
                      src={getImageUrl(
                        product.image
                      )}
                      alt={product.name}
                      onError={(e) => {
                        e.currentTarget.style.display =
                          "none";
                      }}
                    />

                  ) : (

                    <div className="no-product-image">
                      AURAN
                    </div>

                  )}


                  <button
                    className="heart"
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  >
                    ♡
                  </button>

                </div>


                {/* PRODUCT INFORMATION */}

                <div className="product-info">

                  <p>
                    AURAN
                  </p>

                  <h3>
                    {product.name}
                  </h3>

                  <span>
                    ₹{product.price}
                  </span>

                  <small className="product-stock-card">

                    {product.stock > 0
                      ? `Stock: ${product.stock}`
                      : "OUT OF STOCK"}

                  </small>


                  {product.stock <= 0 ? (

                    <button
                      className="add-cart-btn"
                      disabled
                    >
                      OUT OF STOCK
                    </button>

                  ) : (

                    <button
                      className="add-cart-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        openProduct(product);
                      }}
                    >
                      VIEW PRODUCT
                    </button>

                  )}

                </div>

              </div>

            ))}

          </div>

        )}


        <button
          className="outline-btn"
          onClick={() =>
            document
              .getElementById("shop")
              ?.scrollIntoView()
          }
        >
          VIEW ALL PRODUCTS
        </button>

      </section>


      {/* ==================================================
          ABOUT
      ================================================== */}

      <section
        className="brand-section"
        id="about"
      >

        <div className="brand-content">

          <p className="section-label">
            OUR PHILOSOPHY
          </p>

          <h2>
            BUILT FOR
            <br />
            YOUR STYLE.
          </h2>

          <p>
            AURAN represents modern fashion,
            clean design and everyday confidence.
            Every piece is created to help you
            express your identity.
          </p>

          <a href="#shop">

            <button className="primary-btn">
              SHOP AURAN
            </button>

          </a>

        </div>

      </section>


      {/* ==================================================
          NEWSLETTER
      ================================================== */}

      <section className="newsletter">

        <p className="section-label">
          STAY CONNECTED
        </p>

        <h2>
          JOIN THE AURAN COMMUNITY
        </h2>

        <p>
          Get updates about new collections,
          exclusive drops and offers.
        </p>

        <div className="email-box">

          <input
            type="email"
            placeholder="Enter your email"
          />

          <button>
            JOIN
          </button>

        </div>

      </section>


      {/* ==================================================
          FOOTER
      ================================================== */}

      <footer id="contact">

        <div className="footer-logo">

          <img
            src={logo}
            alt="AURAN"
          />

        </div>

        <p>
          PREMIUM CLOTHING. EVERYDAY IDENTITY.
        </p>

        <div className="footer-links">

          <a href="#">
            Instagram
          </a>

          <a href="#">
            Facebook
          </a>

          <a href="#">
            Contact
          </a>

          <a href="#">
            Privacy Policy
          </a>

          <a href="#">
            Terms
          </a>

        </div>

        <div className="copyright">
          © 2026 AURAN CLOTHING.
          ALL RIGHTS RESERVED.
        </div>

      </footer>


      {/* ==================================================
          PRODUCT DETAILS POPUP
      ================================================== */}

      {selectedProduct && (

        <div
          className="product-overlay"
          onClick={() =>
            setSelectedProduct(null)
          }
        >

          <div
            className="product-details"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* CLOSE */}

            <button
              className="product-close"
              onClick={() =>
                setSelectedProduct(null)
              }
            >
              ✕
            </button>


            {/* IMAGE */}

            <div className="product-details-image">

              {selectedProduct.image ? (

                <img
                  src={getImageUrl(
                    selectedProduct.image
                  )}
                  alt={selectedProduct.name}
                />

              ) : (

                <div className="no-product-image">
                  AURAN
                </div>

              )}

            </div>


            {/* INFORMATION */}

            <div className="product-details-info">

              <p className="product-brand">
                AURAN
              </p>

              <h2>
                {selectedProduct.name}
              </h2>

              <h3>
                ₹{selectedProduct.price}
              </h3>

              <p className="product-stock">

                {selectedProduct.stock > 0
                  ? `${selectedProduct.stock} item(s) available`
                  : "OUT OF STOCK"}

              </p>

              <p className="product-description">

                {selectedProduct.description ||
                  "Premium quality clothing designed for everyday comfort and modern style."}

              </p>


              {selectedProduct.stock <= 0 ? (

                <p className="out-of-stock">
                  OUT OF STOCK
                </p>

              ) : (

                <>

                  {/* SIZE */}

                  <div className="size-section">

                    <div className="size-title">

                      <span>
                        SELECT SIZE
                      </span>

                      <span>
                        {selectedSize
                          ? `Selected: ${selectedSize}`
                          : "Choose a size"}
                      </span>

                    </div>


                    <div className="size-buttons">

                      {[
                        "S",
                        "M",
                        "L",
                        "XL",
                        "XXL",
                      ].map((size) => (

                        <button
                          key={size}
                          className={
                            selectedSize === size
                              ? "size-btn selected"
                              : "size-btn"
                          }
                          onClick={() =>
                            setSelectedSize(size)
                          }
                        >
                          {size}
                        </button>

                      ))}

                    </div>

                  </div>


                  {/* QUANTITY */}

                  <div className="detail-quantity">

                    <span>
                      QUANTITY
                    </span>

                    <div className="quantity">

                      <button
                        onClick={() =>
                          setProductQuantity(
                            Math.max(
                              1,
                              productQuantity - 1
                            )
                          )
                        }
                      >
                        −
                      </button>

                      <span>
                        {productQuantity}
                      </span>

                      <button
                        onClick={() =>
                          setProductQuantity(
                            Math.min(
                              selectedProduct.stock,
                              productQuantity + 1
                            )
                          )
                        }
                      >
                        +
                      </button>

                    </div>

                  </div>


                  {/* ADD TO CART */}

                  <button
                    className="details-add-cart"
                    disabled={
                      selectedProduct.stock <= 0
                    }
                    onClick={() =>
                      addToCart(
                        selectedProduct,
                        selectedSize,
                        productQuantity
                      )
                    }
                  >

                    {selectedProduct.stock <= 0
                      ? "OUT OF STOCK"
                      : `ADD TO CART — ₹${
                          selectedProduct.price *
                          productQuantity
                        }`}

                  </button>

                </>

              )}

            </div>

          </div>

        </div>

      )}


      {/* ==================================================
          CART
      ================================================== */}

      {cartOpen && (

        <div
          className="cart-overlay"
          onClick={() =>
            setCartOpen(false)
          }
        >

          <div
            className="cart-sidebar"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* CART HEADER */}

            <div className="cart-header">

              <h2>
                YOUR CART
              </h2>

              <button
                onClick={() =>
                  setCartOpen(false)
                }
              >
                ✕
              </button>

            </div>


            {/* EMPTY CART */}

            {cart.length === 0 ? (

              <div className="empty-cart">

                <h3>
                  Your cart is empty
                </h3>

                <p>
                  Add something you love.
                </p>

                <button
                  onClick={() => {

                    setCartOpen(false);

                    document
                      .getElementById("shop")
                      ?.scrollIntoView();

                  }}
                >
                  START SHOPPING
                </button>

              </div>

            ) : (

              <>

                {/* CART ITEMS */}

                <div className="cart-items">

                  {cart.map((item) => (

                    <div
                      className="cart-item"
                      key={`${item.id}-${item.size}`}
                    >

                      <img
                        src={getImageUrl(
                          item.image
                        )}
                        alt={item.name}
                      />


                      <div className="cart-item-info">

                        <h3>
                          {item.name}
                        </h3>

                        <p>
                          ₹{item.price}
                        </p>

                        <p className="cart-size">
                          Size: {item.size}
                        </p>


                        {/* QUANTITY */}

                        <div className="quantity">

                          <button
                            onClick={() =>
                              decreaseQuantity(
                                item.id,
                                item.size
                              )
                            }
                          >
                            −
                          </button>

                          <span>
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              increaseQuantity(
                                item.id,
                                item.size
                              )
                            }
                          >
                            +
                          </button>

                        </div>


                        {/* REMOVE */}

                        <button
                          className="remove-btn"
                          onClick={() =>
                            removeFromCart(
                              item.id,
                              item.size
                            )
                          }
                        >
                          Remove
                        </button>

                      </div>

                    </div>

                  ))}

                </div>


                {/* CART FOOTER */}

                <div className="cart-footer">

                  <div className="cart-total">

                    <span>
                      TOTAL
                    </span>

                    <strong>
                      ₹{cartTotal}
                    </strong>

                  </div>


                  <button
                    className="checkout-btn"
                    onClick={() => {

                      if (cart.length === 0) {
                        alert("Cart is empty.");
                        return;
                      }

                      setCartOpen(false);
                      setShowCheckout(true);

                    }}
                  >
                    PROCEED TO CHECKOUT
                  </button>

                </div>

              </>

            )}

          </div>

        </div>

      )}


      {/* ==================================================
          CHECKOUT
      ================================================== */}

      {showCheckout && (

        <Checkout
          cart={cart}
          cartTotal={cartTotal}
          onClose={() => {
            setShowCheckout(false);
            setCart([]);

            fetch("http://https://auran-backend.onrender.com/api/products")
              .then((response) => response.json())
              .then((data) => {
                setProducts(data);
              })
              .catch((error) => {
                console.error("Error refreshing products:", error);
              });
          }}
        />

      )}

    </div>
  );
}

export default App;