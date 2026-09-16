"use client";

import { cn } from "@/lib/utils/cn";
import { categoryVar } from "@/lib/utils/colors";
import { useApp } from "@/lib/store/AppStore";
import { Modal } from "@/components/ui/Modal";
import { Icon } from "@/components/ui/Icon";

/**
 * Putting a category on something, in one tap.
 *
 * Quick capture deliberately asks for nothing but a title, so most items start
 * out uncategorised — and reopening the whole edit form just to fill in the one
 * field that is missing is more ceremony than the decision deserves. This is
 * that single field, on its own.
 */
export function CategoryPicker({
  open,
  title,
  value,
  onSelect,
  onClose,
}: {
  open: boolean;
  /** The item being filed, shown so the sheet says what it is about. */
  title: string;
  value: string | null;
  onSelect: (categoryId: string | null) => void;
  onClose: () => void;
}) {
  const { data } = useApp();
  if (!open) return null;

  const choose = (categoryId: string | null) => {
    onSelect(categoryId);
    onClose();
  };

  const options: Array<{ id: string | null; name: string; color?: string }> = [
    { id: null, name: "بدون دسته" },
    ...data.categories.map((category) => ({
      id: category.id,
      name: category.name,
      color: categoryVar(category.color),
    })),
  ];

  return (
    <Modal open onClose={onClose} title="دسته‌بندی" description={title}>
      <ul className="grid gap-1.5 sm:grid-cols-2">
        {options.map((option) => {
          const selected = option.id === value;
          return (
            <li key={option.id ?? "none"}>
              <button
                type="button"
                onClick={() => choose(option.id)}
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-start text-[13.5px] transition-colors",
                  selected
                    ? "border-primary/60 bg-primary-soft text-fg"
                    : "border-line text-fg-soft hover:border-primary/40 hover:bg-surface-2",
                )}
              >
                {option.color ? (
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                ) : (
                  <span className="size-2.5 shrink-0 rounded-full border border-dashed border-line-strong" />
                )}
                <span className="min-w-0 flex-1 truncate">{option.name}</span>
                {selected && (
                  <Icon name="check" size="1em" className="shrink-0 text-primary" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
