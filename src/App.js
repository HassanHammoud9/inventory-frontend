import React from "react";
import { Container, Typography } from "@mui/material";
import InventoryForm from "./InventoryForm";

function App() {
  return (
    <Container maxWidth="md">
      <Typography variant="h4" align="center" gutterBottom sx={{ mt: 4 }}>
        📦 Inventory Management System
      </Typography>
      <InventoryForm />
    </Container>
  );
}

export default App;
