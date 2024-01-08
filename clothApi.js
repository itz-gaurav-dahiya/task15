const express = require('express');
const fs = require('fs').promises;

const app = express();
// const port = 5000;
var port =process.env.PORT||2410

app.use(express.json());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, , authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET,POST,DELETE,PUT,OPTIONS");
  next();
});

let logindata={email: "test12@test.com",password: "test1234",custid:2}
const messagesFilePath = './cdata.json';

let myCart='./myCart.json';

app.get('/products', async (req, res) => {
  try {
    const data = await fs.readFile(messagesFilePath, 'utf8');
    let messages = JSON.parse(data);

    // Check if category query parameter is present
    const category = req.query.category;
   if (category) {
      // Filter messages based on category
      messages = messages.filter(message => message.category === category);
    }
    res.json(messages);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/products/:id', async (req, res) => {
    try {
      const productId = parseInt(req.params.id); // Convert the ID parameter to an integer
      if (isNaN(productId)) {
        return res.status(400).json({ message: 'Invalid product ID' });
      }
  
      const data = await fs.readFile(messagesFilePath, 'utf8');
      const products = JSON.parse(data);
  
      const product = products.find((p) => p.prodId === productId);
  
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }
  
      res.json(product);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
  

  const crypto = require('crypto');

  app.post('/products', async (req, res) => {
    try {
      const newProduct = req.body;
  
      // Read the current state of the products from the file
      const productsData = await fs.readFile(messagesFilePath, 'utf8');
      let products = JSON.parse(productsData);
  
      // Generate a unique 4-digit product ID
      newProduct.prodId = generateUniqueProductId(products);
  
      products.push(newProduct);
  
      // Write the updated products back to the file
      await fs.writeFile(messagesFilePath, JSON.stringify(products, null, 2), 'utf8');
  
      res.status(201).json({ message: 'Product added successfully', product: newProduct });
    } catch (error) {
      console.error('Error adding product:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
  
  function generateUniqueProductId(products) {
    let uniqueId;
    do {
      uniqueId = crypto.randomBytes(2).toString('hex'); // Generates a 4-digit hexadecimal string
    } while (products.some(product => product.prodId === uniqueId));
  
    return uniqueId;
  }
  
  app.delete('/products/:id', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
  
      // Read the current state of the products from the file
      const productsData = await fs.readFile(messagesFilePath, 'utf8');
      let products = JSON.parse(productsData);
  
      // Find the index of the product with the given ID
      const productIndex = products.findIndex(product => product.prodId === productId);
  
      // If the product with the given ID is found, remove it
      if (productIndex !== -1) {
        const removedProduct = products.splice(productIndex, 1)[0];
  
        // Write the updated products back to the file
        await fs.writeFile(messagesFilePath, JSON.stringify(products, null, 2), 'utf8');
  
        res.json({ message: 'Product deleted successfully', product: removedProduct });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
  
  app.put('/products/:id', async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const updatedProduct = req.body;
  
      // Read the current state of the products from the file
      const productsData = await fs.readFile(messagesFilePath, 'utf8');
      let products = JSON.parse(productsData);
  
      // Find the index of the product with the given ID
      const productIndex = products.findIndex(product => product.prodId === productId);
  
      // If the product with the given ID is found, update it
      if (productIndex !== -1) {
        products[productIndex] = { ...products[productIndex], ...updatedProduct };
  
        // Write the updated products back to the file
        await fs.writeFile(messagesFilePath, JSON.stringify(products, null, 2), 'utf8');
  
        res.json({ message: 'Product updated successfully', product: products[productIndex] });
      } else {
        res.status(404).json({ message: 'Product not found' });
      }
    } catch (error) {
      console.error('Error updating product:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
  
app.post('/addtoCart', async (req, res) => {
    try {
      const productToAdd = req.body; // Assumes the product details are sent in the request body
  
      // Read the current state of the shopping cart from the file
      const cartData = await fs.readFile(myCart, 'utf8');
      let shoppingCart = JSON.parse(cartData);
  
      // Check if the product is already in the cart
      const productInCartIndex = shoppingCart.findIndex(item => item.prodId === productToAdd.prodId);
  
      if (productInCartIndex === -1) {
        // If not in the cart, add it with qty 1 and calculate tprice
        const newItem = {
          ...productToAdd,
          qty: 1,
          tprice: productToAdd.price // Assuming initial tprice is the same as the product price
        };
  
        shoppingCart.push(newItem);
      } else {
        // If already in the cart, update qty and tprice
        shoppingCart[productInCartIndex].qty += 1;
        shoppingCart[productInCartIndex].tprice =
          shoppingCart[productInCartIndex].qty * shoppingCart[productInCartIndex].price;
      }
  
      // Write the updated cart back to the file
      await fs.writeFile(myCart, JSON.stringify(shoppingCart, null, 2), 'utf8');
  
      res.status(200).json({ message: 'Product added to the cart successfully', shoppingCart });
    } catch (error) {
      console.error('Error adding to cart:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
  
  app.get('/cart', async (req, res) => {
    try {
      const data = await fs.readFile(myCart, 'utf8');
      const cartData = JSON.parse(data);
      res.json(cartData);
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });

  app.get('/cart/incqty/:prodId', async (req, res) => {
    try {
      const prodId = parseInt(req.params.prodId, 10);
      
      // Read the current state of the shopping cart from the file
      const cartData = await fs.readFile(myCart, 'utf8');
      let shoppingCart = JSON.parse(cartData);
  
      // Find the product in the cart
      const productInCartIndex = shoppingCart.findIndex(item => item.prodId === prodId);
  
      if (productInCartIndex !== -1) {
        // Increment the quantity
        shoppingCart[productInCartIndex].qty += 1;
  
        // Update the total price based on the new quantity
        shoppingCart[productInCartIndex].tprice = shoppingCart[productInCartIndex].qty * shoppingCart[productInCartIndex].price;
  
        // Write the updated cart back to the file
        await fs.writeFile(myCart, JSON.stringify(shoppingCart, null, 2), 'utf8');
  
        res.status(200).json({ message: 'Quantity incremented successfully', shoppingCart });
      } else {
        res.status(404).json({ message: 'Product not found in the cart' });
      }
    } catch (error) {
      console.error('Error incrementing quantity:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
  app.get('/cart/decqty/:prodId', async (req, res) => {
    try {
      const prodId = parseInt(req.params.prodId, 10);
      
      // Read the current state of the shopping cart from the file
      const cartData = await fs.readFile(myCart, 'utf8');
      let shoppingCart = JSON.parse(cartData);
  
      // Find the product in the cart
      const productInCartIndex = shoppingCart.findIndex(item => item.prodId === prodId);
  
      if (productInCartIndex !== -1) {
        // Increment the quantity
        shoppingCart[productInCartIndex].qty -= 1;
  
        // Update the total price based on the new quantity
        shoppingCart[productInCartIndex].tprice = shoppingCart[productInCartIndex].qty * shoppingCart[productInCartIndex].price;
  
        // Write the updated cart back to the file
        await fs.writeFile(myCart, JSON.stringify(shoppingCart, null, 2), 'utf8');
  
        res.status(200).json({ message: 'Quantity incremented successfully', shoppingCart });
      } else {
        res.status(404).json({ message: 'Product not found in the cart' });
      }
    } catch (error) {
      console.error('Error incrementing quantity:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
  
  app.delete('/removeFromCart/:prodId', async (req, res) => {
    try {
      const prodIdToRemove = parseInt(req.params.prodId);
  
      let cartData = await fs.readFile(myCart, 'utf8');
      let shoppingCart = JSON.parse(cartData);
  
      const updatedCart = shoppingCart.filter(item => item.prodId !== prodIdToRemove);
  
      await fs.writeFile(myCart, JSON.stringify(updatedCart, null, 2), 'utf8');
  
      res.status(200).json({ message: 'Product removed from the cart successfully', updatedCart });
    } catch (error) {
      console.error('Error removing from cart:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });

  app.post('/login', (req, res) => {
    try {
      const { email, password } = req.body;
  
      // Check if the provided email and password match the logindata
      if (email === logindata.email && password === logindata.password) {
        // Authentication successful
        const loggedInUser = {
          email: logindata.email,
          id: logindata.custid, // Assuming custid is the user's ID
        };
  
        res.status(200).json({ message: 'Login successful', user: loggedInUser });
      } else {
        // Authentication failed
        res.status(401).json({ message: 'Invalid credentials' });
      }
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
  
  app.post('/mydetails', async (req, res) => {
    try {
      const newDetails = req.body; // Assuming you send the new user details in the request body
      const currentDetails = await fs.readFile('./mydetails.json', 'utf8');
      const userDetails = JSON.parse(currentDetails);
  
      // Assuming each user has a unique ID, you might want to generate one or use another approach
      newDetails.id = userDetails.length + 1;
  
      userDetails.push(newDetails);
  
      await fs.writeFile('./mydetails.json', JSON.stringify(userDetails, null, 2), 'utf8');
  
      // Clear the contents of myCart.json
      await fs.writeFile('./myCart.json', '[]', 'utf8');
  
      res.status(201).json({ message: 'User details added successfully', userDetails: newDetails });
    } catch (error) {
      console.error('Error adding user details:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
  
  app.get('/mydetails', async (req, res) => {
    try {
      const currentDetails = await fs.readFile('./mydetails.json', 'utf8');
      const userDetails = JSON.parse(currentDetails);
  
      res.status(200).json({ message: 'All user details fetched', userDetails });
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
  });
  

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
