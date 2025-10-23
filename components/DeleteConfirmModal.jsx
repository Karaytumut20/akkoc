import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import { useState } from "react";

const [showDeleteModal, setShowDeleteModal] = useState(false);
const [deleteTarget, setDeleteTarget] = useState(null);

const handleDeleteClick = (productId) => {
  setDeleteTarget(productId);
  setShowDeleteModal(true);
};

const handleConfirmDelete = () => {
  if (deleteTarget) {
    // buraya sepetten silme işlemini koy kanka
    updateCartQuantity(deleteTarget, 0);
  }
  setShowDeleteModal(false);
  setDeleteTarget(null);
};
