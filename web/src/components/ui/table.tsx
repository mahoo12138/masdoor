import * as React from "react";
import {cn} from "@/lib/utils";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({className, ...props}, ref) => (
    <div className="relative w-full overflow-auto scrollbar-thin">
      <table ref={ref} className={cn("w-full caption-bottom text-list", className)} {...props} />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({className, ...props}, ref) => <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />,
);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({className, ...props}, ref) => (
    <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
  ),
);
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<HTMLTableSectionElement, React.HTMLAttributes<HTMLTableSectionElement>>(
  ({className, ...props}, ref) => (
    <tfoot ref={ref} className={cn("border-t bg-selected-row font-medium", className)} {...props} />
  ),
);
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({className, ...props}, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border/70 transition-colors hover:bg-hover data-[state=selected]:bg-selected-row",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({className, ...props}, ref) => (
    <th
      ref={ref}
      className={cn(
        // OpenTodo's quiet column heads: small caps meta text
        "h-10 whitespace-nowrap px-3 text-left align-middle text-meta font-medium uppercase tracking-wider text-muted-foreground",
        className,
      )}
      {...props}
    />
  ),
);
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({className, ...props}, ref) => (
    // One line per row. Long opaque values (UUID names, client secrets, redirect
    // URIs) used to wrap and leave every row a different height, which is what
    // made the lists look ragged. Deliberately no `truncate` here: clipping the
    // cell hides data with no way to get at it, and the overflow it needs also
    // swallows anything that has to escape the cell. The table scrolls sideways
    // instead, with the name and action columns pinned. A column that genuinely
    // wants to wrap opts back in with `className: "whitespace-normal"`.
    <td ref={ref} className={cn("whitespace-nowrap px-3 py-2.5 align-middle", className)} {...props} />
  ),
);
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<HTMLTableCaptionElement, React.HTMLAttributes<HTMLTableCaptionElement>>(
  ({className, ...props}, ref) => (
    <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
  ),
);
TableCaption.displayName = "TableCaption";

export {Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption};
