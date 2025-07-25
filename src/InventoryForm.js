import React, { useEffect, useState } from "react";
import Fuse from "fuse.js";
import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Paper,
  Chip,
  Tooltip,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";

const statusColors = {
  IN_STOCK: "success",
  LOW_STOCK: "warning",
  ORDERED: "info",
  DISCONTINUED: "error",
};



// Role state for toggling between admin and viewer
const ROLE_OPTIONS = ['admin', 'viewer'];



const InventoryTable = () => {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);
  // Add form state
  const [form, setForm] = useState({ name: "", quantity: "", category: "", status: "IN_STOCK" });
  const [formError, setFormError] = useState({});
  const [role, setRole] = useState('admin');
  const statusOptions = ["IN_STOCK", "LOW_STOCK", "ORDERED", "DISCONTINUED"];



  const fetchItems = async () => {
    try {
      const response = await axios.get("http://localhost:8080/api/items");
      setItems(response.data);
    } catch (err) {
      console.error("Error fetching items", err);
    }
  };

  // Input validation
  const validate = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    else if (!/^[A-Za-z ]+$/.test(form.name)) errors.name = "Letters only";
    if (!form.quantity) errors.quantity = "Quantity is required";
    else if (!/^[0-9]+$/.test(form.quantity)) errors.quantity = "Numbers only";
    if (!form.category.trim()) errors.category = "Category is required";
    return errors;
  };


  // AI-like status suggestion based on quantity
  const suggestStatus = (quantity) => {
    const q = parseInt(quantity, 10);
    if (isNaN(q)) return "IN_STOCK";
    if (q === 0) return "ORDERED";
    if (q < 5) return "LOW_STOCK";
    if (q > 100) return "IN_STOCK";
    return "IN_STOCK";
  };

  const handleFormChange = e => {
    const { name, value } = e.target;
    let updated = { ...form, [name]: value };
    // If quantity changes, suggest status
    if (name === "quantity") {
      updated.status = suggestStatus(value);
    }
    setForm(updated);
    setFormError({ ...formError, [name]: undefined });
  };

  const handleAdd = async e => {
    e.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) {
      setFormError(errors);
      return;
    }
    try {
      await axios.post("http://localhost:8080/api/items", {
        ...form,
        quantity: parseInt(form.quantity, 10),
      });
      setForm({ name: "", quantity: "", category: "", status: "IN_STOCK" });
      setFormError({});
      await fetchItems();
      // Optionally, show a success message
    } catch (err) {
      setFormError({ submit: "Failed to add item" });
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/items/${id}`);
      fetchItems(); // Refresh the list
    } catch (err) {
      console.error("Error deleting item", err);
    }
  };


  useEffect(() => {
    fetchItems();
    // Listen for external refresh events (from InventoryForm)
    const refresh = () => fetchItems();
    window.addEventListener("inventoryUpdated", refresh);
    return () => window.removeEventListener("inventoryUpdated", refresh);
  }, []);

  // Fuzzy search with fuse.js
  useEffect(() => {
    if (!search) {
      setFiltered(items);
      return;
    }
    const fuse = new Fuse(items, {
      keys: ["name", "category", "status"],
      threshold: 0.4,
    });
    setFiltered(fuse.search(search).map((r) => r.item));
  }, [search, items]);



  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Inventory List
      </Typography>

      {/* Role Toggle Dropdown */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <label htmlFor="role-select" style={{ fontWeight: 500 }}>Role:</label>
        <select
          id="role-select"
          value={role}
          onChange={e => setRole(e.target.value)}
          style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}
        >
          {ROLE_OPTIONS.map(opt => (
            <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Add Item Form (admin only) */}
      {role === 'admin' && (
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, marginBottom: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleFormChange}
            style={{ padding: 8, borderRadius: 4, border: formError.name ? '1px solid red' : '1px solid #ccc', minWidth: 120 }}
            maxLength={32}
            autoComplete="off"
          />
          <input
            name="quantity"
            placeholder="Quantity"
            value={form.quantity}
            onChange={handleFormChange}
            style={{ padding: 8, borderRadius: 4, border: formError.quantity ? '1px solid red' : '1px solid #ccc', minWidth: 80 }}
            maxLength={6}
            autoComplete="off"
          />
          <input
            name="category"
            placeholder="Category"
            value={form.category}
            onChange={handleFormChange}
            style={{ padding: 8, borderRadius: 4, border: formError.category ? '1px solid red' : '1px solid #ccc', minWidth: 120 }}
            maxLength={32}
            autoComplete="off"
          />
          <select
            name="status"
            value={form.status}
            onChange={handleFormChange}
            style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', minWidth: 120 }}
          >
            {statusOptions.map(opt => (
              <option key={opt} value={opt}>{opt.replace('_', ' ')}</option>
            ))}
          </select>
          <span style={{ fontSize: 12, color: '#888', marginLeft: 4 }}>
            (AI suggested)
          </span>
          <button type="submit" style={{ padding: '8px 18px', borderRadius: 4, background: '#1976d2', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}>Add</button>
          {formError.submit && <span style={{ color: 'red', marginLeft: 8 }}>{formError.submit}</span>}
          <div style={{ width: '100%' }}>
            {formError.name && <span style={{ color: 'red', marginRight: 12 }}>{formError.name}</span>}
            {formError.quantity && <span style={{ color: 'red', marginRight: 12 }}>{formError.quantity}</span>}
            {formError.category && <span style={{ color: 'red', marginRight: 12 }}>{formError.category}</span>}
          </div>
        </form>
      )}

      {/* Fuzzy Search Bar */}
      <input
        type="text"
        placeholder="Search inventory..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{ marginBottom: 16, padding: 8, width: '100%' }}
      />

      <Table>
        <TableHead>
          <TableRow>
            <TableCell><strong>Name</strong></TableCell>
            <TableCell><strong>Quantity</strong></TableCell>
            <TableCell><strong>Category</strong></TableCell>
            <TableCell><strong>Status</strong></TableCell>
            <TableCell><strong>Actions</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(filtered.length ? filtered : items).map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>
                <Chip
                  label={item.status}
                  color={statusColors[item.status] || "default"}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>
                {/* Only admin can delete */}
                {role === 'admin' ? (
                  <Tooltip title="Delete">
                    <IconButton
                      onClick={() => handleDelete(item.id)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                ) : (
                  <Tooltip title="View only">
                    <span style={{ color: '#aaa' }}>No actions</span>
                  </Tooltip>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {/* Show role for demo */}
      <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
        Current role: <b>{role}</b>
      </Typography>
    </Paper>
  );
};

export default InventoryTable;
