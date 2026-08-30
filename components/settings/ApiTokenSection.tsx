"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useApiTokensViewModel } from "@/viewModels/useApiTokensViewModel";
import { Copy, Plus, Trash2, Check } from "lucide-react";

export const ApiTokenSection = () => {
  const { tokens, isLoading, newRawToken, createToken, deleteToken, clearNewToken } =
    useApiTokensViewModel();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [tokenName, setTokenName] = useState("");
  const [copied, setCopied] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!tokenName.trim()) return;
    const ok = await createToken(tokenName.trim());
    if (ok) setIsCreateOpen(false);
    setTokenName("");
  };

  const handleCopy = () => {
    if (!newRawToken) return;
    navigator.clipboard.writeText(newRawToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async (id: string) => {
    await deleteToken(id);
    setDeleteId(null);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });

  return (
    <>
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-[var(--color-foreground)]">
            Gmail Add-on Tokens
          </h2>
          <Button size="sm" variant="secondary" onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            New Token
          </Button>
        </CardHeader>
        <CardBody>
          {tokens.length === 0 && !isLoading && (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No tokens yet. Create one to connect the Gmail Add-on.
            </p>
          )}
          <ul className="space-y-2">
            {tokens.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[var(--color-foreground)] truncate">
                    {t.name}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Created {formatDate(t.created_at)}
                    {t.last_used_at && ` · Last used ${formatDate(t.last_used_at)}`}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setDeleteId(t.id)}
                  aria-label="Delete token"
                >
                  <Trash2 className="h-3.5 w-3.5 text-[var(--color-danger)]" />
                </Button>
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      {/* Create token modal */}
      <Modal isOpen={isCreateOpen} onClose={() => { setIsCreateOpen(false); setTokenName(""); }} title="New API Token" size="sm">
        <div className="space-y-4">
          <Input
            label="Token name"
            placeholder="e.g. Gmail Add-on"
            value={tokenName}
            onChange={(e) => setTokenName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => { setIsCreateOpen(false); setTokenName(""); }}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} isLoading={isLoading} disabled={!tokenName.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* One-time token reveal modal */}
      <Modal isOpen={!!newRawToken} onClose={clearNewToken} title="Copy your token" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            This token will not be shown again. Copy it and paste it into the Gmail Add-on settings.
          </p>
          <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-hover)] px-3 py-2">
            <code className="flex-1 text-xs font-mono text-[var(--color-foreground)] break-all">
              {newRawToken}
            </code>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded p-1 hover:bg-[var(--color-border)] transition-colors"
              aria-label="Copy token"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-[var(--color-muted-foreground)]" />
              )}
            </button>
          </div>
          <div className="flex justify-end">
            <Button size="sm" onClick={clearNewToken}>Done</Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete token?" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            The Gmail Add-on will stop working immediately. This cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" isLoading={isLoading} onClick={() => deleteId && handleDelete(deleteId)}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
