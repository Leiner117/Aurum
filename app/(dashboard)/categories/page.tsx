"use client";

import { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonRow } from "@/components/ui/Skeleton";
import { CategoryList } from "@/components/categories/CategoryList";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { useCategoriesViewModel } from "@/viewModels/useCategoriesViewModel";
import { useToast } from "@/providers/ToastProvider";
import type { CategoryInput } from "@/lib/validators";

export default function CategoriesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const { showToast } = useToast();

  const { categories, isLoading, createCategory, updateCategory, deleteCategory } =
    useCategoriesViewModel();

  async function handleCreate(data: CategoryInput) {
    setCreateLoading(true);
    const ok = await createCategory(data);
    setCreateLoading(false);
    if (ok) {
      setIsCreateOpen(false);
      showToast("Category created", "success");
    } else {
      showToast("Failed to create category", "error");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize your expenses into categories."
        actions={
          <Button size="sm" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            New category
          </Button>
        }
      />

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="px-5 py-2">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          ) : categories.length === 0 ? (
            <EmptyState
              icon={<Tag className="h-6 w-6" />}
              title="No categories yet"
              description="Create your first category to start organizing expenses."
              actionLabel="New category"
              onAction={() => setIsCreateOpen(true)}
            />
          ) : (
            <div className="px-5">
              <CategoryList
                categories={categories}
                isLoading={isLoading}
                onUpdate={async (data) => {
                  const ok = await updateCategory(data);
                  if (ok) showToast("Category updated", "success");
                  else showToast("Failed to update category", "error");
                  return ok;
                }}
                onDelete={async (id) => {
                  const ok = await deleteCategory(id);
                  if (ok) showToast("Category deleted", "success");
                  else showToast("Failed to delete category", "error");
                  return ok;
                }}
              />
            </div>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="New category"
        size="sm"
      >
        <CategoryForm
          isLoading={createLoading}
          onSubmit={handleCreate}
          onCancel={() => setIsCreateOpen(false)}
        />
      </Modal>
    </div>
  );
}
