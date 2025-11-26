/*import { useState, useEffect } from "react";
import { Box, Typography, useTheme, Button, Alert, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { tokens } from "../../theme";
import Header from "../../components/Header";
import axios from "axios";

const Contacts = () => {
  const theme = useTheme();
  const colors = tokens(theme.palette.mode);
  const [contactsData, setContactsData] = useState([]);
  const [selectionModel, setSelectionModel] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedContact, setSelectedContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/users?page=1&limit=10", {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("API Response:", res.data); // Debug log
        setContactsData(res.data.users || []);
      } catch (err) {
        console.error("Error fetching contacts:", err);
        setError(err.response?.data?.message || "Lỗi khi tải dữ liệu");
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("currentUser");
          window.location.href = "/login";
        }
      } finally {
        setLoading(false);
      }
    };
    fetchContacts();
  }, []);

  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
  const isAdmin = currentUser?.role === "admin";

  const handleDelete = async () => {
    if (!isAdmin) {
      alert("Chỉ admin mới có quyền xóa thông tin liên hệ!");
      return;
    }
    if (selectionModel.length === 0) {
      alert("Vui lòng chọn ít nhất một liên hệ để xóa!");
      return;
    }
    const selectedContacts = contactsData.filter((contact) => selectionModel.includes(contact._id || contact.id));
    const hasAdmin = selectedContacts.some((contact) => contact.role === "admin");

    if (hasAdmin) {
      alert("Bạn không thể xóa tài khoản admin!");
      return;
    }

    if (window.confirm("Bạn có chắc muốn xóa những liên hệ đã chọn?")) {
      try {
        for (const id of selectionModel) {
          await axios.delete("http://localhost:5000/api/users", {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            data: { id },
          });
        }
        setContactsData((prev) => prev.filter((contact) => !selectionModel.includes(contact._id || contact.id)));
        setSelectionModel([]);
        alert("Thông tin liên hệ đã được xóa thành công!");
      } catch (err) {
        console.error("Error deleting contacts:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("currentUser");
          window.location.href = "/login";
        } else {
          alert(err.response?.data?.message || "Không thể xóa thông tin liên hệ!");
        }
      }
    }
  };

  const handleEdit = () => {
    if (!isAdmin) {
      alert("Chỉ admin mới có quyền sửa thông tin liên hệ!");
      return;
    }
    if (selectionModel.length !== 1) {
      alert("Vui lòng chọn đúng một liên hệ để sửa!");
      return;
    }
    const contactToEdit = contactsData.find((contact) => selectionModel[0] === (contact._id || contact.id));
    setSelectedContact(contactToEdit);
    setOpenEditDialog(true);
  };

  const handleEditSubmit = async (values) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(`http://localhost:5000/api/users/${values.id}`, values, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setContactsData((prev) => prev.map((contact) => (contact._id || contact.id) === values.id ? { ...contact, ...values } : contact));
      if (values.id === currentUser.id) {
        localStorage.setItem("currentUser", JSON.stringify({ ...currentUser, ...values }));
        alert("Bạn đã thay đổi thông tin của chính mình. Trang sẽ tải lại để cập nhật.");
        window.location.reload();
      }
      setOpenEditDialog(false);
      setSelectedContact(null);
      setSelectionModel([]);
      alert("Thông tin liên hệ đã được cập nhật thành công!");
    } catch (err) {
      console.error("Error updating contact:", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
        window.location.href = "/login";
      } else {
        alert(err.response?.data?.message || "Không thể cập nhật thông tin liên hệ!");
      }
    }
  };

  const columns = [
    { field: "name", headerName: "Tên", flex: 1, renderCell: ({ row }) => `${row.firstName || ""} ${row.lastName || ""}` },
    { field: "email", headerName: "Email", flex: 1 },
    { field: "phone", headerName: "Số điện thoại", flex: 1, valueGetter: (params) => params.row.contact || "" },
    { field: "address", headerName: "Địa chỉ", flex: 1, valueGetter: (params) => params.row.address1 || "" },
  ];

  if (loading) return <Box m="20px"><Typography>Đang tải dữ liệu...</Typography></Box>;
  if (error) return <Box m="20px"><Alert severity="error">{error}</Alert><Button onClick={() => window.location.reload()}>Thử lại</Button></Box>;

  return (
    <Box m="20px">
      <Header title="THÔNG TIN LIÊN HỆ" subtitle="Quản lý thông tin liên hệ" />
      {isAdmin ? (
        <Box>
          {selectionModel.length === 0 && (
            <Alert severity="info" sx={{ mb: "10px" }}>
              Vui lòng tích vào checkbox bên trái để chọn liên hệ trước khi xóa hoặc sửa.
            </Alert>
          )}
          <Box display="flex" justifyContent="flex-end" mb="20px" gap="10px">
            <Button
              variant="contained"
              color="error"
              onClick={handleDelete}
              disabled={selectionModel.length === 0}
              sx={{
                padding: "12px 24px",
                fontSize: "1.1rem",
                backgroundColor: "#d32f2f",
                "&:hover": { backgroundColor: "#b71c1c" },
                "&:disabled": { backgroundColor: "#f44336", opacity: 0.5 },
              }}
            >
              Xóa
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleEdit}
              disabled={selectionModel.length !== 1}
              sx={{
                padding: "12px 24px",
                fontSize: "1.1rem",
                backgroundColor: "#4404abff",
                "&:hover": { backgroundColor: "#4404abff" },
                "&:disabled": { backgroundColor: "#4404abff", opacity: 0.5 },
              }}
            >
              Sửa
            </Button>
          </Box>
        </Box>
      ) : (
        <Alert severity="warning" sx={{ mb: "20px" }}>
          Bạn không có quyền admin để quản lý thông tin liên hệ. Vui lòng đăng nhập với tài khoản admin!
        </Alert>
      )}
      <Box
        m="40px 0 0 0"
        height="75vh"
        sx={{
          "& .MuiDataGrid-root": { border: "none" },
          "& .MuiDataGrid-cell": { borderBottom: "none" },
          "& .name-column--cell": { color: colors.greenAccent[300] },
          "& .MuiDataGrid-columnHeaders": { backgroundColor: colors.blueAccent[700], borderBottom: "none" },
          "& .MuiDataGrid-virtualScroller": { backgroundColor: colors.primary[400] },
          "& .MuiDataGrid-footerContainer": { borderTop: "none", backgroundColor: colors.blueAccent[700] },
          "& .MuiCheckbox-root": { color: `${colors.greenAccent[200]} !important` },
        }}
      >
        <DataGrid
          checkboxSelection={isAdmin}
          rows={contactsData}
          columns={columns}
          selectionModel={selectionModel}
          onSelectionModelChange={(newSelection) => setSelectionModel(newSelection)}
          getRowId={(row) => row._id || row.id}
          pageSize={5}
          rowsPerPageOptions={[5]}
        />
      </Box>

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Sửa Thông Tin Liên Hệ</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            variant="outlined"
            label="Họ"
            name="firstName"
            value={selectedContact?.firstName || ""}
            onChange={(e) => setSelectedContact({ ...selectedContact, firstName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            variant="outlined"
            label="Tên"
            name="lastName"
            value={selectedContact?.lastName || ""}
            onChange={(e) => setSelectedContact({ ...selectedContact, lastName: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            variant="outlined"
            label="Email"
            name="email"
            value={selectedContact?.email || ""}
            onChange={(e) => setSelectedContact({ ...selectedContact, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            variant="outlined"
            label="Số điện thoại"
            name="contact"
            value={selectedContact?.contact || ""}
            onChange={(e) => setSelectedContact({ ...selectedContact, contact: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            variant="outlined"
            label="Địa chỉ"
            name="address1"
            value={selectedContact?.address1 || ""}
            onChange={(e) => setSelectedContact({ ...selectedContact, address1: e.target.value })}
            sx={{ mb: 2 }}
          />
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)} color="secondary">
              Hủy
            </Button>
            <Button
              onClick={() => handleEditSubmit(selectedContact)}
              color="primary"
              variant="contained"
              disabled={!selectedContact?.firstName || !selectedContact?.lastName || !selectedContact?.email || !selectedContact?.contact || !selectedContact?.address1}
            >
              Lưu
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Contacts;*/