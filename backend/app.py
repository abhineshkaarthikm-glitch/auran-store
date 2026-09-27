from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

import sqlite3
import os
import uuid

from werkzeug.utils import secure_filename


# ============================================================
# APP
# ============================================================

app = Flask(__name__)

CORS(app)


# ============================================================
# DATABASE
# ============================================================

DATABASE = "auran.db"


def get_db():

    conn = sqlite3.connect(DATABASE)

    conn.row_factory = sqlite3.Row

    conn.execute("PRAGMA foreign_keys = ON")

    return conn


# ============================================================
# IMAGE UPLOAD
# ============================================================

UPLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "uploads"
)


ALLOWED_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "webp"
}


os.makedirs(
    UPLOAD_FOLDER,
    exist_ok=True
)


app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER


def allowed_file(filename):

    return (
        "." in filename
        and
        filename.rsplit(".", 1)[1].lower()
        in ALLOWED_EXTENSIONS
    )


# ============================================================
# CREATE DATABASE
# ============================================================

def create_database():

    conn = get_db()

    # ========================================================
    # ORDERS TABLE
    # ========================================================

    conn.execute("""
        CREATE TABLE IF NOT EXISTS orders (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            order_id TEXT UNIQUE,

            name TEXT NOT NULL,

            mobile TEXT NOT NULL,

            email TEXT NOT NULL,

            address TEXT NOT NULL,

            city TEXT NOT NULL,

            state TEXT NOT NULL,

            pincode TEXT NOT NULL,

            total REAL NOT NULL,

            payment_method TEXT NOT NULL,

            status TEXT NOT NULL DEFAULT 'Pending'

        )
    """)


    # ========================================================
    # PRODUCTS TABLE
    # ========================================================

    conn.execute("""
        CREATE TABLE IF NOT EXISTS products (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            name TEXT NOT NULL,

            price REAL NOT NULL,

            description TEXT,

            category TEXT,

            image TEXT,

            stock INTEGER NOT NULL DEFAULT 0

        )
    """)


    # ========================================================
    # ORDER ITEMS TABLE
    # ========================================================

    conn.execute("""
        CREATE TABLE IF NOT EXISTS order_items (

            id INTEGER PRIMARY KEY AUTOINCREMENT,

            order_id INTEGER NOT NULL,

            product_id INTEGER,

            product_name TEXT NOT NULL,

            size TEXT NOT NULL,

            quantity INTEGER NOT NULL,

            price REAL NOT NULL,

            FOREIGN KEY (order_id)
            REFERENCES orders(id),

            FOREIGN KEY (product_id)
            REFERENCES products(id)

        )
    """)


    # ========================================================
    # CHECK STATUS COLUMN
    # ========================================================

    columns = conn.execute(
        "PRAGMA table_info(orders)"
    ).fetchall()


    column_names = [
        column["name"]
        for column in columns
    ]


    if "status" not in column_names:

        conn.execute("""
            ALTER TABLE orders
            ADD COLUMN status
            TEXT NOT NULL
            DEFAULT 'Pending'
        """)


    # ========================================================
    # DEFAULT PRODUCTS
    # ========================================================

    product_count = conn.execute(
        "SELECT COUNT(*) FROM products"
    ).fetchone()[0]


    if product_count == 0:

        products = [

            (
                "Classic White Tee",
                699,
                "Premium quality clothing designed for everyday comfort and modern style.",
                "T-Shirts",
                "",
                50
            ),

            (
                "Essential Black Tee",
                799,
                "Clean and comfortable black T-shirt for everyday streetwear.",
                "T-Shirts",
                "",
                50
            ),

            (
                "Premium Oversized Tee",
                899,
                "Premium oversized fit designed for a modern streetwear look.",
                "Oversized",
                "",
                30
            ),

            (
                "Auran Street Tee",
                849,
                "Stylish streetwear T-shirt designed for a bold everyday look.",
                "Streetwear",
                "",
                40
            )

        ]


        conn.executemany("""
            INSERT INTO products (
                name,
                price,
                description,
                category,
                image,
                stock
            )

            VALUES (?, ?, ?, ?, ?, ?)

        """, products)


    conn.commit()

    conn.close()


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():

    return "AURAN Backend is running!"


# ============================================================
# IMAGE UPLOAD
# ============================================================

@app.route(
    "/api/upload-image",
    methods=["POST"]
)
def upload_image():

    try:

        if "image" not in request.files:

            return jsonify({
                "success": False,
                "message": "No image selected"
            }), 400


        file = request.files["image"]


        if file.filename == "":

            return jsonify({
                "success": False,
                "message": "No image selected"
            }), 400


        if not allowed_file(file.filename):

            return jsonify({
                "success": False,
                "message":
                    "Only PNG, JPG, JPEG and WEBP images are allowed"
            }), 400


        original_name = secure_filename(
            file.filename
        )


        extension = original_name.rsplit(
            ".",
            1
        )[1].lower()


        unique_name = (
            str(uuid.uuid4())
            + "."
            + extension
        )


        file_path = os.path.join(
            app.config["UPLOAD_FOLDER"],
            unique_name
        )


        file.save(file_path)


        image_url = (
            "http://https://auran-backend.onrender.com/uploads/"
            + unique_name
        )


        return jsonify({

            "success": True,

            "message":
                "Image uploaded successfully",

            "image_url":
                image_url

        })


    except Exception as error:

        print(error)

        return jsonify({

            "success": False,

            "message":
                "Image upload failed"

        }), 500


# ============================================================
# SERVE UPLOADED IMAGES
# ============================================================

@app.route(
    "/uploads/<filename>"
)
def uploaded_file(filename):

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename
    )


# ============================================================
# CREATE ORDER
# ============================================================

@app.route(
    "/api/orders",
    methods=["POST"]
)
def create_order():

    data = request.json or {}


    # ========================================================
    # CUSTOMER DETAILS
    # ========================================================

    name = data.get("name")

    mobile = data.get("mobile")

    email = data.get("email")

    address = data.get("address")

    city = data.get("city")

    state = data.get("state")

    pincode = data.get("pincode")

    total = data.get("total")

    payment_method = data.get(
        "payment_method"
    )


    # ========================================================
    # CART ITEMS
    # ========================================================

    items = data.get(
        "items",
        []
    )


    # ========================================================
    # VALIDATION
    # ========================================================

    if not all([
        name,
        mobile,
        email,
        address,
        city,
        state,
        pincode,
        total,
        payment_method
    ]):

        return jsonify({

            "success": False,

            "message":
                "All fields are required"

        }), 400


    if not items:

        return jsonify({

            "success": False,

            "message":
                "Cart is empty"

        }), 400


    conn = get_db()

    cursor = conn.cursor()


    try:

        # ====================================================
        # CHECK PRODUCTS AND STOCK
        # ====================================================

        validated_items = []


        for item in items:

            product_id = (
                item.get("product_id")
                or
                item.get("productId")
                or
                item.get("id")
            )


            quantity = int(
                item.get(
                    "quantity",
                    1
                )
            )


            size = item.get(
                "size",
                ""
            )


            if not product_id:

                raise Exception(
                    "Product ID is missing"
                )


            if quantity <= 0:

                raise Exception(
                    "Invalid quantity"
                )


            # =================================================
            # GET PRODUCT
            # =================================================

            product = cursor.execute("""
                SELECT *
                FROM products
                WHERE id = ?
            """, (
                product_id,
            )).fetchone()


            if product is None:

                conn.rollback()

                return jsonify({

                    "success": False,

                    "message":
                        f"Product {product_id} not found"

                }), 400


            # =================================================
            # CHECK STOCK
            # =================================================

            if product["stock"] < quantity:

                conn.rollback()

                return jsonify({

                    "success": False,

                    "message":
                        f"Only {product['stock']} stock available for {product['name']}"

                }), 400


            # =================================================
            # STORE VALIDATED PRODUCT
            # =================================================

            validated_items.append({

                "product_id":
                    product_id,

                "product_name":
                    product["name"],

                "size":
                    size,

                "quantity":
                    quantity,

                "price":
                    float(product["price"])

            })


        # ====================================================
        # CREATE ORDER
        # ====================================================

        cursor.execute("""
            INSERT INTO orders (

                order_id,

                name,

                mobile,

                email,

                address,

                city,

                state,

                pincode,

                total,

                payment_method,

                status

            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)

        """, (

            "TEMP",

            name,

            mobile,

            email,

            address,

            city,

            state,

            pincode,

            total,

            payment_method,

            "Pending"

        ))


        order_database_id = cursor.lastrowid


        # ====================================================
        # CREATE AURAN ORDER ID
        # ====================================================

        order_id = (
            "AURAN"
            +
            str(order_database_id).zfill(6)
        )


        cursor.execute("""
            UPDATE orders

            SET order_id = ?

            WHERE id = ?

        """, (

            order_id,

            order_database_id

        ))


        # ====================================================
        # SAVE ORDER ITEMS
        # ====================================================

        for item in validated_items:

            cursor.execute("""
                INSERT INTO order_items (

                    order_id,

                    product_id,

                    product_name,

                    size,

                    quantity,

                    price

                )

                VALUES (?, ?, ?, ?, ?, ?)

            """, (

                order_database_id,

                item["product_id"],

                item["product_name"],

                item["size"],

                item["quantity"],

                item["price"]

            ))


            # =================================================
            # REDUCE STOCK
            # =================================================

            cursor.execute("""
                UPDATE products

                SET stock = stock - ?

                WHERE id = ?

            """, (

                item["quantity"],

                item["product_id"]

            ))


        # ====================================================
        # SAVE EVERYTHING
        # ====================================================

        conn.commit()


        return jsonify({

            "success": True,

            "order_id":
                order_id,

            "message":
                "Order placed successfully"

        })


    except Exception as error:

        conn.rollback()

        print(
            "ORDER ERROR:",
            error
        )


        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


    finally:

        conn.close()


# ============================================================
# GET ALL ORDERS
# ============================================================

@app.route(
    "/api/orders",
    methods=["GET"]
)
def get_orders():

    conn = get_db()


    orders = conn.execute("""
        SELECT *
        FROM orders
        ORDER BY id DESC
    """).fetchall()


    conn.close()


    order_list = []


    for order in orders:

        order_list.append({

            "id":
                order["id"],

            "order_id":
                order["order_id"],

            "name":
                order["name"],

            "mobile":
                order["mobile"],

            "email":
                order["email"],

            "address":
                order["address"],

            "city":
                order["city"],

            "state":
                order["state"],

            "pincode":
                order["pincode"],

            "total":
                order["total"],

            "payment_method":
                order["payment_method"],

            "status":
                order["status"]

        })


    return jsonify(order_list)


# ============================================================
# GET SINGLE ORDER ITEMS
# ============================================================

@app.route(
    "/api/orders/<int:order_id>/items",
    methods=["GET"]
)
def get_order_items(order_id):

    conn = get_db()


    items = conn.execute("""
        SELECT

            oi.id,

            oi.product_id,

            oi.product_name,

            oi.size,

            oi.quantity,

            oi.price,

            p.image

        FROM order_items oi

        LEFT JOIN products p
        ON oi.product_id = p.id

        WHERE oi.order_id = ?

        ORDER BY oi.id ASC

    """, (
        order_id,
    )).fetchall()


    conn.close()


    item_list = []


    for item in items:

        item_list.append({

            "id":
                item["id"],

            "product_id":
                item["product_id"],

            "product_name":
                item["product_name"],

            "size":
                item["size"],

            "quantity":
                item["quantity"],

            "price":
                item["price"],

            "image":
                item["image"]

        })


    return jsonify(item_list)


# ============================================================
# UPDATE ORDER STATUS
# ============================================================

@app.route(
    "/api/orders/<order_id>/status",
    methods=["PUT"]
)
def update_order_status(order_id):

    data = request.json or {}

    status = data.get("status")


    # ========================================================
    # ALLOWED STATUSES
    # ========================================================

    allowed_statuses = [

        "Pending",

        "Confirmed",

        "Packed",

        "Shipped",

        "Out for Delivery",

        "Delivered",

        "Cancelled"

    ]


    if status not in allowed_statuses:

        return jsonify({

            "success": False,

            "message":
                "Invalid order status"

        }), 400


    conn = get_db()

    cursor = conn.cursor()


    try:

        # ====================================================
        # FIND ORDER
        #
        # Supports:
        #     1
        #     AURAN000001
        # ====================================================

        order = None


        if str(order_id).isdigit():

            order = cursor.execute("""
                SELECT *
                FROM orders
                WHERE id = ?
            """, (
                int(order_id),
            )).fetchone()


        else:

            order = cursor.execute("""
                SELECT *
                FROM orders
                WHERE order_id = ?
            """, (
                order_id,
            )).fetchone()


        if order is None:

            conn.close()

            return jsonify({

                "success": False,

                "message":
                    "Order not found"

            }), 404


        # ====================================================
        # UPDATE STATUS
        # ====================================================

        cursor.execute("""
            UPDATE orders

            SET status = ?

            WHERE id = ?

        """, (

            status,

            order["id"]

        ))


        conn.commit()


        return jsonify({

            "success": True,

            "message":
                "Order status updated successfully",

            "order_id":
                order["order_id"],

            "status":
                status

        })


    except Exception as error:

        conn.rollback()

        print(
            "STATUS UPDATE ERROR:",
            error
        )


        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


    finally:

        conn.close()


# ============================================================
# TRACK ORDER
# ============================================================

@app.route(
    "/api/orders/track",
    methods=["GET"]
)
def track_order():

    order_id = request.args.get(
        "order_id"
    )


    mobile = request.args.get(
        "mobile"
    )


    # ========================================================
    # VALIDATION
    # ========================================================

    if not order_id or not mobile:

        return jsonify({

            "success": False,

            "message":
                "Order ID and mobile number are required"

        }), 400


    conn = get_db()


    # ========================================================
    # FIND ORDER
    # ========================================================

    order = conn.execute("""
        SELECT *
        FROM orders

        WHERE order_id = ?

        AND mobile = ?

    """, (

        order_id,

        mobile

    )).fetchone()


    if order is None:

        conn.close()

        return jsonify({

            "success": False,

            "message":
                "Order not found. Please check Order ID and mobile number."

        }), 404


    # ========================================================
    # GET ORDER PRODUCTS
    # ========================================================

    items = conn.execute("""
        SELECT

            oi.id,

            oi.product_id,

            oi.product_name,

            oi.size,

            oi.quantity,

            oi.price,

            p.image

        FROM order_items oi

        LEFT JOIN products p

        ON oi.product_id = p.id

        WHERE oi.order_id = ?

        ORDER BY oi.id ASC

    """, (

        order["id"],

    )).fetchall()


    conn.close()


    item_list = []


    for item in items:

        item_list.append({

            "id":
                item["id"],

            "product_id":
                item["product_id"],

            "product_name":
                item["product_name"],

            "size":
                item["size"],

            "quantity":
                item["quantity"],

            "price":
                item["price"],

            "image":
                item["image"]

        })


    # ========================================================
    # RETURN ORDER
    # ========================================================

    return jsonify({

        "success": True,

        "order_id":
            order["order_id"],

        "name":
            order["name"],

        "mobile":
            order["mobile"],

        "email":
            order["email"],

        "address":
            order["address"],

        "city":
            order["city"],

        "state":
            order["state"],

        "pincode":
            order["pincode"],

        "total":
            order["total"],

        "payment_method":
            order["payment_method"],

        "status":
            order["status"],

        "items":
            item_list

    })


# ============================================================
# GET ALL PRODUCTS
# ============================================================

@app.route(
    "/api/products",
    methods=["GET"]
)
def get_products():

    conn = get_db()


    products = conn.execute("""
        SELECT *
        FROM products
        ORDER BY id DESC
    """).fetchall()


    conn.close()


    product_list = []


    for product in products:

        product_list.append({

            "id":
                product["id"],

            "name":
                product["name"],

            "price":
                product["price"],

            "description":
                product["description"],

            "category":
                product["category"],

            "image":
                product["image"],

            "stock":
                product["stock"]

        })


    return jsonify(product_list)


# ============================================================
# ADD PRODUCT
# ============================================================

@app.route(
    "/api/products",
    methods=["POST"]
)
def add_product():

    data = request.json or {}


    name = data.get(
        "name"
    )


    price = data.get(
        "price"
    )


    description = data.get(
        "description",
        ""
    )


    category = data.get(
        "category",
        "T-Shirts"
    )


    image = data.get(
        "image",
        ""
    )


    stock = data.get(
        "stock",
        0
    )


    if not name or price is None:

        return jsonify({

            "success": False,

            "message":
                "Product name and price are required"

        }), 400


    conn = get_db()

    cursor = conn.cursor()


    try:

        cursor.execute("""
            INSERT INTO products (

                name,

                price,

                description,

                category,

                image,

                stock

            )

            VALUES (?, ?, ?, ?, ?, ?)

        """, (

            name,

            price,

            description,

            category,

            image,

            stock

        ))


        product_id = cursor.lastrowid


        conn.commit()

        conn.close()


        return jsonify({

            "success": True,

            "message":
                "Product added successfully",

            "product_id":
                product_id

        })


    except Exception as error:

        conn.rollback()

        conn.close()


        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ============================================================
# UPDATE PRODUCT
# ============================================================

@app.route(
    "/api/products/<int:product_id>",
    methods=["PUT"]
)
def update_product(product_id):

    data = request.json or {}


    name = data.get(
        "name"
    )


    price = data.get(
        "price"
    )


    description = data.get(
        "description",
        ""
    )


    category = data.get(
        "category",
        "T-Shirts"
    )


    image = data.get(
        "image",
        ""
    )


    stock = data.get(
        "stock",
        0
    )


    if not name or price is None:

        return jsonify({

            "success": False,

            "message":
                "Product name and price are required"

        }), 400


    conn = get_db()

    cursor = conn.cursor()


    try:

        cursor.execute("""
            UPDATE products

            SET

                name = ?,

                price = ?,

                description = ?,

                category = ?,

                image = ?,

                stock = ?

            WHERE id = ?

        """, (

            name,

            price,

            description,

            category,

            image,

            stock,

            product_id

        ))


        if cursor.rowcount == 0:

            conn.close()

            return jsonify({

                "success": False,

                "message":
                    "Product not found"

            }), 404


        conn.commit()

        conn.close()


        return jsonify({

            "success": True,

            "message":
                "Product updated successfully"

        })


    except Exception as error:

        conn.rollback()

        conn.close()


        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ============================================================
# DELETE PRODUCT
# ============================================================

@app.route(
    "/api/products/<int:product_id>",
    methods=["DELETE"]
)
def delete_product(product_id):

    conn = get_db()

    cursor = conn.cursor()


    try:

        # ====================================================
        # CHECK ORDER ITEMS
        # ====================================================

        order_item = cursor.execute("""
            SELECT id

            FROM order_items

            WHERE product_id = ?

            LIMIT 1

        """, (

            product_id,

        )).fetchone()


        if order_item:

            conn.close()

            return jsonify({

                "success": False,

                "message":
                    "This product cannot be deleted because it exists in an order."

            }), 400


        # ====================================================
        # DELETE PRODUCT
        # ====================================================

        cursor.execute("""
            DELETE FROM products

            WHERE id = ?

        """, (

            product_id,

        ))


        if cursor.rowcount == 0:

            conn.close()

            return jsonify({

                "success": False,

                "message":
                    "Product not found"

            }), 404


        conn.commit()

        conn.close()


        return jsonify({

            "success": True,

            "message":
                "Product deleted successfully"

        })


    except Exception as error:

        conn.rollback()

        conn.close()


        return jsonify({

            "success": False,

            "message":
                str(error)

        }), 500


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    create_database()

    app.run(
        debug=True,
        port=5000
    )