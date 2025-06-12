const express = require('express');
const { sql, getPool } = require('./connection'); // ✅ Updated here
const app = express();
const port = 3001;

app.use(express.json());

// ✅ Login API
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password required' });
  }

  try {
    const db = await getPool(); // ✅ Updated here
    const result = await db.request()
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, password)
      .query('SELECT * FROM LOGIN WHERE USERNAME = @username AND PASSWORD = @password');

    if (result.recordset.length > 0) {
      return res.json({ success: true });
    } else {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ✅ Menu section
app.get('/api/menu_items', async (req, res) => {
  try {
    const db = await getPool(); // ✅
    const result = await db.request().query('SELECT DISTINCT Menu_section FROM Menu_Item_Master');
    res.json(result.recordset);
  } catch (err) {
    console.error('Menu sections error:', err);
    res.status(500).json({ message: 'Error fetching options', error: err.message });
  }
});

// ✅ Radio options
app.get('/api/radio-options', async (req, res) => {
  try {
    const db = await getPool(); // ✅
    const result = await db.request().query('SELECT TYPE FROM RADIO_OPTION');
    res.json(result.recordset);
  } catch (err) {
    console.error('Radio options error:', err);
    res.status(500).json({ message: 'Error fetching options', error: err.message });
  }
});

// ✅ Menu by section
app.get('/api/menu_items/:section', async (req, res) => {
  const { section } = req.params;
  try {
    const db = await getPool(); // ✅
    const result = await db.request()
      .input('section', sql.NVarChar, section)
      .query('SELECT Menu_Name, Menu_price, Menu_ID FROM Menu_Item_Master WHERE Menu_section = @section');
    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Menu items by section error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ✅ Save menu items (KOT)
app.post('/api/save_menu_items', async (req, res) => {
  const { menuSection, radioOption, selectedRoom, items } = req.body;

  if (!menuSection || !radioOption || !selectedRoom || !items || !Array.isArray(items)) {
    return res.status(400).json({ success: false, message: 'Invalid input' });
  }

  try {
    const db = await getPool(); // ✅
    const transaction = new sql.Transaction(db);
    await transaction.begin();

    const requestForKotNo = new sql.Request(transaction);
    const kotNoResult = await requestForKotNo.query('SELECT ISNULL(MAX(KOT_No), 0) AS maxKotNo FROM KOT_NEW');
    const newKotNo = kotNoResult.recordset[0].maxKotNo + 1;

    for (const item of items) {
      const request = new sql.Request(transaction);
      request.input('menuSection', sql.VarChar, menuSection);
      request.input('radioOption', sql.VarChar, radioOption);
      request.input('roomNo', sql.VarChar, selectedRoom);
      request.input('code', sql.VarChar, item.code);
      request.input('desc', sql.VarChar, item.desc);
      request.input('qty', sql.Int, item.qty || 0);
      request.input('price', sql.Decimal(10, 2), item.price || 0);
      request.input('total', sql.Decimal(10, 2), item.total || 0);
      request.input('remarks', sql.VarChar, item.remarks || '');
      request.input('kotNo', sql.Int, newKotNo);

      await request.query(`
        INSERT INTO KOT_NEW
          (Menu_Section, Radio_Option, Room_No, ItemCode, Description, Qty, Price, Total, Remarks, KOT_No)
        VALUES
          (@menuSection, @radioOption, @roomNo, @code, @desc, @qty, @price, @total, @remarks, @kotNo)
      `);
    }

    await transaction.commit();
    res.json({ success: true, message: `Data saved with KOT_No ${newKotNo}` });
  } catch (err) {
    console.error('Error saving menu items:', err);
    res.status(500).json({ success: false, message: 'Database error', error: err.message });
  }
});

// ✅ Cancel KOT
// Change from cancel_kot to cancel-kot
app.put('/api/cancel-kot', async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ success: false, message: 'Missing ID' });
  }

  try {
    const db = await getPool();
    await db.request()
      .input('id', sql.Int, id)
      .query("UPDATE KOT_NEW SET Cancel_Status = 'Yes' WHERE ID = @id");
    res.json({ success: true });
  } catch (err) {
    console.error('Cancel KOT error:', err);
    res.status(500).json({ success: false, message: 'DB Error' });
  }
});


// ✅ Table names
app.get('/api/table-names', async (req, res) => {
  try {
    const db = await getPool(); // ✅
    const result = await db.request().query('SELECT Table_Name FROM Table_Master');
    res.json(result.recordset);
  } catch (err) {
    console.error('Table names error:', err);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

// ✅ KOT List
app.get('/api/kot-list', async (req, res) => {
  const { fromDate, toDate } = req.query;

  if (!fromDate || !toDate) {
    return res.status(400).json({ success: false, message: 'fromDate and toDate are required' });
  }

  try {
    const db = await getPool(); // ✅
    const result = await db.request()
      .input('fromDate', sql.Date, fromDate)
      .input('toDate', sql.Date, toDate)
      .query(`
        SELECT DISTINCT KOT_No AS kotNumber
        FROM KOT_NEW
        WHERE CAST(CreatedAt AS DATE) BETWEEN @fromDate AND @toDate
        ORDER BY kotNumber DESC
      `);

    res.json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('KOT list fetch error:', err);
    res.status(500).json({ success: false, message: 'Database error', error: err.message });
  }
});

// ✅ KOT Details
app.get('/api/kot-list-details/:kotNumber', async (req, res) => {
  const { kotNumber } = req.params;

  try {
    const db = await getPool(); // ✅
    const result = await db.request()
      .input('kotNumber', sql.Int, kotNumber)
      .query('SELECT * FROM KOT_NEW WHERE KOT_No = @kotNumber');

    if (result.recordset.length > 0) {
      res.json({ success: true, data: result.recordset });
    } else {
      res.status(404).json({ success: false, message: 'KOT not found' });
    }
  } catch (error) {
    console.error('KOT details error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});



app.post('/api/print_kot', async (req, res) => {
  try {
    const db = await getPool();

    // Step 1: Get the latest KOT_No
    const latestKotResult = await db.request().query(`
      SELECT TOP 1 KOT_No 
      FROM KOT_NEW 
      ORDER BY CreatedAt DESC
    `);

    if (latestKotResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'No KOT records found' });
    }

    const latestKOTNo = latestKotResult.recordset[0].KOT_No;

    // Step 2: Get all items for that KOT_No
    const itemsResult = await db.request()
      .input('kotNo', sql.Int, latestKOTNo)
      .query(`
        SELECT 
          ID,
          KOT_No,
          CreatedAt,
          Menu_Section,
          Radio_Option,
          Room_No,
          ItemCode,
          Description,
          Qty,
          Price,
          Total,
          Remarks,
          Cancel_Status
        FROM KOT_NEW
        WHERE KOT_No = @kotNo
      `);

    res.json({
      success: true,
      kotNo: latestKOTNo,
      items: itemsResult.recordset
    });

  } catch (err) {
    console.error('Print KOT error:', err);
    res.status(500).json({ success: false, message: 'Server error', error: err.message });
  }
});

// ✅ Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`API running at http://0.0.0.0:${port}`);
});
