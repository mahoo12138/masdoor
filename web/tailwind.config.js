/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {"2xl": "1400px"},
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // OpenTodo precision surfaces: row hover, the selected nav item and row,
        // a soft emerald wash, and the strong hairline
        hover: "hsl(var(--hover))",
        selected: "hsl(var(--selected))",
        "selected-row": "hsl(var(--selected-row))",
        "accent-soft": {
          DEFAULT: "hsl(var(--accent-soft))",
          foreground: "hsl(var(--accent-soft-foreground))",
        },
        "line-strong": "hsl(var(--line-strong))",
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        // the chrome is neutral, so charts carry the colour; see index.css
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
          6: "hsl(var(--chart-6))",
          7: "hsl(var(--chart-7))",
          8: "hsl(var(--chart-8))",
        },
      },
      borderRadius: {
        xl: "calc(var(--radius) + 2px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // OpenTodo's precision radii: chip 6, control 7, card 8 (--radius),
        // the inset surface 10, popover 12
        chip: "6px",
        control: "7px",
        surface: "10px",
        popover: "12px",
      },
      fontSize: {
        // OpenTodo's type steps (docs/design-system.md): the list and control
        // step is 13px, prose 15px, headings weight 600 with tighter tracking
        // as the size grows
        hint: ["0.71875rem", {lineHeight: "1rem", fontWeight: "500"}],
        meta: ["0.78125rem", {lineHeight: "1.125rem"}],
        list: ["0.8125rem", {lineHeight: "1.25rem"}],
        prose: ["0.9375rem", {lineHeight: "1.5rem"}],
        h3: ["0.875rem", {lineHeight: "1.25rem", fontWeight: "600"}],
        h2: ["1.25rem", {lineHeight: "1.75rem", fontWeight: "600", letterSpacing: "-0.01em"}],
        h1: ["1.375rem", {lineHeight: "1.75rem", fontWeight: "600", letterSpacing: "-0.015em"}],
        display: ["1.75rem", {lineHeight: "2.125rem", fontWeight: "650", letterSpacing: "-0.025em"}],
      },
      boxShadow: {
        // lists and cards are flat; only overlays keep a shadow
        2: "0 4px 12px rgb(15 23 42 / 0.10)",
        3: "0 12px 32px rgb(15 23 42 / 0.16)",
      },
      fontFamily: {
        sans: [
          "Inter Variable", "Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto",
          // Inter carries no CJK, so hand the Chinese/Japanese/Korean glyphs to
          // the best face each platform ships rather than letting them land on a
          // serif default
          "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Noto Sans SC",
          "Helvetica Neue", "sans-serif",
          "Apple Color Emoji", "Segoe UI Emoji",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: {height: "0"},
          to: {height: "var(--radix-accordion-content-height)"},
        },
        "accordion-up": {
          from: {height: "var(--radix-accordion-content-height)"},
          to: {height: "0"},
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
